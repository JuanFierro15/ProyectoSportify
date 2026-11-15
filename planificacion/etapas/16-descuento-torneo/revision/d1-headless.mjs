// Verificación headless para d1-descuento-torneo (390x844 y 1440x900)
// en /reservar/padel?modo=torneo vía CDP sobre npm run preview (puerto 4173).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9351;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-d1-'));

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
    return { vw, sw, sinDesborde: sw === vw };
  `;

  const seleccionarPrimeraCancha = async () => {
    await esperar(
      `document.querySelector('.tarjeta-cancha--activa .tarjeta-cancha__boton')`,
      'botón de primera cancha en carrusel'
    );
    await ev(`
      const btn = document.querySelector('.tarjeta-cancha--activa .tarjeta-cancha__boton');
      btn.click();
    `);
    await esperar(
      `document.querySelectorAll('.canchas-elegidas__chip').length === 1`,
      '1 chip de cancha seleccionada'
    );
  };

  const leerPromo = () =>
    ev(`
      const el = document.querySelector('.calendario-torneo .formulario-reserva__promo');
      if (!el) return { visible: false, texto: null };
      const r = el.getBoundingClientRect();
      return {
        visible: r.width > 0 && r.height > 0,
        texto: el.textContent.replace(/\\u00a0/g, ' ').replace(/\\s+/g, ' ').trim(),
      };
    `);

  const leerVoucher = () =>
    ev(`
      const v = document.querySelector('.voucher-reserva');
      if (!v) return null;
      const normalizar = (s) => (s || '').replace(/\\u00a0/g, ' ').replace(/\\s+/g, ' ').trim();
      return {
        total: normalizar(v.querySelector('.voucher-reserva__valor-total')?.textContent),
        descuentosLinea: [...v.querySelectorAll('.voucher-reserva__linea-descuento')].map((el) =>
          normalizar(el.textContent)
        ),
        totalesLinea: [...v.querySelectorAll('.voucher-reserva__linea-total')].map((el) =>
          normalizar(el.textContent)
        ),
        calculosLinea: [...v.querySelectorAll('.voucher-reserva__linea-calculo')].map((el) =>
          normalizar(el.textContent)
        ),
      };
    `);

  const resultado = { base: BASE };

  // === 1. MÓVIL 390x844 ===
  // En móvil el asistente exige completar las fases para llegar a Resumen;
  // usamos 4 equipos y 15 min/partido para que 1 hora en cada fase sea válida
  // y cada línea del voucher muestre $50.000 y "−$15.000 por hora".
  await setViewport(390, 844, true);
  await irLimpio('/reservar/padel?modo=torneo');
  await seleccionarPrimeraCancha();
  const desbordeCanchas390 = await ev(EXPR_DESBORDE);

  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-formato"]')`, 'paso-formato 390');
  await ev(`
    [...document.querySelectorAll('button')].find((b) => /4 equipos/i.test(b.textContent))?.click();
    [...document.querySelectorAll('button')].find((b) => /^15 min$/i.test(b.textContent.trim()))?.click();
  `);
  await sleep(150);

  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-fechas"]')`, 'paso-fechas 390');

  const promo390 = await leerPromo();
  await ev(`
    const s1 = document.querySelector('[aria-label="Fase 1: Semifinal"]');
    s1.querySelectorAll('.selector-dia__opcion')[3].click();
  `);
  await sleep(150);
  await ev(`
    const s1 = document.querySelector('[aria-label="Fase 1: Semifinal"]');
    s1.querySelector('button[data-cancha="padel-1"][data-hora="16:00"]').click();
  `);
  await sleep(150);
  await ev(`document.querySelector('.calendario-torneo')?.scrollIntoView({ block: 'start' });`);
  await sleep(200);
  const desbordeCalendario390 = await ev(EXPR_DESBORDE);
  await shot('d1-padel-390-calendario');

  await ev(`document.getElementById('tab-fase-2').click();`);
  await sleep(150);
  await ev(`
    const s2 = document.querySelector('[aria-label="Fase 2: Final"]');
    s2.querySelectorAll('.selector-dia__opcion')[5].click();
  `);
  await sleep(150);
  await ev(`
    const s2 = document.querySelector('[aria-label="Fase 2: Final"]');
    s2.querySelector('button[data-cancha="padel-1"][data-hora="10:00"]').click();
  `);
  await sleep(150);

  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-llaves"]')`, 'paso-llaves 390');
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-datos"]')`, 'paso-datos 390');
  await ev(`
    const input = document.getElementById('reserva-nombre') || document.querySelector('input[type="text"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Laura Morales');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await sleep(150);
  await ev(`document.querySelector('.asistente-torneo__boton-siguiente').click();`);
  await esperar(`document.querySelector('[data-testid="paso-resumen"]')`, 'paso-resumen 390');
  await sleep(200);

  const voucher390 = await leerVoucher();
  const desbordeVoucher390 = await ev(EXPR_DESBORDE);
  await ev(`document.querySelector('.voucher-reserva')?.scrollIntoView({ block: 'start' });`);
  await sleep(200);
  await shot('d1-padel-390-voucher');

  resultado.movil390 = {
    promo390,
    voucher390,
    desbordeCanchas390,
    desbordeCalendario390,
    desbordeVoucher390,
  };

  // === 2. ESCRITORIO 1440x900 ===
  // En escritorio el voucher es visible en vivo con 1 sola hora en 1 cancha ($50.000).
  await setViewport(1440, 900, false);
  await irLimpio('/reservar/padel?modo=torneo');
  await seleccionarPrimeraCancha();

  const promo1440 = await leerPromo();
  await ev(`
    const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
    s1.querySelectorAll('.selector-dia__opcion')[3].click();
  `);
  await sleep(150);
  await ev(`
    const s1 = document.querySelector('[aria-label="Fase 1: Cuartos de final"]');
    s1.querySelector('button[data-cancha="padel-1"][data-hora="16:00"]').click();
  `);
  await sleep(200);

  const voucher1440 = await leerVoucher();
  const desborde1440 = await ev(EXPR_DESBORDE);

  await ev(`document.querySelector('.calendario-torneo')?.scrollIntoView({ block: 'start' });`);
  await sleep(200);
  await shot('d1-padel-1440-calendario-voucher');

  resultado.escritorio1440 = {
    promo1440,
    voucher1440,
    desborde1440,
  };

  resultado.erroresConsola = erroresConsola;
  resultado.excepciones = excepciones;

  fs.writeFileSync(path.join(OUT, 'd1-resultado.json'), JSON.stringify(resultado, null, 2));
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
