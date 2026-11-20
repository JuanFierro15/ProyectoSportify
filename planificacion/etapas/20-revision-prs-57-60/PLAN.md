# Plan de la etapa 20: revisión de las PR #57 a #60 (issues #53 a #56)

**Estado: pendiente de aprobación de Miguel Medina.**

Rama de la etapa: `chore/revision-prs-57-60`, creada desde `origin/main` en
`d2a64c8` (19-11-2026). Solo lleva este plan y el reporte: la revisión no
modifica el código de las PR.

## 1. Qué se pidió

Revisar a fondo las cuatro PR abiertas antes de fusionarlas: validar las
funcionalidades principales del sitio, identificar qué puede verse afectado por
los cambios, buscar bugs que se hayan pasado por alto, código duplicado, código
muerto y cualquier otro error. El objetivo es fusionar sin sorpresas.

## 2. Qué hay hoy

Las cuatro PR son de `jmvr24`, salen de la revisión de la PR #52 (etapa 19) y
están **encadenadas**: cada una tiene como base la anterior.

| PR | Issue | Rama | Base | Tamaño | Archivos |
| --- | --- | --- | --- | --- | --- |
| #57 | #56 reserva en transición perdida por `storage` antes del render | `fix/issue-56` | `main` | +185 −15 | `ReservasContext.jsx`, su test, `docs/agentes/reservas.md` |
| #58 | #53 cancelación sin guardar que reaparece | `fix/issue-53` | `fix/issue-56` | +576 −100 | lo anterior + `src/lib/cancelacion.js` y su test |
| #59 | #55 doble reserva en la misma hora y horas compartidas | `fix/issue-55` | `fix/issue-53` | +490 −28 | lo anterior + `AvisoConflictoReserva.jsx` (nuevo) y su test, `App.jsx`, `App.css`, `AGENTS.md`, `docs/agentes/pagina-reserva.md` |
| #60 | #54 borrar la clave desde otra pestaña pierde pendientes | `fix/issue-54` | `fix/issue-55` | +83 −24 | `ReservasContext.jsx`, su test, docs, `odd/tasks/issues-53-54-55-56.md` |

- Las cuatro dicen `MERGEABLE` y tienen el despliegue de preview de Vercel en
  verde.
- Todo el riesgo se concentra en `src/context/ReservasContext.jsx` (estado que
  se persiste y sincronización entre pestañas): ítems 1 y 4 de la lista de alto
  riesgo.
- `src/lib/cancelacion.js` también lo importa `/api/chat` (cancelación desde el
  chatbot), así que un cambio ahí alcanza al servidor.
- La issue #54 pedía **decidir primero** qué significa borrar la clave desde
  otra pestaña. La PR #60 eligió fusionar las pendientes sobre la semilla: hay
  que confirmar que esa decisión fue tomada por el equipo.
- La issue #55 dejaba la parte 1 (avisar del choque) a decisión. La PR #59
  agrega un aviso visible nuevo (`AvisoConflictoReserva`).

## 3. Decisiones

- **Revisión de solo lectura.** No se corrige nada en las ramas de las PR. Cada
  hallazgo queda en el reporte con PR, archivo y línea, el escenario que lo
  reproduce y su gravedad (bloquea, conviene arreglar, detalle). Las
  correcciones las hace el autor o se planean en otra etapa.
- **Revisar cada PR sobre su propia base** (`gh pr diff <n>`), no el diff
  acumulado: así cada hallazgo se atribuye a la PR que lo introduce. Además, la
  punta de la cadena (`fix/issue-54`) se revisa entera porque es lo que
  quedará en `main`.
- **Cada eslabón tiene que estar verde por sí solo**: se fusionan uno por uno,
  así que `main` pasa por cada estado intermedio (y producción también, porque
  cada push a `main` despliega).
- **Probar en los previews de Vercel** de cada PR en lugar de `vercel dev`, por
  la RAM del equipo. Cada preview tiene su propio `localStorage`, así que no
  toca los datos de producción.
- **Chatbot con pocas llamadas**: como mucho 4 mensajes a `/api/chat` en total
  (reservar y cancelar en el preview de la punta) para no gastar la cuota
  gratuita de Gemini.
- **Reparto** (CLAUDE.md global):
  - lectura y mapa de consumidores: subagentes de Claude con `haiku`, solo
    lectura;
  - pruebas (suite, lint, build, RED/GREEN, sondas adversariales, navegador):
    `agy` con `gemini-4-hydrogen-high`, de a un agente y en segundo plano (PC
    de 8 GB); respaldo `gemini-4-argon-medium`;
  - la lectura de los diffs, el veredicto y el reporte los hace el
    coordinador. Las capturas de agy se revisan antes de darlas por buenas.

## 4. Fases

### F0. Preparación

- Un worktree por punta en `.claude/worktrees/`: `rev-57` (`fix/issue-56`),
  `rev-58`, `rev-59` y `rev-60`, más `origin/main` como línea base. Se crean y
  se prueban de a uno para no llenar la memoria; `npm ci` en cada uno.
- Comprobar que la base de #57 sigue siendo el `main` actual (`d2a64c8`) y que
  la cadena no tiene conflictos: fusión de prueba de `fix/issue-54` sobre
  `origin/main` en un worktree descartable.

### F1. Línea base

En `origin/main` y en cada punta: `npm test`, `npm run lint` y `npm run build`.
Anotar archivos y casos (la etapa 19 cerró con 38 archivos y 500/500). Ningún
eslabón puede tener menos casos sin explicación ni avisos nuevos de lint.

### F2. Revisión del diff por PR (coordinador)

Para cada PR, con esta lista:

1. **Corrige la issue**: el escenario "Cómo reproducirlo" de la issue queda
   cubierto por una prueba con valores exactos.
2. **Lógica nueva**: orden de las operaciones con los `ref`
   (`estadoRef`, `idsSinGuardarRef`, `ultimoRawStorageRef`,
   `syncDesdeStorageRef`), cuándo se llenan y cuándo se vacían los registros,
   y qué pasa con eventos (torneos y cumpleaños con bloques de horas), no solo
   reservas de una hora.
3. **Duplicidad**: la fusión de cancelaciones (#58) frente a
   `conservarReservasSinGuardar`; la comparación contra lo guardado (#57)
   frente al registro del `catch`; la protección de horas compartidas (#59)
   frente a lógica que ya exista en `cancelacion.js`, `horarios.js` o el
   reducer.
4. **Código muerto**: exportaciones sin uso, `ref` o ramas que tras la cadena
   ya no se usan (por ejemplo, partes de #57 que #58 a #60 reemplazan), pruebas
   que quedan fijando un comportamiento que la cadena cambia (como `C9`).
5. **Reglas de `AGENTS.md`**: `localStorage` solo dentro de
   `ReservasContext.jsx`; `z-index` del aviso con los tokens de `App.css`;
   textos visibles con tuteo y sin detalles de implementación; un componente
   por archivo; colores de deporte solo desde `deportes.js`; animaciones GSAP
   con su `revert()`.
6. **Docs al día**: `docs/agentes/reservas.md` y `pagina-reserva.md` describen
   lo que hace el código final (las "limitaciones conocidas" que se cierran se
   quitan), y el cambio en `AGENTS.md` es correcto.
7. **Commits**: en español, con prefijo, sin menciones a IA ni coautorías.
8. **Decisiones de producto**: la de #54 y el aviso de #55 (texto, cuándo
   aparece, cómo se cierra, accesibilidad).

### F3. Las pruebas nuevas fallan sin el arreglo (RED)

Por cada PR, correr sus pruebas nuevas contra el `ReservasContext.jsx` (y
`cancelacion.js`) de su base. Deben fallar las que reproducen la issue y pasar
las de regresión. Una prueba nueva que pasa sin el arreglo no prueba nada y se
anota como hallazgo.

### F4. Mapa de lo que puede verse afectado

Subagente `haiku` de solo lectura: todos los consumidores de lo que cambia
(`useReservas`, `reservar`, `reservarEvento`, `cancelar`, `disponibilidad`,
`aplicarCancelacion` y lo nuevo de `cancelacion.js`, `App.jsx`), con
`ruta:línea`. De ahí sale la lista de funcionalidades a probar en F5 y F6. Como
mínimo:

- formulario de reserva (1 a 3 horas, descuento, validación de nombre y
  teléfono, horas pasadas);
- torneo por fases (asistente en escritorio y móvil, calendario, llaves) y
  cumpleaños;
- "Mis reservas" (búsqueda, plazo de cancelación, cancelar);
- chatbot (reservar y cancelar con confirmación);
- disponibilidad en el catálogo y en la página de reserva;
- cambio de día y sincronización entre pestañas.

### F5. Pruebas adversariales (agy, en un directorio temporal)

Sondas en `src/verificacion/` del worktree de la punta, que se borran al
cerrar. Cada una se corre contra `origin/main` y contra la punta, y se compara
el resultado. Escenarios:

1. Reserva sin guardar + cancelación sin guardar + evento `storage`, en ese
   orden y al revés.
2. Cancelar una reserva pendiente (nunca guardada) y luego llega `storage`.
3. Dos pestañas con la misma hora en una cancha; cancelar la primera, luego la
   segunda: la hora se libera solo al final.
4. Lo mismo con un torneo o cumpleaños que comparte horas con una reserva
   normal (bloques de eventos), y con la última hora del día.
5. Borrar la clave (`removeItem` y `clear()`, `newValue: null` y `key: null`)
   con pendientes y sin pendientes.
6. `setItem` que falla y luego vuelve a funcionar: los registros se vacían y no
   queda nada repetido en `localStorage`.
7. Reservar y cancelar dentro de `startTransition` con un `storage` en el mismo
   tick (la reproducción de #56) y repetir la acción dos veces.
8. Cambio de día (`renovarSiCambioElDia`) con pendientes de los dos tipos.
9. JSON corrupto o de una versión anterior en `localStorage`.
10. Con todo guardado sin errores: el comportamiento es idéntico al de
    `origin/main` (salida y datos), para descartar regresiones del caso feliz.

### F6. Pruebas en la app real (preview de la punta, y de #57 si F2 lo pide)

agy con el MCP de Playwright, a `1440×900` y `390×844`, registrando capturas en
`revision/`:

1. Inicio: hero, navegación por secciones, eventos, ubicación.
2. Reservar 1, 2 y 3 horas seguidas con descuento; nombre y teléfono inválidos.
3. Torneo por fases completo y cumpleaños; ver la reserva en "Mis reservas".
4. Cancelar desde "Mis reservas" y comprobar que la hora se libera.
5. Dos pestañas: reservar la misma hora en las dos y ver el aviso de conflicto
   de #59; cancelar y comprobar la disponibilidad.
6. Forzar el fallo de `setItem` en una pestaña desde la consola (como la prueba
   manual de la etapa 19) y repetir 5.
7. Chatbot: reservar y cancelar una reserva (máximo 4 mensajes).
8. Consola del navegador sin errores en todo el recorrido.

### F7. Segunda opinión sobre `ReservasContext.jsx`

Revisión ciega doble (`judgment-day`) del diff acumulado de
`ReservasContext.jsx` y `cancelacion.js`: dos jueces independientes, solo
lectura. Se hace porque el archivo concentra todo el riesgo y ya tuvo cuatro
bugs de concurrencia seguidos (#50, #51 y #53 a #56).

### F8. Integración

- La fusión de prueba de F0, con la suite, el lint y el build completos sobre
  el resultado.
- Recomendar el modo de fusión: con commit de fusión (como `main` viene
  haciendo) y en orden #57 → #58 → #59 → #60. Un "squash" en #57 dejaría a #58
  con commits que ya no están en `main` y obligaría a rehacer la cadena.

### F9. Reporte y veredicto

`REPORTE.md` con: números de F1, hallazgos por PR con su gravedad y su
escenario, resultado de RED, mapa de impacto, resultado de las sondas y de la
app real, y un veredicto por PR (fusionar, fusionar con detalles, no fusionar).
Se borran los worktrees y las sondas.

## 5. Criterios de aceptación de la revisión

- Las cuatro puntas y `origin/main` con suite, lint y build corridos y
  anotados con números.
- Cada prueba nueva de cada PR comprobada en RED contra su base.
- Los 10 escenarios de F5 corridos en los dos lados, con su resultado.
- Los 8 recorridos de F6 hechos, con capturas revisadas por el coordinador.
- Cada hallazgo con PR, archivo, línea y escenario que lo reproduce.
- Un veredicto explícito por PR.

## 6. Commits

En la rama `chore/revision-prs-57-60`:

1. `docs: plan de la etapa 20 (revisión de las PR #57 a #60)`.
2. `docs: reporte de la etapa 20` (con la fila del README cerrada).

Push de la rama al terminar. La PR de esta rama y la fusión de #57 a #60 las
decide el equipo.

## 7. Por aprobar

- El plan completo.
- Si los hallazgos además se publican como comentarios en cada PR de GitHub
  (es público y lo ve el autor) o se quedan solo en el reporte.
- Si F7 (`judgment-day`) entra o se omite para ahorrar tiempo.
