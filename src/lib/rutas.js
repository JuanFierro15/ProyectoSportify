// Construcción y lectura de las rutas del sitio (/ y /reservar/<deporte>).
// Módulo puro: recibe la ubicación y las listas válidas por parámetro.

export function rutaReserva(slug, modo) {
  const base = `/reservar/${slug}`;
  if (modo && modo !== 'cancha') {
    return `${base}?modo=${encodeURIComponent(modo)}`;
  }
  return base;
}

export function leerRuta(
  { pathname = '/', search = '', hash = '' } = {},
  { slugs = [], modos = [] } = {}
) {
  if (pathname === '/reservar' || pathname.startsWith('/reservar/')) {
    const coincidencia = /^\/reservar\/([^/]+)\/?$/.exec(pathname);
    const slug = coincidencia ? coincidencia[1] : null;
    if (slug && slugs.includes(slug)) {
      const params = new URLSearchParams(search);
      const modoParam = params.get('modo');
      const modo = modoParam && modos.includes(modoParam) ? modoParam : 'cancha';
      return { deporte: slug, modo, redirigir: null };
    }
    return { deporte: null, modo: 'cancha', redirigir: '/' };
  }

  if (pathname === '/') {
    const hashViejo = /^#canchas-([a-z-]+)$/.exec(hash);
    if (hashViejo && slugs.includes(hashViejo[1])) {
      const slug = hashViejo[1];
      return { deporte: slug, modo: 'cancha', redirigir: rutaReserva(slug) };
    }
  }

  return { deporte: null, modo: 'cancha', redirigir: null };
}

export function esClicNormal(evento) {
  if (!evento) return false;
  return (
    evento.button === 0 &&
    !evento.metaKey &&
    !evento.ctrlKey &&
    !evento.shiftKey &&
    !evento.altKey &&
    !evento.defaultPrevented
  );
}
