# Tarea del bloque b5: el primer hero arranca con el texto visible (issue #71)

## Objetivo

Al cargar la página de inicio (`scrollY = 0`), el primer hero (Vóley playa) se
ve sin título, descripción ni botón: el texto entra con el scroll. Juan decidió
(20-11-2026) que **no es intencional**: el primer hero debe arrancar con el
texto visible y conservar la salida con el scroll. Los heros siguientes no
cambian. Lee `gh issue view 71` y `docs/agentes/pagina-reserva.md` (parte de
`DeporteHero` y `controladorSnapHero`).

En `src/components/hero/DeporteHero.jsx`, dentro de
`mm.add('(prefers-reduced-motion: no-preference)', ...)`, la timeline con
`scrub` hace `tl.fromTo(bloque, { autoAlpha: 0, scale: 0.92, y: 20 }, { autoAlpha: 1, ... }, 0)`
(entrada) y luego `.to(bloque, { autoAlpha: 0, scale: 1.06, y: -14, ... }, 1 - DURACION_FADE_CONTENIDO)`
(salida). Con `scrollY = 0` el primer hero está en el progreso 0, donde el
texto todavía no entró.

## Archivos

- Puedes editar solo: `src/components/hero/DeporteHero.jsx`,
  `src/components/hero/DeporteHero.test.jsx`,
  `src/components/layout/PaginaInicio.jsx` y `docs/agentes/pagina-reserva.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
  No cambies `controladorSnapHero.js` ni `modoHero.js`.
- No hagas commits, ni push, ni cambies de rama.
- No levantes servidores: la revisión en el navegador (1440 y 390 px) la hace
  el coordinador al final.

## Diseño

1. Prop nueva `textoVisibleAlInicio` (booleano, `false` por defecto) en
   `DeporteHero`, documentada en el comentario de props.
2. Con `textoVisibleAlInicio`, el bloque de texto **no** tiene tramo de
   entrada: arranca visible (`autoAlpha: 1`, `scale: 1`, `y: 0`) en el
   progreso 0. La salida (`.to(...)` en `1 - DURACION_FADE_CONTENIDO`) queda
   igual. Como la timeline va con `scrub`, al volver arriba el texto debe
   quedar visible otra vez. Sin la prop, la timeline queda exactamente como
   hoy.
3. Todo sigue dentro de `gsap.matchMedia(rootRef)` con `mm.revert()` en el
   cleanup. Con `prefers-reduced-motion: reduce` nada cambia.
4. `PaginaInicio.jsx` pasa `textoVisibleAlInicio={i === 0}` solo al primer
   hero.
5. Pruebas en `DeporteHero.test.jsx` (usa el patrón de
   `simularMatchMedia` de la prueba "anima fade y escala sobre
   .deporte-hero__bloque"):
   - con `textoVisibleAlInicio`, el bloque no tiene un tween que lo lleve de
     `autoAlpha: 0` a `1` al inicio; el estado del bloque en el progreso 0 de
     la timeline es visible (`autoAlpha` 1, o `opacity` 1 y `visibility` no
     `hidden`), y el tween de salida a `autoAlpha: 0` y `scale: 1.06` sigue
     existiendo;
   - sin la prop, la prueba existente pasa sin cambios (2 tweens, entrada y
     salida);
   - al desmontar no quedan tweens ni ScrollTriggers.
6. Actualiza en `docs/agentes/pagina-reserva.md` la descripción del texto del
   hero.

## Comandos

- `npm test -- src/components/hero src/components/layout`
- `npm run lint` (0 errores y 0 avisos)
