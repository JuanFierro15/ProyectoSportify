/**
 * Helpers de presentación derivados de las canchas del ReservasContext.
 * Usados por VistaCanchas para agrupar canchas por deporte, generar el
 * título corto de cada una y su textura de fondo en el carrusel.
 */

export function canchasDelDeporte(canchas, slug) {
  return canchas.filter((c) => c.deporte === slug);
}

// "Cancha N": el deporte ya se ve por separado (badge, pestaña...), así que
// en la tarjeta basta con el número.
export function tituloCancha(cancha) {
  const numero = (cancha.id.match(/(\d+)$/) || [])[1];
  return numero ? `Cancha ${numero}` : cancha.nombre;
}

function mezclarConBlanco(hex, factor) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mezclar = (c) => Math.round(c + (255 - c) * factor);
  return `rgb(${mezclar(r)}, ${mezclar(g)}, ${mezclar(b)})`;
}

// Luminancia relativa (WCAG) de un color hex, para elegir el texto legible.
function luminanciaRelativa(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  const canal = (c8) => {
    const s = c8 / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = canal((num >> 16) & 255);
  const g = canal((num >> 8) & 255);
  const b = canal(num & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Blanco o un oscuro casi negro, lo que tenga más contraste (WCAG) sobre el
// color de acento dado. Usado para el texto de botones/badges con fondo
// de color de acento variable por deporte.
export function colorContraste(hex) {
  const L = luminanciaRelativa(hex || '#1779ba');
  const contrasteBlanco = 1.05 / (L + 0.05);
  const contrasteOscuro = (L + 0.05) / 0.05;
  return contrasteBlanco >= contrasteOscuro ? '#ffffff' : '#161616';
}

// No hay fotografía real de cada cancha todavía: en vez de enlazar imágenes
// de stock ajenas al proyecto, se genera una textura local (degradado con el
// acento del deporte) para el fondo de cada card del carrusel. El nombre real
// de la cancha se muestra como texto encima (vía `renderOverlay`), no aquí.
export function imagenPlaceholderCancha(acento) {
  const base = acento || '#1779ba';
  const claro = mezclarConBlanco(base, 0.35);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${claro}" />
        <stop offset="100%" stop-color="${base}" />
      </linearGradient>
    </defs>
    <rect width="640" height="800" fill="url(#g)" />
    <circle cx="520" cy="150" r="190" fill="rgba(255,255,255,0.10)" />
    <circle cx="80" cy="700" r="230" fill="rgba(0,0,0,0.10)" />
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
