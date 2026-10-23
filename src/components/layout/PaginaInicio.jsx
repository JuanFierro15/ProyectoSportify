import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { DEPORTES } from '../../data/deportes';
import DeporteHero from '../hero/DeporteHero';
import EventoCTA from '../eventos/EventoCTA';
import Ubicacion from '../ubicacion/Ubicacion';

gsap.registerPlugin(ScrollTrigger);

// Videos de fondo de los heros por deporte (en public/media/).
// Son versiones web ligeras: 1080p, keyframe por frame (para que el scrubbing
// por scroll sea fluido) y +faststart. Los originales en alta calidad están
// en public/media/fuente/ (fuera del repo).
// BASE_URL de Vite ya termina en '/': con otra barra quedaría `//media/...`,
// que el navegador interpreta como otro dominio.
const BASE = import.meta.env.BASE_URL;
const VIDEOS = {
  'voley-playa': `${BASE}media/hero_voleyplaya.mp4`,
  padel: `${BASE}media/hero_padel.mp4`,
  futbol: `${BASE}media/hero_futbol.mp4`,
};

// Contenido de la página de inicio (`/`): heros por deporte, sección de
// eventos y ubicación. Al volver desde la página de reserva, espera a que los
// videos tengan metadatos (de su duración depende el largo de cada pin de
// ScrollTrigger) antes de refrescar las medidas y restaurar la posición o
// desplazarse a la sección pedida.
function PaginaInicio() {
  const { abrirVista, leerDestinoInicio, limpiarDestinoInicio } = useVistaCanchas();

  useEffect(() => {
    const destino = leerDestinoInicio();
    if (!destino) return undefined;

    let cancelado = false;
    let aplicado = false;
    let timerId = null;
    const contenedor = document.getElementById('hero-placeholder');
    const videos = contenedor ? Array.from(contenedor.querySelectorAll('video')) : [];
    const escuchando = [];

    const aplicar = () => {
      if (cancelado || aplicado) return;
      aplicado = true;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      escuchando.forEach((v) => v.removeEventListener('loadedmetadata', alCargar));

      ScrollTrigger.refresh();
      if (destino.seccion) {
        if (destino.seccion === 'hero-placeholder') {
          window.scrollTo(0, 0);
        } else {
          document.getElementById(destino.seccion)?.scrollIntoView({ block: 'start' });
        }
      } else if (typeof destino.y === 'number') {
        window.scrollTo(0, destino.y);
      }
      limpiarDestinoInicio();
    };

    const listos = () => videos.every((v) => v.readyState >= 1);

    function alCargar() {
      if (listos()) {
        aplicar();
      }
    }

    if (listos()) {
      timerId = setTimeout(aplicar, 0);
    } else {
      videos.forEach((v) => {
        if (v.readyState < 1) {
          v.addEventListener('loadedmetadata', alCargar);
          escuchando.push(v);
        }
      });
      timerId = setTimeout(aplicar, 2500);
    }

    return () => {
      cancelado = true;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      escuchando.forEach((v) => v.removeEventListener('loadedmetadata', alCargar));
    };
  }, [leerDestinoInicio, limpiarDestinoInicio]);

  return (
    <>
      <div id="hero-placeholder">
        {DEPORTES.map((d, i) => (
          <DeporteHero
            key={d.slug}
            slug={d.slug}
            nombre={d.nombre}
            videoSrc={VIDEOS[d.slug]}
            tituloCTA={`Ver canchas de ${d.nombre.toLowerCase()}`}
            colorAcento={d.colorAcento}
            eyebrow={d.eyebrow}
            descripcion={d.descripcion}
            onVerCanchas={() => abrirVista(d.slug)}
            ultimoDeporte={i === DEPORTES.length - 1}
          />
        ))}
      </div>

      <EventoCTA />

      <Ubicacion />
    </>
  );
}

export default PaginaInicio;
