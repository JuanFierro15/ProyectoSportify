import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Uso, desde la raíz: npm run build, npm run preview y luego
// node planificacion/herramientas/capturas/capturas.mjs
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const BASE_URL = 'http://localhost:4173';
const WORK_DIR = path.join(os.tmpdir(), 'sportify-capturas');
const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DOCS_OUT_DIR = path.join(PROJECT_DIR, 'docs', 'capturas');
const VERIF_OUT_DIR = path.join(WORK_DIR, 'verificacion');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDebugger(port, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(150);
  }
  throw new Error('Timeout esperando a Chrome CDP');
}

function createCdpSession(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const eventWaiters = new Map();

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id) {
        const entry = pending.get(msg.id);
        if (entry) {
          pending.delete(msg.id);
          if (msg.error) entry.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else entry.resolve(msg.result);
        }
      } else if (msg.method) {
        const waiters = eventWaiters.get(msg.method);
        if (waiters && waiters.length > 0) {
          eventWaiters.delete(msg.method);
          for (const w of waiters) w(msg.params);
        }
      }
    });

    ws.addEventListener('open', () => {
      const send = (method, params = {}) =>
        new Promise((res, rej) => {
          const id = nextId++;
          pending.set(id, { resolve: res, reject: rej });
          ws.send(JSON.stringify({ id, method, params }));
        });

      const waitForEvent = (method, timeoutMs = 15000) =>
        new Promise((res, rej) => {
          const timer = setTimeout(() => {
            const list = eventWaiters.get(method) || [];
            eventWaiters.set(
              method,
              list.filter((fn) => fn !== handler)
            );
            rej(new Error(`Timeout esperando evento ${method}`));
          }, timeoutMs);
          const handler = (params) => {
            clearTimeout(timer);
            res(params);
          };
          const list = eventWaiters.get(method) || [];
          list.push(handler);
          eventWaiters.set(method, list);
        });

      const close = () => {
        try {
          ws.close();
        } catch {}
      };

      resolve({ send, waitForEvent, close });
    });

    ws.addEventListener('error', (err) => reject(err));
  });
}

async function main() {
  fs.mkdirSync(DOCS_OUT_DIR, { recursive: true });
  fs.mkdirSync(VERIF_OUT_DIR, { recursive: true });

  const userDataDir = fs.mkdtempSync(path.join(WORK_DIR, 'chrome-profile-'));
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--hide-scrollbars',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    await waitForDebugger(PORT);

    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: 'PUT' });
    if (!newTabRes.ok) throw new Error(`Fallo al abrir pestaña: ${newTabRes.status}`);
    const tabInfo = await newTabRes.json();

    cdp = await createCdpSession(tabInfo.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const evaluate = async (expression) => {
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (res.exceptionDetails) {
        throw new Error(`Error JS: ${res.exceptionDetails.text}`);
      }
      return res.result ? res.result.value : undefined;
    };

    const waitForSelector = async (selector, timeoutMs = 10000) => {
      const start = Date.now();
      const selJson = JSON.stringify(selector);
      while (Date.now() - start < timeoutMs) {
        const exists = await evaluate(`Boolean(document.querySelector(${selJson}))`);
        if (exists) return;
        await sleep(80);
      }
      throw new Error(`Timeout esperando selector: ${selector}`);
    };

    const clickElement = async (selector) => {
      await waitForSelector(selector);
      const selJson = JSON.stringify(selector);
      const isButton = await evaluate(`(() => {
        const el = document.querySelector(${selJson});
        if (!el) return false;
        if (el.tagName === 'BUTTON') {
          el.click();
          return true;
        }
        el.scrollIntoView({ block: 'center', inline: 'center' });
        return false;
      })()`);
      if (!isButton) {
        const pt = await evaluate(`(() => {
          const r = document.querySelector(${selJson}).getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        })()`);
        await cdp.send('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x: pt.x,
          y: pt.y,
          button: 'left',
          clickCount: 1,
        });
        await cdp.send('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: pt.x,
          y: pt.y,
          button: 'left',
          clickCount: 1,
        });
      }
    };

    const typeText = async (selector, text) => {
      await waitForSelector(selector);
      const selJson = JSON.stringify(selector);
      await evaluate(`(() => {
        const el = document.querySelector(${selJson});
        el.focus();
      })()`);
      await cdp.send('Input.insertText', { text });
      await evaluate(`(() => {
        const el = document.querySelector(${selJson});
        el.blur();
      })()`);
    };

    const setDesktopViewport = () =>
      cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });

    const setMobileViewport = () =>
      cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });

    const waitForActiveCardImage = async (timeoutMs = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const ready = await evaluate(`(() => {
          const activeImg = document.querySelector('.depth-carousel__card[aria-hidden="false"] img');
          if (!activeImg || !activeImg.complete || activeImg.naturalWidth === 0) return false;
          const allImgs = Array.from(document.querySelectorAll('.depth-carousel__card img'));
          for (const img of allImgs) {
            if (img.loading === 'lazy') img.loading = 'eager';
            if (!img.complete || img.naturalWidth === 0) return false;
          }
          return true;
        })()`);
        if (ready) return;
        await sleep(80);
      }
      throw new Error('Timeout esperando carga de imagen de tarjeta activa');
    };

    const openScene = async (ruta, isMobile = false) => {
      if (isMobile) await setMobileViewport();
      else await setDesktopViewport();

      const blankLoad = cdp.waitForEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: 'about:blank' });
      await blankLoad;

      // `ruta`: slug ("padel" -> /reservar/padel) o una ruta completa que
      // empiece con "/" (p. ej. "/#canchas-futbol" o "/reservar/padel?modo=torneo").
      const url = ruta.startsWith('/') ? `${BASE_URL}${ruta}` : `${BASE_URL}/reservar/${ruta}`;
      const pageLoad = cdp.waitForEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url });
      await pageLoad;

      await waitForSelector('.vista-canchas');
      await waitForActiveCardImage();
      await sleep(1200);
    };

    const selectMode = async (modeText) => {
      const textJson = JSON.stringify(modeText);
      const changed = await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('.selector-modo button'));
        const btn = btns.find((b) => b.textContent.trim() === ${textJson});
        if (!btn) throw new Error('No se encontró modo: ' + ${textJson});
        if (btn.getAttribute('aria-pressed') === 'true') return false;
        btn.click();
        return true;
      })()`);
      if (changed) {
        await sleep(300);
        await waitForActiveCardImage();
      }
    };

    const selectTomorrow = async () => {
      await clickElement('.selector-dia button:nth-child(2)');
      await sleep(150);
    };

    const clickNextCard = async () => {
      await clickElement('.depth-carousel__arrow--next');
      await sleep(900);
      await waitForActiveCardImage();
    };

    const selectHour = async (hourText) => {
      const hourJson = JSON.stringify(hourText);
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('.formulario-reserva__horas button'));
        const btn = btns.find((b) => b.textContent.trim().startsWith(${hourJson}));
        if (!btn) throw new Error('No se encontró hora: ' + ${hourJson});
        if (btn.disabled) throw new Error('Hora ocupada: ' + ${hourJson});
        btn.click();
      })()`);
      await sleep(100);
    };

    const scrollCuerpoTo = async (targetTopPx) => {
      await evaluate(`(() => {
        const cuerpo = document.querySelector('.vista-canchas__cuerpo');
        window.scrollBy(0, cuerpo.getBoundingClientRect().top - ${targetTopPx});
      })()`);
      await sleep(200);
    };

    const captureToFile = async (filePath) => {
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'webp',
        quality: 82,
      });
      const buf = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, buf);
      return buf.length;
    };

    const printMetrics = async (label) => {
      const metrics = await evaluate(`(() => {
        const vc = document.scrollingElement;
        const card = document.querySelector('.depth-carousel__card[aria-hidden="false"]');
        const cuerpo = document.querySelector('.vista-canchas__cuerpo');
        const rectToObj = (r) => r ? { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100, top: Math.round(r.top * 100) / 100, right: Math.round(r.right * 100) / 100, bottom: Math.round(r.bottom * 100) / 100, left: Math.round(r.left * 100) / 100 } : null;
        return {
          docScrollWidth: document.documentElement.scrollWidth,
          docClientWidth: document.documentElement.clientWidth,
          vistaCanchasScrollWidth: vc.scrollWidth,
          vistaCanchasClientWidth: vc.clientWidth,
          activeCardRect: rectToObj(card ? card.getBoundingClientRect() : null),
          cuerpoRect: rectToObj(cuerpo ? cuerpo.getBoundingClientRect() : null),
        };
      })()`);
      console.log(`=== Métricas ${label} ===`);
      console.log(JSON.stringify(metrics, null, 2));
    };

    await openScene('padel', false);
    await selectMode('Cancha');
    await selectTomorrow();
    await clickNextCard();
    await evaluate(`window.scrollTo(0, 0)`);
    await sleep(400);
    await printMetrics('Escena 1 (vista-canchas.webp - escritorio 1440x900)');
    await captureToFile(path.join(DOCS_OUT_DIR, 'vista-canchas.webp'));

    await openScene('padel', false);
    await selectMode('Cancha');
    await selectTomorrow();
    await clickNextCard();
    await selectHour('14:00');
    await selectHour('15:00');
    await typeText('#reserva-nombre', 'Ana Gómez');
    await typeText('#reserva-telefono', '3001234567');
    await evaluate(`(() => {
      const fieldsets = Array.from(document.querySelectorAll('.formulario-reserva__campo'));
      const diaFieldset = fieldsets.find((f) => {
        const leg = f.querySelector('legend');
        return leg && leg.textContent.trim() === 'Día';
      });
      window.scrollBy(0, diaFieldset.getBoundingClientRect().top - 340);
    })()`);
    await sleep(500);
    await captureToFile(path.join(DOCS_OUT_DIR, 'reserva-voucher.webp'));

    await openScene('padel', false);
    await selectMode('Torneo');
    await selectTomorrow();
    await clickNextCard();
    await clickElement('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
    await sleep(150);
    await selectHour('11:00');
    await selectHour('14:00');
    await scrollCuerpoTo(60);
    await sleep(300);
    await captureToFile(path.join(DOCS_OUT_DIR, 'modo-torneo.webp'));

    await openScene('voley-playa', false);
    await selectMode('Cancha');
    await selectTomorrow();
    await evaluate(`window.scrollTo(0, 0)`);
    await sleep(400);
    await captureToFile(path.join(VERIF_OUT_DIR, 'escritorio-voley.webp'));

    await openScene('futbol', false);
    await selectMode('Cancha');
    await selectTomorrow();
    await evaluate(`window.scrollTo(0, 0)`);
    await sleep(400);
    await captureToFile(path.join(VERIF_OUT_DIR, 'escritorio-futbol-cancha.webp'));

    await openScene('futbol', false);
    await selectMode('Torneo');
    await selectTomorrow();
    await scrollCuerpoTo(60);
    await sleep(300);
    await captureToFile(path.join(VERIF_OUT_DIR, 'escritorio-futbol-torneo.webp'));

    // --- Navegación entre páginas (solo métricas, sin capturas del README) ---
    const pausa = (ms) => sleep(ms);
    // 1) Inicio -> bajar al hero de pádel -> "Ver canchas" -> atrás: ¿vuelve
    //    a la misma posición?
    await setDesktopViewport();
    {
      const load = cdp.waitForEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
      await load;
    }
    await pausa(2500);
    const yAntes = await evaluate(`(() => {
      const sec = document.querySelector('#hero-placeholder [data-sport="padel"]');
      const y = window.scrollY + sec.getBoundingClientRect().top + 400;
      window.scrollTo(0, y);
      return window.scrollY;
    })()`);
    await pausa(800);
    await evaluate(`(() => {
      const sec = document.querySelector('#hero-placeholder [data-sport="padel"]');
      sec.querySelector('.deporte-hero__cta').click();
    })()`);
    await pausa(1500);
    const enReserva = await evaluate(`({
      ruta: location.pathname + location.search,
      titulo: document.title,
      h1: document.querySelector('h1') && document.querySelector('h1').textContent,
      heros: !!document.getElementById('hero-placeholder'),
      navbar: document.querySelector('.site-header').className,
      foco: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
      scrollY: window.scrollY,
    })`);
    await evaluate(`history.back()`);
    await pausa(3500);
    const alVolver = await evaluate(`({
      ruta: location.pathname + location.search + location.hash,
      titulo: document.title,
      heros: !!document.getElementById('hero-placeholder'),
      scrollY: window.scrollY,
    })`);
    console.log('=== Navegación 1: inicio -> reserva -> atrás ===');
    console.log(JSON.stringify({ yAntes, enReserva, alVolver }, null, 2));

    // 2) Enlace viejo con hash -> debe redirigir a /reservar/futbol.
    await openScene('/#canchas-futbol', false);
    const legado = await evaluate(`location.pathname + location.search + location.hash`);
    // 3) Recarga directa en modo torneo -> debe quedar en torneo; cambiar a
    //    Cumpleaños debe actualizar la URL.
    await openScene('/reservar/padel?modo=torneo', false);
    const torneo = await evaluate(`(() => {
      const activo = document.querySelector('.selector-modo [aria-pressed="true"]');
      return { modo: activo && activo.textContent.trim(), h1: document.querySelector('h1').textContent };
    })()`);
    await selectMode('Cumpleaños');
    const trasCambio = await evaluate(`location.pathname + location.search`);
    // 4) "Ubicación" del navbar desde la página de reserva -> inicio en #ubicacion.
    await evaluate(`window.scrollTo(0, 0)`);
    await pausa(300);
    await evaluate(`(() => {
      const a = Array.from(document.querySelectorAll('.site-header a')).find((x) => x.textContent.trim() === 'Ubicación');
      a.click();
    })()`);
    await pausa(3500);
    const ubic = await evaluate(`(() => {
      const u = document.getElementById('ubicacion');
      return { ruta: location.pathname, existe: !!u, topUbicacion: u ? Math.round(u.getBoundingClientRect().top) : null };
    })()`);
    await captureToFile(path.join(VERIF_OUT_DIR, 'navegacion-ubicacion.webp'));
    console.log('=== Navegación 2-4 ===');
    console.log(JSON.stringify({ legado, torneo, trasCambio, ubic }, null, 2));

    await openScene('padel', false);
    await selectTomorrow();
    await clickElement('.depth-carousel__card[aria-hidden="false"] .depth-carousel__trigger');
    await waitForSelector('dialog.vista-canchas__visor[open]');
    const startVisor = Date.now();
    while (Date.now() - startVisor < 10000) {
      const visorReady = await evaluate(`(() => {
        const img = document.querySelector('.vista-canchas__visor-imagen');
        return Boolean(img && img.complete && img.naturalWidth > 0);
      })()`);
      if (visorReady) break;
      await sleep(80);
    }
    await sleep(400);
    await captureToFile(path.join(VERIF_OUT_DIR, 'escritorio-visor.webp'));

    await openScene('padel', true);
    await selectMode('Cancha');
    await selectTomorrow();
    await evaluate(`window.scrollTo(0, 0)`);
    await sleep(400);
    await captureToFile(path.join(VERIF_OUT_DIR, 'movil-padel-arriba.webp'));
    await scrollCuerpoTo(16);
    await sleep(400);
    await printMetrics('Escena 7 (movil-padel.webp - celular 390x844)');
    await captureToFile(path.join(VERIF_OUT_DIR, 'movil-padel.webp'));

    await openScene('futbol', true);
    await selectMode('Torneo');
    await selectTomorrow();
    await scrollCuerpoTo(16);
    await sleep(400);
    await captureToFile(path.join(VERIF_OUT_DIR, 'movil-futbol-torneo.webp'));
  } finally {
    if (cdp) {
      try {
        await cdp.send('Browser.close');
      } catch {}
      cdp.close();
    }
    if (chromeProc && chromeProc.pid) {
      spawnSync('taskkill', ['/PID', String(chromeProc.pid), '/T', '/F'], { stdio: 'ignore' });
    }
    await sleep(400);
    fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
