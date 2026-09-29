import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarDays, Clock, LayoutGrid, Sparkles, Trophy, Users } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import EventoModal from './EventoModal';
import './EventoCTA.css';

gsap.registerPlugin(ScrollTrigger);

const GRID_COLS = 12;
const GRID_ROWS = 8;
const TOTAL_PIXELS = GRID_COLS * GRID_ROWS;

function EventoCTA() {
  const rootRef = useRef(null);
  const pixelGridRef = useRef(null);
  const statsRef = useRef(null);
  const transitionRef = useRef(null);
  const [vista, setVista] = useState('primaria');
  const [abierto, setAbierto] = useState(false);
  const { canchas, dias } = useReservas();

  const pixels = useMemo(() => {
    return Array.from({ length: TOTAL_PIXELS }, (_, i) => {
      let bg = '#161616';
      if (i % 9 === 0) bg = '#f6a94b';
      else if (i % 6 === 0) bg = 'rgba(246, 169, 75, 0.45)';
      else if (i % 4 === 0) bg = '#252525';
      else if (i % 2 === 0) bg = '#1e1e1e';
      return { id: i, bg };
    });
  }, []);

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

  const triggerSwap = useCallback((destino, tipo) => {
    const cells = pixelGridRef.current?.children;
    if (!cells || cells.length === 0) {
      setVista(destino);
      return;
    }

    if (transitionRef.current) {
      transitionRef.current.kill();
    }

    const tl = gsap.timeline();
    transitionRef.current = tl;

    tl.fromTo(
      cells,
      {
        scale: 0,
        opacity: 0,
        rotation: () => gsap.utils.random(-60, 60),
      },
      {
        scale: 1.05,
        opacity: 1,
        rotation: 0,
        duration: 0.22,
        stagger: {
          amount: 0.2,
          from: tipo === 'leave' ? 'edges' : 'random',
          grid: [GRID_ROWS, GRID_COLS],
        },
        ease: 'power2.out',
      }
    )
      .call(() => {
        setVista(destino);
      })
      .to(cells, {
        scale: 0,
        opacity: 0,
        rotation: () => gsap.utils.random(-80, 80),
        duration: 0.26,
        stagger: {
          amount: 0.22,
          from: tipo === 'leave' ? 'center' : 'random',
          grid: [GRID_ROWS, GRID_COLS],
        },
        ease: 'power3.inOut',
      });
  }, []);

  const handleMouseEnter = () => {
    triggerSwap('secundaria', 'enter');
  };

  const handleMouseLeave = () => {
    triggerSwap('primaria', 'leave');
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top 80%',
        onEnter: () => {
          const cells = pixelGridRef.current?.children;
          if (cells && cells.length > 0) {
            gsap.fromTo(
              cells,
              {
                scale: 1,
                opacity: 1,
                rotation: 0,
              },
              {
                scale: 0,
                opacity: 0,
                rotation: () => gsap.utils.random(-70, 70),
                duration: 0.45,
                stagger: {
                  amount: 0.35,
                  from: 'random',
                  grid: [GRID_ROWS, GRID_COLS],
                },
                ease: 'power3.inOut',
              }
            );
          }
        },
      });

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
            ease: 'back.out(2)',
            onComplete: () => {
              statElements.forEach((el) => gsap.set(el, { clearProps: 'transform' }));
            },
          }
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="reservas-placeholder"
      className="evento-cta"
      ref={rootRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="evento-cta__mosaico"
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
            className="evento-cta__pixel"
            style={{ backgroundColor: p.bg }}
          />
        ))}
      </div>

      <div className="evento-cta__pantalla">
        <div className="evento-cta__contenido">
          <div className="grid-x grid-padding-x align-center">
            <div className="cell small-12 medium-10 large-8 evento-cta__texto">
              {vista === 'primaria' ? (
                <>
                  <div className="evento-cta__texto-bloque">
                    <p className="evento-cta__eyebrow">Eventos y torneos</p>
                    <h2 className="evento-cta__titulo">
                      ¿Organizas un torneo o un cumpleaños?
                    </h2>
                    <p className="evento-cta__bajada">
                      Reserva varias canchas y una franja completa para tu evento,
                      en un solo paso.
                    </p>
                  </div>

                  <ul
                    className="evento-cta__stats"
                    ref={statsRef}
                    aria-label="Datos del servicio de eventos"
                  >
                    {statsPrimarios.map(({ icono: Icono, texto }) => (
                      <li
                        className="evento-cta__stat evento-cta__stat--primaria"
                        key={texto}
                      >
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
                  <p className="evento-cta__hint">
                    Pasa el cursor sobre la sección para explorar beneficios
                  </p>
                </>
              ) : (
                <>
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
                      <li
                        className="evento-cta__stat evento-cta__stat--secundaria"
                        key={texto}
                      >
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
                  <p className="evento-cta__hint">Aleja el cursor para volver</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventoModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </section>
  );
}

export default EventoCTA;
