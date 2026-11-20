# Criterios de aceptación del bloque b5 (issue #71)

- C1: Con `textoVisibleAlInicio` y `prefers-reduced-motion: no-preference`, en el progreso 0 de la timeline el bloque de texto está visible (`opacity` 1 y `visibility` distinta de `hidden`) con `scale` 1 e `y` 0.
  Cómo comprobarlo: prueba con jsdom que lleve la timeline (o su ScrollTrigger) al progreso 0 y lea los estilos del bloque. No levantes servidores.
- C2: Con `textoVisibleAlInicio`, el tween de salida sigue igual: lleva el bloque a `autoAlpha: 0`, `scale: 1.06` e `y: -14` y empieza en `1 - DURACION_FADE_CONTENIDO`. Al final de la timeline (progreso 1) el bloque está oculto, y al volver al progreso 0 vuelve a estar visible.
- C3: Sin la prop (o con `false`), la timeline es exactamente la de antes: dos tweens sobre el bloque (entrada de `autoAlpha` 0 a 1 y salida), y la prueba existente "anima fade y escala sobre .deporte-hero__bloque" pasa sin cambiar sus aserciones.
- C4: `PaginaInicio.jsx` pasa `textoVisibleAlInicio` en `true` solo al primer hero de `DEPORTES`; el segundo y el último reciben `false` o no la reciben.
  Cómo comprobarlo: prueba o lectura del código; si hay una prueba de `PaginaInicio`, que lo fije.
- C5: Con `prefers-reduced-motion: reduce` no se crean tweens sobre el bloque (como hoy), con y sin la prop.
- C6: Al desmontar, con y sin la prop, no quedan tweens sobre el bloque ni ScrollTriggers (`mm.revert()` sigue en el cleanup).
- C7: No cambiaron `controladorSnapHero.js` ni `modoHero.js`, y las pruebas de `src/components/hero` pasan sin cambiar sus aserciones.
- C8: `docs/agentes/pagina-reserva.md` explica que el primer hero arranca con el texto visible y por qué.
- C9: `npm test -- src/components/hero src/components/layout` y `npm run lint` terminan con código 0 (lint sin avisos).
