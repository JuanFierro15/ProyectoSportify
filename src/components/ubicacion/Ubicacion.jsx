import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import local from '../../data/local.json';
import canchasData from '../../data/canchas.json';
import { enlaceTelefono, formatoTelefono, textoHorario } from '../../lib/local';
import './Ubicacion.css';

gsap.registerPlugin(ScrollTrigger);

// Sección de ubicación y datos de contacto del local; datos cargados desde local.json y canchas.json.
function Ubicacion() {
  const rootRef = useRef(null);
  const mapaRef = useRef(null);
  const { direccion, zona, ciudad, telefono, dias, mapaEmbed, mapaEnlace } = local;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.ubicacion__anim', {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });
        gsap.from(mapaRef.current, {
          x: 40,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: mapaRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      });
      return () => mm.revert();
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="ubicacion" className="ubicacion" aria-labelledby="ubicacion-titulo" ref={rootRef}>
      <div className="grid-container">
        <div className="grid-x grid-padding-x align-middle">
          <div className="cell small-12 large-5 ubicacion__texto">
            <p className="ubicacion__eyebrow ubicacion__anim">Ubicación</p>
            <h2 id="ubicacion-titulo" className="ubicacion__titulo ubicacion__anim">Visítanos</h2>
            <p className="ubicacion__bajada ubicacion__anim">
              Ven a jugar con nosotros. Aquí te contamos cómo llegar y cómo contactarnos.
            </p>
            <ul className="ubicacion__datos ubicacion__anim">
              <li className="ubicacion__dato">
                <span className="ubicacion__icono">
                  <MapPin size={20} aria-hidden="true" />
                </span>
                <div>
                  <span className="ubicacion__dato-etiqueta">Dirección</span>
                  <span className="ubicacion__dato-principal">{direccion}</span>
                  <span className="ubicacion__dato-secundario">{zona}, {ciudad}</span>
                </div>
              </li>
              <li className="ubicacion__dato">
                <span className="ubicacion__icono">
                  <Phone size={20} aria-hidden="true" />
                </span>
                <div>
                  <span className="ubicacion__dato-etiqueta">Teléfono</span>
                  <a href={enlaceTelefono(telefono)}>{formatoTelefono(telefono)}</a>
                </div>
              </li>
              <li className="ubicacion__dato">
                <span className="ubicacion__icono">
                  <Clock size={20} aria-hidden="true" />
                </span>
                <div>
                  <span className="ubicacion__dato-etiqueta">Horario</span>
                  <span className="ubicacion__dato-principal">{dias}</span>
                  <span className="ubicacion__dato-secundario">{textoHorario(canchasData.horas)}</span>
                </div>
              </li>
            </ul>
            <div className="ubicacion__accion ubicacion__anim">
              <a
                className="button ubicacion__boton"
                href={mapaEnlace}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={18} aria-hidden="true" />
                Cómo llegar
                <span className="show-for-sr"> (se abre en una pestaña nueva)</span>
              </a>
            </div>
          </div>
          <div className="cell small-12 large-7">
            <div className="ubicacion__mapa" ref={mapaRef}>
              <iframe
                src={mapaEmbed}
                title="Mapa con la ubicación del local"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Ubicacion;
