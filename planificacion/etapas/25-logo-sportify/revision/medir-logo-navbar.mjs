import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Mide el logo de Sportify en el navbar, en el build real, en varios anchos y
// en los tres estados del navbar, y revisa el favicon.
//
// Uso (sobre un build ya hecho; levanta y cierra `vite preview` en el 4174):
//   node medir-logo-navbar.mjs --preview <raíz-del-repo-o-worktree>
//     [--anchos 320,390,1280] [--salida medidas.json] [--base antes.json]
//     [--capturas <carpeta>] [--foco]
// O contra un servidor ya levantado: --url http://localhost:4173
//
// Escenas:
//   - tope: `/` arriba del todo (navbar transparente sobre el video).
//   - bajado: `/` pasada la sección de heros (navbar claro).
//   - reserva: `/reservar/padel` (navbar oscuro de la página de reserva).
// Por escena revisa: que el enlace de la marca tenga el SVG `svg.logo-sportify`
// sin el trofeo, con alto entre 28 y 44 px y la proporción del logo
// (8623/2129 ± 0,03), dentro del ancho de la ventana, sin pisar los enlaces del
// menú; los colores de la marca (naranja y verde fijos) y de la palabra (el del
// estado); el nombre accesible "Sportify"; y que la página no desborde.
// Con --base compara el alto del navbar con una corrida anterior (máx. +4 px).
// Con --foco llega con Tab real al enlace de la marca y revisa su contorno.
// Termina con código 1 si algo falla y 2 si el script no pudo correr.

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;
const ANCHOS_POR_DEFECTO = [320, 360, 375, 390, 414, 480, 600, 639, 640, 768, 1023, 1024, 1280, 1440];
const PROPORCION = 8623 / 2129;
const NARANJA = 'rgb(241, 108, 19)';
const VERDE = 'rgb(47, 153, 92)';
const ESCENAS = {
  tope: { clase: 'site-header--transparent', palabra: 'rgb(255, 255, 255)' },
  bajado: { clase: 'site-header--scrolled', palabra: 'rgb(15, 23, 42)' },
  reserva: { clase: 'site-header--reserva', palabra: 'rgb(242, 242, 242)' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function leerArgs() {
  const args = process.argv.slice(2);
  const o = { url: 'http://localhost:4173', anchos: ANCHOS_POR_DEFECTO, salida: null, preview: null, base: null, capturas: null, foco: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') o.url = args[++i];
    else if (args[i] === '--anchos') o.anchos = args[++i].split(',').map(Number);
    else if (args[i] === '--salida') o.salida = args[++i];
    else if (args[i] === '--preview') o.preview = path.resolve(args[++i]);
    else if (args[i] === '--base') o.base = JSON.parse(fs.readFileSync(args[++i], 'utf8'));
    else if (args[i] === '--capturas') o.capturas = path.resolve(args[++i]);
    else if (args[i] === '--foco') o.foco = true;
  }
  if (o.preview) o.url = 'http://localhost:4174';
  return o;
}

async function levantarPreview(raiz) {
  const vite = path.join(raiz, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(path.join(raiz, 'dist', 'index.html'))) {
    throw new Error(`No hay build en ${raiz}\\dist: corre npm run build antes`);
  }
  const proc = spawn(process.execPath, [vite, 'preview', '--port', '4174', '--strictPort'], { cwd: raiz, stdio: 'ignore' });
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

// Se evalúa dentro de la página.
const MEDIR = `(() => {
  const header = document.querySelector('header.site-header');
  const a = document.querySelector('a.site-header__brand');
  if (!header || !a) throw new Error('No está el navbar o el enlace de la marca');
  const svg = a.querySelector('svg.logo-sportify');
  const caja = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, der: r.right, abajo: r.bottom }; };
  const copia = a.cloneNode(true);
  copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  const nombre = (a.getAttribute('aria-label') || copia.textContent).replace(/\\s+/g, ' ').trim();
  const items = Array.from(document.querySelectorAll('.site-header .menu > li')).map(caja);
  const r = {
    clases: header.className,
    altoHeader: +header.getBoundingClientRect().height.toFixed(1),
    topHeader: +header.getBoundingClientRect().top.toFixed(1),
    scrollY: Math.round(window.scrollY),
    nombre,
    trofeo: Boolean(a.querySelector('.lucide-trophy')),
    desborde: document.documentElement.scrollWidth - window.innerWidth,
    anchoVentana: window.innerWidth,
    logo: null,
  };
  if (svg) {
    const c = caja(svg);
    const fills = Array.from(svg.querySelectorAll('path')).map((p) => getComputedStyle(p).fill);
    const pisa = items.some((it) => it.w > 0 && it.h > 0 && c.x < it.der && it.x < c.der && c.y < it.abajo && it.y < c.abajo);
    r.logo = {
      x: +c.x.toFixed(1), der: +c.der.toFixed(1), w: +c.w.toFixed(1), h: +c.h.toFixed(1),
      proporcion: +(c.w / c.h).toFixed(3),
      fills,
      ariaHidden: svg.getAttribute('aria-hidden'),
      filtro: getComputedStyle(svg).filter,
      pisaMenu: pisa,
    };
  }
  return r;
})()`;

function evaluarEscena(escena, m) {
  const esperado = ESCENAS[escena];
  const fallas = [];
  if (!m.clases.includes(esperado.clase)) fallas.push(`sin clase ${esperado.clase}`);
  if (m.nombre !== 'Sportify') fallas.push(`nombre accesible "${m.nombre}"`);
  if (m.trofeo) fallas.push('sigue el trofeo');
  if (m.desborde > 0) fallas.push(`desborde ${m.desborde}`);
  const l = m.logo;
  if (!l) {
    fallas.push('sin svg.logo-sportify');
  } else {
    if (l.h < 28 || l.h > 44) fallas.push(`alto ${l.h}`);
    if (Math.abs(l.proporcion - PROPORCION) > 0.03) fallas.push(`proporción ${l.proporcion}`);
    if (l.x < 0 || l.der > m.anchoVentana) fallas.push(`fuera de la ventana (${l.x}..${l.der})`);
    if (l.pisaMenu) fallas.push('pisa el menú');
    if (l.ariaHidden !== 'true') fallas.push('svg sin aria-hidden="true"');
    if (!l.fills.includes(NARANJA)) fallas.push('sin naranja');
    if (!l.fills.includes(VERDE)) fallas.push('sin verde');
    const otros = l.fills.filter((f) => f !== NARANJA && f !== VERDE);
    if (otros.length === 0 || otros.some((f) => f !== esperado.palabra)) {
      fallas.push(`palabra ${otros.join('/') || 'sin trazo'} (esperado ${esperado.palabra})`);
    }
    if (escena === 'tope' && !/drop-shadow/.test(l.filtro)) fallas.push('sin drop-shadow sobre el video');
  }
  return fallas;
}

async function revisarFavicon(url) {
  const fallas = [];
  const html = await (await fetch(`${url}/`)).text();
  const links = html.match(/<link[^>]+rel="icon"[^>]*>/g) || [];
  const svgLink = links.find((l) => /href="[^"]*favicon\.svg"/.test(l));
  if (!svgLink) fallas.push('index.html sin <link rel="icon"> a favicon.svg');
  else if (!/type="image\/svg\+xml"/.test(svgLink)) fallas.push('el link de favicon.svg sin type="image/svg+xml"');
  if (!links.some((l) => /favicon\.ico/.test(l))) fallas.push('index.html sin respaldo favicon.ico');
  for (const [archivo, tipo] of [
    ['favicon.svg', 'svg'],
    ['favicon.ico', 'icon'],
    ['logo192.png', 'png'],
    ['logo512.png', 'png'],
  ]) {
    const res = await fetch(`${url}/${archivo}`);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes(tipo)) fallas.push(`${archivo}: ${res.status} ${ct}`);
  }
  return { links, fallas };
}

async function main() {
  const { url, anchos, salida, preview, base, capturas, foco } = leerArgs();
  const servidor = preview ? await levantarPreview(preview) : null;
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sportify-logo-'));
  const chrome = spawn(
    CHROME_PATH,
    ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`, '--no-first-run', '--hide-scrollbars'],
    { stdio: 'ignore' }
  );
  if (capturas) fs.mkdirSync(capturas, { recursive: true });
  let cdp = null;
  const resultados = [];
  let fallos = 0;
  try {
    const favicon = await revisarFavicon(url);
    console.log(`favicon ${favicon.fallas.length ? 'FALLA ' + favicon.fallas.join('; ') : 'OK'} | ${favicon.links.join(' ')}`);
    fallos += favicon.fallas.length;
    resultados.push({ favicon });

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
    const abrir = async (ruta, ancho, selector) => {
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
      await esperarSelector(selector);
      await sleep(1200);
    };
    const capturar = async (nombre) => {
      if (!capturas) return;
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        // El clip va en coordenadas del documento: se suma el scroll.
        clip: { x: 0, y: await evaluar('window.scrollY'), width: await evaluar('window.innerWidth'), height: 120, scale: 1 },
      });
      fs.writeFileSync(path.join(capturas, `${nombre}.png`), Buffer.from(data, 'base64'));
    };

    // Con --foco: Tab real (CDP) hasta el enlace de la marca y lee su contorno.
    const enfocarMarca = async (nombre) => {
      if (!foco) return null;
      // Arranca desde el enlace "Saltar al contenido" (va antes del navbar): la
      // página de reserva enfoca su h1 al entrar y el Tab seguiría desde ahí.
      await evaluar("document.querySelector('.skip-link')?.focus()");
      for (let i = 0; i < 6; i++) {
        for (const type of ['keyDown', 'keyUp']) {
          await cdp.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        }
        await sleep(120);
        if (await evaluar("document.activeElement?.classList?.contains('site-header__brand') || false")) break;
      }
      const r = await evaluar(`(() => { const a = document.activeElement; if (!a?.classList?.contains('site-header__brand')) return null;
        const cs = getComputedStyle(a); return { estilo: cs.outlineStyle, ancho: cs.outlineWidth, color: cs.outlineColor, offset: cs.outlineOffset, visible: a.matches(':focus-visible') }; })()`);
      await capturar(nombre + '-foco');
      return r;
    };
    const ESPERADO_FOCO = { tope: 'rgba(255, 255, 255, 0.8)', bajado: 'rgb(12, 84, 132)', reserva: 'rgb(242, 242, 242)' };

    for (const ancho of anchos) {
      const medidas = {};
      const focos = {};
      await abrir('/', ancho, 'header.site-header');
      await evaluar('window.scrollTo(0, 0); window.dispatchEvent(new Event("scroll"))');
      await sleep(500);
      medidas.tope = await evaluar(MEDIR);
      await capturar(`${ancho}-tope`);
      focos.tope = await enfocarMarca(`${ancho}-tope`);

      // Pasar los heros y subir un poco para que el navbar vuelva a mostrarse.
      await evaluar(`(() => {
        const destino = document.getElementById('eventos') || document.body;
        const y = destino.getBoundingClientRect().top + window.scrollY + 200;
        window.scrollTo(0, y); window.dispatchEvent(new Event('scroll'));
      })()`);
      await sleep(400);
      await evaluar('window.scrollBy(0, -60); window.dispatchEvent(new Event("scroll"))');
      // El cursor cerca del borde superior vuelve a mostrar el navbar.
      await evaluar('window.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 10 }))');
      await sleep(900);
      medidas.bajado = await evaluar(MEDIR);
      await capturar(`${ancho}-bajado`);
      focos.bajado = await enfocarMarca(`${ancho}-bajado`);

      await abrir('/reservar/padel', ancho, '.vista-canchas');
      medidas.reserva = await evaluar(MEDIR);
      await capturar(`${ancho}-reserva`);
      focos.reserva = await enfocarMarca(`${ancho}-reserva`);

      for (const escena of Object.keys(ESCENAS)) {
        const m = medidas[escena];
        const fallas = evaluarEscena(escena, m);
        if (foco) {
          const fo = focos[escena];
          if (!fo) fallas.push('Tab no llegó al enlace de la marca');
          else if (!fo.visible || fo.estilo !== 'solid' || fo.ancho !== '2px' || fo.color !== ESPERADO_FOCO[escena]) fallas.push(`foco ${JSON.stringify(fo)}`);
        }
        const previa = base?.find?.((x) => x.ancho === ancho && x.escena === escena);
        if (previa && m.altoHeader > previa.medida.altoHeader + 4) {
          fallas.push(`navbar más alto: ${m.altoHeader} frente a ${previa.medida.altoHeader}`);
        }
        fallos += fallas.length;
        resultados.push({ ancho, escena, medida: m, fallas });
        const l = m.logo;
        console.log(
          `${String(ancho).padStart(4)} px ${escena.padEnd(7)} ${fallas.length ? 'FALLA' : 'OK   '} ` +
            `altoHeader=${m.altoHeader}${previa ? `(antes ${previa.medida.altoHeader})` : ''} desborde=${m.desborde} ` +
            (l ? `logo=${l.w}x${l.h} x=${l.x}..${l.der} prop=${l.proporcion} fills=${l.fills.join('|')} ` : 'logo=no ') +
            `nombre="${m.nombre}" top=${m.topHeader} scrollY=${m.scrollY} clases="${m.clases}"` +
            (fallas.length ? ` | ${fallas.join('; ')}` : '')
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
  if (salida) fs.writeFileSync(salida, JSON.stringify(resultados.filter((r) => r.escena), null, 2));
  console.log(fallos === 0 ? 'RESULTADO: logo y favicon correctos' : `RESULTADO: ${fallos} fallos`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
