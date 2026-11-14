// Verificación headless (390x844 y 1440x900) para el bloque p1-chips-y-carrusel vía CDP.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:4173';
const SOLO_MEDIDAS = process.argv.includes('--antes');
const OUT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9345;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-p1-'));
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
      // esperando que abra el puerto CDP
    }
    await sleep(150);
  }
  throw new Error('sin CDP');
}

let sock;
const errores = [];

try {
  sock = new WebSocket(await wsUrl());
  await new Promise((r) => sock.addEventListener('open', r));

  let id = 0;
  const pend = new Map();
  sock.addEventListener('message', (e) => {
    const m = JSON.parse(String(e.data));
    if (m.id && pend.has(m.id)) {
      pend.get(m.id)(m);
      pend.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errores.push(
        m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text
      );
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errores.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  });

  const cdp = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pend.set(i, r);
      sock.send(JSON.stringify({ id: i, method, params }));
    });

  const ev = async (expr) => {
    const r = await cdp('Runtime.evaluate', {
      expression: `(async()=>{${expr}})()`,
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
    if (SOLO_MEDIDAS) return;
    const r = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, `${nombre}.png`), Buffer.from(r.result.data, 'base64'));
  };

  await cdp('Runtime.enable');
  await cdp('Page.enable');

  const ir = async (ruta) => {
    await cdp('Page.navigate', { url: BASE + ruta });
    await sleep(2200);
  };

  const setViewport = async (width, height, mobile) => {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
    await cdp('Emulation.setTouchEmulationEnabled', { enabled: mobile });
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
  `;

  const EXPR_MEDIDAS_CARRUSEL = `
    const cuerpo = document.querySelector('.vista-canchas__cuerpo')?.getBoundingClientRect();
    const card = document.querySelector('.tarjeta-cancha--activa')?.closest('.depth-carousel__card')?.getBoundingClientRect();
    const btn = document.querySelector('.tarjeta-cancha--activa .tarjeta-cancha__elegida, .tarjeta-cancha--activa .tarjeta-cancha__boton')?.getBoundingClientRect();
    const dots = document.querySelector('.vista-canchas__cuerpo .depth-carousel__dots')?.getBoundingClientRect();
    const arrows = [...document.querySelectorAll('.vista-canchas__cuerpo .depth-carousel__arrow')].map((a) => a.getBoundingClientRect());
    const siguiente = document.querySelector('.canchas-elegidas, .formulario-reserva, #reserva-horario')?.getBoundingClientRect();
    const r = (x) => Math.round(x * 10) / 10;
    const solapa = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    return {
      cuerpo: cuerpo ? { top: r(cuerpo.top), bottom: r(cuerpo.bottom), height: r(cuerpo.height) } : null,
      card: card ? { top: r(card.top), bottom: r(card.bottom), height: r(card.height) } : null,
      btn: btn ? { top: r(btn.top), bottom: r(btn.bottom), height: r(btn.height) } : null,
      dots: dots ? { left: r(dots.left), right: r(dots.right), top: r(dots.top), bottom: r(dots.bottom), height: r(dots.height) } : null,
      distDotsCard: (dots && card) ? r(dots.top - card.bottom) : null,
      distDotsBtn: (dots && btn) ? r(dots.top - btn.bottom) : null,
      distSiguienteDots: (dots && siguiente) ? r(siguiente.top - dots.bottom) : null,
      solapeFlechas: (dots && arrows.length === 2) ? (solapa(dots, arrows[0]) || solapa(dots, arrows[1])) : null,
      gapFlechaIzq: (dots && arrows[0]) ? r(dots.left - arrows[0].right) : null,
      gapFlechaDer: (dots && arrows[1]) ? r(arrows[1].left - dots.right) : null,
    };
  `;

  const probarChat = async (etiqueta) => {
    await ir('/');
    await ev(`sessionStorage.removeItem('sportify_chat_v1');`);
    await ir('/');
    await ev(`
      const origFetch = window.fetch.bind(window);
      window.__chatMockCalls = 0;
      window.fetch = async (input, init) => {
        const u = typeof input === 'string' ? input : input?.url || '';
        if (u.includes('/api/chat')) {
          window.__chatMockCalls++;
          return new Response(
            JSON.stringify({ respuesta: 'ok', sugerencias: ['A', 'B', 'C'], accion: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return origFetch(input, init);
      };
      document.querySelector('.chatbot__boton').click();
    `);
    await sleep(600);

    const medirChips = async () =>
      ev(`
        const input = document.querySelector('.chatbot__input')?.getBoundingClientRect();
        const enviar = document.querySelector('.chatbot__enviar')?.getBoundingClientRect();
        const chips = [...document.querySelectorAll('.chatbot__chip')].map((el) => {
          const b = el.getBoundingClientRect();
          const solapa = (a, c) => !!(a && c && !(a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom));
          return {
            texto: el.textContent.trim(),
            height: Math.round(b.height * 10) / 10,
            top: Math.round(b.top * 10) / 10,
            bottom: Math.round(b.bottom * 10) / 10,
            tapaInput: solapa(b, input),
            tapaEnviar: solapa(b, enviar),
          };
        });
        return {
          chips,
          inputTop: input ? Math.round(input.top * 10) / 10 : null,
          enviarTop: enviar ? Math.round(enviar.top * 10) / 10 : null,
        };
      `);

    const iniciales = await medirChips();
    if (etiqueta === '390') {
      await shot('p1-chat-390');
    }

    // Clic en el segundo chip inicial para disparar la respuesta simulada ['A', 'B', 'C']
    const textoInicial2 = await ev(`
      const chips = [...document.querySelectorAll('.chatbot__chip')];
      const t = chips[1].textContent.trim();
      chips[1].click();
      return t;
    `);
    await sleep(300);

    const mockChips = await medirChips();

    // Clic en el segundo ('B') y en el último ('C') chip de la respuesta simulada
    const click2 = await ev(`
      const chips = [...document.querySelectorAll('.chatbot__chip')];
      const t = chips[1].textContent.trim();
      chips[1].click();
      return t;
    `);
    await sleep(300);

    const ultimoUsuarioTras2 = await ev(`
      const msgs = [...document.querySelectorAll('.chatbot__mensaje--usuario .chatbot__texto')];
      return msgs[msgs.length - 1]?.textContent.trim() || null;
    `);

    const clickUlt = await ev(`
      const chips = [...document.querySelectorAll('.chatbot__chip')];
      const t = chips[chips.length - 1].textContent.trim();
      chips[chips.length - 1].click();
      return t;
    `);
    await sleep(300);

    const ultimoUsuarioTrasUlt = await ev(`
      const msgs = [...document.querySelectorAll('.chatbot__mensaje--usuario .chatbot__texto')];
      return msgs[msgs.length - 1]?.textContent.trim() || null;
    `);

    const mockCalls = await ev(`return window.__chatMockCalls;`);

    await ev(`
      document.querySelector('[role=dialog]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    `);
    await sleep(350);

    return {
      iniciales,
      textoInicial2,
      mockChips,
      segundoChip: { esperado: click2, enviado: ultimoUsuarioTras2 },
      ultimoChip: { esperado: clickUlt, enviado: ultimoUsuarioTrasUlt },
      mockCalls,
    };
  };

  const probarCarrusel = async (etiqueta, ruta, capturar) => {
    await ir(ruta);
    const desborde = await ev(`${EXPR_DESBORDE} return { vw, sw, sinDesborde: sw === vw, fuera };`);
    const medidas = await ev(EXPR_MEDIDAS_CARRUSEL);

    let clics = null;
    if (!SOLO_MEDIDAS) {
      await ev(`document.querySelector('.vista-canchas__cuerpo')?.scrollIntoView({ block: 'center' });`);
      await sleep(500);
      if (capturar) {
        await shot(capturar);
      }
      clics = await ev(`
        const out = [];
        const d = () => [...document.querySelectorAll('.depth-carousel__dot')];
        const indices = [1, d().length - 1, d().length - 1];
        for (const idx of indices) {
          d()[idx].click();
          await new Promise((r) => setTimeout(r, 700));
          const activo = d().findIndex((x) => x.getAttribute('aria-pressed') === 'true');
          out.push({ clic: idx, activo });
        }
        return out;
      `);
    }

    return { ruta, etiqueta, desborde, medidas, clics };
  };

  const res = { base: BASE, soloMedidas: SOLO_MEDIDAS, chat: {}, carrusel: {}, reducedMotion: null };

  // 390x844
  await setViewport(390, 844, true);
  if (SOLO_MEDIDAS) {
    await ir('/');
    res.chat['390'] = await ev(`
      document.querySelector('.chatbot__boton').click();
      await new Promise((r) => setTimeout(r, 600));
      return [...document.querySelectorAll('.chatbot__chip')].map((el) => ({
        texto: el.textContent.trim(),
        height: Math.round(el.getBoundingClientRect().height * 10) / 10,
      }));
    `);
  } else {
    res.chat['390'] = await probarChat('390');
  }
  for (const [slug, cap] of [
    ['/reservar/padel', 'p1-carrusel-390'],
    ['/reservar/voley-playa', null],
    ['/reservar/futbol', null],
    ['/reservar/padel?modo=torneo', null],
  ]) {
    res.carrusel[`390:${slug}`] = await probarCarrusel('390', slug, cap);
  }

  // 1440x900
  await setViewport(1440, 900, false);
  if (SOLO_MEDIDAS) {
    await ir('/');
    res.chat['1440'] = await ev(`
      document.querySelector('.chatbot__boton').click();
      await new Promise((r) => setTimeout(r, 600));
      return [...document.querySelectorAll('.chatbot__chip')].map((el) => ({
        texto: el.textContent.trim(),
        height: Math.round(el.getBoundingClientRect().height * 10) / 10,
      }));
    `);
  } else {
    res.chat['1440'] = await probarChat('1440');
  }
  for (const [slug, cap] of [
    ['/reservar/padel', 'p1-carrusel-1440'],
    ['/reservar/voley-playa', null],
    ['/reservar/futbol', null],
    ['/reservar/padel?modo=torneo', null],
  ]) {
    res.carrusel[`1440:${slug}`] = await probarCarrusel('1440', slug, cap);
  }

  // Reduced motion (390x844 sobre /reservar/padel y chat)
  if (!SOLO_MEDIDAS) {
    await setViewport(390, 844, true);
    await cdp('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await ir('/reservar/padel');
    const rmCarrusel = await ev(`
      ${EXPR_DESBORDE}
      const img = document.querySelector('.depth-carousel__img--activa');
      const dot = document.querySelector('.depth-carousel__dot');
      const dotAfter = dot ? getComputedStyle(dot, '::after') : null;
      return {
        matchesReduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
        sinDesborde: sw === vw,
        imgAnim: img ? getComputedStyle(img).animationName : null,
        dotTrans: dot ? getComputedStyle(dot).transitionDuration : null,
        dotAfterTrans: dotAfter ? dotAfter.transitionDuration : null,
      };
    `);
    await ev(`document.querySelector('.chatbot__boton').click();`);
    await sleep(300);
    const rmChat = await ev(`
      const chip = document.querySelector('.chatbot__chip');
      return {
        panelAbierto: !!document.querySelector('[role=dialog]'),
        chipHeight: chip ? Math.round(chip.getBoundingClientRect().height * 10) / 10 : null,
        chipTrans: chip ? getComputedStyle(chip).transitionDuration : null,
      };
    `);
    res.reducedMotion = { rmCarrusel, rmChat };
  }

  res.errores = errores;
  const archivoSalida = SOLO_MEDIDAS ? 'p1-resultado-antes.json' : 'p1-resultado.json';
  fs.writeFileSync(path.join(OUT, archivoSalida), JSON.stringify(res, null, 2));
  console.log(JSON.stringify(res, null, 2));
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
