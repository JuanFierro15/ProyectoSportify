import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Mide si el texto de estado de las pastillas del selector de día ("bloqueado",
// "13 libres", "completo") cabe dentro de su pastilla en varios anchos.
//
// Uso (con `npm run build` y `npm run preview` corriendo en la rama a medir):
//   node medir-pastillas.mjs [--url http://localhost:4173] [--anchos 360,400,412] [--salida resultado.json]
// O que levante y cierre su propio servidor sobre un build ya hecho:
//   node medir-pastillas.mjs --preview <raíz-del-repo-o-worktree>
// Con --preview usa el puerto 4174 y siempre mata el servidor al terminar.
//
// Escenas:
//   - torneo: /reservar/padel?modo=torneo, Cuartos de final en el 3.er día y la
//     pestaña Semifinal abierta: "Hoy" y "Mañana" quedan en "bloqueado".
//   - cancha: /reservar/padel en modo Cancha ("N libres" o "completo").
// Por pastilla informa el ancho útil (borde interno), el ancho del texto y si
// el texto queda recortado (overflow oculto), se sale del borde de la pastilla,
// queda a menos de 1 px del borde o usa letra de menos de 8 px.
// Termina con código 1 si alguna pastilla falla.

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
const ANCHOS_POR_DEFECTO = [
  320, 360, 375, 390, 400, 412, 414, 430, 480, 540, 600, 639, 640, 700, 768, 820, 900, 1023, 1024, 1280, 1440,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function leerArgs() {
  const args = process.argv.slice(2);
  const opciones = { url: 'http://localhost:4173', anchos: ANCHOS_POR_DEFECTO, salida: null, preview: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') opciones.url = args[++i];
    else if (args[i] === '--anchos') opciones.anchos = args[++i].split(',').map(Number);
    else if (args[i] === '--salida') opciones.salida = args[++i];
    else if (args[i] === '--preview') opciones.preview = path.resolve(args[++i]);
  }
  if (opciones.preview) opciones.url = 'http://localhost:4174';
  return opciones;
}

// Levanta `vite preview` en el puerto 4174 sobre el build de `raiz` y espera a
// que responda. Devuelve el proceso para matarlo al final.
async function levantarPreview(raiz) {
  const vite = path.join(raiz, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(path.join(raiz, 'dist', 'index.html'))) {
    throw new Error(`No hay build en ${raiz}\\dist: corre npm run build antes`);
  }
  const proc = spawn(process.execPath, [vite, 'preview', '--port', '4174', '--strictPort'], {
    cwd: raiz,
    stdio: 'ignore',
  });
  const inicio = Date.now();
  while (Date.now() - inicio < 30000) {
    try {
      const res = await fetch('http://localhost:4174/');
      if (res.ok) return proc;
    } catch {}
    await sleep(250);
  }
  matar(proc);
  throw new Error('vite preview no respondió en 30 s (¿puerto 4174 ocupado?)');
}

function matar(proc) {
  if (proc && proc.pid) spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
}

async function esperarDepurador(port, timeoutMs = 15000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(150);
  }
  throw new Error('Timeout esperando a Chrome CDP');
}

function crearSesion(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let siguienteId = 1;
    const pendientes = new Map();
    const esperas = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id) {
        const p = pendientes.get(msg.id);
        if (p) {
          pendientes.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result);
        }
      } else if (msg.method && esperas.has(msg.method)) {
        const lista = esperas.get(msg.method);
        esperas.delete(msg.method);
        lista.forEach((fn) => fn(msg.params));
      }
    });
    ws.addEventListener('open', () => {
      const send = (method, params = {}) =>
        new Promise((res, rej) => {
          const id = siguienteId++;
          pendientes.set(id, { resolve: res, reject: rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      const esperarEvento = (method, timeoutMs = 15000) =>
        new Promise((res, rej) => {
          const timer = setTimeout(() => rej(new Error(`Timeout esperando ${method}`)), timeoutMs);
          const lista = esperas.get(method) || [];
          lista.push((p) => {
            clearTimeout(timer);
            res(p);
          });
          esperas.set(method, lista);
        });
      resolve({ send, esperarEvento, cerrar: () => ws.close() });
    });
    ws.addEventListener('error', reject);
  });
}

// Se evalúa dentro de la página: mide las pastillas de `selectorRaiz`.
const MEDIR = (selectorRaiz) => `(() => {
  const raiz = document.querySelector(${JSON.stringify(selectorRaiz)});
  if (!raiz) throw new Error('No está el selector: ' + ${JSON.stringify(selectorRaiz)});
  return Array.from(raiz.querySelectorAll('.selector-dia__opcion')).map((btn) => {
    const span = btn.querySelector('.selector-dia__libres');
    const b = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    const internoIzq = b.left + parseFloat(cs.borderLeftWidth);
    const internoDer = b.right - parseFloat(cs.borderRightWidth);
    if (!span) return { texto: null, ok: true };
    const ss = getComputedStyle(span);
    const s = span.getBoundingClientRect();
    const rango = document.createRange();
    rango.selectNodeContents(span);
    const t = rango.getBoundingClientRect();
    const oculto = ss.overflowX === 'hidden' || ss.overflow === 'hidden';
    const recortado = oculto && t.width > s.width + 0.5;
    const fueraDeLaPastilla = t.left < internoIzq - 0.5 || t.right > internoDer + 0.5;
    return {
      texto: span.textContent.trim(),
      anchoPastilla: +(b.width).toFixed(1),
      anchoUtil: +(internoDer - internoIzq).toFixed(1),
      anchoTexto: +(t.width).toFixed(1),
      margenIzq: +(t.left - internoIzq).toFixed(1),
      margenDer: +(internoDer - t.right).toFixed(1),
      fontSize: ss.fontSize,
      letterSpacing: ss.letterSpacing,
      overflow: ss.overflowX,
      recortado,
      fueraDeLaPastilla,
      // Falla si se recorta, si se sale del borde o si queda a menos de 1 px de
      // él, o si la letra baja de 8 px.
      ok:
        !recortado &&
        t.left - internoIzq >= 1 &&
        internoDer - t.right >= 1 &&
        parseFloat(ss.fontSize) >= 8,
    };
  });
})()`;

async function main() {
  const { url, anchos, salida, preview } = leerArgs();
  const servidor = preview ? await levantarPreview(preview) : null;
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sportify-pastillas-'));
  const chrome = spawn(
    CHROME_PATH,
    ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`, '--no-first-run', '--hide-scrollbars'],
    { stdio: 'ignore' }
  );
  let cdp = null;
  const resultados = [];
  let fallos = 0;
  try {
    await esperarDepurador(PORT);
    const pestana = await (await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: 'PUT' })).json();
    cdp = await crearSesion(pestana.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const evaluar = async (expr) => {
      const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result?.value;
    };
    const esperarSelector = async (sel, timeoutMs = 10000) => {
      const inicio = Date.now();
      while (Date.now() - inicio < timeoutMs) {
        if (await evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)) return;
        await sleep(80);
      }
      throw new Error(`Timeout esperando ${sel}`);
    };
    const clic = async (sel) => {
      await esperarSelector(sel);
      await evaluar(`document.querySelector(${JSON.stringify(sel)}).click()`);
      await sleep(200);
    };
    const abrir = async (ruta, ancho) => {
      const movil = ancho < 1024;
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: ancho,
        height: movil ? 844 : 900,
        deviceScaleFactor: movil ? 2 : 1,
        mobile: movil,
      });
      const enBlanco = cdp.esperarEvento('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: 'about:blank' });
      await enBlanco;
      const carga = cdp.esperarEvento('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: `${url}${ruta}` });
      await carga;
      await evaluar('localStorage.clear()');
      const recarga = cdp.esperarEvento('Page.loadEventFired');
      await cdp.send('Page.reload');
      await recarga;
      await esperarSelector('.vista-canchas');
      await sleep(1200);
    };

    for (const ancho of anchos) {
      // Escena torneo: Semifinal con días bloqueados
      await abrir('/reservar/padel?modo=torneo', ancho);
      await clic('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
      const hayAsistente = await evaluar(
        `Boolean(document.querySelector('.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente'))`
      );
      if (hayAsistente) {
        await clic('.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente');
        await clic('.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente');
      }
      await clic('#tab-fase-1');
      await clic('.calendario-torneo__fase[data-ronda="1"] .selector-dia button:nth-child(3)');
      await clic('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="11:00"]');
      await clic('#tab-fase-2');
      const torneo = await evaluar(MEDIR('.calendario-torneo__fase[data-ronda="2"] .selector-dia'));
      const desbordeTorneo = await evaluar('document.documentElement.scrollWidth - window.innerWidth');

      // Escena cancha: "N libres" o "completo"
      await abrir('/reservar/padel', ancho);
      await evaluar(`(() => {
        const btn = Array.from(document.querySelectorAll('.selector-modo button')).find((b) => b.textContent.trim() === 'Cancha');
        if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
      })()`);
      await sleep(400);
      const cancha = await evaluar(MEDIR('.selector-dia'));
      const desbordeCancha = await evaluar('document.documentElement.scrollWidth - window.innerWidth');

      for (const [escena, pastillas, desborde] of [
        ['torneo', torneo, desbordeTorneo],
        ['cancha', cancha, desbordeCancha],
      ]) {
        const conTexto = pastillas.filter((p) => p.texto);
        const malas = conTexto.filter((p) => !p.ok);
        // La escena de torneo debe mostrar días bloqueados; si no, no prueba nada.
        const bloqueadas = conTexto.filter((p) => p.texto === 'bloqueado').length;
        const sinBloqueados = escena === 'torneo' && bloqueadas === 0;
        fallos += malas.length + (desborde > 0 ? 1 : 0) + (sinBloqueados ? 1 : 0);
        resultados.push({ ancho, escena, bloqueadas, desbordePagina: desborde, pastillas: conTexto });
        const peor = conTexto.reduce((a, p) => (a == null || p.margenDer < a.margenDer ? p : a), null);
        const bien = malas.length === 0 && desborde <= 0 && !sinBloqueados;
        console.log(
          `${String(ancho).padStart(4)} px ${escena.padEnd(6)} ${bien ? 'OK   ' : 'FALLA'} ` +
            `bloqueadas=${bloqueadas} desbordePagina=${desborde} ` +
            (peor
              ? `peor="${peor.texto}" util=${peor.anchoUtil} texto=${peor.anchoTexto} margenes=${peor.margenIzq}/${peor.margenDer} ` +
                `font=${peor.fontSize} ls=${peor.letterSpacing} overflow=${peor.overflow}`
              : 'sin texto') +
            (malas.length ? ` | fallan: ${malas.map((m) => m.texto).join(', ')}` : '')
        );
      }
    }
  } finally {
    if (cdp) {
      try {
        await cdp.send('Browser.close');
      } catch {}
      cdp.cerrar();
    }
    matar(chrome);
    matar(servidor);
    await sleep(400);
    fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  if (salida) fs.writeFileSync(salida, JSON.stringify(resultados, null, 2));
  console.log(fallos === 0 ? 'RESULTADO: todas las pastillas caben' : `RESULTADO: ${fallos} fallos`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
