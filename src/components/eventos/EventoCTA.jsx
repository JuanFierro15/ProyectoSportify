import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReservas } from '../../context/ReservasContext';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { DEPORTES, deportePorSlug } from '../../data/deportes';
import { canchasDelDeporte, imagenGrandeCancha } from '../../lib/canchas';
import { esClicNormal, rutaReserva } from '../../lib/rutas';
import negocio from '../../data/negocio.json';
import AccordionGallery from '../reactbits/AccordionGallery';
import './EventoCTA.css';

gsap.registerPlugin(ScrollTrigger);

// Tipos de evento: textos en src/data/negocio.json, compartidos con el chatbot.
const TIPOS_EVENTO = negocio.eventos;

// Diseño en dos columnas: mensaje y cifras reales a la izquierda, y AccordionGallery con un
// tipo de evento por deporte a la derecha. Colores desde deportes.js, cifras desde datos reales,
// animaciones GSAP dentro de gsap.context con ctx.revert y desactivadas si se prefiere movimiento reducido.
function EventoCTA() {
  const { canchas, dias } = useReservas();
  const { abrirVista } = useVistaCanchas();

  const rootRef = useRef(null);
  const textoRef = useRef(null);
  const galeriaRef = useRef(null);

  const items = TIPOS_EVENTO.map((t) => {
    const cancha = canchasDelDeporte(canchas, t.slug)[0];
    const deporte = deportePorSlug(t.slug);
    return {
      label: t.label,
      detalle: t.detalle,
      image: cancha ? imagenGrandeCancha(cancha.imagen) : undefined,
      alt: '',
      acento: deporte ? deporte.colorAcento : undefined,
    };
  });

  const stats = [
    { valor: DEPORTES.length, etiqueta: 'deportes' },
    { valor: canchas.length, etiqueta: 'canchas combinables' },
    { valor: dias.length, etiqueta: 'días de disponibilidad' },
    { texto: '08–21 h', etiqueta: 'horario diario' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const disparoTexto = { trigger: textoRef.current, start: 'top 75%', toggleActions: 'play none none reverse' };

        // 1) Entrada del texto en cascada
        gsap.from('.evento-cta__anim', { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', scrollTrigger: disparoTexto });

        // 2) Conteo de las cifras: el HTML trae el valor final (se ve bien sin
        //    animación); aquí se pone en 0 y se anima hasta data-valor.
        const numeros = gsap.utils.toArray('.evento-cta__stat-numero[data-valor]');
        numeros.forEach((el) => {
          const valor = Number(el.dataset.valor);
          const contador = { v: 0 };
          el.textContent = '0';
          gsap.to(contador, {
            v: valor,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => { el.textContent = String(Math.round(contador.v)); },
            scrollTrigger: { ...disparoTexto },
          });
        });

        // 3) Entrada de la galería: se anima el CONTENEDOR, nunca los paneles
        //    (AccordionGallery anima sus paneles por dentro).
        gsap.from(galeriaRef.current, { x: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: galeriaRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } });

        return () => {
          numeros.forEach((el) => { el.textContent = el.dataset.valor; });
        };
      });
      return () => mm.revert();
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section id="eventos" className="evento-cta" ref={rootRef}>
        <div className="grid-container">
          <div className="grid-x grid-padding-x align-middle evento-cta__grid">
            <div className="cell small-12 large-5 evento-cta__texto" ref={textoRef}>
              <p className="evento-cta__eyebrow evento-cta__anim">Eventos y torneos</p>
              <h2 className="evento-cta__titulo evento-cta__anim">¿Organizas un torneo o un cumpleaños?</h2>
              <p className="evento-cta__bajada evento-cta__anim">Reserva varias canchas y una franja completa para tu evento, en un solo paso.</p>
              <ul className="evento-cta__stats evento-cta__anim" aria-label="El servicio de eventos en cifras">
                {stats.map(({ valor, texto, etiqueta }) => (
                  <li className="evento-cta__stat" key={etiqueta}>
                    {valor !== undefined ? (
                      <span className="evento-cta__stat-numero" data-valor={valor}>
                        {valor}
                      </span>
                    ) : (
                      <span className="evento-cta__stat-numero">{texto}</span>
                    )}
                    <span className="evento-cta__stat-etiqueta">{etiqueta}</span>
                  </li>
                ))}
              </ul>
              <div className="evento-cta__accion evento-cta__anim">
                <a
                  className="button large evento-cta__boton"
                  href={rutaReserva(DEPORTES[0].slug, 'torneo')}
                  onClick={(e) => {
                    if (esClicNormal(e)) {
                      e.preventDefault();
                      abrirVista(DEPORTES[0].slug, { modo: 'torneo' });
                    }
                  }}
                >
                  Reserva un evento
                </a>
              </div>
            </div>
            <div className="cell small-12 large-7">
              <div className="evento-cta__galeria" ref={galeriaRef}>
                <AccordionGallery
                  items={items}
                  ariaLabel="Tipos de evento"
                  defaultIndex={0}
                  trigger="hover"
                  overlayColor="#0d0d0d"
                  radius={18}
                  tilt={6}
                  height={480}
                />
                <p className="evento-cta__hint">Pasa el cursor o toca cada tarjeta para ver qué incluye</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default EventoCTA;
