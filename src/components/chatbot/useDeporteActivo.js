import { useState, useEffect } from 'react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';

// Deporte activo para el acento del chat: el de la página de reserva si se
// está en ella; si no, el de la sección [data-sport] (heros del inicio) que
// cruza el centro de la pantalla, con IntersectionObserver (sin listener de
// scroll). Solo cuenta lo que está dentro de #root (el propio widget del chat
// vive en un portal en document.body). Depende de `deporteAbierto` para volver
// a observar los heros cuando se regresa a la página de inicio.
export default function useDeporteActivo() {
  const { deporteAbierto } = useVistaCanchas();
  const [deporteScroll, setDeporteScroll] = useState(null);

  useEffect(() => {
    if (deporteAbierto || typeof window === 'undefined' || !window.IntersectionObserver) {
      return undefined;
    }

    const rootElemento = document.getElementById('root');
    if (!rootElemento) {
      return undefined;
    }

    const elementos = rootElemento.querySelectorAll('[data-sport]');
    if (elementos.length === 0) {
      return undefined;
    }

    const visibles = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const slug = entry.target.getAttribute('data-sport');
          if (entry.isIntersecting) {
            visibles.delete(entry.target);
            visibles.set(entry.target, slug);
          } else {
            visibles.delete(entry.target);
          }
        });

        let activo = null;
        for (const slug of visibles.values()) {
          activo = slug;
        }
        setDeporteScroll(activo);
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0,
      }
    );

    elementos.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [deporteAbierto]);

  return deporteAbierto || deporteScroll;
}
