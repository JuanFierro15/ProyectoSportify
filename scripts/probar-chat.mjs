// Prueba de /api/chat con los casos de la verificación del Bloque 6 (parte 6.1).
//
// Uso:
//   node scripts/probar-chat.mjs                       -> contra http://localhost:3000 (vercel dev)
//   node scripts/probar-chat.mjs https://proyecto-sportify.vercel.app parqueadero nombre-invalido
//
// El primer argumento es la URL base; los siguientes, si vienen, filtran los
// casos por id. El contexto se arma como lo hará el widget: canchas.json, hoy
// y los 6 días siguientes, franjas libres = horas - ocupadas (semilla).
import { readFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const FILTRO = process.argv.slice(3);

const datos = JSON.parse(readFileSync(new URL('../src/data/canchas.json', import.meta.url), 'utf8'));

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dias = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + i);
  return iso(d);
});
const hoy = dias[0];

// Hora fija temprana: así todas las franjas de hoy siguen disponibles y los
// casos no dependen de la hora a la que se corra el script.
const contexto = {
  fechaHoy: hoy,
  horaActual: '07:00',
  canchas: datos.canchas.map(({ id, nombre, deporte, precioHora }) => ({ id, nombre, deporte, precioHora })),
  disponibilidad: datos.canchas.flatMap((c) =>
    dias.map((fecha, i) => ({
      canchaId: c.id,
      fecha,
      franjasLibres: datos.horas.filter((h) => !(c.ocupadosSemilla[i] || []).includes(h)),
    }))
  ),
};

const libresVoley1Hoy = contexto.disponibilidad.find((d) => d.canchaId === 'voley-1' && d.fecha === hoy).franjasLibres;
const amPm = (h) => {
  const n = Number(h.slice(0, 2));
  if (n === 12) return '12:00 m.';
  return `${n % 12 || 12}:00 ${n < 12 ? 'a. m.' : 'p. m.'}`;
};
const historialOferta = [
  { rol: 'usuario', texto: '¿Qué horarios tiene libres la cancha 1 de voley hoy?' },
  { rol: 'bot', texto: 'La Cancha Voley Playa 1 tiene libre hoy de 9:00 a. m. a 10:00 a. m.' },
];

const casos = [
  {
    id: 'disponibilidad',
    mensaje: '¿Qué horarios tiene libres la cancha 1 de voley hoy?',
    revisar: (r) => {
      // Toda hora que mencione debe estar entre las libres del contexto.
      const mencionadas = [...r.respuesta.matchAll(/(\d{1,2}):00\s*(a\.\s*m\.|p\.\s*m\.|m\.)/g)].map((m) => m[0].replace(/\s+/g, ' '));
      const permitidas = new Set(libresVoley1Hoy.flatMap((h) => [amPm(h), amPm(`${String(Number(h.slice(0, 2)) + 1).padStart(2, '0')}:00`)]));
      const fuera = mencionadas.filter((h) => !permitidas.has(h));
      return r.accion === null && mencionadas.length > 0 && fuera.length === 0
        ? 'PASA'
        : `REVISAR (horas fuera del contexto: ${fuera.join(', ') || 'ninguna'}; mencionadas: ${mencionadas.length})`;
    },
  },
  {
    id: 'reservalo',
    historial: historialOferta,
    mensaje: 'resérvalo',
    revisar: (r) => (r.accion === null && /nombre/i.test(r.respuesta) && /tel[eé]fono/i.test(r.respuesta) ? 'PASA' : 'REVISAR (debe pedir nombre y teléfono)'),
  },
  {
    id: 'reservalo-varias',
    historial: [
      historialOferta[0],
      { rol: 'bot', texto: `La Cancha Voley Playa 1 tiene libres hoy estas franjas: ${libresVoley1Hoy.slice(0, 3).map(amPm).join(', ')}.` },
    ],
    mensaje: 'resérvalo',
    revisar: (r) =>
      r.accion === null && /cu[aá]l|franja|horario|\bhoras?\b/i.test(r.respuesta) ? 'PASA' : 'REVISAR (debe preguntar cuál franja, no suponer una)',
  },
  {
    id: 'datos-validos',
    historial: [...historialOferta, { rol: 'usuario', texto: 'resérvalo' }, { rol: 'bot', texto: 'Claro. ¿A nombre de quién y con qué teléfono?' }],
    mensaje: 'Juan Pérez, 300 123 4567',
    revisar: (r) =>
      r.accion?.tipo === 'CONFIRMAR_RESERVA' && r.accion.telefono === '3001234567' && r.accion.canchaId === 'voley-1' && r.accion.fecha === hoy && JSON.stringify(r.accion.horas) === '["09:00"]'
        ? 'PASA'
        : 'REVISAR (se esperaba CONFIRMAR_RESERVA voley-1, hoy, ["09:00"], 3001234567)',
  },
  {
    id: 'nombre-invalido',
    historial: [...historialOferta, { rol: 'usuario', texto: 'resérvalo' }, { rol: 'bot', texto: 'Claro. ¿A nombre de quién y con qué teléfono?' }],
    mensaje: 'Juan123, 3001234567',
    revisar: (r) => (r.accion === null && r.respuesta === 'Tu nombre solo puede tener letras y espacios, sin números ni símbolos.' ? 'PASA' : 'REVISAR (se esperaba el error fijo del nombre)'),
  },
  {
    id: 'telefono-invalido',
    historial: [...historialOferta, { rol: 'usuario', texto: 'resérvalo' }, { rol: 'bot', texto: 'Claro. ¿A nombre de quién y con qué teléfono?' }],
    mensaje: 'Juan Pérez, 2001234567',
    revisar: (r) => (r.accion === null && r.respuesta === 'Tu teléfono debe empezar por 3 y tener 10 dígitos.' ? 'PASA' : 'REVISAR (se esperaba el error fijo del teléfono)'),
  },
  {
    id: 'hora-ocupada',
    historial: [
      { rol: 'usuario', texto: 'Quiero reservar la cancha 1 de voley hoy a las 12 del mediodía' },
      { rol: 'bot', texto: 'Claro. ¿A nombre de quién y con qué teléfono?' },
    ],
    mensaje: 'Juan Pérez, 3001234567',
    revisar: (r) => (r.accion === null && /no está libre/.test(r.respuesta) ? 'PASA' : 'REVISAR (se esperaba el error fijo de franja ocupada)'),
  },
  {
    id: 'ubicacion',
    mensaje: '¿Dónde quedan?',
    revisar: (r) => (r.accion?.tipo === 'ABRIR_SECCION' && r.accion.seccion === 'ubicacion' && /Carrera 16/.test(r.respuesta) ? 'PASA' : 'REVISAR (dirección + ABRIR_SECCION ubicacion)'),
  },
  {
    id: 'parqueadero',
    mensaje: '¿Tienen parqueadero para motos?',
    revisar: (r) => (/\$1\.000/.test(r.respuesta) ? 'PASA' : 'REVISAR (se esperaba la tarifa de motos, $1.000)'),
  },
  {
    id: 'fuera-de-tema',
    mensaje: '¿Quién ganó el mundial de fútbol de 2022?',
    revisar: (r) => (r.accion === null && !/Argentina/i.test(r.respuesta) ? 'PASA' : 'REVISAR (debe redirigir sin responder el tema)'),
  },
];

let fallos = 0;
for (const caso of casos.filter((c) => FILTRO.length === 0 || FILTRO.includes(c.id))) {
  const inicio = Date.now();
  let estado = '-';
  let cuerpo;
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: caso.mensaje, historial: caso.historial || [], contexto }),
    });
    estado = res.status;
    cuerpo = await res.json();
  } catch (e) {
    cuerpo = { respuesta: `(sin respuesta: ${e.message})`, sugerencias: [], accion: null };
  }
  const veredicto = estado === 200 ? caso.revisar(cuerpo) : `REVISAR (HTTP ${estado})`;
  if (!veredicto.startsWith('PASA')) fallos += 1;
  console.log(`\n[${veredicto.startsWith('PASA') ? 'PASA' : '----'}] ${caso.id}  (HTTP ${estado}, ${Date.now() - inicio} ms)`);
  console.log(`  > ${caso.mensaje}`);
  console.log(`  respuesta:   ${cuerpo.respuesta}`);
  console.log(`  sugerencias: ${JSON.stringify(cuerpo.sugerencias)}`);
  console.log(`  accion:      ${JSON.stringify(cuerpo.accion)}`);
  if (!veredicto.startsWith('PASA')) console.log(`  ${veredicto}`);
}
console.log(`\nCasos para revisar: ${fallos}`);
process.exitCode = fallos ? 1 : 0;
