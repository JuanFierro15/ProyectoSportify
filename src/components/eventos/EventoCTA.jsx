import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarDays, Clock, LayoutGrid, Sparkles, Trophy, Users } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import PixelSwap from './PixelSwap';
import EventoModal from './EventoModal';
import './EventoCTA.css';

// Registro idempotente del plugin de ScrollTrigger.
gsap.registerPlugin(ScrollTrigger);

/**
 * EventoCTA — sección de eventos a pantalla completa (100vh).
 *
 * Utiliza el componente oficial PixelSwap de React Bits con trigger="hover"
 * para intercambiar dinámicamente entre la vista inicial y la vista detallada
 * de beneficios de eventos con animaciones basadas en ventanas de píxeles.
 *
 * Además, las etiquetas estadísticas caen en cascada al entrar al viewport
 * mediante ScrollTrigger con física elástica de gravedad.
 */
function EventoCTA() {
  const rootRef = useRef(null);
  const statsRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const { canchas, dias } = useReservas();

  const statsPrimarios = [
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

  const statsSecundarios = [
    {
      icono: Trophy,
      texto: 'Trofeos y premiación',
    },
    {
      icono: Users,
      texto: 'Zonas sociales y vestuarios',
    },
    {
      icono: CalendarDays,
      texto: 'Fechas reservadas en exclusiva',
    },
    {
      icono: Sparkles,
      texto: 'Arbitraje y sonido a medida',
    },
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      // Animación de caída de etiquetas al hacer scroll (Physics Drop)
      const statElements = gsap.utils.toArray('.evento-cta__stat--primaria');
      if (statsRef.current && statElements.length > 0) {
        const dropTl = gsap.timeline({
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
        });

        dropTl.fromTo(
          statElements,
          {
            y: -140,
            opacity: 0,
            scale: 0.65,
            rotation: (i) => (i % 2 === 0 ? -14 : 14),
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'back.out(2)', // rebote elástico de gravedad
            onComplete: () => {
              // Limpiar transform para permitir efectos hover CSS
              statElements.forEach((el) => gsap.set(el, { clearProps: 'transform' }));
            },
          }
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const firstContent = (
    <div className="evento-cta__pantalla evento-cta__pantalla--primaria">
      <div className="evento-cta__contenido">
        <div className="grid-x grid-padding-x align-center">
          <div className="cell small-12 medium-10 large-8 evento-cta__texto">
            <div className="evento-cta__texto-bloque">
              <p className="evento-cta__eyebrow">Eventos y torneos</p>
              <h2 className="evento-cta__titulo">
                ¿Organizas un torneo o un cumpleaños?
              </h2>
              <p className="evento-cta__bajada">
                Reserva varias canchas y una franja completa para tu evento, en un
                solo paso.
              </p>
            </div>

            {/* Etiquetas animadas en caída libre por scroll */}
            <ul
              className="evento-cta__stats"
              ref={statsRef}
              aria-label="Datos del servicio de eventos"
            >
              {statsPrimarios.map(({ icono: Icono, texto }) => (
                <li className="evento-cta__stat evento-cta__stat--primaria" key={texto}>
                  <Icono size={16} aria-hidden="true" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>

            <div className="evento-cta__accion">
              <button
                type="button"
                className="button large evento-cta__boton"
                onClick={(e) => {
                  e.stopPropagation();
                  setAbierto(true);
                }}
              >
                Reserva un evento
              </button>
            </div>
            <p className="evento-cta__hint">Pasa el cursor sobre la sección para explorar beneficios</p>
          </div>
        </div>
      </div>
    </div>
  );

  const secondContent = (
    <div className="evento-cta__pantalla evento-cta__pantalla--secundaria">
      <div className="evento-cta__contenido">
        <div className="grid-x grid-padding-x align-center">
          <div className="cell small-12 medium-10 large-8 evento-cta__texto">
            <div className="evento-cta__texto-bloque">
              <p className="evento-cta__eyebrow evento-cta__eyebrow--dorado">
                Experiencia deportiva completa
              </p>
              <h2 className="evento-cta__titulo">
                Torneos exclusivos y celebraciones a medida
              </h2>
              <p className="evento-cta__bajada">
                Franjas horarias personalizadas, vestuarios exclusivos, premiación
                y soporte logístico para todos tus invitados.
              </p>
            </div>

            <ul
              className="evento-cta__stats"
              aria-label="Beneficios exclusivos de eventos"
            >
              {statsSecundarios.map(({ icono: Icono, texto }) => (
                <li className="evento-cta__stat evento-cta__stat--secundaria" key={texto}>
                  <Icono size={16} aria-hidden="true" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>

            <div className="evento-cta__accion">
              <button
                type="button"
                className="button large evento-cta__boton"
                onClick={(e) => {
                  e.stopPropagation();
                  setAbierto(true);
                }}
              >
                Reserva un evento
              </button>
            </div>
            <p className="evento-cta__hint">Aleja el cursor para volver</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="reservas-placeholder" className="evento-cta" ref={rootRef}>
      <PixelSwap
        firstContent={firstContent}
        secondContent={secondContent}
        pixelSize={64}
        gap={0}
        pixelRadius={0}
        pixelSpin={0}
        pixelScale={0.35}
        duration={1400}
        pixelDuration={450}
        pattern="random"
        randomness={0}
        fade
        trigger="hover"
        aspectRatio="unset"
        style={{ width: '100%', minHeight: '100vh', height: '100%' }}
      />

      <EventoModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </section>
  );
}

export default EventoCTA;
