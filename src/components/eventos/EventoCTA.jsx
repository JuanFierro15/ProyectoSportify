import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarDays, Clock, LayoutGrid, Sparkles, Trophy, Users } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import PixelReveal from '../reactbits/PixelReveal';
import EventoModal from './EventoModal';
import './EventoCTA.css';

gsap.registerPlugin(ScrollTrigger);

const IMAGEN_SECUNDARIA = `${process.env.PUBLIC_URL}/img/canchas/futbol-2-lg.webp`;

function PanelEvento({ eyebrow, eyebrowClase, titulo, bajada, stats, statClase, statsRef, ariaLabelStats, onReservar }) {
  return (
    <>
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
    </>
  );
}

function EventoCTA() {
  const rootRef = useRef(null);
  const statsRef = useRef(null);
  const [activo, setActivo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [hoverDisponible, setHoverDisponible] = useState(false);
  const [reducirMovimiento, setReducirMovimiento] = useState(false);
  const { canchas, dias } = useReservas();

  // Un solo estado (`activo`) maneja tanto el hover de escritorio como el
  // botón: así el texto del botón nunca puede desincronizarse del fondo
  // que PixelReveal tiene como objetivo, sea cual sea el disparador.
  useEffect(() => {
    const mqHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const actualizarHover = () => setHoverDisponible(mqHover.matches);
    actualizarHover();
    mqHover.addEventListener('change', actualizarHover);

    const mqMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    const actualizarMovimiento = () => setReducirMovimiento(mqMovimiento.matches);
    actualizarMovimiento();
    mqMovimiento.addEventListener('change', actualizarMovimiento);

    return () => {
      mqHover.removeEventListener('change', actualizarHover);
      mqMovimiento.removeEventListener('change', actualizarMovimiento);
    };
  }, []);

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
  const alternarPaneles = () => setActivo((v) => !v);

  const hoverProps = hoverDisponible
    ? {
        onMouseEnter: () => setActivo(true),
        onMouseLeave: () => setActivo(false),
      }
    : {};

  useEffect(() => {
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
  }, []);

  return (
    <>
      <section id="eventos" className="evento-cta" ref={rootRef} {...hoverProps}>
        <div className="evento-cta__panel">
          <PixelReveal
            className="evento-cta__mosaico-fondo"
            imageUrl={IMAGEN_SECUNDARIA}
            active={activo}
            reducedMotion={reducirMovimiento}
            pixelSize={80}
            gap={0}
            pixelScale={0.35}
            duration={1200}
            pixelDuration={450}
            pattern="center"
            randomness={0.3}
          />
          <div className="evento-cta__overlay-oscuro" style={{ opacity: activo ? 1 : 0 }} aria-hidden="true" />

          <div className="grid-x grid-padding-x align-center evento-cta__grid-texto">
            <div className="cell small-12 medium-10 large-8 evento-cta__texto">
              <div className="evento-cta__texto-stack">
                <div className="evento-cta__texto-capa" data-visible={!activo}>
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
                </div>
                <div className="evento-cta__texto-capa" data-visible={activo}>
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
                </div>
              </div>
            </div>
          </div>
        </div>

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
      </section>

      <EventoModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}

export default EventoCTA;
