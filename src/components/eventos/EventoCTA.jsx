import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarDays, Clock, LayoutGrid, Trophy } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import EventoModal from './EventoModal';
import './EventoCTA.css';

// Registro idempotente del plugin de ScrollTrigger.
gsap.registerPlugin(ScrollTrigger);

const GRID_COLS = 12;
const GRID_ROWS = 8;
const TOTAL_PIXELS = GRID_COLS * GRID_ROWS;

/**
 * EventoCTA — sección de eventos a pantalla completa (100vh).
 *
 * Incluye:
 * 1. Transición Pixel Swap (React Bits): cuadrícula de píxeles digitales
 *    que se disuelven y rotan de forma aleatoria al entrar al viewport.
 * 2. Caída escalonada de etiquetas al hacer scroll: cada etiqueta baja desde
 *    la parte superior con física de rebote elástico a medida que el usuario avanza.
 * 3. Textos en español estándar sin voseo.
 * 4. Modal para reserva de eventos completos (torneos / cumpleaños).
 */
function EventoCTA() {
  const rootRef = useRef(null);
  const pixelGridRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const { canchas, dias } = useReservas();

  // Matriz de píxeles para el efecto Pixel Swap de React Bits
  const pixels = useMemo(() => {
    return Array.from({ length: TOTAL_PIXELS }, (_, i) => {
      let bg = '#161616';
      if (i % 11 === 0) bg = 'rgba(246, 169, 75, 0.25)'; // píxeles de acento dorado
      else if (i % 7 === 0) bg = '#282828';
      else if (i % 3 === 0) bg = '#1f1f1f';
      return { id: i, bg };
    });
  }, []);

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
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      // 1. Animación Pixel Swap (React Bits) al aparecer la sección en el viewport
      const pixelElements = gsap.utils.toArray('.pixel-swap-cell');
      if (pixelElements.length > 0) {
        gsap.fromTo(
          pixelElements,
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
          },
          {
            scale: 0,
            opacity: 0,
            rotation: () => gsap.utils.random(-80, 80),
            duration: 0.5,
            stagger: {
              amount: 0.65,
              from: 'random',
              grid: [GRID_ROWS, GRID_COLS],
            },
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // 2. Revelado suave del bloque de encabezado y texto
      gsap.fromTo(
        '.evento-cta__texto-bloque',
        {
          opacity: 0,
          y: 35,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 3. Animación de caída de etiquetas al hacer scroll (React Bits Falling Tags / Physics Drop)
      const statElements = gsap.utils.toArray('.evento-cta__stat');
      statElements.forEach((el, index) => {
        gsap.fromTo(
          el,
          {
            y: -110 - index * 25,
            opacity: 0,
            scale: 0.7,
            rotation: index % 2 === 0 ? -10 : 10,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.85,
            ease: 'back.out(2)', // rebote elástico de gravedad
            scrollTrigger: {
              trigger: rootRef.current,
              start: `top ${72 - index * 8}%`,
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // 4. Aparición del botón CTA de reserva
      gsap.fromTo(
        '.evento-cta__accion',
        {
          opacity: 0,
          scale: 0.88,
          y: 24,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 46%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="reservas-placeholder" className="evento-cta" ref={rootRef}>
      {/* Cuadrícula de Pixel Swap (React Bits) */}
      <div
        className="pixel-swap-grid"
        ref={pixelGridRef}
        aria-hidden="true"
        style={{
          '--pixel-cols': GRID_COLS,
          '--pixel-rows': GRID_ROWS,
        }}
      >
        {pixels.map((p) => (
          <div
            key={p.id}
            className="pixel-swap-cell"
            style={{ backgroundColor: p.bg }}
          />
        ))}
      </div>

      <div className="grid-container evento-cta__contenido">
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
              aria-label="Datos del servicio de eventos"
            >
              {stats.map(({ icono: Icono, texto }) => (
                <li className="evento-cta__stat" key={texto}>
                  <Icono size={16} aria-hidden="true" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>

            <div className="evento-cta__accion">
              <button
                type="button"
                className="button large evento-cta__boton"
                onClick={() => setAbierto(true)}
              >
                Reserva un evento
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
