# Issue #35: el texto de los heros no tapa el video

Objetivo: mover y achicar el texto de los tres heros para que no tape la acción de su video. Rama: `feat/hero-texto` desde `origin/main` (84e4758). Entrega: un PR independiente de #36. Tests: Vitest (`npm test`) + `npm run lint` + `npm run build`.

## Specs

Las citas son textuales de la issue #35. Las decisiones marcadas "(plan)" salen de las capturas de los videos (5 cuadros por hero, 1920x1080 y 390x844) y del plan aprobado por Miguel el 16-11-2026.

- **S1** "Evaluar en cada hero cuál es la mejor posición para el texto (izquierda, abajo a la izquierda u otra) según dónde ocurre la acción de su video. La posición puede ser distinta en cada hero si el video lo pide." (plan) Desde `large` (64em): vóley playa `abajo-izquierda`, pádel `izquierda` (centrado en alto), fútbol `abajo-derecha` (el bloque a la derecha, con el texto alineado a la izquierda dentro del bloque). Bajo `large`: los tres abajo a la izquierda.
- **S2** "Si la posición cambia por deporte, el dato va en `src/data/deportes.js` (la fuente visual por deporte), no hardcodeado en el CSS." (plan) Campo `posicionTexto` en cada deporte, con valores `'izquierda' | 'abajo-izquierda' | 'abajo-derecha'`. `DeporteHero` recibe la posición y agrega la clase `deporte-hero--texto-<posicion>`; si falta el dato o es desconocido, usa `izquierda`. El CSS define las tres clases (una regla por posición, no por deporte).
- **S3** "Ajustar el tamaño de la fuente del título y de la descripción para que no compitan con el video." (plan) Título alrededor de `clamp(2rem, 4.5vw, 3.75rem)`, descripción alrededor de `clamp(0.95rem, 1.3vw, 1.15rem)`, y el bloque con un ancho máximo de unos 34rem.
- **S4** "Mantener legible el texto sobre el video (contraste del overlay o sombra) y conservar el botón "Ver canchas" visible en el punto de reposo." (plan) El overlay general se aclara y se agrega un degradado del lado del texto (izquierda: de oscuro a transparente hacia la derecha; abajo: de oscuro a transparente hacia arriba; abajo a la derecha: espejo). Se mantiene la sombra del texto. El fade de entrada y salida (`DURACION_FADE_CONTENIDO`, `REPOSO_HERO`) no cambia.
- **S5** "En móvil, que el texto no se salga ni choque con el navbar ni con el botón del chat." (plan) Bajo `large`, el bloque queda abajo con margen inferior suficiente para no tapar el botón flotante del chat (abajo a la derecha, ~56 px) y sin pasar por debajo del navbar.
- **S6** "Las pruebas de `DeporteHero.test.jsx` siguen en verde, y si se agrega un dato a `deportes.js` se prueba." y "Actualizar `docs/agentes/pagina-reserva.md` si cambia algo de lo que describe." (plan) Test de que cada deporte tiene un `posicionTexto` válido, y de que `DeporteHero` aplica la clase correcta y usa `izquierda` por defecto. La nota de la doc va en la parte de colores por deporte (`deportes.js`), no en el párrafo de `DeporteHero`, para no chocar con el PR de #36.
- **S7** "Escritorio (1920 y 1366 px de ancho) y móvil (390 y 360 px): el texto no tapa la acción principal del video y se lee bien." (plan) Se verifica con capturas reales en esos cuatro anchos, en el reposo de cada hero. Miguel revisa después en localhost.

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|---|---|---|---|---|
| T1 | S1-S6 | agy hydrogen-medium (código) | hecho | 2e14f20 + corrección del contenedor |
| T2 | S7 | agy hydrogen-high (capturas y verificación) | hecho (falta la revisión de Miguel en localhost) | |

Riesgo: bajo (presentación; sin estado ni datos persistidos).

## Log

- **L1** (16-11-2026, Miguel): "Sobre la número 35, que es el texto de los giros, pues quiero que tomes fotos, más que todo. Toma fotos y verifica bien qué espacios hay, porque en la mayoría pues se pueden elegir como un lado como a la izquierda, si no estoy mal. Pero pues sí quiero que te asegures de eso y que pues primero pues hacemos la implementación como tú recomiendas y pues ya luego yo verifico en localhost cómo se ve y pues ya te daré las correcciones pertinentes."
- **L2** (16-11-2026) Capturas reales (agy, Playwright con un script en una carpeta temporal; revisadas una por una). Vóley: la acción ocupa el centro y la derecha; la arena de abajo a la izquierda queda libre en los 5 cuadros. Pádel: el jugador siempre está al centro; la izquierda queda libre. Fútbol: la acción se mueve (a la mitad hay un jugador a la izquierda, al final el arco a la derecha); el césped de abajo a la derecha queda libre en todos los cuadros. En 390 px el video se recorta al centro, donde está la acción.
- **L3** (16-11-2026) T1: RED de 5 tests; 406/406, lint y build OK.
- **L4** (16-11-2026) Primera ronda de capturas (1920, 1366, 390 y 360): el `grid-container` de Foundation centraba el bloque, así que a 1920 el texto de vóley empezaba en x=375 y pisaba a la jugadora, y a 1366 la descripción de pádel rozaba la raqueta. Corrección: el contenedor pasa a ancho completo con `padding-inline: clamp(1.25rem, 5vw, 6rem)`, el bloque mide como máximo 32rem y la descripción 30rem; abajo a la derecha deja al menos 5.5rem a la derecha por el botón del chat. Segunda ronda: el texto no pisa a los jugadores en ningún hero, no choca con el navbar ni con el chat en los cuatro anchos, y no hay errores en consola. Revisión gentle-ai del commit: Miguel eligió "Omitir esta vez".
- **L5** (16-11-2026) Correcciones de la revisión del PR #38: desde `large`, `.deporte-hero__bloque` pasa a `max-width: min(32rem, 36vw)` para no tapar el jugador de pádel ni el balón de fútbol entre 1024 y ~1200 px; `.deporte-hero__eyebrow` suma `text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6)` para mejorar el contraste sobre el video; la animación GSAP de entrada/salida (`fade` + `scale`) pasa de `.deporte-hero__contenido` a `.deporte-hero__bloque` (`bloqueRef`) para que escale sobre sí mismo sin desplazamiento diagonal. Se añaden pruebas en `DeporteHero.test.jsx` (animación sobre el bloque y limpieza con `mm.revert()`), `deportes.test.js` (valores exactos por deporte) y `PaginaInicio.test.jsx` (propagación de `posicionTexto`), y se actualiza `docs/agentes/pagina-reserva.md`.
