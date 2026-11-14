import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Uso, desde la raíz: npm run build, npm run preview y luego
// node planificacion/herramientas/capturas/capturas.mjs
// O solo una escena: node planificacion/herramientas/capturas/capturas.mjs --solo movil-torneo
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
  const args = process.argv.slice(2);
  let soloScene = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--solo' && args[i + 1]) {
      soloScene = args[i + 1];
      i++;
    } else if (args[i].startsWith('--solo=')) {
      soloScene = args[i].slice('--solo='.length);
    }
  }

  const shouldRun = (name) => {
    if (!soloScene) return true;
    if (Array.isArray(name)) return name.includes(soloScene);
    return soloScene === name;
  };

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

    const clickButton = async (selector, timeoutMs = 10000) => {
      const start = Date.now();
      const selJson = JSON.stringify(selector);
      while (Date.now() - start < timeoutMs) {
        const clicked = await evaluate(`(() => {
          const el = document.querySelector(${selJson});
          if (!el || el.disabled) return false;
          el.click();
          return true;
        })()`);
        if (clicked) return;
        await sleep(80);
      }
      throw new Error(`Timeout esperando botón habilitado: ${selector}`);
    };

    const typeText = async (selector, text) => {
      await waitForSelector(selector);
      const selJson = JSON.stringify(selector);
      const valJson = JSON.stringify(String(text));
      await evaluate(`(() => {
        const el = document.querySelector(${selJson});
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, ${valJson});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
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

    const openHome = async (isMobile = false) => {
      if (isMobile) await setMobileViewport();
      else await setDesktopViewport();

      const blankLoad = cdp.waitForEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: 'about:blank' });
      await blankLoad;

      const pageLoad = cdp.waitForEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
      await pageLoad;

      await waitForSelector('#hero-placeholder');
      await sleep(2200);
    };

    const scrollToHero = async (slug) => {
      const slugJson = JSON.stringify(slug);
      await evaluate(`(() => {
        const sec = document.querySelector('#hero-placeholder [data-sport=' + ${slugJson} + ']');
        if (!sec) throw new Error('Hero no encontrado: ' + ${slugJson});
        const wrapper = sec.parentElement && sec.parentElement.classList.contains('pin-spacer')
          ? sec.parentElement
          : sec;
        const top = window.scrollY + wrapper.getBoundingClientRect().top;
        const recorrido = Math.max(400, wrapper.offsetHeight - window.innerHeight);
        window.scrollTo(0, top + Math.round(recorrido * 0.35) + 12);
      })()`);
      await sleep(100);
      await evaluate(`window.scrollBy(0, -12)`);
      await sleep(1400);
    };

    const openScene = async (ruta, isMobile = false) => {
      if (isMobile) await setMobileViewport();
      else await setDesktopViewport();

      const blankLoad = cdp.waitForEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: 'about:blank' });
      await blankLoad;

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
      console.log(`Guardada: ${path.basename(filePath)} (${Math.round(buf.length / 1024)} KB)`);
      return buf.length;
    };

    // --- 1) Página de inicio (escritorio y móvil) ---
    if (shouldRun('inicio')) {
      await openHome(false);
      await scrollToHero('voley-playa');
      await captureToFile(path.join(DOCS_OUT_DIR, 'inicio.webp'));

      await scrollToHero('padel');
      await captureToFile(path.join(DOCS_OUT_DIR, 'hero-padel.webp'));

      await scrollToHero('futbol');
      await captureToFile(path.join(DOCS_OUT_DIR, 'hero-futbol.webp'));

      await evaluate(`(() => {
        const ev = document.getElementById('eventos');
        const imgs = Array.from(ev.querySelectorAll('img'));
        for (const img of imgs) {
          if (img.loading === 'lazy') img.loading = 'eager';
        }
        window.scrollTo(0, window.scrollY + ev.getBoundingClientRect().top);
      })()`);
      await sleep(1800);
      await captureToFile(path.join(DOCS_OUT_DIR, 'eventos.webp'));

      await evaluate(`(() => {
        const ub = document.getElementById('ubicacion');
        window.scrollTo(0, window.scrollY + ub.getBoundingClientRect().top - 40);
      })()`);
      await sleep(1600);
      await captureToFile(path.join(DOCS_OUT_DIR, 'ubicacion.webp'));

      await openHome(true);
      await scrollToHero('voley-playa');
      await captureToFile(path.join(DOCS_OUT_DIR, 'movil-inicio.webp'));
    }

    // --- 2) Vista de canchas, reserva con voucher, confirmación QR y Mis reservas ---
    if (shouldRun(['canchas', 'reserva'])) {
      await openScene('padel', false);
      await evaluate(`localStorage.clear()`);
      await openScene('padel', false);
      await selectMode('Cancha');
      await selectTomorrow();
      await clickNextCard();
      await evaluate(`window.scrollTo(0, 0)`);
      await sleep(400);
      await captureToFile(path.join(DOCS_OUT_DIR, 'vista-canchas.webp'));

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
        window.scrollBy(0, diaFieldset.getBoundingClientRect().top - 320);
      })()`);
      await sleep(500);
      await captureToFile(path.join(DOCS_OUT_DIR, 'reserva-voucher.webp'));

      // Confirmar reserva -> confirmacion-qr.webp
      await clickElement('.voucher-reserva__acciones button.success');
      await waitForSelector('.confirmacion-reserva');
      await evaluate(`window.scrollTo(0, 0)`);
      await sleep(600);
      await captureToFile(path.join(DOCS_OUT_DIR, 'confirmacion-qr.webp'));

      const codigoConfirmado = await evaluate(`(() => {
        const el = document.querySelector('.confirmacion-reserva__codigo');
        return el ? el.textContent.trim() : '';
      })()`);

      // Abrir Mis reservas y consultar el código confirmado -> mis-reservas.webp
      await clickElement('.site-header__btn-mis-reservas');
      await waitForSelector('dialog.mis-reservas[open]');
      await sleep(300);
      await typeText('#mis-reservas-codigo', codigoConfirmado);
      await clickElement('.mis-reservas__form button[type="submit"]');
      await waitForSelector('.mis-reservas__tarjeta');
      await clickElement('.mis-reservas__btn-qr');
      await sleep(400);
      await captureToFile(path.join(DOCS_OUT_DIR, 'mis-reservas.webp'));

      // Cerrar Mis reservas y limpiar localStorage antes de capturar modo torneo
      await clickElement('.mis-reservas__cerrar');
      await evaluate(`localStorage.clear()`);
    }

    // --- 3) Modo torneo por fases y bracket ---
    if (shouldRun(['torneo', 'modo-torneo'])) {
      await openScene('/reservar/padel?modo=torneo', false);
      // Agregar Pádel 1 y Pádel 2
      await clickElement('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
      await sleep(200);
      await clickNextCard();
      await clickElement('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
      await sleep(300);

      // Fase 1 (Cuartos de final): día 2, 11:00 a 13:00 (2 h)
      await clickElement('#tab-fase-1');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="1"] .selector-dia button:nth-child(2)');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="11:00"]');
      await sleep(100);
      await clickElement('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="12:00"]');
      await sleep(150);

      // Fase 2 (Semifinal): día 3, 11:00 (1 h)
      await clickElement('#tab-fase-2');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="2"] .selector-dia button:nth-child(3)');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="2"] .formulario-reserva__horas button[data-hora="11:00"]');
      await sleep(150);

      // Fase 3 (Final): día 4, 11:00 (1 h)
      await clickElement('#tab-fase-3');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="3"] .selector-dia button:nth-child(4)');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="3"] .formulario-reserva__horas button[data-hora="11:00"]');
      await sleep(150);

      // Volver a la fase 1 para mostrarla visible junto a las pestañas ya programadas
      await clickElement('#tab-fase-1');
      await sleep(200);

      await typeText('#reserva-nombre', 'Club Pádel Huila');
      await typeText('#reserva-telefono', '3109876543');

      await evaluate(`(() => {
        const cal = document.querySelector('.calendario-torneo');
        window.scrollBy(0, cal.getBoundingClientRect().top - 96);
      })()`);
      await sleep(500);
      await captureToFile(path.join(DOCS_OUT_DIR, 'modo-torneo.webp'));

      await evaluate(`(() => {
        const br = document.querySelector('.bracket-torneo');
        window.scrollBy(0, br.getBoundingClientRect().top - 110);
      })()`);
      await sleep(500);
      await captureToFile(path.join(DOCS_OUT_DIR, 'torneo-bracket.webp'));
    }

    // --- 4) Modo torneo en móvil: asistente por pasos (Llaves) ---
    if (shouldRun(['movil-torneo', 'asistente-movil'])) {
      await openScene('/reservar/padel?modo=torneo', true);
      await evaluate(`localStorage.clear()`);
      await openScene('/reservar/padel?modo=torneo', true);

      // Paso 1 (Canchas): Agregar Pádel 1 y Pádel 2
      await clickElement('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
      await sleep(250);
      await clickNextCard();
      await clickElement('.depth-carousel__card[aria-hidden="false"] .tarjeta-cancha__boton');
      await sleep(300);

      // Avanzar a Paso 2 (Formato): 8 equipos y 20 min vienen por defecto
      await clickButton('.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente');
      await sleep(350);

      // Avanzar a Paso 3 (Fechas por fase)
      await clickButton('.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente');
      await sleep(350);

      // Fase 1 (Cuartos de final): día 2, 11:00 a 13:00 (2 h)
      await clickElement('#tab-fase-1');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="1"] .selector-dia button:nth-child(2)');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="11:00"]');
      await sleep(100);
      await clickElement('.calendario-torneo__fase[data-ronda="1"] .formulario-reserva__horas button[data-hora="12:00"]');
      await sleep(150);

      // Fase 2 (Semifinal): día 3, 11:00 (1 h)
      await clickElement('#tab-fase-2');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="2"] .selector-dia button:nth-child(3)');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="2"] .formulario-reserva__horas button[data-hora="11:00"]');
      await sleep(150);

      // Fase 3 (Final): día 4, 11:00 (1 h)
      await clickElement('#tab-fase-3');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="3"] .selector-dia button:nth-child(4)');
      await sleep(150);
      await clickElement('.calendario-torneo__fase[data-ronda="3"] .formulario-reserva__horas button[data-hora="11:00"]');
      await sleep(200);

      // Avanzar a Paso 4 (Llaves)
      await clickButton('.asistente-torneo__barra-inferior .asistente-torneo__boton-siguiente');
      await sleep(600);

      // Desplazar la vista para que la cabecera del paso quede arriba y el bracket visible
      await evaluate(`(() => {
        const cab = document.querySelector('.asistente-torneo__cabecera');
        if (cab) {
          const top = window.scrollY + cab.getBoundingClientRect().top;
          window.scrollTo(0, Math.max(0, top - 8));
        }
      })()`);
      await sleep(600);

      await captureToFile(path.join(DOCS_OUT_DIR, 'movil-torneo.webp'));
    }
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
