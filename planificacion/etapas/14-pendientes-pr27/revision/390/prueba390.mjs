// Prueba headless a 390x844 sobre producción vía CDP (sin dependencias).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'https://proyecto-sportify.vercel.app';
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const PORT = 9344;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'sp390-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

async function ws() {
  for (let i = 0; i < 100; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {}
    await sleep(150);
  }
  throw new Error('sin CDP');
}
const sock = new WebSocket(await ws());
await new Promise((r) => sock.addEventListener('open', r));
let id = 0; const pend = new Map(); const errores = [];
sock.addEventListener('message', (e) => {
  const m = JSON.parse(String(e.data));
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errores.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
});
const cdp = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async (n) => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(r.result.data, 'base64')); };

await cdp('Runtime.enable'); await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
const ir = async (url) => { await cdp('Page.navigate', { url }); await sleep(3500); };

const DESBORDE = `const vw=innerWidth; const fuera=[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect(); if(!(b.width>0&&b.right>vw+1))return false; let p=e; while(p&&p!==document.body){const o=getComputedStyle(p).overflowX; if(o==='hidden'||o==='clip'||o==='auto'||o==='scroll'){ if(p!==e) return false;} p=p.parentElement;} return true;}).slice(0,6).map(e=>(e.className||e.tagName)+'@'+Math.round(e.getBoundingClientRect().right));`;
const res = {};

// 1. Inicio
await ir(BASE + '/');
res.inicio = await ev(`${DESBORDE} return {vw, scrollW:document.documentElement.scrollWidth, fuera, mains:document.querySelectorAll('main').length};`);
res.skip = await ev(`const s=document.querySelector('.skip-link'); s.focus(); await new Promise(r=>setTimeout(r,250)); const c=getComputedStyle(s); s.click(); await new Promise(r=>setTimeout(r,200)); const a=document.activeElement.id; s.click(); return {color:c.color,bg:c.backgroundColor,top:Math.round(s.getBoundingClientRect().top),foco:a,foco2:document.activeElement.id,hash:location.hash};`);
await ev(`document.querySelector('.skip-link').focus(); return 1`); await sleep(300); await shot('01-skip-link');
// Navbar: Inicio / Eventos / Ubicación (dos veces cada una)
res.navInicio = await ev(`scrollTo(0,0); const links=[...document.querySelectorAll('a')]; const ev=links.find(a=>/^#?eventos$/.test(a.getAttribute('href')||'')||a.getAttribute('href')==='/#eventos'); const ub=links.filter(a=>(a.getAttribute('href')||'').includes('ubicacion')); return {hrefsEventos:links.filter(a=>(a.getAttribute('href')||'').includes('eventos')).map(a=>a.textContent.trim()), ubic:ub.map(a=>a.textContent.trim())};`);
res.navSeccion = await ev(`const res=[]; for (const id of ['eventos','ubicacion','eventos']) { const a=[...document.querySelectorAll('footer a')].find(x=>(x.getAttribute('href')||'').includes(id)) || [...document.querySelectorAll('a')].find(x=>(x.getAttribute('href')||'').includes(id)); a.click(); await new Promise(r=>setTimeout(r,1800)); const t=document.getElementById(id).getBoundingClientRect().top; res.push(id+':'+Math.round(t)+':'+location.hash); } return res;`);
res.navInicioClic = await ev(`const a=[...document.querySelectorAll('a')].find(x=>x.textContent.trim()==='Inicio'); a.click(); await new Promise(r=>setTimeout(r,1800)); const y1=Math.round(scrollY); a.click(); await new Promise(r=>setTimeout(r,800)); return {y1, y2:Math.round(scrollY), path:location.pathname+location.hash};`);
// EventoCTA y Ubicación
await ev(`document.getElementById('eventos').scrollIntoView(); return 1`); await sleep(1200); await shot('02-eventos');
// Chatbot (sin enviar mensajes: no gastar cuota)
res.chat = await ev(`const b=document.querySelector('.chatbot__boton'); b.click(); await new Promise(r=>setTimeout(r,800)); const d=document.querySelector('[role=dialog]'); const br=d?.getBoundingClientRect(); const env=document.querySelector('.chatbot__enviar')?.getBoundingClientRect(); const chips=[...document.querySelectorAll('.chatbot__chip')].map(c=>Math.round(c.getBoundingClientRect().height)); const acc=[...document.querySelectorAll('.chatbot__accion,.chatbot__boton-primario,.chatbot__boton-secundario')].map(c=>c.className.split(' ')[0]+':'+Math.round(c.getBoundingClientRect().height)); return {dialog:!!d, ancho:br&&Math.round(br.width), der:br&&Math.round(br.right), enviar:env&&[Math.round(env.width),Math.round(env.height)], chips, acc};`);
await shot('03-chat-abierto');
res.chatEsc = await ev(`document.querySelector('[role=dialog]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await new Promise(r=>setTimeout(r,400)); return {cerrado:!document.querySelector('[role=dialog]'), foco:document.activeElement.className};`);

// 2. Reserva pádel
await ir(BASE + '/reservar/padel');
res.reserva = await ev(`${DESBORDE} return {vw, scrollW:document.documentElement.scrollWidth, fuera, mains:document.querySelectorAll('main').length, mainId:document.querySelector('main')?.id};`);
res.dots = await ev(`const d=[...document.querySelectorAll('.depth-carousel__dot')]; const cont=document.querySelector('.depth-carousel__dots')?.getBoundingClientRect(); const fl=[...document.querySelectorAll('.depth-carousel__arrow, [class*=depth-carousel__nav]')].map(f=>{const b=f.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.right),Math.round(b.top)];}); return {n:d.length, tam:d.map(x=>{const b=x.getBoundingClientRect(); return Math.round(b.width)+'x'+Math.round(b.height)}), cont:cont&&[Math.round(cont.left),Math.round(cont.right),Math.round(cont.top),Math.round(cont.bottom)], flechas:fl};`);
// clic en el segundo y el último punto, dos veces
res.dotsClic = await ev(`const out=[]; const d=()=>[...document.querySelectorAll('.depth-carousel__dot')]; for (const i of [1, d().length-1, d().length-1, 0]) { d()[i].click(); await new Promise(r=>setTimeout(r,900)); out.push(i+':'+d().findIndex(x=>x.getAttribute('aria-pressed')==='true')); } return out;`);
await ev(`document.querySelector('.depth-carousel')?.scrollIntoView({block:'center'}); return 1`); await sleep(800); await shot('04-reserva-carrusel');
// Skip link en reserva y "Volver al inicio"
res.skipReserva = await ev(`history.replaceState({...history.state},''); const s=document.querySelector('.skip-link'); s.click(); await new Promise(r=>setTimeout(r,200)); return {foco:document.activeElement.id, hash:location.hash, state:JSON.stringify(history.state)};`);

// 3. Torneo: chips de canchas elegidas
await ir(BASE + '/reservar/voley?modo=torneo');
res.torneo = await ev(`${DESBORDE} return {vw, scrollW:document.documentElement.scrollWidth, fuera, quitar:[...document.querySelectorAll('.canchas-elegidas__quitar')].length};`);
await shot('05-torneo');

// 4. Volver a inicio por popstate tras skip link en reserva
await ir(BASE + '/');
res.flujoVolver = await ev(`scrollTo(0,1500); await new Promise(r=>setTimeout(r,400)); const a=[...document.querySelectorAll('a')].find(x=>(x.getAttribute('href')||'').startsWith('/reservar/')); a.click(); await new Promise(r=>setTimeout(r,2500)); document.querySelector('.skip-link').click(); await new Promise(r=>setTimeout(r,300)); const v=[...document.querySelectorAll('a,button')].find(x=>/Volver al inicio/i.test(x.textContent)); v.click(); await new Promise(r=>setTimeout(r,2500)); return {path:location.pathname, y:Math.round(scrollY)};`);

res.errores = errores;
fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify(res, null, 2));
console.log(JSON.stringify(res, null, 2));
sock.close(); chrome.kill();
