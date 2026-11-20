import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Reserva de torneo descartada dentro del asistente móvil (pendiente de #78).
// Dos pestañas del mismo navegador (comparten localStorage):
//   A (390 px): no puede guardar (setItem lanza) y confirma un torneo en
//               Pádel 1 con Cuartos el 2.º día a las 11:00 y 12:00.
//   B (390 px): reserva Pádel 1, 2.º día, 11:00 en modo cancha (sí guarda).
// El evento storage llega a A, el torneo se descarta y A muestra el aviso.
// Después A pulsa "Elegir otro horario" y se registra a qué paso vuelve.
//
// Uso: node descartada-asistente.mjs --preview <raíz con dist/> [--capturas <carpeta>]

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;
const URL_BASE = 'http://localhost:4174';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const raiz = path.resolve(args[args.indexOf('--preview') + 1]);
const capturas = args.includes('--capturas') ? path.resolve(args[args.indexOf('--capturas') + 1]) : null;
if (capturas) fs.mkdirSync(capturas, { recursive: true });

function matar(proc) {
  if (proc && proc.pid) spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
}

async function esperarUrl(url, ms = 30000) {
  const inicio = Date.now();
  while (Date.now() - inicio < ms) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`No responde ${url}`);
}

function sesion(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pend = new Map();
    const esperas = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(String(ev.data));
      if (m.id && pend.has(m.id)) {
        const p = pend.get(m.id);
        pend.delete(m.id);
        m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
      } else if (m.method && esperas.has(m.method)) {
        const l = esperas.get(m.method);
        esperas.delete(m.method);
        l.forEach((f) => f(m.params));
      }
    });
    ws.addEventListener('open', () => {
      const send = (method, params = {}) =>
        new Promise((res, rej) => {
          const n = id++;
          pend.set(n, { res, rej });
          ws.send(JSON.stringify({ id: n, method, params }));
        });
      const evento = (method, ms = 15000) =>
        new Promise((res, rej) => {
          const t = setTimeout(() => rej(new Error(`Timeout ${method}`)), ms);
          const l = esperas.get(method) || [];
          l.push((p) => {
            clearTimeout(t);
            res(p);
          });
          esperas.set(method, l);
        });
      resolve({ send, evento, cerrar: () => ws.close() });
    });
    ws.addEventListener('error', reject);
  });
}

async function pestana() {
  const info = await (await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: 'PUT' })).json();
  const cdp = await sesion(info.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const ev = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result?.value;
  };
  const esperar = async (sel, ms = 10000) => {
    const inicio = Date.now();
    while (Date.now() - inicio < ms) {
      if (await ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)) return;
      await sleep(100);
    }
    throw new Error(`Timeout esperando ${sel}`);
  };
  const clic = async (sel) => {
    await esperar(sel);
    const ok = await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el.disabled) return false; el.click(); return true; })()`);
    if (!ok) throw new Error(`Deshabilitado: ${sel}`);
    await sleep(300);
  };
  const escribir = async (sel, texto) => {
    await esperar(sel);
    await ev(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(texto)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(150);
  };
  const abrir = async (ruta) => {
    const carga = cdp.evento('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: URL_BASE + ruta });
    await carga;
    await esperar('.vista-canchas');
    await sleep(1500);
  };
  const captura = async (nombre) => {
    if (!capturas) return;
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(capturas, nombre), Buffer.from(data, 'base64'));
  };
  const pasoActivo = () =>
    ev(`(() => {
      const actual = document.querySelector('[aria-current="step"]');
      const cab = document.querySelector('.asistente-torneo__cabecera');
      return { indicador: actual ? actual.textContent.trim() : null, cabecera: cab ? cab.textContent.trim().slice(0, 80) : null };
    })()`);
  return { cdp, ev, esperar, clic, escribir, abrir, captura, pasoActivo };
}

const informe = {};
const servidor = spawn(process.execPath, [path.join(raiz, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', '4174', '--strictPort'], { cwd: raiz, stdio: 'ignore' });
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sportify-descartada-'));
const chrome = spawn(CHROME_PATH, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`, '--no-first-run', '--hide-scrollbars'], { stdio: 'ignore' });
let codigoSalida = 0;
try {
  await esperarUrl(`${URL_BASE}/`);
  await esperarUrl(`http://127.0.0.1:${PORT}/json/version`);

  // --- Pestaña A: torneo sin poder guardar ---
  const A = await pestana();
  await A.abrir('/reservar/padel?modo=torneo');
  await A.ev('localStorage.clear()');
  await A.abrir('/reservar/padel?modo=torneo');
  await A.ev(`Storage.prototype.setItem = function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }`);
  await A.clic('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
  informe.canchaTorneo = await A.ev(`document.querySelector('.depth-carousel__card[aria-hidden="false"] h3, .depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__nombre')?.textContent.trim() || null`);
  const sig = '.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente';
  await A.clic(sig); // Formato
  await A.clic(sig); // Fechas por fase
  await A.clic('#tab-fase-1');
  await A.clic('.calendario-torneo__fase[data-ronda="1"] .selector-dia button:nth-child(2)');
  await A.clic('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="11:00"]');
  await A.clic('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="12:00"]');
  await A.clic('#tab-fase-2');
  await A.clic('.calendario-torneo__fase[data-ronda="2"] .selector-dia button:nth-child(3)');
  await A.clic('.calendario-torneo__fase[data-ronda="2"] .formulario-reserva__horas button[data-hora="11:00"]');
  await A.clic('#tab-fase-3');
  await A.clic('.calendario-torneo__fase[data-ronda="3"] .selector-dia button:nth-child(4)');
  await A.clic('.calendario-torneo__fase[data-ronda="3"] .formulario-reserva__horas button[data-hora="11:00"]');
  await A.clic(sig); // Llaves
  await A.clic(sig); // Tus datos
  await A.escribir('#reserva-nombre', 'Ana Torneo');
  await A.escribir('#reserva-telefono', '3001234567');
  await A.clic(sig); // Resumen
  informe.pasoAntesDeConfirmar = await A.pasoActivo();
  await A.clic('.voucher-reserva__acciones button.success');
  await A.esperar('.confirmacion-reserva');
  informe.codigoA = await A.ev(`document.querySelector('.confirmacion-reserva__codigo')?.textContent.trim() || null`);
  informe.reservasGuardadasTrasConfirmarA = await A.ev(`JSON.parse(localStorage.getItem('sportify_reservas_v2') || '{"reservas":[]}').reservas.length`);
  await A.captura('1-a-confirmada.png');

  // --- Pestaña B: ocupa Pádel 1, 2.º día, 11:00 y sí guarda ---
  const B = await pestana();
  await B.abrir('/reservar/padel');
  await B.ev(`(() => { const b = Array.from(document.querySelectorAll('.selector-modo button')).find((x) => x.textContent.trim() === 'Cancha'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); })()`);
  await sleep(500);
  informe.canchaB = await B.ev(`document.querySelector('.depth-carousel__card[aria-hidden="false"] h3, .depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__nombre')?.textContent.trim() || null`);
  await B.clic('.selector-dia button:nth-child(2)');
  await B.clic('.formulario-reserva__horas button[data-hora="11:00"]');
  await B.escribir('#reserva-nombre', 'Beto Cancha');
  await B.escribir('#reserva-telefono', '3019876543');
  await B.clic('.voucher-reserva__acciones button.success');
  await B.esperar('.confirmacion-reserva');
  informe.codigoB = await B.ev(`document.querySelector('.confirmacion-reserva__codigo')?.textContent.trim() || null`);

  // --- Pestaña A: aviso de reserva descartada ---
  await A.cdp.send('Page.bringToFront');
  await A.esperar('.vista-canchas__descartada', 15000);
  await sleep(600);
  informe.aviso = await A.ev(`(() => ({
    titulo: document.querySelector('.vista-canchas__descartada-titulo')?.textContent.trim(),
    focoEnTitulo: document.activeElement === document.querySelector('.vista-canchas__descartada-titulo'),
    alertas: document.querySelectorAll('[role="alert"]').length,
    ariaLive: document.querySelectorAll('[aria-live]').length,
    hayCodigo: Boolean(document.querySelector('.confirmacion-reserva__codigo')),
    hayQr: Boolean(document.querySelector('.confirmacion-reserva canvas, .confirmacion-reserva svg[role="img"], .confirmacion-reserva img')),
  }))()`);
  await A.captura('2-a-descartada.png');

  await A.clic('.vista-canchas__descartada-boton');
  await sleep(900);
  informe.trasElegirOtro = await A.pasoActivo();
  await A.captura('3-a-elegir-otro.png');
  // Estado de las fases al volver
  const leerFase = (ronda) =>
    A.ev(`(() => {
      const f = document.querySelector('.calendario-torneo__fase[data-ronda="${ronda}"]');
      if (!f) return 'fase no visible';
      const dia = f.querySelector('.selector-dia__opcion--sel');
      const sel = Array.from(f.querySelectorAll('.formulario-reserva__horas button[aria-pressed="true"]')).map((b) => b.dataset.hora);
      const h11 = f.querySelector('.formulario-reserva__horas button[data-hora="11:00"]');
      return { dia: dia ? dia.getAttribute('aria-label') : null, horasElegidas: sel, once: h11 ? { deshabilitada: h11.disabled, texto: h11.textContent.trim() } : null };
    })()`);
  // Ir a Fechas (si se puede) para ver la fase 1
  informe.irAFechas = await A.ev(`(() => {
    const b = Array.from(document.querySelectorAll('.indicador-pasos button, [class*="indicador-pasos"] button')).find((x) => /Fechas/.test(x.textContent));
    if (!b || b.disabled) return false; b.click(); return true;
  })()`);
  await sleep(600);
  if (await A.ev(`Boolean(document.querySelector('#tab-fase-1'))`)) {
    await A.clic('#tab-fase-1');
    informe.fase1 = await leerFase(1);
    await A.clic('#tab-fase-2');
    informe.fase2 = await leerFase(2);
  }
  informe.pasoTrasIrAFechas = await A.pasoActivo();
  await A.captura('4-a-fechas.png');
  informe.datosConservados = await A.ev(`(() => ({
    nombre: document.querySelector('#reserva-nombre')?.value ?? '(campo no visible en este paso)',
    telefono: document.querySelector('#reserva-telefono')?.value ?? '(campo no visible en este paso)',
  }))()`);
  A.cdp.cerrar();
  B.cdp.cerrar();
} catch (e) {
  informe.error = String(e && e.stack ? e.stack : e);
  codigoSalida = 1;
} finally {
  matar(chrome);
  matar(servidor);
  await sleep(400);
  fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
console.log(JSON.stringify(informe, null, 2));
process.exit(codigoSalida);
