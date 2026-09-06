import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Hero.css';

// El plugin se registra una sola vez a nivel de módulo (es idempotente).
gsap.registerPlugin(ScrollTrigger);

/**
 * Hero de la página (Bloque 2).
 *
 * - Layout con el grid de Foundation (`grid-container`, `grid-x`, `grid-padding-x`, `cell`).
 * - Clases propias (`hero-title`, `hero-cta`, `hero-bg`, ...) usadas SOLO como
 *   targets de GSAP.
 * - Toda la animación vive dentro de `gsap.context()` con `ctx.revert()` en el
 *   cleanup, para que StrictMode / desmontajes no dejen tweens ni ScrollTriggers
 *   huérfanos.
 */
function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    const media = el.querySelector('.hero-bg');

    const ctx = gsap.context(() => {
      // 1) Animación de entrada al cargar: fade + slide del título, subtítulo y
      //    botón CTA. Sin ScrollTrigger porque es lo primero que se ve.
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-title', { opacity: 0, y: 40, duration: 1 })
        .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.8 }, '-=0.6')
        .from('.hero-cta', { opacity: 0, y: 24, duration: 0.7 }, '-=0.45');

      // 2) El video de fondo NO se reproduce solo: su avance lo controla el
      //    scroll. Se liga el `currentTime` del <video> al progreso de scroll
      //    del hero, de modo que el video avanza al bajar y retrocede al subir.
      //    (Para que el hero quede "clavado" mientras se recorre el video,
      //    añadir  pin: true  y cambiar  end  a algo como  '+=150%'.)
      gsap.to(media, {
        currentTime: () => media.duration || 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      });
    }, rootRef);

    // Cuando el navegador ya conoce la duración del video, recalcular medidas.
    const onMeta = () => ScrollTrigger.refresh();
    media.addEventListener('loadedmetadata', onMeta);

    return () => {
      media.removeEventListener('loadedmetadata', onMeta);
      ctx.revert();
    };
  }, []);

  return (
    <section className="hero" id="hero-placeholder" ref={rootRef}>
      {/* Fondo del hero: video en `public/media/hero.mp4`.
          Sin `autoPlay` ni `loop`: su reproducción la controla el scroll (ver
          el ScrollTrigger de arriba). Mantiene la clase `hero-bg` para el
          `object-fit: cover` de Hero.css. */}
      <div className="hero-bg-wrap" aria-hidden="true">
        <video
          className="hero-bg"
          src={`${process.env.PUBLIC_URL}/media/hero.mp4`}
          muted
          playsInline
          preload="auto"
        />
      </div>

      <div className="hero-overlay" aria-hidden="true" />

      <div className="grid-container hero-content">
        <div className="grid-x grid-padding-x align-center">
          <div className="cell small-12 medium-10 large-8">
            <h1 className="hero-title">
              Reserva tu cancha de voley playa, pádel o fútbol
            </h1>
            <p className="hero-subtitle">
              Canchas listas para jugar y organización de torneos, cumpleaños y
              eventos especiales, todo en un mismo lugar.
            </p>
            <a className="button large hero-cta" href="#reservas-placeholder">
              Reservar ahora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
