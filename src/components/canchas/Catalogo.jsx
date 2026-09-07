import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReservas } from '../../context/ReservasContext';
import CanchaCard from './CanchaCard';
import './Catalogo.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

// Orden y títulos de las secciones por deporte.
const DEPORTES = [
  { slug: 'voley-playa', titulo: 'Voley Playa' },
  { slug: 'padel', titulo: 'Pádel' },
  { slug: 'futbol', titulo: 'Fútbol' },
];

/**
 * Catalogo (Bloque 3) — catálogo de canchas.
 *
 * La lista de canchas y su disponibilidad se leen del ReservasContext
 * (Bloque 4); `canchas.json` es solo la semilla. Agrupa por deporte en tres
 * secciones (Voley Playa / Pádel / Fútbol) y maqueta con el grid de Foundation
 * (1 col en móvil, 2 en tablet, 3 en desktop).
 *
 * Cada card entra con un scroll reveal (fade + slide desde abajo) usando
 * GSAP ScrollTrigger con `toggleActions: 'play none none reverse'`. Es un
 * reveal normal, sin pin. Toda la animación vive dentro de `gsap.context()`
 * con `ctx.revert()` en el cleanup, igual que en el resto de componentes.
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
      <header className="catalogo__intro">
        <h2 className="catalogo__h2">Nuestras canchas</h2>
        <p className="catalogo__bajada">
          Disponibilidad de hoy. Elegí una cancha para reservar.
        </p>
      </header>

      {DEPORTES.map(({ slug, titulo }) => {
        const delDeporte = canchas.filter((c) => c.deporte === slug);
        if (delDeporte.length === 0) return null;

        return (
          <div className="catalogo__seccion" key={slug}>
            <h3 className="catalogo__titulo">{titulo}</h3>
            <div className="grid-x grid-padding-x">
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
