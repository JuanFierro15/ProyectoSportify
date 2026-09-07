import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import CanchaCard from './CanchaCard';
import './Catalogo.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

/**
 * Catalogo — catálogo de canchas.
 *
 * Toma la lista de canchas del ReservasContext y las agrupa por deporte en
 * tres secciones (mismo orden y nombres que los DeporteHero, vía data/deportes).
 * Maquetación con el grid de Foundation: 1 columna en móvil, 2 en tablet, 3 en
 * desktop, con `align-center` para centrar las filas incompletas.
 *
 * Cada card entra con un scroll reveal (fade + slide desde abajo) usando GSAP
 * ScrollTrigger con `toggleActions: 'play none none reverse'`, dentro de
 * `gsap.context()` con `ctx.revert()` en el cleanup.
 */
function Catalogo() {
  const rootRef = useRef(null);
  const { canchas } = useReservas();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.catalogo__card').forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="canchas-placeholder" className="catalogo" ref={rootRef}>
      <p className="catalogo__bajada">
        Elegí día y horario. La disponibilidad cubre los próximos 7 días.
      </p>

      {DEPORTES.map(({ slug, nombre }) => {
        const delDeporte = canchas.filter((c) => c.deporte === slug);
        if (delDeporte.length === 0) return null;

        return (
          <div className="catalogo__seccion" key={slug}>
            <h3 className="catalogo__titulo">{nombre}</h3>
            <div className="grid-x grid-padding-x align-center">
              {delDeporte.map((cancha) => (
                <div
                  className="cell small-12 medium-6 large-4 catalogo__card"
                  key={cancha.id}
                >
                  <CanchaCard cancha={cancha} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default Catalogo;
