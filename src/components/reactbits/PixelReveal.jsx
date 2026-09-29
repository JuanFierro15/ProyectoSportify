import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './PixelReveal.css';

/*
 * PixelReveal — basado en PixelSwap de React Bits (reactbits.dev), MIT +
 * Commons Clause. Reutiliza su idea central (grilla con patrón/ruido/easing
 * por celda, vía Web Animations API) pero NO clona contenido.
 *
 * Por qué: PixelSwap clona el panel entrante COMPLETO dentro de cada
 * píxel (hasta ~220 veces), y cada clon mide el contenedor entero, no la
 * celda. Medido en esta sección a 1920x1080 con el build de producción:
 * 240 clones de 1920x1080 = ~1.9 GB de textura, picos de >1400 capas
 * compuestas y ~27 FPS reales (peor con CPU throttling 4x, con frames de
 * hasta 1.3s). Aquí cada celda es un div del tamaño real de su píxel
 * (~72px) con la MISMA imagen como background-image: una sola
 * decodificación compartida, y cada celda solo necesita rasterizar su
 * propio recorte pequeño, no el contenedor completo. El `background-size`
 * (grande, el del recorte "cover") es idéntico en todas las celdas; solo
 * cambia `background-position`, calculado para que el mosaico arme
 * exactamente el mismo recorte que queda como fondo final de una pieza.
 *
 * Otras diferencias respecto al original:
 * - Sin clonado de DOM, por lo anterior.
 * - Sin pixelRadius/pixelSpin (no se piden acá): solo opacity + scale.
 * - Interrupciones (alternar rápido) invierten las animaciones ya en
 *   vuelo con Animation.reverse() en vez de encolar una transición nueva:
 *   siguen desde el progreso actual, sin saltos ni reiniciar desde cero.
 * - La imagen se pre-decodifica al montar (`Image().decode()`), y la
 *   grilla se recalcula solo cuando cambia el tamaño del contenedor
 *   (ResizeObserver), no en cada transición.
 * - Al asentarse completamente revelado, las celdas se desmontan del DOM
 *   y el fondo queda como un único div con el mismo recorte "cover"
 *   calculado a mano (mismos números que usó el mosaico, sin margen para
 *   que haya un salto visual).
 */

const MAX_PIXELS = 220;
const KEYFRAME_STEPS = 14;

const PATTERNS = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  'left-to-right': (x) => x,
  'right-to-left': (x) => 1 - x,
  'top-to-bottom': (_x, y) => y,
  'bottom-to-top': (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  },
};

const EASINGS = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const noise = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const makeEasing = (value) => {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const points = match ? match[1].split(',').map(Number) : EASINGS[value];
  if (!points || points.length !== 4 || points.some(Number.isNaN)) return makeEasing('ease');

  const [x1, y1, x2, y2] = points;
  if (x1 === y1 && x2 === y2) return (progress) => progress;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return (progress) => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
};

function construirGrilla({ width, height, pixelSize, gap, pattern, randomness }) {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }

  const stride = size + gap;
  const originX = (width - (columns * stride - gap)) / 2;
  const originY = (height - (rows * stride - gap)) / 2;
  const order = PATTERNS[pattern] ?? PATTERNS.random;
  const mix = clamp(randomness, 0, 1);
  const pixels = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);

      pixels.push({
        id: index,
        left: originX + column * stride,
        top: originY + row * stride,
        offset: base === null ? random : base * (1 - mix) + random * mix,
      });
    }
  }

  return { pixels, size, gap, width, height };
}

function construirKeyframes({ ease, startScale }) {
  const frames = [];
  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = ease(progress);
    const scale = startScale + (1 - startScale) * eased;
    frames.push({ offset: progress, opacity: eased, transform: `scale(${scale})` });
  }
  return frames;
}

// Mismo cálculo que hace `background-size: cover; background-position: center`,
// pero explícito en px para que el mosaico (celda por celda) y la capa final
// (una sola pieza) usen exactamente los mismos números.
function calcularCover(contW, contH, imgW, imgH) {
  if (!contW || !contH || !imgW || !imgH) return null;
  const escala = Math.max(contW / imgW, contH / imgH);
  const anchoBg = imgW * escala;
  const altoBg = imgH * escala;
  return {
    backgroundSize: `${anchoBg}px ${altoBg}px`,
    offsetX: (contW - anchoBg) / 2,
    offsetY: (contH - altoBg) / 2,
  };
}

function PixelReveal({
  imageUrl,
  active,
  reducedMotion = false,
  pixelSize = 72,
  gap = 0,
  pixelScale = 0.35,
  duration = 1200,
  pixelDuration = 450,
  pattern = 'center',
  randomness = 0.3,
  easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
  className = '',
  style,
}) {
  const containerRef = useRef(null);
  const cuadrosRef = useRef([]);
  const animsRef = useRef([]);
  const generacionRef = useRef(0);
  const estadoActualRef = useRef(false);

  const [box, setBox] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState(null);
  const [mostrarMosaico, setMostrarMosaico] = useState(false);
  const [revelado, setRevelado] = useState(!!active);
  const [peticion, setPeticion] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setBox((actual) =>
        actual.width === r.width && actual.height === r.height ? actual : { width: r.width, height: r.height }
      );
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-decodificar la imagen al montar, para que el primer frame de la
  // animación no pague el costo de decodificarla.
  useEffect(() => {
    let cancelado = false;
    const img = new Image();
    const marcarLista = () => {
      if (!cancelado) setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
    if (img.decode) {
      img.decode().then(marcarLista).catch(() => {
        img.onload = marcarLista;
      });
    } else {
      img.onload = marcarLista;
    }
    return () => {
      cancelado = true;
    };
  }, [imageUrl]);

  const grilla = useMemo(() => {
    if (!box.width || !box.height) return null;
    return construirGrilla({
      width: box.width,
      height: box.height,
      pixelSize: Math.max(8, Math.round(pixelSize)),
      gap: Math.max(0, Math.round(gap)),
      pattern,
      randomness,
    });
  }, [box.width, box.height, pixelSize, gap, pattern, randomness]);

  const cover = useMemo(() => {
    if (!natural) return null;
    return calcularCover(box.width, box.height, natural.width, natural.height);
  }, [box.width, box.height, natural]);

  const listo = !!(grilla && cover);

  useEffect(() => {
    if (!listo) return;
    if (estadoActualRef.current === active) return;

    generacionRef.current += 1;
    const miGeneracion = generacionRef.current;

    if (reducedMotion) {
      estadoActualRef.current = active;
      setMostrarMosaico(false);
      setRevelado(active);
      return;
    }

    setMostrarMosaico(true);
    setPeticion({ activar: active, generacion: miGeneracion });
  }, [active, listo, reducedMotion]);

  // useLayoutEffect: corre sincrónicamente después de que React monte las
  // celdas (si hacía falta), así cuadrosRef ya está poblado y no hay que
  // adivinar con un requestAnimationFrame.
  useLayoutEffect(() => {
    if (!peticion || !grilla) return;
    const { activar, generacion } = peticion;
    setPeticion(null);

    const total = Math.max(200, duration);
    const pixelMs = clamp(pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    const keyframes = construirKeyframes({ ease: makeEasing(easing), startScale: clamp(pixelScale, 0.05, 1) });

    const anims = grilla.pixels.map((pixel, i) => {
      const cuadro = cuadrosRef.current[i];
      if (!cuadro) return null;

      const existente = animsRef.current[i];
      if (existente && (existente.playState === 'running' || existente.playState === 'paused')) {
        existente.reverse();
        return existente;
      }

      const timing = { duration: pixelMs, delay: pixel.offset * spread, easing: 'linear', fill: 'both' };
      const anim = cuadro.animate(keyframes, timing);
      if (!activar) {
        anim.pause();
        anim.currentTime = timing.delay + timing.duration;
        anim.playbackRate = -1;
        anim.play();
      }
      return anim;
    });
    animsRef.current = anims;

    Promise.all(anims.map((a) => (a ? a.finished.catch(() => {}) : Promise.resolve()))).then(() => {
      if (generacion !== generacionRef.current) return; // una petición más nueva ya tomó el control
      estadoActualRef.current = activar;
      setMostrarMosaico(false);
      setRevelado(activar);
      animsRef.current = [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peticion, grilla]);

  return (
    <div ref={containerRef} className={`pixel-reveal ${className}`.trim()} style={style} aria-hidden="true">
      {revelado && !mostrarMosaico && cover && (
        <div
          className="pixel-reveal__capa-final"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: cover.backgroundSize,
            backgroundPosition: `${cover.offsetX}px ${cover.offsetY}px`,
          }}
        />
      )}
      {mostrarMosaico && grilla && cover && (
        <div className="pixel-reveal__mosaico">
          {grilla.pixels.map((pixel, i) => (
            <div
              key={pixel.id}
              ref={(el) => {
                cuadrosRef.current[i] = el;
              }}
              className="pixel-reveal__cuadro"
              style={{
                left: pixel.left,
                top: pixel.top,
                width: grilla.size,
                height: grilla.size,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: cover.backgroundSize,
                backgroundPosition: `${cover.offsetX - pixel.left}px ${cover.offsetY - pixel.top}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PixelReveal;
