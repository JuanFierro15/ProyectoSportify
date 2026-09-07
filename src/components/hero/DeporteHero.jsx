import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './DeporteHero.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

// Cuántos píxeles de scroll equivalen a 1 segundo de video. Sube el número
// para que haya que scrollear más para recorrer el video (más "cine"),
// bájalo para pasarlo más rápido.
const PX_POR_SEGUNDO = 150;

// Suavizado del video: en cada frame el `currentTime` se acerca al objetivo
// esta fracción (0-1). 1 = 1:1 duro con el scroll (más brusco). ~0.2-0.4 =
// interpola y "asienta" en pocos frames al soltar el scroll.
const SUAVIZADO = 0.3;

/**
 * DeporteHero (Bloque 2.5) — sección narrativa por deporte, reutilizable.
 *
 * Props:
 *  - nombre      {string}  nombre del deporte (ej. "Voley Playa")
 *  - videoSrc    {string}  ruta del video de fondo
 *  - tituloCTA   {string}  texto del botón
 *  - colorAcento {string}  color de acento (hex) para el CTA y el "eyebrow"
 *
 * Comportamiento:
 *  - Ocupa 100vh con el video cubriendo la sección (object-fit: cover) + overlay.
 *  - La sección se ancla (`pin: true`) y, mientras dura el pin, el `currentTime`
 *    del <video> sigue al scroll: al scrollear avanza; al soltar el scroll el
 *    video se queda quieto (no se reproduce solo). El tramo de pin dura lo que
 *    dura el video (duración * PX_POR_SEGUNDO), y al llegar al final se suelta
 *    y pasa a la siguiente sección.
 *  - Fluidez: el video NO se mueve directamente desde la timeline de GSAP.
 *    El ScrollTrigger sólo guarda el progreso objetivo y un bucle en
 *    `gsap.ticker` acerca `currentTime` a ese objetivo con easing (SUAVIZADO),
 *    saltándose el seek si el video todavía está buscando (`video.seeking`).
 *    Así, en scroll rápido no se encolan decenas de seeks que traban al
 *    decoder.
 *  - El texto/CTA hacen fade + scale (scrubbed) al principio y al final del pin.
 *  - Todo dentro de `gsap.context()` con `ctx.revert()` en el cleanup.
 *  - `ScrollTrigger.refresh()` cuando el video reporta su duración, para que el
 *    largo del pin (que depende de esa duración) quede bien medido.
 */
function DeporteHero({ nombre, videoSrc, tituloCTA, colorAcento }) {
  const rootRef = useRef(null);
  const contenidoRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const seccion = rootRef.current;
    const contenido = contenidoRef.current;
    const video = videoRef.current;

    // Progreso objetivo del scroll (0..1) que persigue el bucle del ticker.
    let progresoObjetivo = 0;

    const ctx = gsap.context(() => {
      // Timeline del PIN + CONTENIDO (el video NO va aquí).
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: seccion,
          start: 'top top',
          // El pin dura lo que dure el video (en px de scroll).
          end: () =>
            '+=' + Math.max(1, Math.round((video.duration || 1) * PX_POR_SEGUNDO)),
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progresoObjetivo = self.progress;
          },
          onRefresh: (self) => {
            progresoObjetivo = self.progress;
          },
        },
      });

      // Contenido: entra en el primer tramo del pin y se va en el último.
      tl.fromTo(
        contenido,
        { autoAlpha: 0, scale: 0.92, y: 20 },
        { autoAlpha: 1, scale: 1, y: 0, ease: 'power2.out', duration: 0.15 },
        0
      ).to(
        contenido,
        { autoAlpha: 0, scale: 1.06, y: -14, ease: 'power2.in', duration: 0.15 },
        0.85
      );
    }, rootRef);

    // Bucle que acerca el frame del video al objetivo sin encolar seeks.
    const seguirVideo = () => {
      const dur = video.duration;
      if (!dur || video.seeking) return; // aún buscando -> no pedir otro seek
      const objetivo = progresoObjetivo * dur;
      const delta = objetivo - video.currentTime;
      if (Math.abs(delta) < 0.033) return; // ~1 frame: nada que hacer
      video.currentTime += delta * SUAVIZADO;
    };
    gsap.ticker.add(seguirVideo);

    // La duración del video llega de forma asíncrona y de ella depende el largo
    // del pin -> re-medir cuando esté disponible.
    const onLoadedMetadata = () => ScrollTrigger.refresh();
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      gsap.ticker.remove(seguirVideo);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="deporte-hero"
      ref={rootRef}
      style={{ '--acento': colorAcento }}
    >
      <div className="deporte-hero__bg" aria-hidden="true">
        <video
          ref={videoRef}
          className="deporte-hero__video"
          src={videoSrc}
          muted
          playsInline
          preload="auto"
        />
      </div>

      <div className="deporte-hero__overlay" aria-hidden="true" />

      <div className="grid-container deporte-hero__contenido" ref={contenidoRef}>
        <div className="grid-x grid-padding-x align-center">
          <div className="cell small-12 medium-10 large-8">
            <p className="deporte-hero__eyebrow">Nuestras canchas</p>
            <h2 className="deporte-hero__titulo">{nombre}</h2>
            <p className="deporte-hero__texto">
              Viví la experiencia del {nombre.toLowerCase()} en un espacio
              pensado para jugar, con torneos y eventos durante todo el año.
            </p>
            <a
              className="button large deporte-hero__cta"
              href="#canchas-placeholder"
            >
              {tituloCTA}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DeporteHero;
