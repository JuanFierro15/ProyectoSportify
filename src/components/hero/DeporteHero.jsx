import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './DeporteHero.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

/**
 * DeporteHero (Bloque 2.5) — sección narrativa por deporte, reutilizable.
 *
 * Props:
 *  - nombre      {string}  nombre del deporte (ej. "Voley Playa")
 *  - videoSrc    {string}  ruta del video de fondo (placeholder por ahora)
 *  - tituloCTA   {string}  texto del botón
 *  - colorAcento {string}  color de acento (hex) para el CTA y el "eyebrow"
 *
 * Comportamiento:
 *  - Ocupa 100vh con el video cubriendo la sección (object-fit: cover) + overlay.
 *  - Se ancla con ScrollTrigger `pin: true` durante su tramo de scroll y luego
 *    se suelta para dar paso a la siguiente sección.
 *  - El texto/CTA hacen fade + scale (scrubbed) mientras dura el pin.
 *  - El <video> NO se monta/desmonta: se reproduce solo cuando la sección está
 *    activa (onToggle del ScrollTrigger) y se pausa al salir.
 *  - Todo dentro de `gsap.context()` con `ctx.revert()` en el cleanup.
 *  - `ScrollTrigger.refresh()` cuando el video reporta metadata, por si el
 *    layout se recalcula.
 */
function DeporteHero({ nombre, videoSrc, tituloCTA, colorAcento }) {
  const rootRef = useRef(null);
  const contenidoRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const seccion = rootRef.current;
    const contenido = contenidoRef.current;
    const video = videoRef.current;

    const reproducir = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    const pausar = () => video.pause();

    const ctx = gsap.context(() => {
      // Timeline anclada: pin de la sección + animación sutil del contenido.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: seccion,
          start: 'top top',
          end: '+=130%', // cuánto scroll dura el pin de esta sección
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => (self.isActive ? reproducir() : pausar()),
        },
      });

      tl.fromTo(
        contenido,
        { autoAlpha: 0, scale: 0.9, y: 24 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 1, ease: 'power2.out' }
      )
        .to(contenido, { duration: 1.4 }) // mantener visible el tramo central
        .to(contenido, {
          autoAlpha: 0,
          scale: 1.08,
          y: -16,
          duration: 1,
          ease: 'power2.in',
        });
    }, rootRef);

    // Si el navegador recalcula algo al conocer el video, re-medir los pines.
    const onLoadedMetadata = () => ScrollTrigger.refresh();
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      pausar();
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
          loop
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
