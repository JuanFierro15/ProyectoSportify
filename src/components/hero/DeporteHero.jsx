import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { esClicNormal, rutaReserva } from '../../lib/rutas';
import {
  DURACION_FADE_CONTENIDO,
  MEDIA_VIDEO_GRANDE,
} from '../../lib/modoHero';
import { POSICIONES_TEXTO_HERO } from '../../data/deportes';
import {
  heroEstaReproduciendo,
  registrarHeroSnap,
} from './controladorSnapHero';
import './DeporteHero.css';

// Registro idempotente del plugin.
gsap.registerPlugin(ScrollTrigger);

// Cuántos píxeles de scroll equivalen a 1 segundo de video. Sube el número
// para que haya que scrollear más para recorrer el video (más "cine"),
// bájalo para pasarlo más rápido.
const PX_POR_SEGUNDO = 150;

// Suavizado del video: en cada frame el `currentTime` se acerca al objetivo
// esta fracción (0-1). 1 = 1:1 duro con el scroll (más brusco). ~0.2-0.4 =
// interpola y "asienta" en pocos frames al soltar el scroll.
const SUAVIZADO = 0.3;

// Sin margen extra: la primera medición ocurre antes de `loadedmetadata`,
// cuando el pin usa la duración de respaldo (1 s = 150 px), por lo que un
// margen de precarga alcanzaba al hero siguiente y lo descargaba al cargar.
// Así solo se precarga el hero ya visible; el siguiente lo precarga
// `controladorSnapHero.js` al iniciar la reproducción.
const MARGEN_PRECARGA_VISIBLE = '0px';

/**
 * DeporteHero (Bloque 2.5) — sección narrativa por deporte, reutilizable.
 *
 * Props:
 *  - nombre        {string}  nombre del deporte (ej. "Voley Playa")
 *  - slug          {string}  slug del deporte; va en data-sport para que el chat sepa qué deporte se está viendo
 *  - videoSrc      {string}  ruta del video de fondo (720p para móvil y respaldo)
 *  - videoSrcLg    {string}  [opcional] ruta del video en 1080p para pantallas grandes (`MEDIA_VIDEO_GRANDE`, 64em)
 *  - posterSrc     {string}  ruta de la imagen de respaldo (poster) del video
 *  - tituloCTA     {string}  texto del botón
 *  - colorAcento   {string}  color de acento (hex) para el CTA y el "eyebrow"
 *  - posicionTexto {string}  ubicación del bloque de texto desde `large`
 *    ('izquierda' | 'abajo-izquierda' | 'abajo-derecha' | 'arriba-izquierda')
 *  - ultimoDeporte {bool}    true solo en el último hero del listado: agrega
 *    un degradado de salida (transparente -> --eventos-fondo) para que no
 *    quede un corte abrupto contra la sección de eventos que sigue.
 *  - textoVisibleAlInicio {bool} [opcional, false] si es true, el bloque de
 *    texto arranca visible (autoAlpha: 1, scale: 1, y: 0) en el progreso 0
 *    sin tramo de entrada y conserva solo la salida con el scroll. Usado en
 *    el primer hero para que el texto y el CTA se vean al cargar la página.
 *
 * Comportamiento:
 *  - Ocupa 100vh con el video cubriendo la sección (object-fit: cover) + overlay.
 *  - La sección se ancla (`pin: true`) durante un tramo proporcional a la
 *    duración del video (`duración * PX_POR_SEGUNDO`): tras un gesto hacia abajo
 *    el video se reproduce solo mientras el scroll avanza con él, y hacia arriba
 *    el `currentTime` del `<video>` sigue al scroll con scrub; al terminar el
 *    tramo pasa a la siguiente sección.
 *  - Fluidez: el video NO se mueve directamente desde la timeline de GSAP.
 *    El ScrollTrigger sólo guarda el progreso objetivo y un bucle en
 *    `gsap.ticker` acerca `currentTime` a ese objetivo con easing (SUAVIZADO),
 *    saltándose el seek si el video todavía está buscando (`video.seeking`).
 *    Así, en scroll rápido no se encolan decenas de seeks que traban al
 *    decoder.
 *  - El texto/CTA hacen fade + scale (scrubbed) al principio y al final del pin.
 *  - Navegación por secciones (snap): coordinada por un controlador único compartido
 *    (`controladorSnapHero.js`) con estado y listeners globales. Cada hero tiene
 *    dos puntos estables: inicio (reposo 0.15, texto y CTA visibles) y final
 *    (`st.end`, último cuadro). Dentro de la zona de heros intercepta el gesto al
 *    empezar (`wheel`, `touchmove` > 30 px o teclas) para reproducir de inmediato
 *    hacia abajo desde inicio, deslizar al inicio del siguiente (o `#eventos`) desde
 *    final, rebobinar al inicio hacia arriba desde final o deslizar al final del
 *    hero anterior hacia arriba desde inicio; al terminar el video desliza al
 *    inicio del siguiente hero en pausa (o a `#eventos`), y si el scroll se
 *    detiene entre puntos estables acomoda al más cercano.
 *  - Todo dentro de `gsap.matchMedia()` con `mm.revert()` en el cleanup.
 *  - `ScrollTrigger.refresh()` cuando el video reporta su duración, para que el
 *    largo del pin (que depende de esa duración) quede bien medido.
 */
function DeporteHero({
  nombre,
  slug,
  videoSrc,
  videoSrcLg,
  posterSrc,
  tituloCTA,
  colorAcento,
  eyebrow = 'Nuestras canchas',
  descripcion,
  posicionTexto = 'izquierda',
  preload = 'metadata',
  onVerCanchas,
  ultimoDeporte = false,
  textoVisibleAlInicio = false,
}) {
  const rootRef = useRef(null);
  const bloqueRef = useRef(null);
  const videoRef = useRef(null);
  const posicionValida = POSICIONES_TEXTO_HERO.includes(posicionTexto)
    ? posicionTexto
    : 'izquierda';

  useEffect(() => {
    const seccion = rootRef.current;
    const bloque = bloqueRef.current;
    const video = videoRef.current;

    const mm = gsap.matchMedia(rootRef);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Progreso objetivo del scroll (0..1) que persigue el bucle del ticker.
      let progresoObjetivo = 0;

      // Timeline del PIN + CONTENIDO (el video NO va aquí).
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: seccion,
          start: 'top top',
          // El pin dura lo que dure el video (en px de scroll).
          end: () => {
            const dur =
              video && Number.isFinite(video.duration) && video.duration > 0
                ? video.duration
                : 1;
            return '+=' + Math.max(1, Math.round(dur * PX_POR_SEGUNDO));
          },
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progresoObjetivo = self.progress;
          },
          onRefresh: (self) => {
            progresoObjetivo = self.progress;
          },
        },
      });
      const st = tl.scrollTrigger;

      // Bloque de texto: si arranca visible (primer hero), omite la entrada y
      // solo hace la salida en el último tramo; en los siguientes entra al
      // inicio del pin y se va al final.
      if (textoVisibleAlInicio) {
        gsap.set(bloque, { autoAlpha: 1, scale: 1, y: 0 });
      } else {
        tl.fromTo(
          bloque,
          { autoAlpha: 0, scale: 0.92, y: 20 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            ease: 'power2.out',
            duration: DURACION_FADE_CONTENIDO,
          },
          0
        );
      }

      tl.to(
        bloque,
        {
          autoAlpha: 0,
          scale: 1.06,
          y: -14,
          ease: 'power2.in',
          duration: DURACION_FADE_CONTENIDO,
        },
        1 - DURACION_FADE_CONTENIDO
      );

      // Bucle que acerca el frame del video al objetivo sin encolar seeks.
      // Mientras reproduce de forma nativa, el controlador mueve el scroll.
      const seguirVideo = () => {
        if (heroEstaReproduciendo(seccion)) return;
        const dur = video?.duration;
        if (!dur || video?.seeking) return; // aún buscando -> no pedir otro seek
        const objetivo = progresoObjetivo * dur;
        const delta = objetivo - video.currentTime;
        if (Math.abs(delta) < 0.033) return; // ~1 frame: nada que hacer
        video.currentTime += delta * SUAVIZADO;
      };

      gsap.ticker.add(seguirVideo);

      // La duración del video llega de forma asíncrona y de ella depende el largo
      // del pin -> re-medir cuando esté disponible.
      const onLoadedMetadata = () => ScrollTrigger.refresh();
      video?.addEventListener('loadedmetadata', onLoadedMetadata);

      const desregistrarSnap = registrarHeroSnap({
        seccion,
        video,
        st,
        progresoObjetivo: () => progresoObjetivo,
      });

      let observer = null;
      if (typeof IntersectionObserver !== 'undefined' && seccion && video) {
        observer = new IntersectionObserver(
          (entradas) => {
            if (entradas.some((e) => e.isIntersecting)) {
              video.preload = 'auto';
              observer.disconnect();
            }
          },
          { rootMargin: MARGEN_PRECARGA_VISIBLE }
        );
        observer.observe(seccion);
      }

      return () => {
        desregistrarSnap();
        observer?.disconnect();
        gsap.ticker.remove(seguirVideo);
        video?.removeEventListener('loadedmetadata', onLoadedMetadata);
        video?.pause();
      };
    });

    return () => {
      mm.revert();
      video?.pause();
    };
  }, [textoVisibleAlInicio]);

  return (
    <section
      className={`deporte-hero deporte-hero--texto-${posicionValida}${ultimoDeporte ? ' deporte-hero--ultimo' : ''}`}
      ref={rootRef}
      data-sport={slug}
      style={{ '--acento': colorAcento }}
    >
      <div className="deporte-hero__bg" aria-hidden="true">
        <video
          ref={videoRef}
          className="deporte-hero__video"
          src={videoSrcLg ? undefined : videoSrc}
          poster={posterSrc}
          muted
          playsInline
          preload={preload}
          tabIndex="-1"
          aria-hidden="true"
        >
          {videoSrcLg ? (
            <>
              <source
                src={videoSrcLg}
                media={MEDIA_VIDEO_GRANDE}
                type="video/mp4"
              />
              <source src={videoSrc} type="video/mp4" />
            </>
          ) : null}
        </video>
      </div>

      <div className="deporte-hero__overlay" aria-hidden="true" />

      <div className="grid-container deporte-hero__contenido">
        <div className="deporte-hero__bloque" ref={bloqueRef}>
          <p className="deporte-hero__eyebrow">{eyebrow}</p>
          <h2 className="deporte-hero__titulo">{nombre}</h2>
          {/* En móvil (menos de 640px) solo título y botón: show-for-medium
              de Foundation oculta la descripción por debajo de `medium`. */}
          <p className="deporte-hero__texto show-for-medium">
            {descripcion ||
              `Vive la experiencia del ${nombre.toLowerCase()} en un espacio pensado para disfrutar al máximo cada partido.`}
          </p>
          {/* En móvil el texto se acorta a "Ver canchas" (el deporte ya está
              en el título); el aria-label conserva el texto completo para
              lectores de pantalla en cualquier tamaño. */}
          <a
            className="button large deporte-hero__cta"
            href={rutaReserva(slug)}
            aria-label={tituloCTA}
            onClick={(e) => {
              if (onVerCanchas && esClicNormal(e)) {
                e.preventDefault();
                onVerCanchas();
              }
            }}
          >
            <span className="show-for-medium">{tituloCTA}</span>
            <span className="hide-for-medium">Ver canchas</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default DeporteHero;
