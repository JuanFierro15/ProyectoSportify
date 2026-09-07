import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DEPORTES } from '../../data/deportes';
import './TransicionCatalogo.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

// Color de acento del último deporte de los heros (fútbol): el gradiente va de
// este color al fondo neutro del catálogo, para dar continuidad visual.
const ACENTO_FINAL = DEPORTES[DEPORTES.length - 1].colorAcento;

/**
 * TransicionCatalogo — sección corta entre el último DeporteHero y el catálogo.
 *
 * Título "Elegí tu cancha" sobre un gradiente que baja del color de acento del
 * último deporte al blanco del catálogo. El texto entra con fade al aparecer en
 * viewport (mismo patrón gsap.context() + ScrollTrigger del resto de la app).
 */
function TransicionCatalogo() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.transicion-catalogo__contenido', {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="transicion-catalogo"
      ref={rootRef}
      style={{
        background: `linear-gradient(180deg, ${ACENTO_FINAL}59 0%, #ffffff 100%)`,
      }}
    >
      <div className="grid-container transicion-catalogo__contenido">
        <h2 className="transicion-catalogo__titulo">Elegí tu cancha</h2>
        <p className="transicion-catalogo__bajada">
          Voley playa, pádel y fútbol. Mirá los horarios libres y reservá en
          segundos.
        </p>
      </div>
    </section>
  );
}

export default TransicionCatalogo;
