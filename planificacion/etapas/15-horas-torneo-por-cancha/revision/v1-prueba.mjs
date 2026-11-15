// Verificación headless independiente (v1-verificacion) en 390x844 y 1440x900
// para /reservar/padel?modo=torneo y /reservar/futbol?modo=torneo vía CDP.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9349;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-v1-'));

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${perfil}`,
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

async function wsUrl() {
  for (let i = 0; i < 100; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = lista.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // esperando CDP
    }
    await sleep(150);
  }
  throw new Error('No se pudo conectar al puerto CDP de Chrome');
}

let sock;
const erroresConsola = [];
const excepciones = [];

try {
  sock = new WebSocket(await wsUrl());
  await new Promise((r) => sock.addEventListener('open', r));

  let seq = 0;
  const pend = new Map();
  sock.addEventListener('message', (e) => {
    const m = JSON.parse(String(e.data));
    if (m.id && pend.has(m.id)) {
      pend.get(m.id)(m);
      pend.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      excepciones.push(
        m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text
      );
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      erroresConsola.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  });

  const cdp = (method, params = {}) =>
    new Promise((r) => {
      const id = ++seq;
      pend.set(id, r);
      sock.send(JSON.stringify({ id, method, params }));
    });

  const ev = async (expr) => {
    const r = await cdp('Runtime.evaluate', {
      expression: `(async () => { ${expr} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.result?.exceptionDetails) {
      throw new Error(
        r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text
      );
    }
    return r.result?.result?.value;
  };

  const shot = async (nombre) => {
    const r = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, `${nombre}.png`), Buffer.from(r.result.data, 'base64'));
  };

  const pressKey = async (key, code, keyCode, modifiers = 0) => {
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
      modifiers,
    });
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
      modifiers,
    });
  };

  await cdp('Runtime.enable');
  await cdp('Page.enable');

  const setViewport = async (width, height, mobile) => {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
    await cdp('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  };

  const irLimpio = async (ruta) => {
    await cdp('Page.navigate', { url: `${BASE}/` });
    await sleep(800);
    await ev(`localStorage.clear(); sessionStorage.clear();`);
    await cdp('Page.navigate', { url: `${BASE}${ruta}` });
    await sleep(1500);
  };

  const esperar = async (exprCondicion, desc, timeoutMs = 4500) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const ok = await ev(`return Boolean(${exprCondicion});`);
      if (ok) return;
      await sleep(100);
    }
    throw new Error(`Timeout esperando: ${desc}`);
  };

  const EXPR_DESBORDE = `
    const vw = innerWidth;
    const sw = document.documentElement.scrollWidth;
    const fuera = [...document.querySelectorAll('body *')].filter((e) => {
      const b = e.getBoundingClientRect();
      if (!(b.width > 0 && b.right > vw + 1)) return false;
      let p = e;
      while (p && p !== document.body) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') {
          if (p !== e) return false;
        }
        p = p.parentElement;
      }
      return true;
    }).slice(0, 6).map((e) => (e.className || e.tagName) + '@' + Math.round(e.getBoundingClientRect().right));
    return { vw, sw, sinDesborde: sw === vw, fuera };
  `;

  const seleccionarTresCanchas = async () => {
    await ev(`
      const dots = [...document.querySelectorAll('.depth-carousel__dot')];
      for (let i = 0; i < dots.length; i++) {
        dots[i].click();
        await new Promise((r) => setTimeout(r, 420));
        const btn = document.querySelector('.tarjeta-cancha--activa .tarjeta-cancha__boton');
        if (btn && /Agregar al evento/i.test(btn.textContent)) {
          btn.click();
          await new Promise((r) => setTimeout(r, 180));
        }
      }
    `);
    await esperar(
      `document.querySelectorAll('.canchas-elegidas__chip').length === 3`,
      '3 chips de canchas seleccionadas'
    );
  };

  const escribirNombre = async (valor) => {
    await ev(`
      const input = [...document.querySelectorAll('label')]
        .find((l) => /Nombre/i.test(l.textContent))
        ?.querySelector('input') || document.getElementById('reserva-nombre') || document.querySelector('input[type="text"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(valor)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `);
  };

  // Probar interacción por teclado en botones de hora (Tab llega, Space alterna a true y de vuelta a false)
  const probarTecladoHoras = async (prefijoCancha) => {
    await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      const btns = [...s1.querySelectorAll('button[data-cancha="${prefijoCancha}-1"]:not(:disabled)')];
      btns[0].focus();
    `);
    await pressKey('Tab', 'Tab', 9);
    await sleep(100);
    const trasTab = await ev(`
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        cancha: el?.getAttribute('data-cancha'),
        hora: el?.getAttribute('data-hora'),
        pressedAntes: el?.getAttribute('aria-pressed'),
      };
    `);
    // Space activa la hora enfocada
    await pressKey(' ', 'Space', 32);
    await sleep(120);
    const pressedTrasActivar = await ev(`return document.activeElement?.getAttribute('aria-pressed');`);
    // Space la desactiva para dejar limpio el estado antes de marcar Cuartos
    await pressKey(' ', 'Space', 32);
    await sleep(120);
    const pressedTrasDesactivar = await ev(`return document.activeElement?.getAttribute('aria-pressed');`);

    return {
      trasTab,
      pressedTrasActivar,
      pressedTrasDesactivar,
    };
  };

  const probarFlujoCalendario = async (deporte, etiqueta, esMovil) => {
    const c1 = `${deporte}-1`;
    const c2 = `${deporte}-2`;
    const horaInicialC1 = deporte === 'padel' ? '16:00' : '15:00';
    // Día índice 3: en padel 16:00, 18:00 libres en padel-1 y 19:00 en padel-2;
    // en futbol 16:00 ocupada en futbol-1 pero libre en futbol-2, y 15:00, 18:00 libres en futbol-1 y 19:00 en futbol-2.
    await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      const dias1 = [...s1.querySelectorAll('.selector-dia__opcion')];
      dias1[3].click();
    `);
    await sleep(200);

    const teclado = await probarTecladoHoras(deporte);

    // 1. Probar cascada y bloqueo de orden cuando Cuartos termina a las 20:00 en cancha 2:
    await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      s1.querySelector('button[data-cancha="${c1}"][data-hora="${horaInicialC1}"]').click();
      s1.querySelector('button[data-cancha="${c1}"][data-hora="18:00"]').click();
    `);
    await sleep(150);

    // Ir a Semifinal en el mismo día 3, marcar 19:00 en c1 (válido porque Cuartos cerraba a las 19:00)
    await ev(`document.getElementById('tab-fase-2').click();`);
    await sleep(150);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelectorAll('.selector-dia__opcion')[3].click();
    `);
    await sleep(150);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelector('button[data-cancha="${c1}"][data-hora="19:00"]').click();
    `);
    await sleep(150);
    const semiAntesDeC2 = await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      return s2.querySelector('button[data-cancha="${c1}"][data-hora="19:00"]')?.getAttribute('aria-pressed');
    `);

    // Volver a Cuartos y marcar 19:00 en c2 (cierra a las 20:00 -> Semifinal a las 19:00 queda antes del fin de Cuartos en cancha 2!)
    await ev(`document.getElementById('tab-fase-1').click();`);
    await sleep(150);
    await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      s1.querySelector('button[data-cancha="${c2}"][data-hora="19:00"]').click();
    `);
    await sleep(200);

    // Verificar en Semifinal que 19:00 fue limpiada por cascada y que < 20:00 está bloqueado
    await ev(`document.getElementById('tab-fase-2').click();`);
    await sleep(200);
    const ordenSemiEnVivo = await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      const tab2Txt = document.getElementById('tab-fase-2')?.textContent?.trim() || '';
      const h18Disabled = s2.querySelector('button[data-cancha="${c1}"][data-hora="18:00"]')?.disabled;
      const h19Disabled = s2.querySelector('button[data-cancha="${c1}"][data-hora="19:00"]')?.disabled;
      const h20Disabled = s2.querySelector('button[data-cancha="${c1}"][data-hora="20:00"]')?.disabled;
      return {
        semiAntesDeC2: ${JSON.stringify(semiAntesDeC2)},
        limpiadoEnCascada: /Sin horario/i.test(tab2Txt),
        h18Disabled: Boolean(h18Disabled),
        h19Disabled: Boolean(h19Disabled),
        h20Disabled: Boolean(h20Disabled),
      };
    `);

    // Volver a Cuartos para verificar el resumen y tomar captura de 3 canchas
    await ev(`document.getElementById('tab-fase-1').click();`);
    await sleep(200);

    const desbordeCalendario3Canchas = await ev(EXPR_DESBORDE);
    const cuartosResumen = await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      const filas = s1.querySelectorAll('.calendario-torneo__cancha-fila').length;
      const c1_ini = s1.querySelector('button[data-cancha="${c1}"][data-hora="${horaInicialC1}"]')?.getAttribute('aria-pressed');
      const c1_18 = s1.querySelector('button[data-cancha="${c1}"][data-hora="18:00"]')?.getAttribute('aria-pressed');
      const c2_19 = s1.querySelector('button[data-cancha="${c2}"][data-hora="19:00"]')?.getAttribute('aria-pressed');
      const resumenTxt = s1.querySelector('.formulario-reserva__rango')?.textContent?.trim() || '';
      return { filas, c1_ini, c1_18, c2_19, resumenTxt };
    `);

    await ev(`document.querySelector('.calendario-torneo')?.scrollIntoView({ block: 'start' });`);
    await sleep(200);
    await shot(`v1-${deporte}-${etiqueta}-cuartos-3canchas`);

    // Pasar Semifinal a día índice 4 y marcar 14:00 en c1
    await ev(`document.getElementById('tab-fase-2').click();`);
    await sleep(150);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelectorAll('.selector-dia__opcion')[4].click();
    `);
    await sleep(150);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelector('button[data-cancha="${c1}"][data-hora="14:00"]').click();
    `);
    await sleep(150);

    // Pasar Final a día índice 5 y marcar 5 horas (08:00..12:00 en c1)
    await ev(`document.getElementById('tab-fase-3').click();`);
    await sleep(150);
    await ev(`
      const s3 = document.querySelector('[aria-label="Fase 3: Final"]');
      s3.querySelectorAll('.selector-dia__opcion')[5].click();
    `);
    await sleep(150);
    await ev(`
      const s3 = document.querySelector('[aria-label="Fase 3: Final"]');
      for (const h of ['08:00', '09:00', '10:00', '11:00', '12:00']) {
        s3.querySelector(\`button[data-cancha="${c1}"][data-hora="\${h}"]\`).click();
      }
    `);
    await sleep(200);

    const avisoFinal = await ev(`
      const s3 = document.querySelector('[aria-label="Fase 3: Final"]');
      const calloutEl = s3.querySelector('.calendario-torneo__alerta-extra');
      const callout = calloutEl?.textContent?.trim() || null;
      const roleStatus = calloutEl?.getAttribute('role') || null;
      const tabTieneAviso = Boolean(document.querySelector('#tab-fase-3 svg')) &&
        /Revisa el horario/i.test(document.getElementById('tab-fase-3')?.textContent || '');
      return { callout, roleStatus, tabTieneAviso };
    `);

    if (esMovil) {
      await ev(`document.querySelector('.calendario-torneo__alerta-extra')?.scrollIntoView({ block: 'center' });`);
    } else {
      await ev(`document.querySelector('.calendario-torneo')?.scrollIntoView({ block: 'start' });`);
    }
    await sleep(200);
    await shot(`v1-${deporte}-${etiqueta}-final-aviso`);

    return {
      deporte,
      etiqueta,
      teclado,
      desbordeCalendario3Canchas,
      cuartosResumen,
      ordenSemiEnVivo,
      avisoFinal,
    };
  };

  const verificarDialogoYConfirmar = async (deporte, etiqueta, esMovil) => {
    if (!esMovil) {
      await ev(`document.getElementById('tab-fase-1').click();`);
      await sleep(150);
    }

    await ev(`
      const btn = [...document.querySelectorAll('button')]
        .find((b) => /Confirmar reserva/i.test(b.textContent));
      btn.focus();
      btn.click();
    `);
    await esperar(`document.querySelector('dialog[role="dialog"]')`, 'apertura diálogo horas sin partido');

    const dlgEstado = await ev(`
      const dlg = document.querySelector('dialog[role="dialog"]');
      const activoTexto = document.activeElement?.textContent?.trim() || null;
      return {
        abierto: Boolean(dlg),
        ariaModal: dlg?.getAttribute('aria-modal'),
        titulo: dlg?.querySelector('h2')?.textContent?.trim() || null,
        texto: dlg?.textContent?.replace(/\\s+/g, ' ').trim() || null,
        focoInicial: activoTexto,
      };
    `);

    // Probar trampa de foco con Tab y Shift+Tab dentro del diálogo
    await pressKey('Tab', 'Tab', 9);
    await sleep(100);
    const focoTrasTab1 = await ev(`return document.activeElement?.textContent?.trim() || null;`);
    await pressKey('Tab', 'Tab', 9);
    await sleep(100);
    const focoTrasTab2 = await ev(`return document.activeElement?.textContent?.trim() || null;`);
    // Shift+Tab (modifiers: 8)
    await pressKey('Tab', 'Tab', 9, 8);
    await sleep(100);
    const focoTrasShiftTab = await ev(`return document.activeElement?.textContent?.trim() || null;`);

    await shot(`v1-${deporte}-${etiqueta}-dialogo`);

    // Probar Escape: cierra diálogo y devuelve foco a Confirmar reserva
    await pressKey('Escape', 'Escape', 27);
    await sleep(200);
    const trasEscape = await ev(`
      return {
        dialogoAbierto: Boolean(document.querySelector('dialog[role="dialog"]')),
        focoTrasEscape: document.activeElement?.textContent?.trim() || null,
        reservasCount: (JSON.parse(localStorage.getItem('sportify_reservas_v2') || '{}').reservas || []).length,
      };
    `);

    // Volver a pulsar Confirmar y pulsar Revisar horas
    await ev(`
      const btn = [...document.querySelectorAll('button')]
        .find((b) => /Confirmar reserva/i.test(b.textContent));
      btn.focus();
      btn.click();
    `);
    await esperar(`document.querySelector('dialog[role="dialog"]')`, 'reapertura para Revisar horas');
    await ev(`
      [...document.querySelectorAll('dialog button')]
        .find((b) => /Revisar horas/i.test(b.textContent)).click();
    `);
    await sleep(300);

    const trasRevisar = await ev(`
      const tabFinal = document.getElementById('tab-fase-3');
      const enPasoFechas = Boolean(document.querySelector('[data-testid="paso-fechas"]')) || !${esMovil};
      return {
        enPasoFechas,
        tabFinalSeleccionada: tabFinal?.getAttribute('aria-selected') === 'true',
        focoId: document.activeElement?.id || null,
        reservasCount: (JSON.parse(localStorage.getItem('sportify_reservas_v2') || '{}').reservas || []).length,
      };
    `);

    if (esMovil) {
      for (const pasoEsperado of ['paso-llaves', 'paso-datos', 'paso-resumen']) {
        await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
        await esperar(`document.querySelector('[data-testid="${pasoEsperado}"]')`, pasoEsperado);
      }
    }

    // Volver a pulsar Confirmar y pulsar Reservar igual (doble clic rápido para probar que repetir no duplica)
    await ev(`
      [...document.querySelectorAll('button')]
        .find((b) => /Confirmar reserva/i.test(b.textContent)).click();
    `);
    await esperar(`document.querySelector('dialog[role="dialog"]')`, 'reapertura para Reservar igual');
    await ev(`
      const btnIgual = [...document.querySelectorAll('dialog button')]
        .find((b) => /Reservar igual/i.test(b.textContent));
      btnIgual.click();
      await new Promise((r) => setTimeout(r, 20));
      btnIgual.click();
    `);
    await esperar(`document.querySelector('.confirmacion-reserva')`, 'pantalla de confirmación');
    await sleep(300);

    const confirmacion = await ev(`
      const box = document.querySelector('.confirmacion-reserva');
      const reservas = JSON.parse(localStorage.getItem('sportify_reservas_v2') || '{}').reservas || [];
      return {
        reservasCount: reservas.length,
        titulo: box?.querySelector('.confirmacion-reserva__titulo')?.textContent?.trim() || null,
        codigo: box?.querySelector('.confirmacion-reserva__codigo')?.textContent?.trim() || null,
        jornadasTexto: [...box.querySelectorAll('.confirmacion-reserva__torneo-jornada-item')].map((li) => li.textContent.trim()),
        desbordeConfirmacion: document.documentElement.scrollWidth === innerWidth,
      };
    `);

    await shot(`v1-${deporte}-${etiqueta}-confirmacion`);

    // Abrir "Mis reservas" desde Navbar y buscar por código
    await ev(`document.querySelector('button[aria-label="Mis reservas"]').click();`);
    await esperar(`document.querySelector('input[placeholder="SPF-XXXXXX"]')`, 'modal Mis reservas');
    await ev(`
      const inp = document.querySelector('input[placeholder="SPF-XXXXXX"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inp, ${JSON.stringify(confirmacion.codigo)});
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      [...document.querySelectorAll('dialog button, .mis-reservas button')]
        .find((b) => /^Buscar$/i.test(b.textContent.trim())).click();
    `);
    await esperar(`document.querySelector('.mis-reservas__torneo-fases')`, 'lista de fases en Mis reservas');
    await sleep(250);

    const misReservas = await ev(`
      const phases = [...document.querySelectorAll('.mis-reservas__torneo-fase')].map((li) => li.textContent.trim());
      return {
        fasesCount: phases.length,
        phases,
        sinDesborde: document.documentElement.scrollWidth === innerWidth,
      };
    `);

    await shot(`v1-${deporte}-${etiqueta}-mis-reservas`);

    return {
      dlgEstado,
      trampaFoco: { focoTrasTab1, focoTrasTab2, focoTrasShiftTab },
      trasEscape,
      trasRevisar,
      confirmacion,
      misReservas,
    };
  };

  const resultado = { base: BASE };

  // === 1. PÁDEL MÓVIL 390x844 ===
  await setViewport(390, 844, true);
  await irLimpio('/reservar/padel?modo=torneo');
  await seleccionarTresCanchas();
  const desbordePadelCanchas390 = await ev(EXPR_DESBORDE);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-formato"]')`, 'paso-formato padel 390');
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-fechas"]')`, 'paso-fechas padel 390');
  const calPadel390 = await probarFlujoCalendario('padel', '390', true);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-llaves"]')`, 'paso-llaves padel 390');
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-datos"]')`, 'paso-datos padel 390');
  await escribirNombre('Andrés Morales');
  await sleep(150);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-resumen"]')`, 'paso-resumen padel 390');
  const desbordePadelResumen390 = await ev(EXPR_DESBORDE);
  const flujoPadel390 = await verificarDialogoYConfirmar('padel', '390', true);

  resultado.padel390 = {
    desbordePadelCanchas390,
    calPadel390,
    desbordePadelResumen390,
    flujoPadel390,
  };

  // === 2. PÁDEL ESCRITORIO 1440x900 ===
  await setViewport(1440, 900, false);
  await irLimpio('/reservar/padel?modo=torneo');
  await seleccionarTresCanchas();
  const desbordePadel1440 = await ev(EXPR_DESBORDE);
  const calPadel1440 = await probarFlujoCalendario('padel', '1440', false);
  await escribirNombre('Laura Morales');
  await sleep(150);
  const voucherPadel1440 = await ev(`
    const items = [...document.querySelectorAll('.voucher-reserva__fase-item, .voucher-reserva__linea-descuento, .voucher-reserva__valor-total')]
      .map((el) => el.textContent.replace(/\\s+/g, ' ').trim());
    return items;
  `);
  const flujoPadel1440 = await verificarDialogoYConfirmar('padel', '1440', false);

  resultado.padel1440 = {
    desbordePadel1440,
    calPadel1440,
    voucherPadel1440,
    flujoPadel1440,
  };

  // === 3. FÚTBOL MÓVIL 390x844 ===
  await setViewport(390, 844, true);
  await irLimpio('/reservar/futbol?modo=torneo');
  await seleccionarTresCanchas();
  const desbordeFutbolCanchas390 = await ev(EXPR_DESBORDE);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-formato"]')`, 'paso-formato futbol 390');
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-fechas"]')`, 'paso-fechas futbol 390');
  const calFutbol390 = await probarFlujoCalendario('futbol', '390', true);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-llaves"]')`, 'paso-llaves futbol 390');
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-datos"]')`, 'paso-datos futbol 390');
  await escribirNombre('Carlos Ramírez');
  await sleep(150);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-resumen"]')`, 'paso-resumen futbol 390');
  const desbordeFutbolResumen390 = await ev(EXPR_DESBORDE);
  const flujoFutbol390 = await verificarDialogoYConfirmar('futbol', '390', true);

  resultado.futbol390 = {
    desbordeFutbolCanchas390,
    calFutbol390,
    desbordeFutbolResumen390,
    flujoFutbol390,
  };

  // === 4. FÚTBOL ESCRITORIO 1440x900 ===
  await setViewport(1440, 900, false);
  await irLimpio('/reservar/futbol?modo=torneo');
  await seleccionarTresCanchas();
  const desbordeFutbol1440 = await ev(EXPR_DESBORDE);
  const calFutbol1440 = await probarFlujoCalendario('futbol', '1440', false);
  await escribirNombre('Diana Ospina');
  await sleep(150);
  const flujoFutbol1440 = await verificarDialogoYConfirmar('futbol', '1440', false);

  resultado.futbol1440 = {
    desbordeFutbol1440,
    calFutbol1440,
    flujoFutbol1440,
  };

  resultado.erroresConsola = erroresConsola;
  resultado.excepciones = excepciones;

  fs.writeFileSync(path.join(OUT, 'v1-resultado.json'), JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));

  if (erroresConsola.length > 0 || excepciones.length > 0) {
    process.exitCode = 1;
  }
} finally {
  try {
    sock?.close();
  } catch {
    // ignorar
  }
  try {
    chrome.kill('SIGKILL');
  } catch {
    // ignorar
  }
  try {
    fs.rmSync(perfil, { recursive: true, force: true });
  } catch {
    // ignorar
  }
}
