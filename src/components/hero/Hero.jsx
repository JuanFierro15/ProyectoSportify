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

    const ctx = gsap.context(() => {
      // 1) Animación de entrada al cargar: fade + slide del título, subtítulo y
      //    botón CTA. Sin ScrollTrigger porque es lo primero que se ve.
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-title', { opacity: 0, y: 40, duration: 1 })
        .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.8 }, '-=0.6')
        .from('.hero-cta', { opacity: 0, y: 24, duration: 0.7 }, '-=0.45');

      // 2) Parallax del fondo al hacer scroll (ScrollTrigger con scrub).
      gsap.to('.hero-bg', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="hero-placeholder" ref={rootRef}>
      {/* Fondo: placeholder por ahora. Reemplazar por el asset real, p. ej.:
          <video className="hero-bg" src="/media/hero.mp4" autoPlay muted loop playsInline /> */}
      <div className="hero-bg-wrap" aria-hidden="true">
        <img
          className="hero-bg"
          alt=""
          src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1600'%20height='900'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='0'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%23ffd27a'/%3E%3Cstop%20offset='0.55'%20stop-color='%23f6a94b'/%3E%3Cstop%20offset='1'%20stop-color='%232b6cb0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='1600'%20height='900'%20fill='url(%23g)'/%3E%3Ccircle%20cx='1290'%20cy='170'%20r='90'%20fill='%23fff6e0'%20opacity='0.85'/%3E%3Crect%20y='630'%20width='1600'%20height='270'%20fill='%23e8c98f'/%3E%3C/svg%3E"
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
