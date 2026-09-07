import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EventoModal from './EventoModal';
import './EventoCTA.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

/**
 * EventoCTA — punto de entrada al flujo de evento especial.
 *
 * Banda a ancho completo, después del catálogo. Conserva el id
 * "reservas-placeholder" para el enlace "Reservar" del navbar (sin tocar).
 * El texto entra con fade al aparecer en viewport (gsap.context + ScrollTrigger).
 */
function EventoCTA() {
  const rootRef = useRef(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.evento-cta__contenido', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="reservas-placeholder"
      className="evento-cta"
      ref={rootRef}
    >
      <div className="grid-container evento-cta__contenido">
        <div className="grid-x grid-padding-x align-middle">
          <div className="cell medium-8">
            <h2 className="evento-cta__titulo">
              ¿Organizás un torneo o un cumpleaños?
            </h2>
            <p className="evento-cta__bajada">
              Reservá varias canchas y una franja completa para tu evento, en un
              solo paso.
            </p>
          </div>
          <div className="cell medium-4 evento-cta__accion">
            <button
              type="button"
              className="button large evento-cta__boton"
              onClick={() => setAbierto(true)}
            >
              Reservá un evento
            </button>
          </div>
        </div>
      </div>

      <EventoModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </section>
  );
}

export default EventoCTA;
