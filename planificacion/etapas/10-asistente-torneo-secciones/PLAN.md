# Etapa 10: secciones del formulario del torneo y CSS móvil (frente B)

Issue: #6. Responsable: Miguel Medina. Rama: `feat/asistente-torneo-movil-secciones`
(desde `origin/feat/asistente-torneo-movil`), PR a `main` con `Closes #6`.
Especificación: `odd/tasks/asistente-torneo-movil.md`, tareas **B1** (S7) y **B2** (S8).

## Hallazgos

- El frente A ya llama `FormularioReserva` con `seccion` en
  `torneo/AsistenteTorneo.jsx:88-125`; hoy la prop se ignora y cada paso muestra
  el formulario entero.
- El agrupamiento de la spec no coincide con el DOM de escritorio: el fieldset
  "Formato del torneo" junta equipos, duración, desempate, **emparejamiento** y
  **capacidad**; en móvil el emparejamiento va al paso `llaves` y la capacidad al
  paso `fechas`. Por eso los bloques se extraen en piezas más finas que los pasos
  y el formulario las compone de dos maneras.
- `Bracket.css` ya desplaza en horizontal dentro de su contenedor
  (`overflow-x: auto`, líneas 158 y 365): B2 parte de medir, no de reescribir.

## Diseño (B1)

Componentes nuevos en `src/components/reservas/torneo/` (uno por archivo, props
`reserva` y lo mínimo extra):

| Archivo | Contenido (movido tal cual desde `FormularioReserva.jsx`) |
| --- | --- |
| `PasoFormato.jsx` | aviso `errorCanchas`, cantidad de equipos, duración con su nota, desempate |
| `PasoLlaves.jsx` | emparejamiento: Aleatorio/Manual, "Volver a sortear llaves", `AsignacionManual` |
| `PasoCapacidad.jsx` | "Capacidad y tiempo estimado", canchas por fase y `AlertaTiempo` |
| `PasoFechas.jsx` | fieldset "Programación por fases" con `CalendarioTorneo` |
| `PasoDatos.jsx` | fieldset "Tus datos" (también lo usan Cancha y Cumpleaños, con invitados) |
| `PasoGuardados.jsx` | `<details>` "Torneos reservados" (no renderiza nada si no hay) |

`FormularioReserva`:

- **Sin `seccion`**: mismo árbol de hoy. El fieldset "Formato del torneo" envuelve
  `PasoFormato` + `PasoLlaves` + `PasoCapacidad` en ese orden; después
  `PasoFechas`, `PasoGuardados` y `PasoDatos`. Mismas clases y mismo orden: sin
  cambios en escritorio ni en Cancha/Cumpleaños.
- **Con `seccion`** (solo en modo torneo): `formato` → fieldset "Formato del torneo"
  con `PasoFormato`; `fechas` → `PasoFechas` + `PasoCapacidad`; `llaves` →
  fieldset con `PasoLlaves`; `datos` → `PasoDatos`; `guardados` → `PasoGuardados`.
- El aviso `reserva.error` se sigue mostrando arriba del bloque en cualquier caso.
- Un `seccion` desconocido o fuera del modo torneo se comporta como sin `seccion`.

Tests (`FormularioReserva.test.jsx`, nuevo, primero en RED): sin `seccion` se ven
todos los bloques del torneo y los de Cancha/Cumpleaños siguen igual; con cada uno
de los cinco valores aparece solo su bloque y los otros cuatro no.

## Diseño (B2)

- Revisar a 390×844 cada paso con `npm run build` + `npm run preview` y Chrome
  headless (`document.documentElement.scrollWidth <= innerWidth`).
- Corregir solo bajo `(max-width: 63.9375em)` en los CSS permitidos: pills que
  envuelvan, métricas en columna, `min-width: 0` donde un hijo flex empuje, y el
  bracket con scroll propio y rondas legibles.
- Comparar capturas 1440×900 antes y después: sin diferencias.

## Ejecución

Según el reparto de la etapa 9: código con agy `gemini-3.8-flash-high` (una
tarea, B1 + B2 juntas: comparten archivo), pruebas y capturas con agy
`gemini-4-argon-medium` en segundo plano; yo reviso el diff, corro `npm test` y
`npm run lint` y hago los commits (`test:`, `feat:`, `fix:` o `style:` por tema).
Al final: B1 y B2 marcadas en el documento de la spec, `REPORTE.md`, fila en
`planificacion/README.md`, push y PR a `main`.

Pronóstico: unas 350 líneas (casi todo movido, no nuevo). Riesgo: ninguno de la
lista alta (sin datos, contratos públicos ni dependencias; tests cubren la
regresión de escritorio).

## Fuera de alcance

Archivos del frente A (`VistaCanchas.*`, `IndicadorPasos.*`, `AsistenteTorneo.*`,
`useAsistenteTorneo.js`, `src/lib/pasosTorneo.*`, `Torneo.test.jsx`), README y
capturas (son de C1).
