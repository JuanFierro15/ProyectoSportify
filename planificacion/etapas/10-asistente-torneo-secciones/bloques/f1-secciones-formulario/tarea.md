
# Tarea f1 — Prop `seccion` en `FormularioReserva` (B1, spec S7)

Antes de editar, lee completos:

- `AGENTS.md` (raíz): guía del proyecto. Reemplaza a `GEMINI.md`.
- `odd/tasks/asistente-torneo-movil.md` hasta `## Log` incluido. Tu tarea es **B1** y cubre **S7**.
- `planificacion/etapas/10-asistente-torneo-secciones/PLAN.md` (aprobado; si choca con la spec, manda el PLAN).
- `src/components/reservas/FormularioReserva.jsx` y `src/components/reservas/torneo/AsistenteTorneo.jsx` (líneas 80-130: así consume la prop el frente A).

## Qué hacer

### 1. Prueba diferencial (antes de tocar el componente)

Crea un archivo temporal `src/components/reservas/FormularioReserva.diff.test.jsx` que renderice `FormularioReserva` **sin `seccion`** en los tres modos (`cancha`, `torneo`, `cumpleanos`) con `ReservasProvider` + `useReserva` (mismo patrón que `FlujoTorneoPrueba` en `Torneo.test.jsx`) y guarde `container.innerHTML` con `toMatchSnapshot()`. Fija el reloj con `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(new Date('2026-11-09T07:00:00'))` y limpia `localStorage` en `beforeEach`, para que el resultado no dependa del día. Si algo usa `Math.random` en ese render, fíjalo con `vi.spyOn(Math, 'random')`. En modo torneo, elige antes dos canchas de fútbol para que se vea el contenido real (capacidad, fases y calendario).

Córrelo con `npx vitest run src/components/reservas/FormularioReserva.diff.test.jsx` **con el componente sin cambios**: eso escribe la línea base. Córrelo dos veces y comprueba que pasa la segunda (determinista).

### 2. Tests nuevos en RED

Crea `src/components/reservas/FormularioReserva.test.jsx`, a través de la interfaz pública: render del componente y consultas de Testing Library por rol o texto visible, no por clases.

- Sin `seccion`, en modo torneo, se ven todos los bloques: "Formato del torneo", "Cantidad de equipos", "Duración por partido", el desempate, "Emparejamiento de 1.ª ronda", "Capacidad y tiempo estimado", "Programación por fases", "Torneos reservados" (con un torneo guardado en el contexto) y "Tus datos". Comprueba que aparecen en ese orden.
- Sin `seccion`, en modo cancha y en cumpleaños, se ven "Día", "Horario" y "Tus datos" (y "Invitados" en cumpleaños), igual que hoy.
- `seccion="formato"`: solo equipos, duración con su nota y desempate. No aparecen emparejamiento, capacidad, calendario, guardados ni "Tus datos".
- `seccion="fechas"`: solo el calendario por fases, "Capacidad y tiempo estimado" y la `AlertaTiempo` cuando la franja no alcanza. Nada de los otros bloques.
- `seccion="llaves"`: solo el emparejamiento (Aleatorio/Manual, "Volver a sortear llaves", y `AsignacionManual` en manual). Nada del resto.
- `seccion="datos"`: solo "Tus datos" (nombre y teléfono).
- `seccion="guardados"`: solo "Torneos reservados" si hay torneos; si no hay, no renderiza ningún bloque del formulario.

Para "Torneos reservados" haz un torneo de verdad con `reservarEvento` del contexto o con el flujo de confirmación, como en `Torneo.test.jsx`; no escribas en `localStorage` a mano.

Córrelos y comprueba que **fallan** los de `seccion` (hoy la prop se ignora). Anota en tu resumen qué tests fallaron en RED.

### 3. Implementación (GREEN)

Extrae los bloques del modo torneo de `FormularioReserva.jsx` a componentes nuevos en `src/components/reservas/torneo/`, uno por archivo y **moviendo el JSX tal cual** (mismas clases, textos, atributos y orden):

| Archivo | Contenido |
| --- | --- |
| `PasoFormato.jsx` | aviso `errorCanchas`, cantidad de equipos, duración con su nota, desempate |
| `PasoLlaves.jsx` | emparejamiento: Aleatorio/Manual, "Volver a sortear llaves", `AsignacionManual` |
| `PasoCapacidad.jsx` | "Capacidad y tiempo estimado", canchas por fase y `AlertaTiempo` |
| `PasoFechas.jsx` | el fieldset "Programación por fases (días y horarios)" con `CalendarioTorneo` |
| `PasoDatos.jsx` | el fieldset "Tus datos" (con "Invitados" en cumpleaños; también lo usan cancha y cumpleaños) |
| `PasoGuardados.jsx` | el `<details>` "Torneos reservados"; devuelve `null` si no hay torneos |

Cada uno recibe `reserva` y lo mínimo extra (`dias`, `canchas`, `torneosGuardados`). Pon un comentario JSDoc corto como el del componente actual.

`FormularioReserva` acepta `seccion` (`'formato' | 'fechas' | 'llaves' | 'datos' | 'guardados'`, documentado en el JSDoc):

- **Sin `seccion`**, o con un valor desconocido, o fuera del modo torneo: el mismo árbol de hoy. En torneo, el fieldset "Formato del torneo" envuelve `PasoFormato` + `PasoLlaves` + `PasoCapacidad` en ese orden, luego `PasoFechas`, `PasoGuardados` y `PasoDatos`, dentro del mismo `div.formulario-reserva__torneo` que hoy.
- **Con `seccion` en modo torneo**:
  - `formato`: fieldset "Formato del torneo" con `PasoFormato`.
  - `fechas`: `PasoFechas` y después `PasoCapacidad`.
  - `llaves`: un fieldset con leyenda "Emparejamiento" y `PasoLlaves`.
  - `datos`: `PasoDatos`.
  - `guardados`: `PasoGuardados`.
  - Todo dentro del `div.formulario-reserva` de siempre. El callout de `reserva.error` sigue arriba en cualquier caso.
- El `Bracket` del torneo en curso **no** va aquí (lo pone `SeccionLlaves` del frente A). El `Bracket` compacto de los torneos guardados sí se queda dentro de `PasoGuardados`.

Si un bloque necesita CSS propio, déjalo en `FormularioReserva.css` (las clases ya están ahí). No crees CSS nuevo en esta tarea.

### 4. Verificación

1. `npx vitest run src/components/reservas/FormularioReserva.diff.test.jsx` tiene que **pasar sin actualizar la snapshot** (nunca uses `-u`). Si falla, el árbol sin `seccion` cambió: corrígelo hasta que pase. Después **borra** el archivo `.diff.test.jsx` y su carpeta `__snapshots__` (solo la de esta prueba). Reporta que pasó antes de borrarlo.
2. `npm test` y `npm run lint` sin errores ni warnings.

## Archivos que puedes editar

- `src/components/reservas/FormularioReserva.jsx`
- `src/components/reservas/FormularioReserva.test.jsx` (nuevo)
- `src/components/reservas/torneo/Paso*.jsx` (nuevos)
- `src/components/reservas/FormularioReserva.diff.test.jsx` y su `__snapshots__/` (temporales, se borran al final)

No toques nada más: ni `VistaCanchas.*`, `IndicadorPasos.*`, `AsistenteTorneo.*`, `useAsistenteTorneo.js`, `src/lib/`, `useReserva.js` ni `Torneo.test.jsx`.

## Reglas

- Textos visibles idénticos a los de hoy (copia exacta, con tildes). Tuteo, sin copy técnico.
- Sin dependencias nuevas.
- No corras `npm run dev`, `preview` ni `vercel dev`.
- Al terminar, resume: archivos cambiados, tests que fallaron en RED, resultado de la prueba diferencial, `npm test` (archivos y tests) y `npm run lint`.
