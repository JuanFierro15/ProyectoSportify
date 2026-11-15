// Verificación headless (390x844 y 1440x900) para u1-interfaz-torneo vía CDP.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9347;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-u1-'));

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
    await sleep(900);
    await ev(`localStorage.clear(); sessionStorage.clear();`);
    await cdp('Page.navigate', { url: `${BASE}${ruta}` });
    await sleep(1600);
  };

  const esperar = async (exprCondicion, desc, timeoutMs = 4000) => {
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

  const seleccionarTresCanchasPadel = async () => {
    await ev(`
      const dots = [...document.querySelectorAll('.depth-carousel__dot')];
      for (let i = 0; i < dots.length; i++) {
        dots[i].click();
        await new Promise((r) => setTimeout(r, 450));
        const btn = document.querySelector('.tarjeta-cancha--activa .tarjeta-cancha__boton');
        if (btn && /Agregar al evento/i.test(btn.textContent)) {
          btn.click();
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    `);
    await esperar(
      `document.querySelectorAll('.canchas-elegidas__chip').length === 3`,
      '3 chips de canchas de pádel seleccionadas'
    );
  };

  const probarFlujoCalendario = async (etiqueta, esMovil) => {
    // 1. Cuartos (fase 1): día índice 3 (en semilla: padel-1 libre a las 16,18; padel-2 libre a las 19)
    await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      const dias1 = [...s1.querySelectorAll('.selector-dia__opcion')];
      dias1[3].click();
    `);
    await sleep(200);
    await ev(`
      document.querySelector('button[data-cancha="padel-1"][data-hora="16:00"]').click();
      document.querySelector('button[data-cancha="padel-1"][data-hora="18:00"]').click();
      document.querySelector('button[data-cancha="padel-2"][data-hora="19:00"]').click();
    `);
    await sleep(200);

    const desbordeCalendario3Canchas = await ev(EXPR_DESBORDE);
    const cuartosResumen = await ev(`
      const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
      const filas = s1.querySelectorAll('.calendario-torneo__cancha-fila').length;
      const p1_16 = s1.querySelector('button[data-cancha="padel-1"][data-hora="16:00"]')?.getAttribute('aria-pressed');
      const p1_18 = s1.querySelector('button[data-cancha="padel-1"][data-hora="18:00"]')?.getAttribute('aria-pressed');
      const p2_19 = s1.querySelector('button[data-cancha="padel-2"][data-hora="19:00"]')?.getAttribute('aria-pressed');
      const p2_14_disabled = s1.querySelector('button[data-cancha="padel-2"][data-hora="14:00"]')?.disabled;
      const p1_14_disabled = s1.querySelector('button[data-cancha="padel-1"][data-hora="14:00"]')?.disabled;
      const resumenTxt = s1.querySelector('.formulario-reserva__rango')?.textContent?.trim() || '';
      return { filas, p1_16, p1_18, p2_19, p2_14_disabled, p1_14_disabled, resumenTxt };
    `);

    if (esMovil) {
      await ev(`document.querySelector('.calendario-torneo')?.scrollIntoView({ block: 'start' });`);
      await sleep(200);
      await shot('u1-390-cuartos-3canchas');
    }

    // 2. Semifinal: verificar bloqueo cronológico mismo día que Cuartos (día índice 3 -> <20:00 bloqueado por padel-2 19:00)
    await ev(`document.getElementById('tab-fase-2').click();`);
    await sleep(200);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      const dias2 = [...s2.querySelectorAll('.selector-dia__opcion')];
      dias2[3].click();
    `);
    await sleep(200);
    const semiBloqueoMismoDia = await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      const h18 = s2.querySelector('button[data-cancha="padel-1"][data-hora="18:00"]')?.disabled;
      const h19 = s2.querySelector('button[data-cancha="padel-1"][data-hora="19:00"]')?.disabled;
      const h20 = s2.querySelector('button[data-cancha="padel-1"][data-hora="20:00"]')?.disabled;
      return { h18Disabled: Boolean(h18), h19Disabled: Boolean(h19), h20Disabled: Boolean(h20) };
    `);

    // Pasar Semifinal a día índice 4 (padel-2 y padel-3 vacíos en semilla; padel-1 libre a las 14:00)
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelectorAll('.selector-dia__opcion')[4].click();
    `);
    await sleep(200);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelector('button[data-cancha="padel-1"][data-hora="14:00"]').click();
    `);
    await sleep(200);

    // Probar cascada al mover Semifinal al día índice 3: las 14:00 (< 20:00 fin de Cuartos) se limpian solas
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelectorAll('.selector-dia__opcion')[3].click();
    `);
    await sleep(200);
    const semiCascadaLimpio = await ev(`
      const tab2Txt = document.getElementById('tab-fase-2')?.textContent?.trim() || '';
      return /Sin horario/i.test(tab2Txt);
    `);

    // Volver a programar Semifinal en día índice 4 a las 14:00
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelectorAll('.selector-dia__opcion')[4].click();
    `);
    await sleep(200);
    await ev(`
      const s2 = document.querySelector('[aria-label="Fase 2: Semifinal"]');
      s2.querySelector('button[data-cancha="padel-1"][data-hora="14:00"]').click();
    `);
    await sleep(200);

    // 3. Final: día índice 5 (padel-1 vacío en semilla) y marcar 5 horas (08:00..12:00)
    await ev(`document.getElementById('tab-fase-3').click();`);
    await sleep(200);
    await ev(`
      const s3 = document.querySelector('[aria-label="Fase 3: Final"]');
      s3.querySelectorAll('.selector-dia__opcion')[5].click();
    `);
    await sleep(200);
    await ev(`
      const s3 = document.querySelector('[aria-label="Fase 3: Final"]');
      for (const h of ['08:00', '09:00', '10:00', '11:00', '12:00']) {
        s3.querySelector(\`button[data-cancha="padel-1"][data-hora="\${h}"]\`).click();
      }
    `);
    await sleep(250);

    const avisoFinal = await ev(`
      const s3 = document.querySelector('[aria-label="Fase 3: Final"]');
      const callout = s3.querySelector('.calendario-torneo__alerta-extra')?.textContent?.trim() || null;
      const tabTieneAviso = Boolean(document.querySelector('#tab-fase-3 svg')) &&
        /Revisa el horario/i.test(document.getElementById('tab-fase-3')?.textContent || '');
      return { callout, tabTieneAviso };
    `);

    if (esMovil) {
      await ev(`document.querySelector('.calendario-torneo__alerta-extra')?.scrollIntoView({ block: 'center' });`);
      await sleep(200);
      await shot('u1-390-final-aviso');
    } else {
      await ev(`document.querySelector('.calendario-torneo')?.scrollIntoView({ block: 'start' });`);
      await sleep(200);
      await shot('u1-1440-calendario-aviso');
    }

    return {
      etiqueta,
      desbordeCalendario3Canchas,
      cuartosResumen,
      semiBloqueoMismoDia,
      semiCascadaLimpio,
      avisoFinal,
    };
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

  const verificarDialogoYConfirmar = async (esMovil) => {
    // Asegurar pestaña Cuartos antes de confirmar para verificar que Revisar horas vuelve a Final
    if (!esMovil) {
      await ev(`document.getElementById('tab-fase-1').click();`);
      await sleep(150);
    }

    // Pulsar Confirmar reserva (simulando foco previo como clic real o teclado)
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
        titulo: dlg?.querySelector('h2')?.textContent?.trim() || null,
        texto: dlg?.textContent?.replace(/\\s+/g, ' ').trim() || null,
        focoInicial: activoTexto,
      };
    `);

    await shot(esMovil ? 'u1-390-dialogo' : 'u1-1440-dialogo');

    // Probar Escape: cierra diálogo y devuelve foco al botón Confirmar reserva
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
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
      // Avanzar de paso fechas -> llaves -> datos -> resumen en asistente móvil
      for (const pasoEsperado of ['paso-llaves', 'paso-datos', 'paso-resumen']) {
        await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
        await esperar(`document.querySelector('[data-testid="${pasoEsperado}"]')`, pasoEsperado);
      }
    }

    // Volver a pulsar Confirmar y pulsar Reservar igual
    await ev(`
      [...document.querySelectorAll('button')]
        .find((b) => /Confirmar reserva/i.test(b.textContent)).click();
    `);
    await esperar(`document.querySelector('dialog[role="dialog"]')`, 'reapertura para Reservar igual');
    await ev(`
      [...document.querySelectorAll('dialog button')]
        .find((b) => /Reservar igual/i.test(b.textContent)).click();
    `);
    await esperar(`document.querySelector('.confirmacion-reserva')`, 'pantalla de confirmación');
    await sleep(300);

    const confirmacion = await ev(`
      const box = document.querySelector('.confirmacion-reserva');
      return {
        titulo: box?.querySelector('.confirmacion-reserva__titulo')?.textContent?.trim() || null,
        codigo: box?.querySelector('.confirmacion-reserva__codigo')?.textContent?.trim() || null,
        jornadasTexto: [...box.querySelectorAll('.confirmacion-reserva__torneo-jornada-item')].map((li) => li.textContent.trim()),
        desbordeConfirmacion: document.documentElement.scrollWidth === innerWidth,
      };
    `);

    await shot(esMovil ? 'u1-390-confirmacion' : 'u1-1440-confirmacion');

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

    await shot(esMovil ? 'u1-390-mis-reservas' : 'u1-1440-mis-reservas');

    return {
      dlgEstado,
      trasEscape,
      trasRevisar,
      confirmacion,
      misReservas,
    };
  };

  const resultado = { base: BASE };

  // === CASO 1: MÓVIL 390x844 ===
  await setViewport(390, 844, true);
  await irLimpio('/reservar/padel?modo=torneo');
  await seleccionarTresCanchasPadel();
  const desbordePasoCanchas390 = await ev(EXPR_DESBORDE);

  // Siguiente -> formato
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-formato"]')`, 'paso-formato');
  // Siguiente -> fechas
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-fechas"]')`, 'paso-fechas');

  const cal390 = await probarFlujoCalendario('390', true);

  // Siguiente -> llaves -> datos -> llenar nombre -> resumen
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-llaves"]')`, 'paso-llaves');
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-datos"]')`, 'paso-datos');
  await escribirNombre('Andrés Morales');
  await sleep(150);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-resumen"]')`, 'paso-resumen');

  const desbordeResumen390 = await ev(EXPR_DESBORDE);
  const flujo390 = await verificarDialogoYConfirmar(true);

  resultado.movil390 = {
    desbordePasoCanchas390,
    cal390,
    desbordeResumen390,
    flujo390,
  };

  // === CASO 2: ESCRITORIO 1440x900 ===
  await setViewport(1440, 900, false);
  await irLimpio('/reservar/padel?modo=torneo');
  await seleccionarTresCanchasPadel();
  const desbordeInicial1440 = await ev(EXPR_DESBORDE);

  const cal1440 = await probarFlujoCalendario('1440', false);
  await escribirNombre('Laura Morales');
  await sleep(150);
  const voucher1440 = await ev(`
    const items = [...document.querySelectorAll('.voucher-reserva__fase-item, .voucher-reserva__linea-descuento, .voucher-reserva__valor-total')]
      .map((el) => el.textContent.replace(/\\s+/g, ' ').trim());
    return items;
  `);
  const flujo1440 = await verificarDialogoYConfirmar(false);

  resultado.desktop1440 = {
    desbordeInicial1440,
    cal1440,
    voucher1440,
    flujo1440,
  };

  resultado.erroresConsola = erroresConsola;
  resultado.excepciones = excepciones;

  fs.writeFileSync(path.join(OUT, 'u1-resultado.json'), JSON.stringify(resultado, null, 2));
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
