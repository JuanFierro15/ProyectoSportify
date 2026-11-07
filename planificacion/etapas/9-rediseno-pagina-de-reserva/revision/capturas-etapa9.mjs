import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Uso:
// BASE_URL=https://proyecto-sportify.vercel.app OUT_DIR=planificacion/etapas/9-rediseno-pagina-de-reserva/revision/antes node planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.CHROME_PORT) || 9335;
const BASE_URL = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/+$/, '');
const OUT_DIR_RAW = process.env.OUT_DIR;

if (!OUT_DIR_RAW) {
  console.error('Error: La variable de entorno OUT_DIR es obligatoria.');
  process.exit(1);
}

const OUT_DIR = path.resolve(process.cwd(), OUT_DIR_RAW);
const WORK_DIR = path.join(os.tmpdir(), 'sportify-capturas-etapa9');

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

      const waitForEvent = (method, timeoutMs = 20000) =>
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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(WORK_DIR, { recursive: true });

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

    const waitForSelector = async (selector, timeoutMs = 15000) => {
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

    // Los inputs controlados de React se llenan con Input.insertText tras enfocar el campo
    const typeText = async (selector, text) => {
      await waitForSelector(selector);
      const selJson = JSON.stringify(selector);
      await evaluate(`(() => {
        const el = document.querySelector(${selJson});
        if (!el) throw new Error('No se encontró input: ' + ${selJson});
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.focus();
      })()`);
      await sleep(60);
      await cdp.send('Input.insertText', { text: String(text) });
      await sleep(100);
    };

    const setDesktopViewport = () =>
      cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        mobile: false,
      });

    const setMobileViewport = () =>
      cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });

    const waitForActiveCardImage = async (timeoutMs = 15000) => {
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

    const openScene = async (ruta, isMobile = false, clearStorage = true) => {
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
      if (clearStorage) {
        await evaluate(`localStorage.clear()`);
        const blankLoad2 = cdp.waitForEvent('Page.loadEventFired');
        await cdp.send('Page.navigate', { url: 'about:blank' });
        await blankLoad2;

        const pageLoad2 = cdp.waitForEvent('Page.loadEventFired');
        await cdp.send('Page.navigate', { url });
        await pageLoad2;
        await waitForSelector('.vista-canchas');
      }

      await waitForActiveCardImage();
      await sleep(1000);
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

    const addActiveCardToEvent = async () => {
      await evaluate(`(() => {
        const activeCard = document.querySelector('.depth-carousel__card[aria-hidden="false"]');
        if (!activeCard) throw new Error('No hay tarjeta activa en el carrusel');
        const btn = Array.from(activeCard.querySelectorAll('button')).find(
          (b) => b.textContent.includes('Agregar al evento')
        );
        if (!btn) throw new Error('No se encontró botón Agregar al evento en tarjeta activa');
        btn.click();
      })()`);
      await sleep(250);
    };

    const selectHour = async (hourText) => {
      const hourJson = JSON.stringify(hourText);
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('#reserva-horario .formulario-reserva__horas button'));
        const btn = btns.find((b) => b.textContent.trim().startsWith(${hourJson}));
        if (!btn) throw new Error('No se encontró hora: ' + ${hourJson});
        if (btn.disabled) throw new Error('Hora ocupada: ' + ${hourJson});
        btn.click();
      })()`);
      await sleep(120);
    };

    const selectTorneoTeams = async (numTeams) => {
      await evaluate(`(() => {
        const group = document.querySelector('[aria-label="Cantidad de equipos"]');
        if (!group) throw new Error('No se encontró grupo Cantidad de equipos');
        const btn = Array.from(group.querySelectorAll('button')).find((b) =>
          b.textContent.trim().startsWith('${numTeams} equipos')
        );
        if (!btn) throw new Error('No se encontró botón para ${numTeams} equipos');
        btn.click();
      })()`);
      await sleep(250);
    };

    const selectPhaseSchedule = async (ronda, dayIndex1Based, hours) => {
      const phaseSel = `.calendario-torneo__fase[data-ronda="${ronda}"]`;
      await clickElement(`${phaseSel} .selector-dia button:nth-child(${dayIndex1Based})`);
      await sleep(150);
      for (const h of hours) {
        await clickElement(`${phaseSel} .formulario-reserva__horas button[data-hora="${h}"]`);
        await sleep(120);
      }
    };

    const captureScene = async (sceneName, isMobile) => {
      const suffix = isMobile ? 'celular' : 'escritorio';
      const filePath = path.join(OUT_DIR, `${sceneName}-${suffix}.webp`);
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'webp',
        quality: 82,
      });
      const buf = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, buf);
      console.log(`Guardada: ${path.basename(filePath)} (${Math.round(buf.length / 1024)} KB)`);
    };

    for (const isMobile of [false, true]) {
      // 1) cancha-futbol y confirmacion-cancha
      await openScene('/reservar/futbol', isMobile, true);
      await selectTomorrow();
      await selectHour('14:00');
      await selectHour('15:00');
      await typeText('#reserva-nombre', 'Ana Gómez');
      await typeText('#reserva-telefono', '3001234567');

      await evaluate(`window.scrollTo(0, 0)`);
      await sleep(400);
      await captureScene('cancha-futbol-arriba', isMobile);

      if (isMobile) {
        await evaluate(`(() => {
          const horario = document.getElementById('reserva-horario');
          window.scrollBy(0, horario.getBoundingClientRect().top - 72);
        })()`);
        await sleep(400);
        await captureScene('cancha-futbol-horario', isMobile);

        await evaluate(`(() => {
          const voucher = document.querySelector('.voucher-reserva');
          const rect = voucher.getBoundingClientRect();
          window.scrollBy(0, rect.bottom - window.innerHeight + 24);
        })()`);
        await sleep(400);
        await captureScene('cancha-futbol', isMobile);
      } else {
        await evaluate(`(() => {
          const horario = document.getElementById('reserva-horario');
          window.scrollBy(0, horario.getBoundingClientRect().top - 120);
        })()`);
        await sleep(400);
        await captureScene('cancha-futbol-horario', isMobile);
        await captureScene('cancha-futbol', isMobile);
      }

      // Confirmar cancha -> confirmacion-cancha
      await clickElement('.voucher-reserva__acciones button.success');
      await waitForSelector('.confirmacion-reserva');
      await evaluate(`(() => {
        const conf = document.querySelector('.confirmacion-reserva');
        window.scrollBy(0, conf.getBoundingClientRect().top - 76);
      })()`);
      await sleep(500);
      await captureScene('confirmacion-cancha', isMobile);

      // 2) torneo-4
      await openScene('/reservar/futbol?modo=torneo', isMobile, true);
      await addActiveCardToEvent();
      await clickNextCard();
      await addActiveCardToEvent();
      await selectTorneoTeams(4);
      // Fase 1 (Semifinal): mañana (día 2), 11:00
      await selectPhaseSchedule(1, 2, ['11:00']);
      // Fase 2 (Final): día 3, 13:00
      await selectPhaseSchedule(2, 3, ['13:00']);
      await typeText('#reserva-nombre', 'Ana Gómez');
      await typeText('#reserva-telefono', '3001234567');
      await evaluate(`(() => {
        const br = document.querySelector('.bracket-torneo');
        window.scrollBy(0, br.getBoundingClientRect().top - 110);
      })()`);
      await sleep(500);
      await captureScene('torneo-4', isMobile);

      // 3) torneo-8 y confirmacion-torneo
      await openScene('/reservar/futbol?modo=torneo', isMobile, true);
      await addActiveCardToEvent();
      await clickNextCard();
      await addActiveCardToEvent();
      await selectTorneoTeams(8);
      // Fase 1 (Cuartos): mañana (día 2), 11:00 a 13:00 (2 h)
      await selectPhaseSchedule(1, 2, ['11:00', '12:00']);
      // Fase 2 (Semifinal): día 3, 13:00 (1 h)
      await selectPhaseSchedule(2, 3, ['13:00']);
      // Fase 3 (Final): día 4, 13:00 (1 h)
      await selectPhaseSchedule(3, 4, ['13:00']);
      await typeText('#reserva-nombre', 'Ana Gómez');
      await typeText('#reserva-telefono', '3001234567');
      await evaluate(`(() => {
        const br = document.querySelector('.bracket-torneo');
        window.scrollBy(0, br.getBoundingClientRect().top - 110);
      })()`);
      await sleep(500);
      await captureScene('torneo-8', isMobile);

      // Confirmar torneo -> confirmacion-torneo
      await clickElement('.voucher-reserva__acciones button.success');
      await waitForSelector('.confirmacion-reserva');
      await evaluate(`(() => {
        const conf = document.querySelector('.confirmacion-reserva');
        window.scrollBy(0, conf.getBoundingClientRect().top - 76);
      })()`);
      await sleep(500);
      await captureScene('confirmacion-torneo', isMobile);

      // 4) torneo-16
      await openScene('/reservar/futbol?modo=torneo', isMobile, true);
      await addActiveCardToEvent();
      await clickNextCard();
      await addActiveCardToEvent();
      await selectTorneoTeams(16);
      // Fase 1 (Octavos): mañana (día 2), 11:00 a 13:00 (2 h)
      await selectPhaseSchedule(1, 2, ['11:00', '12:00']);
      // Fase 2 (Cuartos): día 3, 13:00 a 15:00 (2 h)
      await selectPhaseSchedule(2, 3, ['13:00', '14:00']);
      // Fase 3 (Semifinal): día 4, 13:00 (1 h)
      await selectPhaseSchedule(3, 4, ['13:00']);
      // Fase 4 (Final): día 5, 13:00 (1 h)
      await selectPhaseSchedule(4, 5, ['13:00']);
      await typeText('#reserva-nombre', 'Ana Gómez');
      await typeText('#reserva-telefono', '3001234567');
      await evaluate(`(() => {
        const br = document.querySelector('.bracket-torneo');
        window.scrollBy(0, br.getBoundingClientRect().top - 110);
      })()`);
      await sleep(500);
      await captureScene('torneo-16', isMobile);

      // 5) cumpleanos y confirmacion-cumpleanos
      await openScene('/reservar/futbol?modo=cumpleanos', isMobile, true);
      await addActiveCardToEvent();
      await selectTomorrow();
      await selectHour('14:00');
      await selectHour('15:00');
      await typeText('#reserva-invitados', '20');
      await typeText('#reserva-nombre', 'Ana Gómez');
      await typeText('#reserva-telefono', '3001234567');

      if (isMobile) {
        await evaluate(`(() => {
          const inv = document.getElementById('reserva-invitados');
          const fieldset = inv.closest('fieldset') || inv;
          window.scrollBy(0, fieldset.getBoundingClientRect().top - 72);
        })()`);
      } else {
        await evaluate(`(() => {
          const horario = document.getElementById('reserva-horario');
          window.scrollBy(0, horario.getBoundingClientRect().top - 90);
        })()`);
      }
      await sleep(400);
      await captureScene('cumpleanos', isMobile);

      // Confirmar cumpleaños -> confirmacion-cumpleanos
      await clickElement('.voucher-reserva__acciones button.success');
      await waitForSelector('.confirmacion-reserva');
      await evaluate(`(() => {
        const conf = document.querySelector('.confirmacion-reserva');
        window.scrollBy(0, conf.getBoundingClientRect().top - 76);
      })()`);
      await sleep(500);
      await captureScene('confirmacion-cumpleanos', isMobile);
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
