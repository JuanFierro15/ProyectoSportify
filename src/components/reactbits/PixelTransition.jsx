'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { gsap } from 'gsap';
import './PixelTransition.css';

/*
 * Adiciones manuales sobre el componente descargado del registro de React Bits:
 * - Grilla medida en vez de gridSize x gridSize fijo: el original siempre
 *   genera una malla cuadrada, que en un contenedor rectangular (como esta
 *   sección, mucho más ancha que alta en escritorio y angosta en móvil) da
 *   celdas estiradas en vez de píxeles nítidos. En su lugar se mide el
 *   contenedor con ResizeObserver y se reparte `gridSize` celdas en el lado
 *   corto, derivando cuántas celdas van en el lado largo para que cada celda
 *   salga aproximadamente cuadrada sin importar la proporción real (se
 *   recalcula en cada resize, así que también funciona al rotar o cambiar de
 *   breakpoint).
 * - reducedMotion: con prefers-reduced-motion el cambio es instantáneo, sin
 *   generar ni animar los píxeles, para no cubrir contenido innecesariamente.
 * - active (via ref con toggle/activate/deactivate) + onActiveChange: permiten
 *   que un control externo (botón accesible para táctil/teclado) dispare la
 *   misma transición que el hover, y que el padre refleje el estado actual
 *   (aria-pressed, texto del botón) sin duplicar el motor de animación.
 * - Se quitó el aspectRatio (hack de padding-top) y el click-to-toggle sobre
 *   todo el contenedor: ver PixelTransition.css y el componente que lo usa.
 * - El swap del panel usa visibility (no display) sobre AMBOS paneles, no
 *   solo el activo: con grid-area apilado y contenido de texto (no una
 *   imagen opaca como en el demo original), dejar el panel de abajo con
 *   display:block hacía que su texto se viera transparentado a través del
 *   panel de encima. visibility:hidden lo oculta de verdad sin afectar la
 *   altura del grid (a diferencia de display:none). También se quitó el
 *   pointerEvents:'none' que el original aplicaba al panel activo: con nuestro
 *   secondContent real (que incluye un botón "Reserva un evento"), esa línea
 *   lo habría dejado sin poder hacer click; `inert` en el panel oculto ya
 *   cubre esa necesidad de forma declarativa.
 */
const PixelTransition = forwardRef(function PixelTransition(
  {
    firstContent,
    secondContent,
    gridSize = 7,
    pixelColor = 'currentColor',
    animationStepDuration = 0.3,
    once = false,
    className = '',
    style = {},
    reducedMotion = false,
    onActiveChange,
  },
  ref
) {
  const containerRef = useRef(null);
  const pixelGridRef = useRef(null);
  const defaultRef = useRef(null);
  const activeRef = useRef(null);
  const delayedCallRef = useRef(null);
  const isActiveRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [grilla, setGrilla] = useState({ cols: gridSize, rows: gridSize });

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const proporcion = width / height;
      const siguiente =
        proporcion >= 1
          ? { cols: Math.max(1, Math.round(gridSize * proporcion)), rows: gridSize }
          : { cols: gridSize, rows: Math.max(1, Math.round(gridSize / proporcion)) };
      setGrilla((actual) =>
        actual.cols === siguiente.cols && actual.rows === siguiente.rows ? actual : siguiente
      );
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gridSize]);

  const { cols, rows } = grilla;

  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;

    pixelGridEl.innerHTML = '';

    const anchoCelda = 100 / cols;
    const altoCelda = 100 / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixelated-image-card__pixel');
        pixel.style.backgroundColor = pixelColor;
        pixel.style.width = `${anchoCelda}%`;
        pixel.style.height = `${altoCelda}%`;
        pixel.style.left = `${col * anchoCelda}%`;
        pixel.style.top = `${row * altoCelda}%`;
        pixelGridEl.appendChild(pixel);
      }
    }
  }, [cols, rows, pixelColor]);

  const animatePixels = (activate) => {
    isActiveRef.current = activate;
    setIsActive(activate);
    onActiveChange?.(activate);

    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current;
    const defaultEl = defaultRef.current;
    if (!pixelGridEl || !activeEl || !defaultEl) return;

    const pixels = pixelGridEl.querySelectorAll('.pixelated-image-card__pixel');

    if (reducedMotion) {
      gsap.killTweensOf(pixels);
      if (delayedCallRef.current) {
        delayedCallRef.current.kill();
      }
      gsap.set(pixels, { display: 'none' });
      activeEl.style.visibility = activate ? 'visible' : 'hidden';
      defaultEl.style.visibility = activate ? 'hidden' : 'visible';
      return;
    }

    if (!pixels.length) return;

    gsap.killTweensOf(pixels);
    if (delayedCallRef.current) {
      delayedCallRef.current.kill();
    }

    gsap.set(pixels, { display: 'none' });

    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    gsap.to(pixels, {
      display: 'block',
      duration: 0,
      stagger: {
        each: staggerDuration,
        from: 'random'
      }
    });

    delayedCallRef.current = gsap.delayedCall(animationStepDuration, () => {
      activeEl.style.visibility = activate ? 'visible' : 'hidden';
      defaultEl.style.visibility = activate ? 'hidden' : 'visible';
    });

    gsap.to(pixels, {
      display: 'none',
      duration: 0,
      delay: animationStepDuration,
      stagger: {
        each: staggerDuration,
        from: 'random'
      }
    });
  };

  const handleEnter = () => {
    if (!isActiveRef.current) animatePixels(true);
  };
  const handleLeave = () => {
    if (isActiveRef.current && !once) animatePixels(false);
  };

  useImperativeHandle(ref, () => ({
    toggle: () => animatePixels(!isActiveRef.current),
    activate: () => animatePixels(true),
    deactivate: () => animatePixels(false),
  }));

  return (
    <div
      ref={containerRef}
      className={`pixelated-image-card ${className}`}
      style={style}
      onMouseEnter={!isTouchDevice ? handleEnter : undefined}
      onMouseLeave={!isTouchDevice ? handleLeave : undefined}
    >
      <div
        className="pixelated-image-card__default"
        ref={defaultRef}
        aria-hidden={isActive}
        inert={isActive || undefined}
      >
        {firstContent}
      </div>
      <div
        className="pixelated-image-card__active"
        ref={activeRef}
        aria-hidden={!isActive}
        inert={!isActive || undefined}
      >
        {secondContent}
      </div>
      <div className="pixelated-image-card__pixels" ref={pixelGridRef} aria-hidden="true" />
    </div>
  );
});

export default PixelTransition;
