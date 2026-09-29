import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarDays, Clock, LayoutGrid, Trophy } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import EventoModal from './EventoModal';
import './EventoCTA.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

/**
 * EventoCTA — punto de entrada al flujo de evento especial.
 *
 * Banda a ancho completo, después del catálogo. Conserva el id
 * "reservas-placeholder" para el enlace "Reservar" del navbar (sin tocar).
 * La tira de estadísticas sale de datos reales (deportes, canchas y
 * ventana de días del ReservasContext), no de cifras inventadas.
 * El contenido entra con fade al aparecer en viewport (gsap.context +
 * ScrollTrigger), con un stagger extra para los stats.
 */
function EventoCTA() {
  const rootRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const { canchas, dias } = useReservas();

  const stats = [
    {
      icono: Trophy,
      texto: `${DEPORTES.length} deportes`,
    },
    {
      icono: LayoutGrid,
      texto: `Combina hasta ${canchas.length} canchas`,
    },
    {
      icono: CalendarDays,
      texto: `${dias.length} días de disponibilidad`,
    },
    {
      icono: Clock,
      texto: '08:00 a 21:00',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.from('.evento-cta__contenido', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power2.out',
      }).from(
        gsap.utils.toArray('.evento-cta__stat'),
        {
          opacity: 0,
          y: 16,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        },
        '-=0.3'
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="reservas-placeholder" className="evento-cta" ref={rootRef}>
      <div className="grid-container evento-cta__contenido">
        <div className="grid-x grid-padding-x align-center">
          <div className="cell small-12 medium-10 large-8 evento-cta__texto">
            <p className="evento-cta__eyebrow">Eventos y torneos</p>
            <h2 className="evento-cta__titulo">
              ¿Organizás un torneo o un cumpleaños?
            </h2>
            <p className="evento-cta__bajada">
              Reservá varias canchas y una franja completa para tu evento, en un
              solo paso.
            </p>

            <ul className="evento-cta__stats" aria-label="Datos del servicio de eventos">
              {stats.map(({ icono: Icono, texto }) => (
                <li className="evento-cta__stat" key={texto}>
                  <Icono size={16} aria-hidden="true" />
                  {texto}
                </li>
              ))}
            </ul>

            <div className="evento-cta__accion">
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
      </div>

      <EventoModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </section>
  );
}

export default EventoCTA;
