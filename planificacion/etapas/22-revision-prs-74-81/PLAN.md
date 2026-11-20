# Plan de la etapa 22: revisión de las PR #74 a #81 (issues #61 a #71)

**Estado: aprobado por Miguel Medina el 20-11-2026**, con el orden de fusión
de F8, los hallazgos solo en el reporte (no como comentarios en las PR) y F7
incluida.

Rama de la etapa: `chore/revision-prs-74-81`, creada desde `origin/main` en
`39d64c7` (20-11-2026). Solo lleva este plan y el reporte: la revisión no
modifica el código de las PR.

## 1. Qué se pidió

Revisar el trabajo de Juan Fierro sobre las 11 issues que dejó la etapa 20
(#61 a #71) antes de fusionarlo: probar que todas las funcionalidades que
puedan verse afectadas por las soluciones funcionen bien, y buscar bugs,
código muerto, duplicidad o cualquier error que se haya colado.

## 2. Qué hay hoy

Ocho PR abiertas de Juan (etapa 21), todas `CLEAN`, con el preview de Vercel
en verde y al día con `main` (`39d64c7`).

| PR | Issues | Rama | Base | Tamaño | Qué toca |
| --- | --- | --- | --- | --- | --- |
| #74 | #67 doc ODD | `docs/issue-67` | `main` | +11 −7 | `odd/tasks/issues-53-54-55-56.md` |
| #75 | #69 fecha del torneo | `fix/issue-69` | `main` | +131 −3 | `fechas.js` (`textoRangoFechas`), `useReserva.js`, pruebas |
| #76 | #70 pastillas del selector de día | `fix/issue-70` | `main` | +125 −1 | `SelectorDia.css`, su prueba, `AGENTS.md` |
| #77 | #71 texto del primer hero | `fix/issue-71` | `main` | +99 −16 | `DeporteHero.jsx` (`textoVisibleAlInicio`), `PaginaInicio.jsx`, prueba, doc |
| #78 | #65 y #61 aviso y confirmación descartada | `fix/aviso-conflicto-61-65` | `main` | +783 −22 | `VistaCanchas.jsx/.css`, `useReserva.js`, `AvisoConflictoReserva.jsx`, `App.css`, una línea de `ReservasContext.jsx`, pruebas y docs |
| #79 | #66, #62 y #63 sincronización | `fix/sincronizacion-pestanas-62-66` | `main` | +1746 −36 | `ReservasContext.jsx` (+146 −35), +1435 líneas de pruebas |
| #80 | #64 refactor | `refactor/sincronizacion-64` | `fix/sincronizacion-pestanas-62-66` | +945 −266 | `ReservasContext.jsx` (+148 −214), `cancelacion.js` (−23); **incluye #78 fusionada** (`498785b`) |
| #81 | plan y reporte de la etapa 21 | `chore/etapa-21-issues-61-71` | `main` | +2081 | `planificacion/etapas/21-issues-61-71/` y el README |

Lo que ya se comprobó al armar este plan (`git merge-tree`, sin tocar nada):

- **#78 y #79 chocan entre sí** en `docs/agentes/reservas.md` y
  `src/components/shared/AvisoConflictoReserva.test.jsx`. El reporte de Juan
  dice que resolvió esos dos conflictos a mano, pero solo dentro de #80 (commit
  de fusión `498785b`). Con el orden de su tabla ("#78 y #79 en cualquier
  orden, #80 al final"), la segunda de las dos queda en conflicto en GitHub.
- #80 sobre `main` + #78 entra limpia (ya la contiene). #75, #76 y #77 no chocan
  con #80 ni con #81.
- La #68 está cerrada (D1 y D2 confirmadas por Juan). La #73 (comprobante del
  chat con la misma contradicción que la #61) quedó abierta y fuera de alcance.
- La etapa 21 cerró con 40 archivos y 546 pruebas en verde sobre la
  integración local de Juan; nadie más lo ha comprobado.

Riesgo: #79 y #80 tocan otra vez `ReservasContext.jsx` (estado persistido y
sincronización entre pestañas, ítems 1 y 4 de alto riesgo), que ya tuvo seis
bugs de concurrencia seguidos (#50, #51, #53 a #56). `cancelacion.js` lo
importa también `/api/chat`, así que el cambio de #80 llega al servidor.

## 3. Decisiones

- **Revisión de solo lectura.** No se corrige nada en las ramas de las PR.
  Cada hallazgo queda en el reporte con PR, archivo y línea, el escenario que
  lo reproduce y su gravedad (bloquea, conviene arreglar, detalle).
- **Cada PR sobre su propia base** (`gh pr diff <n>`); #80 se revisa **sin**
  los commits de #78 (`git diff 498785b..d57e955` para el refactor puro, y
  `498785b` aparte para la resolución de conflictos).
- **El estado final se revisa entero**: `main` + las siete PR de código, que
  es lo que quedará en producción.
- **Cada estado intermedio de `main` tiene que estar verde**, porque cada push
  a `main` despliega. Se prueba la secuencia de fusión recomendada (F8), no
  solo el final.
- **Previews de Vercel** de cada PR para la app real (no `vercel dev`, por la
  RAM). Cada preview tiene su propio `localStorage`.
- **Chatbot con pocas llamadas**: como mucho 4 mensajes a `/api/chat` en total,
  en el preview de #80, para no gastar la cuota de Gemini.
- **Reparto** (CLAUDE.md global):
  - lectura y mapa de consumidores: subagentes de Claude con `haiku`, solo
    lectura;
  - pruebas (suite, lint, build, RED, sondas, navegador): `agy` con
    `gemini-4-hydrogen-high`, de a un agente y en segundo plano (PC de 8 GB);
    respaldo `gemini-4-argon-medium`;
  - la lectura de los diffs, el veredicto y el reporte los hace el
    coordinador. Las capturas de agy se revisan antes de darlas por buenas.

## 4. Fases

### F0. Preparación

- Worktrees en `.claude/worktrees/` (con `core.longpaths=true`), de a uno para
  no llenar la memoria y con `npm ci` en cada uno: uno para las PR chicas
  (#74 a #77, se cambia de rama dentro), `rev-78`, `rev-79`, `rev-80` y uno de
  integración.
- Integración: `origin/main` + #74, #75, #76, #77, #79 y #80 (que trae #78),
  en el orden de F8.

### F1. Línea base

En `origin/main`, en cada punta y en la integración: `npm test`,
`npm run lint` y `npm run build`, con archivos y casos anotados. Contrastar
contra lo que dice el reporte de Juan (40 archivos, 546 pruebas). Ninguna PR
puede bajar casos sin explicación ni sumar avisos de lint. Comprobar además
que la suite no deja cambios en el árbol (el reporte cuenta que reescribía el
snapshot de `instrucciones.test.js.snap` con LF).

### F2. Revisión del diff por PR (coordinador)

Lista común para cada PR:

1. **Corrige la issue**: el escenario de "Cómo reproducirlo" de la issue queda
   cubierto por una prueba con valores exactos.
2. **Duplicidad y código muerto**: exportaciones sin uso, funciones nuevas que
   repiten otras ya existentes, pruebas que fijan un comportamiento que otra
   PR cambia.
3. **Reglas de `AGENTS.md`**: `localStorage` solo en `ReservasContext.jsx`;
   `z-index` y colores con tokens de `App.css` (nada de colores sueltos);
   tuteo y sin detalles de implementación en el texto visible; un componente
   por archivo; GSAP dentro de `gsap.context()`/`matchMedia` con `revert()`.
4. **Docs al día** (`docs/agentes/*.md`, `AGENTS.md`) y coherentes entre PR.
5. **Commits** en español, con prefijo, sin menciones a IA ni coautorías.

Puntos propios de cada PR:

- **#74**: las ramas y los commits que cita el documento existen de verdad
  (`git cat-file -e` y `git branch -r`).
- **#75**: `textoRangoFechas` con fases en días distintos, todas el mismo día,
  una sola fase, fases desordenadas y cambio de mes o de año; que el resto de
  textos de fechas del torneo (confirmación, "Mis reservas", chat) no se
  contradiga con el nuevo.
- **#76**: el CSS de `< 400 px` (`letter-spacing` negativo y `overflow:
  visible`) no desborda ni se monta sobre la pastilla vecina, y no afecta a
  pantallas de 400 px o más; qué cambió en `AGENTS.md` y por qué.
- **#77**: `textoVisibleAlInicio` solo en el primer hero; la animación de
  salida y la de los otros dos heros siguen igual; `prefers-reduced-motion`;
  limpieza de GSAP al desmontar; el avance por gestos (`controladorSnapHero`).
- **#78**: una sola región viva (`role="alert"` sin `aria-live` duplicado);
  los tokens `--aviso-*` en los dos temas; la confirmación descartada cuando
  el choque toca **una** de varias horas o un evento (torneo, cumpleaños);
  foco, cierre del aviso y "Elegir otro horario" (conserva nombre y teléfono,
  deshabilita la hora tomada); para qué es la línea nueva de
  `ReservasContext.jsx`.
- **#79**: orden de operaciones con los `ref`; el choque contra celdas
  guardadas y candidatas ya aceptadas; el cambio de día con la semilla sin
  perder fechas fuera de la ventana; la regla de texto ilegible ("solo cuentan
  los ids registrados") y el registro nuevo en `despachar` (desvío del plan
  según el reporte); si las +1435 líneas de pruebas tienen casos repetidos.
- **#80**: que el refactor no cambie comportamiento (los cuatro caminos de
  sincronización y la clave borrada), que `quitarReservasDeEstado` cubra todo
  lo que hacía `aplicarCancelacion` (también desde `/api/chat`), que de verdad
  no quede código muerto, y que la resolución de conflictos de `498785b`
  conserve los dos lados.
- **#81**: que el reporte diga lo que hay en las ramas (commits, números) y
  que la fila del README sea correcta.

### F3. Las pruebas nuevas fallan sin el arreglo (RED)

Por cada PR de código, correr sus pruebas nuevas contra los archivos de su
base. Deben fallar las que reproducen la issue y pasar las de regresión. Una
prueba que pasa sin el arreglo no prueba nada y se anota. Para #80 (refactor)
es al revés: todas las pruebas de #79 deben pasar igual antes y después.

### F4. Mapa de lo que puede verse afectado

Subagente `haiku` de solo lectura: consumidores, con `ruta:línea`, de
`useReserva`, `textoRangoFechas` y los demás textos de fecha, `SelectorDia`,
`DeporteHero`, `AvisoConflictoReserva`, `VistaCanchas`, `useReservas`,
`reservar`, `reservarEvento`, `cancelar`, `disponibilidad`,
`quitarReservasDeEstado` y lo que se borra de `cancelacion.js`. De ahí sale la
lista de recorridos de F6. Como mínimo:

- inicio (tres heros, gestos, navegación por secciones, eventos, ubicación);
- reserva de 1 a 3 horas (descuento, validación, horas pasadas, selector de
  día);
- torneo por fases (asistente en escritorio y móvil, calendario, llaves) y
  cumpleaños;
- "Mis reservas" (búsqueda, plazo, cancelar);
- chatbot (reservar y cancelar con confirmación);
- sincronización entre pestañas y cambio de día.

### F5. Sondas adversariales (agy, en un directorio temporal)

Sondas en `src/verificacion/` del worktree de integración, que se borran al
cerrar. Cada una se corre contra `origin/main` y contra la integración y se
compara la salida y los datos. Se reutilizan las 14 sondas de la etapa 20
cuando apliquen, más:

1. Choque de una reserva sin guardar contra una reserva **guardada** en otra
   pestaña en la misma celda (#62), con una hora y con un bloque de evento
   (segundo y último bloque).
2. Dos pendientes y un solo choque: se descarta solo la que choca.
3. Lo último guardado vacío, ilegible o de otra versión, con una cancelación
   sin guardar (#63): la reserva cancelada no revive.
4. Reservar y cancelar dentro de `startTransition` con un `storage` en el
   mismo tick, dos veces seguidas (el registro nuevo en `despachar`).
5. Cambio de día con pendientes y fechas fuera de la ventana (#62).
6. Borrar la clave (`removeItem`, `clear()`) con y sin pendientes, ahora por
   `sincronizarConLeido`.
7. Cancelar desde el chat (`/api/chat` → `cancelacion.js`) con el código de
   #80, sin llamar a Gemini: llamando a la función directamente.
8. Con todo guardado sin errores: comportamiento idéntico al de `origin/main`.
9. #80 contra #79: las mismas sondas dan la misma salida (el refactor no
   cambia nada observable).
10. `textoRangoFechas` con mismo día, días distintos, cruce de mes y de año.

### F6. Pruebas en la app real (previews)

agy con el MCP de Playwright, a `1440×900`, `390×844` y `360×780`, con
capturas en `revision/`:

1. Inicio: el primer hero con texto desde que carga, los otros dos ocultos
   hasta su turno, salida al hacer scroll, volver arriba, gestos y reducción de
   movimiento (#77).
2. Selector de día a 360, 390 y 400 px: "bloqueado" y "11 libres" completos y
   sin montarse (#76); 1440 px igual que antes.
3. Torneo con todas las fases el mismo día y con fases en días distintos: una
   sola fecha o el rango en confirmación y "Mis reservas" (#75).
4. Reservar 1, 2 y 3 horas con descuento; nombre y teléfono inválidos; horas
   pasadas.
5. Dos pestañas, con `setItem` fallando en una (desde la consola): misma hora
   en las dos, aviso de conflicto, confirmación cambiada a "Tu reserva no pudo
   completarse" sin QR, foco, cerrar, "Elegir otro horario" (#61, #65). Lo
   mismo con un cumpleaños.
6. Cancelar en una pestaña y ver la hora libre en la otra; cambio de día
   simulado.
7. Chatbot: reservar y cancelar (máximo 4 mensajes).
8. Consola sin errores en todo el recorrido.

La prueba con lector de pantalla (NVDA o Narrador) que pidió Juan para #65 no
la puede hacer agy: queda como prueba manual en el reporte.

### F7. Segunda opinión sobre la sincronización

Revisión ciega doble (`judgment-day`) del diff acumulado de #79 y #80 sobre
`ReservasContext.jsx` y `cancelacion.js`: dos jueces independientes, solo
lectura. Se hace por el historial de bugs de concurrencia del archivo.

### F8. Orden de fusión

Probar en el worktree de integración, paso a paso y con suite, lint y build en
cada paso, esta secuencia:

1. #74, #75, #76 y #77 (independientes).
2. #79 (núcleo).
3. #80, que GitHub reapunta a `main` al borrar la rama de #79 y que trae #78
   con los conflictos ya resueltos. Al entrar #80, GitHub marca #78 como
   fusionada sola.
4. #81 al final, para que el reporte de la etapa 21 quede junto al código.

Si F2 encuentra algo en `498785b`, la otra opción es fusionar #78 primero y que
Juan resuelva el conflicto en #79. Se recomienda en el reporte con su porqué.
Modo de fusión: con commit de fusión, como viene haciendo `main`; un "squash"
en #79 dejaría a #80 con commits que ya no están en `main`.

### F9. Reporte y veredicto

`REPORTE.md` con: números de F1, hallazgos por PR con gravedad y escenario,
resultado de RED, mapa de impacto, sondas, app real, juicio de F7, orden de
fusión probado y un veredicto por PR (fusionar, fusionar con detalles, no
fusionar). Se borran los worktrees y las sondas.

## 5. Criterios de aceptación de la revisión

- `origin/main`, las siete puntas de código y la integración con suite, lint y
  build anotados con números, y cada paso de F8 en verde.
- Cada prueba nueva comprobada en RED contra su base, y las de #79 en verde
  antes y después de #80.
- Las 10 sondas de F5 corridas en los dos lados, con su resultado.
- Los 8 recorridos de F6 hechos, con capturas revisadas por el coordinador.
- Cada hallazgo con PR, archivo, línea y escenario que lo reproduce.
- Un veredicto explícito por PR y un orden de fusión probado.

## 6. Commits

En la rama `chore/revision-prs-74-81`:

1. `docs: plan de la etapa 22 (revisión de las PR #74 a #81)`.
2. `docs: reporte de la etapa 22` (con la fila del README cerrada).

Push de la rama al terminar. La PR de esta rama y la fusión de #74 a #81 las
decide el equipo.

## 7. Por aprobar

- El plan completo, con el orden de fusión de F8 (#79 → #80 en lugar de #78
  por separado).
- Si los hallazgos además se publican como comentarios en cada PR de GitHub o
  se quedan solo en el reporte.
- Si F7 (`judgment-day`) entra o se omite para ahorrar tiempo.
