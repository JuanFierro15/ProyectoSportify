# Etapa 14: pendientes del PR #27

Estado: **Por aprobar** (14-11-2026).
Rama: `fix/pendientes-pr27` (desde `main`, `2cf1cc4`).
Responsable: Juan Fierro.

## Qué se pidió y qué hay hoy

Juan pidió probar la app a 390 px y planear los pendientes que dejó la revisión del
PR #27 (etapa 13). La prueba está en `revision/390/verificacion.md`: no hay
regresiones; salen dos hallazgos de diseño (P1 y P6).

| Id | Pendiente | Hoy |
| --- | --- | --- |
| P1 | Chips de sugerencias del chat bajo 44 px | `src/components/chatbot/Chatbot.css:246-256` (`.chatbot__chip`, `padding: 0.35rem 0.75rem`): miden 26 px de alto a 390 px |
| P2 | Sin prueba de la limpieza GSAP del torneo | `Bracket.jsx:125-138` y `CalendarioTorneo.jsx:75-86` usan `gsap.matchMedia(rootRef)` + `mm.revert()`; el `matchMedia` de `setupTests.js` responde `matches: false`, así que el callback nunca corre en jsdom |
| P3 | Sin prueba de la pausa del video | `src/components/hero/DeporteHero.jsx:136-146` llama `video?.pause()` en los dos cleanups |
| P4 | Sin prueba del caso mixto 429 + 503 | `src/lib/modelosChat.js:93-104`: si no todos son 429 ni todos timeout, `respuestaFinal` da 502; `api/_lib/chat.test.js` no lo cubre |
| P5 | Faltan dos enlaces en la prueba de Navbar y Footer | `src/components/layout/Navbar.test.jsx:97`: el título dice "Navbar y Footer" pero solo prueba Navbar→Eventos y Footer→Ubicación |
| P6 | La pastilla de puntos tapa el borde de la tarjeta | `DepthCarousel.css:167-169` (`bottom: 16px`) y la regla de `VistaCanchas.css:371-373` (`bottom: 2px`, "debajo de la tarjeta"): con puntos de 44 px la pastilla mide ~50 px y queda pegada al botón "Cancha elegida" |
| P7 | `PLAN.md` de la etapa 13 nombra la herramienta y el modelo | `planificacion/etapas/13-correcciones-rubrica/PLAN.md:59-61`; las etapas 1, 10 y 11 hacen lo mismo |

## Decisiones y su porqué

1. **P1, `min-height: 44px` real en el chip** (con `display: inline-flex` y
   `align-items: center`), no un `::after` invisible. Entre filas de chips hay solo
   0.4rem (6.4 px): un área expandida de ±9 px pisaría la fila vecina y un toque podría
   caer en el chip equivocado. El costo es ~36 px más de alto en la zona de sugerencias
   cuando hacen dos filas; el panel a 390 px tiene espacio de sobra (ver
   `revision/390/03-chat-abierto.png`).
2. **P2, probar el contrato y no el detalle interno de GSAP.** Con
   `vi.spyOn(gsap, 'matchMedia')` (que llama a la implementación real) se captura la
   instancia y se espía su `revert`. Con `window.matchMedia` simulado con `matches: true`
   para `(prefers-reduced-motion: no-preference)`, se verifica: (a) al montar se llama
   `gsap.from` con el selector del componente; (b) al cambiar una dependencia
   (`partidos.length` en Bracket, `rondaActiva` en CalendarioTorneo) se revierte la
   instancia anterior y se crea otra; (c) al desmontar se revierte la última; (d) con
   `reduce` no se llama `gsap.from`.
3. **P3:** espiar `HTMLMediaElement.prototype.pause` (ya simulado en `setupTests.js`),
   montar `DeporteHero`, desmontar y esperar la llamada. Probar también con reduced-motion,
   donde el callback de `mm.add` no corre y la pausa debe venir del cleanup externo.
4. **P4:** dos casos nuevos en `api/_lib/chat.test.js`: 429, 503, 429 → 502 con
   `TEXTOS.generico` y 3 llamadas; y 429, 429, timeout → 502 (no 429 ni 504), para fijar
   el borde de `respuestaFinal`.
5. **P5:** completar las cuatro combinaciones (Navbar y Footer × Eventos y Ubicación)
   con `it.each`, y repetir un clic para probar la acción repetida.
6. **P6, medir antes de mover.** El bloque mide primero, a 390 y 1440 px, el
   solape entre la pastilla de puntos, el botón "Cancha elegida" y el borde de la tarjeta.
   Solo si la pastilla toca el botón (distancia < 8 px) se baja la pastilla en
   `VistaCanchas.css` para que quede bajo la tarjeta y no encima. No se toca
   `DepthCarousel.css`: el ajuste del tema oscuro ya vive en `VistaCanchas.css`, que es el único que usa el carrusel.
7. **P7, recomendación: no cambiar.** La regla de no nombrar IA, herramientas ni modelos
   aplica a commits, PR, issues y notas de versión. `planificacion/` es el registro
   interno de cómo se trabajó, y el propio `README.md` de planificación documenta el
   comando de agy y el modelo. Borrarlo solo en la etapa 13 la dejaría inconsistente
   con las demás. Se deja para que decida Juan.
8. **Fuera de alcance:** el ícono de "Mis reservas" solo en una tercera fila del navbar
   móvil. Ya era así antes del PR #27 (`docs/capturas/movil-inicio.webp`). Si Juan
   quiere arreglarlo, va en otra etapa porque cambia el diseño del navbar.

## Bloques, rutas y olas

Archivos disjuntos: los dos bloques van en paralelo (ola 1), si la memoria libre
alcanza. Modelos según el `CLAUDE.md` global: pruebas y CSS en Hydrogen `high`.

| Ola | Bloque | Agente | Objetivo | Rutas permitidas |
| --- | --- | --- | --- | --- |
| 1 | `p1-chips-y-carrusel` | agy, Hydrogen `high` | P1 y P6 (CSS), con la medición de P6 antes del cambio y capturas en `revision/` | `src/components/chatbot/Chatbot.css`, `src/components/canchas/VistaCanchas.css`, `planificacion/etapas/14-pendientes-pr27/revision/` |
| 1 | `t1-pruebas` | agy, Hydrogen `high` | P2, P3, P4 y P5 | `src/components/reservas/torneo/Bracket.test.jsx` (nuevo), `src/components/reservas/torneo/CalendarioTorneo.test.jsx` (nuevo o existente), `src/components/hero/DeporteHero.test.jsx` (nuevo), `api/_lib/chat.test.js`, `src/components/layout/Navbar.test.jsx` |

Prohibido en los dos: código de producción fuera de esos CSS (si una prueba de `t1`
revela un defecto, se reporta y no se corrige ahí), `AGENTS.md` y `docs/agentes/`
(los actualiza el coordinador al cerrar).

## Verificación

### Automática
- `npm test`, `npm run lint` (0 warnings) y `npm run build`.
- Cada prueba nueva debe fallar si se quita el código que prueba: en `t1` se comprueba
  quitando temporalmente `mm.revert()`, `video?.pause()` y la regla de 502, y se anota
  el resultado en el reporte del bloque (el código se restaura antes de entregar).
- Reglas: título igual a lo que ejercita; errores esperados acotados al código exacto;
  sin `try/catch` sin aserción; mocks globales restaurados en `finally` o `afterEach`.

### En la app (headless a 390×844 y 1440×900, con `npm run preview`, que se cierra al terminar)
- Chips: alto ≥ 44 px; con 3 sugerencias en dos filas, sin tapar el input ni el botón
  enviar; tocar el **segundo** y el **último** chip envía su texto (sin enviar a Gemini:
  se intercepta `fetch` en la página).
- Carrusel: pastilla sin tocar el botón "Cancha elegida" en los tres deportes; clic en el
  segundo y el último punto, y repetido; sin desborde horizontal; flechas sin cambios.
- Reduced-motion activado: los chips y la pastilla no se animan.

## Commits

1. `fix: área táctil de 44 px en las sugerencias del chat`
2. `fix: los puntos del carrusel no tapan el botón de la tarjeta` (solo si P6 lo requiere)
3. `test: limpieza de GSAP en el torneo y pausa del video del hero`
4. `test: caso mixto de errores en /api/chat y enlaces de Navbar y Footer`
5. `docs: plan, verificación y reporte de la etapa 14`

## Por aprobar

1. El plan, la rama `fix/pendientes-pr27` y los dos bloques en paralelo.
2. P1 con alto real de 44 px (las sugerencias crecen ~36 px cuando hacen dos filas).
3. P6 condicionado a la medición.
4. P7: dejar el `PLAN.md` de la etapa 13 como está (recomendado) o quitarle el nombre de
   la herramienta y el modelo.
5. El navbar móvil fuera de alcance.
