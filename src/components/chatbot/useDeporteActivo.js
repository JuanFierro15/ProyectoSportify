import { useState, useEffect } from 'react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';

// Deporte activo para el acento del chat: el de la vista de canchas si está
// abierta; si no, el de la sección [data-sport] (heros) que cruza el centro de
// la pantalla, con IntersectionObserver (sin listener de scroll). Solo cuenta
// lo que está dentro de #root: la vista y el visor viven en portales.
export default function useDeporteActivo() {
  const { deporteAbierto } = useVistaCanchas();
  const [deporteScroll, setDeporteScroll] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return;
    }

    const rootElemento = document.getElementById('root');
    if (!rootElemento) {
      return;
    }

    const elementos = rootElemento.querySelectorAll('[data-sport]');
    if (elementos.length === 0) {
      return;
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
  }, []);

  return deporteAbierto || deporteScroll;
}
