import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 * Características:
 * 1. Transición Pixel Swap (React Bits):
 *    - Se activa al entrar la sección al viewport.
 *    - Se activa de forma interactiva en hover (onMouseEnter).
 *    - Se activa nuevamente al salir el cursor de la sección (onMouseLeave).
 * 2. Caída dinámica de etiquetas al scrollear (Physics Drop / Falling Tags):
 *    - Las etiquetas descienden en cascada con física de rebote elástico
 *      en el momento exacto en que la tira de etiquetas entra en la vista.
 * 3. Textos 100% en español estándar sin voseo.
 * 4. Modal para reserva de eventos completos (torneos / cumpleaños).
 */
function EventoCTA() {
  const rootRef = useRef(null);
  const pixelGridRef = useRef(null);
  const statsRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const { canchas, dias } = useReservas();

  // Matriz de píxeles para el efecto Pixel Swap de React Bits
  const pixels = useMemo(() => {
    return Array.from({ length: TOTAL_PIXELS }, (_, i) => {
      let bg = '#161616';
      if (i % 8 === 0) bg = '#f6a94b'; // píxeles de acento dorado
      else if (i % 5 === 0) bg = 'rgba(246, 169, 75, 0.45)';
      else if (i % 3 === 0) bg = '#282828';
      else if (i % 2 === 0) bg = '#1e1e1e';
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

  // Ejecución del efecto Pixel Swap (React Bits)
  const runPixelSwap = useCallback((type = 'enter') => {
    const pixelElements = gsap.utils.toArray('.pixel-swap-cell');
    if (!pixelElements.length) return;

    gsap.killTweensOf(pixelElements);

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(pixelElements, { opacity: 0, scale: 0 });
      },
    });

    // Fase 1: Ensamblado rápido de píxeles con rotación y dispersión
    tl.fromTo(
      pixelElements,
      {
        scale: 0,
        opacity: 0,
        rotation: () => gsap.utils.random(-60, 60),
      },
      {
        scale: 1,
        opacity: 0.95,
        rotation: 0,
        duration: 0.26,
        stagger: {
          amount: 0.36,
          from: type === 'leave' ? 'edges' : 'random',
          grid: [GRID_ROWS, GRID_COLS],
        },
        ease: 'power2.out',
      }
    ).to(
      // Fase 2: Disolución y dispersión aleatoria revelando el contenido
      pixelElements,
      {
        scale: 0,
        opacity: 0,
        rotation: () => gsap.utils.random(-90, 90),
        duration: 0.32,
        stagger: {
          amount: 0.36,
          from: type === 'leave' ? 'center' : 'random',
          grid: [GRID_ROWS, GRID_COLS],
        },
        ease: 'power3.inOut',
      },
      '+=0.06'
    );
  }, []);

  const handleMouseEnter = () => {
    runPixelSwap('enter');
  };

  const handleMouseLeave = () => {
    runPixelSwap('leave');
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      // 1. Pixel Swap activado al aparecer la sección en el viewport
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top 80%',
        onEnter: () => runPixelSwap('enter'),
        onEnterBack: () => runPixelSwap('enter'),
      });

      // 2. Revelado suave del bloque de título y texto
      gsap.fromTo(
        '.evento-cta__texto-bloque',
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 3. Animación de caída de etiquetas al hacer scroll (Physics Drop)
      // Se activa directamente sobre statsRef para ser 100% visible cuando las etiquetas entran a la pantalla
      const statElements = gsap.utils.toArray('.evento-cta__stat');
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
              // Limpiar transform para permitir los efectos hover CSS nativos
              statElements.forEach((el) => gsap.set(el, { clearProps: 'transform' }));
            },
          }
        );
      }

      // 4. Aparición del botón CTA de reserva
      gsap.fromTo(
        '.evento-cta__accion',
        {
          opacity: 0,
          scale: 0.88,
          y: 26,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 48%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [runPixelSwap]);

  return (
    <section
      id="reservas-placeholder"
      className="evento-cta"
      ref={rootRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cuadrícula interactiva de Pixel Swap (React Bits) */}
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

            {/* Etiquetas animadas en caída visible al scrollear */}
            <ul
              className="evento-cta__stats"
              ref={statsRef}
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
