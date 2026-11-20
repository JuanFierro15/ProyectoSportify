[MODO EJECUTOR]

# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `AGENTS.md` (raíz, versionado): léela
  antes de empezar y respétala. La parte del plan que te toca va copiada en tu
  tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

---

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

La carpeta `src/verificacion/b5/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

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
