/**
 * Helpers de presentación derivados de las canchas del ReservasContext.
 * Compartidos por Catalogo y VistaCanchas para no duplicar la agrupación
 * por deporte ni el título corto de cada cancha.
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
