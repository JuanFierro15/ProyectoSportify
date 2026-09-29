import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarDays, Clock, LayoutGrid, Sparkles, Trophy, Users } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import PixelTransition from '../reactbits/PixelTransition';
import EventoModal from './EventoModal';
import './EventoCTA.css';

gsap.registerPlugin(ScrollTrigger);

// Referencia de celdas en el lado corto del contenedor; PixelTransition mide
// el lado largo y calcula cuántas celdas le corresponden para que salgan
// aproximadamente cuadradas (ver comentario en PixelTransition.jsx).
const GRID_SIZE = 8;

function PanelEvento({ eyebrow, eyebrowClase, titulo, bajada, stats, statClase, statsRef, ariaLabelStats, onReservar }) {
  return (
    <div className="evento-cta__panel">
      <div className="evento-cta__texto-bloque">
        <p className={`evento-cta__eyebrow ${eyebrowClase || ''}`.trim()}>{eyebrow}</p>
        <h2 className="evento-cta__titulo">{titulo}</h2>
        <p className="evento-cta__bajada">{bajada}</p>
      </div>

      <ul className="evento-cta__stats" ref={statsRef} aria-label={ariaLabelStats}>
        {stats.map(({ icono: Icono, texto }) => (
          <li className={`evento-cta__stat ${statClase}`} key={texto}>
            <Icono size={16} aria-hidden="true" />
            <span>{texto}</span>
          </li>
        ))}
      </ul>

      <div className="evento-cta__accion">
        <button type="button" className="button large evento-cta__boton" onClick={onReservar}>
          Reserva un evento
        </button>
      </div>
    </div>
  );
}

function EventoCTA() {
  const rootRef = useRef(null);
  const statsRef = useRef(null);
  const transicionRef = useRef(null);
  const [activo, setActivo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [reducirMovimiento, setReducirMovimiento] = useState(false);
  const { canchas, dias } = useReservas();

  const statsPrimarios = [
    { icono: Trophy, texto: `${DEPORTES.length} deportes` },
    { icono: LayoutGrid, texto: `Combina hasta ${canchas.length} canchas` },
    { icono: CalendarDays, texto: `${dias.length} días de disponibilidad` },
    { icono: Clock, texto: '08:00 a 21:00' },
  ];

  const statsSecundarios = [
    { icono: Trophy, texto: 'Trofeos y premiación' },
    { icono: Users, texto: 'Zonas sociales y vestuarios' },
    { icono: CalendarDays, texto: 'Fechas reservadas en exclusiva' },
    { icono: Sparkles, texto: 'Arbitraje y sonido a medida' },
  ];

  const abrirModal = () => setAbierto(true);

  const alternarPaneles = () => {
    transicionRef.current?.toggle();
  };

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        normal: '(prefers-reduced-motion: no-preference)',
        reducida: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { reducida } = context.conditions;
        setReducirMovimiento(reducida);

        if (reducida) return undefined;

        const ctx = gsap.context(() => {
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
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <>
      <section id="eventos" className="evento-cta" ref={rootRef}>
        <div className="evento-cta__pantalla">
          <div className="evento-cta__contenido">
            <div className="grid-x grid-padding-x align-center">
              <div className="cell small-12 medium-10 large-8 evento-cta__texto">
                <PixelTransition
                  ref={transicionRef}
                  className="evento-cta__transicion"
                  gridSize={GRID_SIZE}
                  pixelColor="var(--evento-acento)"
                  animationStepDuration={0.32}
                  reducedMotion={reducirMovimiento}
                  onActiveChange={setActivo}
                  firstContent={
                    <PanelEvento
                      eyebrow="Eventos y torneos"
                      titulo="¿Organizas un torneo o un cumpleaños?"
                      bajada="Reserva varias canchas y una franja completa para tu evento, en un solo paso."
                      stats={statsPrimarios}
                      statClase="evento-cta__stat--primaria"
                      statsRef={statsRef}
                      ariaLabelStats="Datos del servicio de eventos"
                      onReservar={abrirModal}
                    />
                  }
                  secondContent={
                    <PanelEvento
                      eyebrow="Experiencia deportiva completa"
                      eyebrowClase="evento-cta__eyebrow--dorado"
                      titulo="Torneos exclusivos y celebraciones a medida"
                      bajada="Franjas horarias personalizadas, vestuarios exclusivos, premiación y soporte logístico para todos tus invitados."
                      stats={statsSecundarios}
                      statClase="evento-cta__stat--secundaria"
                      ariaLabelStats="Beneficios exclusivos de eventos"
                      onReservar={abrirModal}
                    />
                  }
                />

                <div className="evento-cta__controles">
                  <button
                    type="button"
                    className="evento-cta__alternar"
                    aria-pressed={activo}
                    onClick={alternarPaneles}
                  >
                    {activo ? 'Volver' : 'Ver beneficios'}
                  </button>
                  <p className="evento-cta__hint">
                    {activo ? 'Aleja el cursor para volver' : 'Pasa el cursor sobre la sección para explorar beneficios'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EventoModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}

export default EventoCTA;
