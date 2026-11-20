# Informe v1: línea base, RED y secuencia de fusión (PR #74 a #81)

Trabajo ejecutado en el worktree descartable (`e22-rev`), comenzando sobre `origin/main` (`39d64c7`). Por la longitud de la ruta del worktree (202 caracteres), todos los comandos de `git` se ejecutaron con `-c core.longpaths=true`.

Se ejecutó `npm ci` una sola vez al inicio (`276` paquetes instalados). Ninguna de las ocho ramas modifica `package.json` ni `package-lock.json`.

---

## 1. Línea base

| ref | commit | archivos | casos | pasan | fallan | árbol tras la suite | lint | build |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| `origin/main` | `39d64c7` | 39 | 511 | 511 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.77 s, sin avisos nuevos) |
| `origin/docs/issue-67` (#74) | `a695074` | — | — | — | — | Solo documentos (`odd/tasks/issues-53-54-55-56.md`) | — | — |
| `origin/fix/issue-69` (#75) | `5fe9c7d` | 39 | 515 | 515 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.53 s, sin avisos nuevos) |
| `origin/fix/issue-70` (#76) | `28f5040` | 40 | 514 | 514 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.96 s, sin avisos nuevos) |
| `origin/fix/issue-71` (#77) | `c663e51` | 39 | 513 | 513 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.65 s, sin avisos nuevos) |
| `origin/fix/aviso-conflicto-61-65` (#78) | `89c4514` | 39 | 517 | 517 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.59 s, sin avisos nuevos) |
| `origin/fix/sincronizacion-pestanas-62-66` (#79) | `40c992f` | 39 | 531 | 531 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.33 s, sin avisos nuevos) |
| `origin/refactor/sincronizacion-64` (#80) | `d57e955` | 39 | 537 | 537 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (1.30 s, sin avisos nuevos) |
| `origin/chore/etapa-21-issues-61-71` (#81) | `a9b86a5` | — | — | — | — | Solo documentos (36 archivos en `planificacion/`) | — | — |

- **Casos fallidos:** ninguno en ninguna rama.
- **Avisos nuevos en `build`:** ninguno (solo aparecen los dos avisos esperados en todas las corridas: `[lightningcss minify] Invalid media query` de `foundation.min.css` y el aviso de chunk mayor a 500 kB).
- **Verificación solo documentos:**
  - `#74` (`origin/docs/issue-67`): modifica únicamente `odd/tasks/issues-53-54-55-56.md`.
  - `#81` (`origin/chore/etapa-21-issues-61-71`): modifica únicamente `planificacion/README.md` y 35 archivos bajo `planificacion/etapas/21-issues-61-71/`.

---

## 2. Pruebas nuevas por PR

### PR #75 (`origin/fix/issue-69` vs `origin/main`)
- `src/components/reservas/Torneo.test.jsx › 24. Torneo de 4 equipos con todas las fases el mismo día no repite la fecha en confirmación ni QR`
- `src/lib/fechas.test.js › textoRangoFechas › misma fecha devuelve una sola fecha sin rango`
- `src/lib/fechas.test.js › textoRangoFechas › fechas distintas del mismo mes devuelve el rango`
- `src/lib/fechas.test.js › textoRangoFechas › fechas de meses distintos devuelve el rango con los dos meses`

### PR #76 (`origin/fix/issue-70` vs `origin/main`, archivo nuevo)
- `src/components/shared/SelectorDia.test.jsx › muestra "bloqueado", deshabilita el botón, termina aria-label en ", bloqueado" y no dispara onChange`
- `src/components/shared/SelectorDia.test.jsx › deshabilita un día lleno no seleccionado con "completo", pero mantiene habilitado el día lleno seleccionado`
- `src/components/shared/SelectorDia.test.jsx › muestra "13 libres" habilitado y llama onChange con la fecha ISO en el segundo y el último día de la tira`

### PR #77 (`origin/fix/issue-71` vs `origin/main`)
- `src/components/hero/DeporteHero.test.jsx › con textoVisibleAlInicio arranca visible en progreso 0, mantiene el tween de salida, vuelve a ser visible al regresar a 0 y limpia al desmontar`
- `src/components/hero/DeporteHero.test.jsx › con prefers-reduced-motion: reduce no crea tweens sobre el bloque con ni sin textoVisibleAlInicio`

### PR #78 (`origin/fix/aviso-conflicto-61-65` vs `origin/main`)
- `src/components/canchas/VistaCanchas.test.jsx › reemplaza la confirmación con QR por "Tu reserva no pudo completarse", enfoca el título y no revierte al cerrar el aviso`
- `src/components/canchas/VistaCanchas.test.jsx › no cambia la confirmación visible cuando llega un aviso de conflicto con otro código`
- `src/components/canchas/VistaCanchas.test.jsx › "Elegir otro horario" conserva modalidad, cancha, fecha, nombre y teléfono sin la hora ocupada y permite confirmar otra hora con código nuevo`
- `src/components/canchas/VistaCanchas.test.jsx › un evento (cumpleaños) descartado por un choque también cambia a "Tu reserva no pudo completarse"`
- `src/components/shared/AvisoConflictoReserva.test.jsx › usa una sola región viva por aviso con dos conflictos y cierra primero el segundo y luego el último`
- `src/components/shared/AvisoConflictoReserva.test.jsx › incluye codigo igual al de la reserva descartada en avisosConflicto conservando id y mensaje`

### PR #79 (`origin/fix/sincronizacion-pestanas-62-66` vs `origin/main`)
- `src/components/shared/AvisoConflictoReserva.test.jsx › #66 caso 5: con dos reservas pendientes y una sola que choca, muestra un solo alert con el código de la que chocó`
- `src/context/ReservasContext.test.jsx › #66 caso 1 (S2): cancelar R1 y volver a reservar R2 en la misma celda sin guardar, luego storage con R1 y Rb deja R2 y Rb sin avisos`
- `src/context/ReservasContext.test.jsx › #66 caso 2 (segundo bloque): un torneo pendiente que choca en su segundo bloque contra una individual guardada se descarta completo`
- `src/context/ReservasContext.test.jsx › #66 caso 2 (último bloque): un torneo pendiente que choca en su último bloque contra una individual guardada se descarta completo`
- `src/context/ReservasContext.test.jsx › #66 caso 3 (S6): borrar la clave con removeItem y clear(), sin pendientes y con cancelación más alta pendiente`
- `src/context/ReservasContext.test.jsx › #66 caso 4 (S14): ultimoRawStorageRef ilegible o nulo (JSON corrupto + cambio de día + storage válido sin R1, y clave borrada + setItem fallando + storage válido con Rb)`
- `src/context/ReservasContext.test.jsx › #66 caso 5 (choca la primera pendiente): queda la segunda pendiente y avisa solo de la primera`
- `src/context/ReservasContext.test.jsx › #66 caso 5 (choca la segunda pendiente): queda la primera pendiente y avisa solo de la segunda`
- `src/context/ReservasContext.test.jsx › S13 (#62): choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados)`
- `src/context/ReservasContext.test.jsx › #62: conciliarReservasSinGuardar detecta choque contra guardado.reservas y entre candidatas aceptadas aunque falte la fecha en ocupados`
- `src/context/ReservasContext.test.jsx › #62: un evento con bloques pendiente cuyo último bloque choca con una reserva guardada ausente de ocupados se descarta entero con un aviso`
- `src/context/ReservasContext.test.jsx › #62: una pendiente que no choca con su fecha ausente de ocupados en lo leído se acepta, ocupa su hora y conserva la semilla del día`
- `src/context/ReservasContext.test.jsx › #62: conserva fechas futuras fuera de la ventana nueva tras el cambio de día con cambio externo`
- `src/context/ReservasContext.test.jsx › #62: repetir focus y visibilitychange después del cambio de día no duplica reservas ni avisos`
- `src/context/ReservasContext.test.jsx › #63: con JSON ilegible en el cambio de día y setItem fallando, R1 cancelada por otra pestaña no revive al llegar storage`
- `src/context/ReservasContext.test.jsx › #63: tras cambio de día con texto ilegible, ultimoRaw conserva lo último legible (una pendiente nueva sobrevive y R1 cancelada por otra pestaña no revive)`
- `src/context/ReservasContext.test.jsx › #63: con ultimoRaw ilegible desde el montaje y setItem fallando, una reserva nueva se conserva al llegar storage y se guarda una sola vez al restaurar setItem`
- `src/context/ReservasContext.test.jsx › #63: con ultimoRaw en null, una reserva hecha dentro de startTransition se conserva al llegar storage en el mismo act`
- `src/context/ReservasContext.test.jsx › #63: repetir focus y repetir el mismo storage tras texto ilegible no duplica reservas ni avisos`
- `src/lib/cancelacion.test.js › #66 (S5): horas compartidas al cancelar con aplicarCancelacion y quitarReservasDeEstado, incluida la última hora del día y un evento con bloques`

### PR #80 (`origin/refactor/sincronizacion-64` vs `498785b`)
- `src/context/ReservasContext.test.jsx › C10 (#50): conciliarReservasSinGuardar no muta sus argumentos y con el registro vacío devuelve el mismo objeto guardado` — **renombrado y adaptado** (antes: `C10 (#50): conservarReservasSinGuardar no muta sus argumentos y con el registro vacío devuelve el mismo objeto guardado`).
- Sin casos agregados ni borrados.

---

## 3. RED por PR

### PR #75 (`origin/fix/issue-69` con producción de `origin/main`)

| caso | contra la base | primera línea del error |
| --- | --- | --- |
| `src/lib/fechas.test.js › misma fecha devuelve una sola fecha sin rango` | **falla** | `TypeError: textoRangoFechas is not a function` |
| `src/lib/fechas.test.js › fechas distintas del mismo mes devuelve el rango` | **falla** | `TypeError: textoRangoFechas is not a function` |
| `src/lib/fechas.test.js › fechas de meses distintos devuelve el rango con los dos meses` | **falla** | `TypeError: textoRangoFechas is not a function` |
| `src/components/reservas/Torneo.test.jsx › 24. Torneo de 4 equipos con todas las fases el mismo día no repite la fecha en confirmación ni QR` | **falla** | `AssertionError: expected 'Sábado 21 de noviembre a Sábado 21 de…' to be 'Sábado 21 de noviembre' // Object.is equality` |

### PR #76 (`origin/fix/issue-70` con `SelectorDia.css` de `origin/main`)

| caso | contra la base | primera línea del error |
| --- | --- | --- |
| `src/components/shared/SelectorDia.test.jsx › muestra "bloqueado", deshabilita el botón, termina aria-label en ", bloqueado" y no dispara onChange` | **pasa** | — (no prueba el arreglo de CSS en jsdom: prueba comportamiento y DOM preexistentes en `SelectorDia.jsx`) |
| `src/components/shared/SelectorDia.test.jsx › deshabilita un día lleno no seleccionado con "completo", pero mantiene habilitado el día lleno seleccionado` | **pasa** | — (ídem) |
| `src/components/shared/SelectorDia.test.jsx › muestra "13 libres" habilitado y llama onChange con la fecha ISO en el segundo y el último día de la tira` | **pasa** | — (ídem) |

### PR #77 (`origin/fix/issue-71` con producción de `origin/main`)

| caso | contra la base | primera línea del error |
| --- | --- | --- |
| `src/components/hero/DeporteHero.test.jsx › con textoVisibleAlInicio arranca visible en progreso 0, mantiene el tween de salida, vuelve a ser visible al regresar a 0 y limpia al desmontar` | **falla** | `AssertionError: expected [ …(2) ] to have a length of 1 but got 2` |
| `src/components/hero/DeporteHero.test.jsx › con prefers-reduced-motion: reduce no crea tweens sobre el bloque con ni sin textoVisibleAlInicio` | **pasa** | — (el comportamiento con `reduced-motion: reduce` ya no creaba tweens antes del arreglo) |

### PR #78 (`origin/fix/aviso-conflicto-61-65` con producción de `origin/main`)

| caso | contra la base | primera línea del error |
| --- | --- | --- |
| `src/components/canchas/VistaCanchas.test.jsx › reemplaza la confirmación con QR por "Tu reserva no pudo completarse", enfoca el título y no revierte al cerrar el aviso` | **falla** | `AssertionError: expected <h3 …(1)></h3> to be null` |
| `src/components/canchas/VistaCanchas.test.jsx › no cambia la confirmación visible cuando llega un aviso de conflicto con otro código` | **pasa** | — (caso de control/regresión: en `origin/main` la confirmación tampoco cambia) |
| `src/components/canchas/VistaCanchas.test.jsx › "Elegir otro horario" conserva modalidad, cancha, fecha, nombre y teléfono sin la hora ocupada y permite confirmar otra hora con código nuevo` | **falla** | `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Elegir otro horario"` |
| `src/components/canchas/VistaCanchas.test.jsx › un evento (cumpleaños) descartado por un choque también cambia a "Tu reserva no pudo completarse"` | **falla** | `AssertionError: expected <h3 …(1)></h3> to be null` |
| `src/components/shared/AvisoConflictoReserva.test.jsx › usa una sola región viva por aviso con dos conflictos y cierra primero el segundo y luego el último` | **falla** | `Error: expect(element).not.toHaveAttribute("aria-live") // element.hasAttribute("aria-live")` |
| `src/components/shared/AvisoConflictoReserva.test.jsx › incluye codigo igual al de la reserva descartada en avisosConflicto conservando id y mensaje` | **falla** | `AssertionError: expected undefined to be 'SPF-B93URC' // Object.is equality` |

### PR #79 (`origin/fix/sincronizacion-pestanas-62-66` con `ReservasContext.jsx` de `origin/main`)

| caso | contra la base | primera línea del error |
| --- | --- | --- |
| `src/components/shared/AvisoConflictoReserva.test.jsx › #66 caso 5: con dos reservas pendientes y una sola que choca, muestra un solo alert con el código de la que chocó` | **pasa** | — (prueba de riesgo #66 sobre comportamiento previo) |
| `src/lib/cancelacion.test.js › #66 (S5): horas compartidas al cancelar con aplicarCancelacion y quitarReservasDeEstado, incluida la última hora del día y un evento con bloques` | **pasa** | — (prueba de riesgo #66 sobre `cancelacion.js` ya existente) |
| `src/context/ReservasContext.test.jsx › #66 caso 1 (S2): cancelar R1 y volver a reservar R2 en la misma celda sin guardar, luego storage con R1 y Rb deja R2 y Rb sin avisos` | **pasa** | — (prueba de riesgo #66 sobre comportamiento previo) |
| `src/context/ReservasContext.test.jsx › #66 caso 2 (segundo bloque): un torneo pendiente que choca en su segundo bloque contra una individual guardada se descarta completo` | **pasa** | — (prueba de riesgo #66) |
| `src/context/ReservasContext.test.jsx › #66 caso 2 (último bloque): un torneo pendiente que choca en su último bloque contra una individual guardada se descarta completo` | **pasa** | — (prueba de riesgo #66) |
| `src/context/ReservasContext.test.jsx › #66 caso 3 (S6): borrar la clave con removeItem y clear(), sin pendientes y con cancelación más alta pendiente` | **pasa** | — (prueba de riesgo #66) |
| `src/context/ReservasContext.test.jsx › #66 caso 4 (S14): ultimoRawStorageRef ilegible o nulo (JSON corrupto + cambio de día + storage válido sin R1, y clave borrada + setItem fallando + storage válido con Rb)` | **pasa** | — (prueba de riesgo #66) |
| `src/context/ReservasContext.test.jsx › #66 caso 5 (choca la primera pendiente): queda la segunda pendiente y avisa solo de la primera` | **pasa** | — (prueba de riesgo #66) |
| `src/context/ReservasContext.test.jsx › #66 caso 5 (choca la segunda pendiente): queda la primera pendiente y avisa solo de la segunda` | **pasa** | — (prueba de riesgo #66) |
| `src/context/ReservasContext.test.jsx › S13 (#62): choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados)` | **falla** | `AssertionError: expected [ 'SPF-S13B02', 'SPF-M7TRAN' ] to deeply equal [ 'SPF-S13B02' ]` |
| `src/context/ReservasContext.test.jsx › #62: conciliarReservasSinGuardar detecta choque contra guardado.reservas y entre candidatas aceptadas aunque falte la fecha en ocupados` | **falla** | `AssertionError: expected [] to deeply equal [ { …(10) } ]` |
| `src/context/ReservasContext.test.jsx › #62: un evento con bloques pendiente cuyo último bloque choca con una reserva guardada ausente de ocupados se descarta entero con un aviso` | **falla** | `AssertionError: expected [ 'SPF-62EV01', 'SPF-9UMA8P' ] to deeply equal [ 'SPF-62EV01' ]` |
| `src/context/ReservasContext.test.jsx › #62: una pendiente que no choca con su fecha ausente de ocupados en lo leído se acepta, ocupa su hora y conserva la semilla del día` | **falla** | `AssertionError: expected false to be true // Object.is equality` |
| `src/context/ReservasContext.test.jsx › #62: conserva fechas futuras fuera de la ventana nueva tras el cambio de día con cambio externo` | **pasa** | — (conservación de fechas futuras ya funcionaba en la base) |
| `src/context/ReservasContext.test.jsx › #62: repetir focus y visibilitychange después del cambio de día no duplica reservas ni avisos` | **falla** | `AssertionError: expected [ 'SPF-62REP1', 'SPF-GAQCC5', …(1) ] to deeply equal [ 'SPF-62REP1', 'SPF-2TSU3K' ]` |
| `src/context/ReservasContext.test.jsx › #63: con JSON ilegible en el cambio de día y setItem fallando, R1 cancelada por otra pestaña no revive al llegar storage` | **falla** | `AssertionError: expected [ 'SPF-63B001', 'SPF-G96C9Q' ] to deeply equal [ 'SPF-63B001' ]` |
| `src/context/ReservasContext.test.jsx › #63: tras cambio de día con texto ilegible, ultimoRaw conserva lo último legible (una pendiente nueva sobrevive y R1 cancelada por otra pestaña no revive)` | **falla** | `AssertionError: expected [ 'SPF-63B002', 'SPF-4BH58H', …(1) ] to deeply equal [ 'SPF-63B002', 'SPF-2RQUHV' ]` |
| `src/context/ReservasContext.test.jsx › #63: con ultimoRaw ilegible desde el montaje y setItem fallando, una reserva nueva se conserva al llegar storage y se guarda una sola vez al restaurar setItem` | **pasa** | — (este escenario sin cambio de día ya se preservaba en la base) |
| `src/context/ReservasContext.test.jsx › #63: con ultimoRaw en null, una reserva hecha dentro de startTransition se conserva al llegar storage en el mismo act` | **pasa** | — (ya se preservaba en la base) |
| `src/context/ReservasContext.test.jsx › #63: repetir focus y repetir el mismo storage tras texto ilegible no duplica reservas ni avisos` | **falla** | `AssertionError: expected [ 'SPF-63C5B1', 'SPF-LQLBNJ', …(1) ] to deeply equal [ 'SPF-63C5B1', 'SPF-F948ED' ]` |

### PR #80 (`origin/refactor/sincronizacion-64`, refactor frente a `498785b`)

Se corrieron los 3 archivos (`src/context/ReservasContext.test.jsx`, `src/lib/cancelacion.test.js`, `src/components/shared/AvisoConflictoReserva.test.jsx`): **96 casos en total**.

| caso | antes del refactor (`498785b`) | después (`d57e955`) |
| --- | --- | --- |
| `src/context/ReservasContext.test.jsx › C10 (#50): conciliarReservasSinGuardar no muta sus argumentos y con el registro vacío devuelve el mismo objeto guardado` | **pasa** | **pasa** |
| Resto de los 95 casos en los 3 archivos (`ReservasContext.test.jsx`, `cancelacion.test.js`, `AvisoConflictoReserva.test.jsx`) | **pasan** (95/95) | **pasan** (95/95) |

---

## 4. Secuencia de fusión

Partiendo de `origin/main` (`39d64c7`), los 7 pasos se fusionaron en orden sin conflictos:

| paso | ref | conflicto | archivos | casos | lint | build |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `origin/docs/issue-67` | No | — | — | — | — |
| 2 | `origin/fix/issue-69` | No | — | 39 archivos, 515/515 pasan | 0 errores, 0 avisos | OK (3.21 s, nota `[PLUGIN_TIMINGS]` informativa) |
| 3 | `origin/fix/issue-70` | No | — | 40 archivos, 518/518 pasan | 0 errores, 0 avisos | OK (1.88 s, sin avisos nuevos) |
| 4 | `origin/fix/issue-71` | No | — | 40 archivos, 520/520 pasan | 0 errores, 0 avisos | OK (1.73 s, sin avisos nuevos) |
| 5 | `origin/fix/sincronizacion-pestanas-62-66` | No | — | 40 archivos, 540/540 pasan | 0 errores, 0 avisos | OK (2.40 s, sin avisos nuevos) |
| 6 | `origin/refactor/sincronizacion-64` | No | — | 40 archivos, 546/546 pasan | 0 errores, 0 avisos | OK (2.15 s, sin avisos nuevos) |
| 7 | `origin/chore/etapa-21-issues-61-71` | No | — | — | — | — |

- En cada paso con corrida de pruebas (2, 3, 4, 5 y 6), `npm test` dejó modificado `api/_lib/__snapshots__/instrucciones.test.js.snap`, revertido antes de continuar.
- **Comprobación de PR #78 (`git merge-base --is-ancestor origin/fix/aviso-conflicto-61-65 HEAD`):** código de salida `0` — `#78` quedó incluida en el `HEAD` final (`8c8b74f`).
- **Estado final del worktree:** `HEAD` en `8c8b74f` y `git status --porcelain` vacío.

---

## 5. Observaciones

- **Pruebas lentas:** La suite completa tardó entre `46.63 s` y `75.10 s` por corrida (`51.33 s` en la corrida verbose sobre el `HEAD` final `8c8b74f`), concentrando `~49 %–59 %` del tiempo en la creación del entorno `jsdom` por archivo (`39` o `40` veces). Casos individuales por encima de `1 s` en el `HEAD` final:
  - `src/components/reservas/Torneo.test.jsx`: caso `19.` (`5059 ms`), `5.` (`4851 ms`), `22.` (`3614 ms`), `21.` (`3435 ms`), `2.` (`3275 ms`), `1.` (`2827 ms`), `16.` (`2609 ms`), `3.` (`2009 ms`), `13.` (`1957 ms`), `17.` (`1560 ms`), `18.` (`1540 ms`), `24.` (`1488 ms`), `4.` (`1421 ms`).
  - `src/App.test.jsx`: `la aplicación se renderiza sin errores con landmark main y skip link en inicio` (`1836 ms`).
  - `src/components/canchas/VistaCanchas.test.jsx`: `S11 — Carrusel con filtro de disponibilidad...` (`1809 ms`), `"Elegir otro horario"...` (`1486 ms`), `un evento (cumpleaños) descartado por un choque...` (`1152 ms`).
  - `src/components/layout/MisReservas.test.jsx`: `busca una reserva por código, muestra sus datos, el QR y permite cancelarla en dos pasos` (`1585 ms`).
  - `src/components/reservas/torneo/AsistenteTorneo.test.jsx`: `en móvil (< 64em)...` (`1316 ms`), `en escritorio (>= 64em)...` (`1149 ms`).
- **Avisos de `act(...)`:** Ninguno en ninguna corrida.
- **Errores en la consola de las pruebas:** Únicamente el mensaje esperado de `jsdom` al renderizar el `<canvas>` del QR: `Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package` (`5` repeticiones en `origin/main` y `#75`/`#76`/`#77`/`#79`; `19` repeticiones en `#78`, `#80` y en el `HEAD` final debido a los casos nuevos de `VistaCanchas.test.jsx`). No hubo otros errores ni rechazos no manejados.
- **`skip` u `only`:** Ninguna ocurrencia en los archivos de prueba (`*.test.js`, `*.test.jsx`).
