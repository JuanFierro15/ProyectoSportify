# Informe v1 — Línea base y verificación RED de las PR #57 a #60

Ejecutado sobre el worktree `<carpeta temporal del job>/rev` tras `npm ci` (sin modificar código de producción ni pruebas).

## 1. Línea base

| ref | archivos | casos | pasan | fallan | lint | build |
| --- | --- | --- | --- | --- | --- | --- |
| `origin/main` (`d2a64c8`) | 38 | 500 | 500 | 0 | 0 errores / 0 avisos | OK (1.50 s) |
| `origin/fix/issue-56` (`e5212c3`) | 38 | 502 | 502 | 0 | 0 errores / 0 avisos | OK (1.49 s) |
| `origin/fix/issue-53` (`95a5771`) | 38 | 507 | 507 | 0 | 0 errores / 0 avisos | OK (1.37 s) |
| `origin/fix/issue-55` (`cfcdf49`) | 39 | 511 | 511 | 0 | 0 errores / 0 avisos | OK (1.26 s) |
| `origin/fix/issue-54` (`cffe519`) | 39 | 511 | 511 | 0 | 0 errores / 0 avisos | OK (1.52 s) |

- **Casos fallidos:** ninguno en los 5 refs.
- **Avisos nuevos en `build`:** ninguno. En los 5 refs solo aparecieron los dos avisos ya esperados: `[lightningcss minify] Invalid media query` (hack de IE en `foundation.min.css`) y el aviso de tamaño de chunk mayor a 500 kB (`dist/assets/index-*.js` entre `548.70 kB` y `553.24 kB`).

## 2. Pruebas nuevas por PR

### PR #57 (`origin/main` → `origin/fix/issue-56`)

- `src/context/ReservasContext.test.jsx` › `#56: reserva despachada dentro de startTransition no se pierde si llega un evento storage antes de que confirme el render`
- `src/context/ReservasContext.test.jsx` › `#56: reserva despachada dentro de startTransition no se pierde si leerEstadoFresco sincroniza otra escritura en el mismo tick`

### PR #58 (`origin/fix/issue-56` → `origin/fix/issue-53`)

- `src/context/ReservasContext.test.jsx` › `#53 camino storage: una cancelación que falló al guardarse no reaparece cuando otra pestaña escribe y se limpia al volver a guardar`
- `src/context/ReservasContext.test.jsx` › `#53 camino leerEstadoFresco: una cancelación sin guardar no reaparece al reservar otra hora después de una escritura externa`
- `src/context/ReservasContext.test.jsx` › `#53 camino renovarSiCambioElDia: una cancelación sin guardar no reaparece al cambiar de día con escritura externa`
- `src/context/ReservasContext.test.jsx` › `#53 + #56: cancelación en startTransition antes del render no reaparece si llega evento storage`
- `src/lib/cancelacion.test.js` › `quitarReservasDeEstado conserva horas compartidas con reservas activas o bloques de torneo sin mutar la entrada (#53)`

### PR #59 (`origin/fix/issue-53` → `origin/fix/issue-55`)

- `src/components/shared/AvisoConflictoReserva.test.jsx` › `muestra el aviso cuando una reserva pendiente choca con otra guardada y permite cerrarlo`
- `src/context/ReservasContext.test.jsx` › `#55: si una reserva pendiente choca con otra ya guardada al llegar storage, se descarta y registra un aviso descartable`
- `src/context/ReservasContext.test.jsx` › `#55: también descarta el choque y avisa cuando sincroniza por leerEstadoFresco`
- `src/lib/cancelacion.test.js` › `aplicarCancelacion no libera una hora que otra reserva activa (individual o evento) sigue usando (#55)`

### PR #60 (`origin/fix/issue-55` → `origin/fix/issue-54`)

- `src/context/ReservasContext.test.jsx` › `C9 (#54): si otra pestaña borra la clave (removeItem o clear), A conserva las reservas sin guardar sobre la semilla y el espejo reintenta guardar` *(caso modificado; reemplaza a `C9 (#50): si otra pestaña borra la clave (removeItem o clear), A vuelve a la semilla con reservas [] aunque tuviera reservas sin guardar`)*

## 3. RED por PR

### PR #57 (`origin/fix/issue-56` con producción de `origin/main`)

Archivos ejecutados: `npx vitest run src/context/ReservasContext.test.jsx` (2 fallaron, 48 pasaron de 50).

| caso | resultado contra la base (falla/pasa) | primera línea del error |
| --- | --- | --- |
| `src/context/ReservasContext.test.jsx` › `#56: reserva despachada dentro de startTransition no se pierde si llega un evento storage antes de que confirme el render` | falla (RED) | `AssertionError: expected [ { tipo: 'individual', …(7) } ] to have a length of 2 but got 1` |
| `src/context/ReservasContext.test.jsx` › `#56: reserva despachada dentro de startTransition no se pierde si leerEstadoFresco sincroniza otra escritura en el mismo tick` | falla (RED) | `AssertionError: expected [ { tipo: 'individual', …(7) }, …(1) ] to have a length of 3 but got 2` |

### PR #58 (`origin/fix/issue-53` con producción de `origin/fix/issue-56`)

Archivos ejecutados: `npx vitest run src/context/ReservasContext.test.jsx src/lib/cancelacion.test.js` (5 fallaron, 65 pasaron de 70).

| caso | resultado contra la base (falla/pasa) | primera línea del error |
| --- | --- | --- |
| `src/context/ReservasContext.test.jsx` › `#53 camino storage: una cancelación que falló al guardarse no reaparece cuando otra pestaña escribe y se limpia al volver a guardar` | falla (RED) | `AssertionError: expected [ 'SPF-G3EYEL', 'SPF-53B1' ] to deeply equal [ 'SPF-53B1' ]` |
| `src/context/ReservasContext.test.jsx` › `#53 camino leerEstadoFresco: una cancelación sin guardar no reaparece al reservar otra hora después de una escritura externa` | falla (RED) | `AssertionError: expected [ 'SPF-A5CDR8', 'SPF-53B2', …(1) ] to deeply equal [ 'SPF-53B2', 'SPF-4HLQVD' ]` |
| `src/context/ReservasContext.test.jsx` › `#53 camino renovarSiCambioElDia: una cancelación sin guardar no reaparece al cambiar de día con escritura externa` | falla (RED) | `AssertionError: expected [ 'SPF-BQRGSG', 'SPF-53B3' ] to deeply equal [ 'SPF-53B3' ]` |
| `src/context/ReservasContext.test.jsx` › `#53 + #56: cancelación en startTransition antes del render no reaparece si llega evento storage` | falla (RED) | `AssertionError: expected [ 'SPF-ALJQ69', 'SPF-53B4' ] to deeply equal [ 'SPF-53B4' ]` |
| `src/lib/cancelacion.test.js` › `quitarReservasDeEstado conserva horas compartidas con reservas activas o bloques de torneo sin mutar la entrada (#53)` | falla (RED) | `TypeError: quitarReservasDeEstado is not a function` |

### PR #59 (`origin/fix/issue-55` con `ReservasContext.jsx` y `cancelacion.js` de `origin/fix/issue-53`)

Archivos ejecutados: `npx vitest run src/components/shared/AvisoConflictoReserva.test.jsx src/context/ReservasContext.test.jsx src/lib/cancelacion.test.js` (4 fallaron, 70 pasaron de 74).

| caso | resultado contra la base (falla/pasa) | primera línea del error |
| --- | --- | --- |
| `src/components/shared/AvisoConflictoReserva.test.jsx` › `muestra el aviso cuando una reserva pendiente choca con otra guardada y permite cerrarlo` | falla (RED) | `TestingLibraryElementError: Unable to find an accessible element with the role "alert"` |
| `src/context/ReservasContext.test.jsx` › `#55: si una reserva pendiente choca con otra ya guardada al llegar storage, se descarta y registra un aviso descartable` | falla (RED) | `AssertionError: expected undefined to deeply equal []` |
| `src/context/ReservasContext.test.jsx` › `#55: también descarta el choque y avisa cuando sincroniza por leerEstadoFresco` | falla (RED) | `AssertionError: expected [ 'SPF-55B2', 'SPF-JFN838', …(1) ] to deeply equal [ 'SPF-55B2', 'SPF-HXSP59' ]` |
| `src/lib/cancelacion.test.js` › `aplicarCancelacion no libera una hora que otra reserva activa (individual o evento) sigue usando (#55)` | falla (RED) | `AssertionError: expected [ '08:00' ] to deeply equal [ '08:00', '09:00', '10:00' ]` |

### PR #60 (`origin/fix/issue-54` con producción de `origin/fix/issue-55`)

Archivos ejecutados: `npx vitest run src/context/ReservasContext.test.jsx` (1 falló, 55 pasaron de 56).

| caso | resultado contra la base (falla/pasa) | primera línea del error |
| --- | --- | --- |
| `src/context/ReservasContext.test.jsx` › `C9 (#54): si otra pestaña borra la clave (removeItem o clear), A conserva las reservas sin guardar sobre la semilla y el espejo reintenta guardar` | falla (RED) | `AssertionError: expected [] to deeply equal [ 'SPF-S737CC' ]` |

## 4. Observaciones

- **Mensaje en consola de pruebas:** en las 5 corridas de `npm test` aparece 5 veces por corrida el aviso de jsdom: `Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package`.
- **Duración de `npm test`:** cada corrida completa tomó entre `47.38 s` (`origin/fix/issue-56`) y `53.20 s` (`origin/fix/issue-54`), dominada por la creación del entorno `jsdom` (55 %–59 % del tiempo total reportado por Vitest, al crearse 38–39 veces).
- **Sin `act(...)` ni `skip`/`only`:** no se observaron advertencias de `act(...)` ni casos omitidos (`skip`) o focalizados (`only`); todos los casos de cada suite completa ejecutaron y pasaron en la línea base.
- **Estado de snapshot tras `npm test` en `origin/main`:** después de ejecutar `npm test` en `origin/main`, `git status` reportó modificado `api/_lib/__snapshots__/instrucciones.test.js.snap` por diferencia de fin de línea en Windows (`warning: in the working copy of 'api/_lib/__snapshots__/instrucciones.test.js.snap', LF will be replaced by CRLF the next time Git touches it`, sin cambios de contenido en `git diff`); se limpió con `git checkout -- .`.
- **Nota sobre limpieza en RED:** `git checkout <base> -- <archivos>` deja los archivos restaurados preparados en el índice de Git, por lo que `git checkout -- .` no los devuelve a `HEAD`. Se usó `git checkout HEAD -- .` al terminar cada comprobación RED; el worktree quedó limpio (`nothing to commit, working tree clean`) en `origin/fix/issue-54` (`cffe519`).
