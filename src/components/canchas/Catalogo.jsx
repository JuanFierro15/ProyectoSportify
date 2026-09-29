import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarX } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import { canchasDelDeporte } from '../../lib/canchas';
import CanchaCard from './CanchaCard';
import './Catalogo.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

/**
 * CanchaCardSkeleton — placeholder con animación de shimmer, del mismo
 * tamaño que una CanchaCard, mientras el catálogo se inicializa.
 */
function CanchaCardSkeleton() {
  return (
    <div className="catalogo-skeleton" aria-hidden="true">
      <div className="catalogo-skeleton__barra" />
      <div className="catalogo-skeleton__linea catalogo-skeleton__linea--ancha" />
      <div className="catalogo-skeleton__linea catalogo-skeleton__linea--media" />
      <div className="catalogo-skeleton__chips">
        {Array.from({ length: 6 }).map((_, i) => (
          <span className="catalogo-skeleton__chip" key={i} />
        ))}
      </div>
      <div className="catalogo-skeleton__boton" />
    </div>
  );
}

/**
 * Catalogo — catálogo de canchas.
 *
 * Toma la lista de canchas del ReservasContext y las agrupa por deporte en
 * tres secciones (mismo orden y nombres que los DeporteHero, vía data/deportes).
 * Maquetación con el grid de Foundation: 1 columna en móvil, 2 en tablet, 3 en
 * desktop, con `align-center` para centrar las filas incompletas.
 *
 * Mientras se resuelve la disponibilidad inicial se muestran skeletons; si
 * un deporte no tiene canchas para mostrar, se ve un estado vacío en vez de
 * simplemente omitir la sección.
 *
 * Cada card entra con un scroll reveal (fade + slide desde abajo) usando GSAP
 * ScrollTrigger con `toggleActions: 'play none none reverse'`, dentro de
 * `gsap.context()` con `ctx.revert()` en el cleanup.
 */
function Catalogo() {
  const rootRef = useRef(null);
  const { canchas } = useReservas();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setCargando(false), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cargando) return undefined;

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
  }, [cargando]);

  return (
    <section id="canchas-placeholder" className="catalogo" ref={rootRef}>
      {cargando ? (
        <div className="grid-x grid-padding-x align-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="cell small-12 medium-6 large-4" key={i}>
              <CanchaCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        DEPORTES.map(({ slug, nombre }) => {
          const delDeporte = canchasDelDeporte(canchas, slug);

          return (
            <div className="catalogo__seccion" key={slug}>
              <h3 className="catalogo__titulo">{nombre}</h3>

              {delDeporte.length === 0 ? (
                <div className="catalogo__vacio">
                  <CalendarX
                    size={32}
                    className="catalogo__vacio-icono"
                    aria-hidden="true"
                  />
                  <p className="catalogo__vacio-texto">
                    Por ahora no hay canchas de {nombre.toLowerCase()} para
                    mostrar.
                  </p>
                  <button
                    type="button"
                    className="button hollow small catalogo__vacio-cta"
                    onClick={() =>
                      document
                        .getElementById('canchas-placeholder')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    Ver otros días o deportes
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

export default Catalogo;
