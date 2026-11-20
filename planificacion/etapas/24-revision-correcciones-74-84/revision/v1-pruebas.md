# Informe v1: línea base, RED, mutación y secuencia de fusión (PR #74 a #84)

- **Worktree de pruebas:** `e24-rev`
- **Dependencias (`package.json`, `package-lock.json`):** ninguna de las 11 ramas (`#74` a `#84`) modifica `package.json` ni `package-lock.json` respecto a `origin/main`. Se ejecutó `npm ci` una sola vez al inicio.

## 1. Línea base

| ref | commit | archivos | casos | pasan | fallan | árbol tras la suite | lint | build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `origin/main` | `39d64c7` | 39 | 511 | 511 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (sin avisos nuevos) |
| `origin/fix/issue-70` | `7ed54ea` | 40 | 514 | 514 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (sin avisos nuevos) |
| `origin/refactor/sincronizacion-64` | `cd3486a` | 39 | 551 | 551 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (sin avisos nuevos) |
| `origin/fix/snapshots-eol` | `11873d8` | 39 | 511 | 511 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (sin avisos nuevos) |

### Detalle `cqi` / `@supports` en `origin/fix/issue-70` (`dist/assets/index-YvkDxtiH.css`)

- Líneas con `cqi` (equivalente a `grep -c "cqi"` sobre CSS minificado): **1** línea (con **3** ocurrencias totales de `cqi`: `clamp(8px,20cqi,12px)`, `clamp(8px,24cqi,9px)` y `@supports not (font-size:1cqi)`).
- Presencia de `@supports not (font-size:1cqi)`: **sí aparece** literalmente (`@supports not (font-size:1cqi){...}`).

### Comprobación de ramas de documentación (`git diff origin/main <rama> --stat`)

- **#74 (`origin/docs/issue-67`):** solo toca `odd/tasks/issues-53-54-55-56.md` (1 archivo, +12/-8). Sin excepciones fuera de `odd/`.
- **#81 (`origin/chore/etapa-21-issues-61-71`):** toca `planificacion/README.md` y archivos `*.md` dentro de `planificacion/etapas/21-issues-61-71/` (36 archivos, +2091). Sin excepciones fuera de `planificacion/` y `*.md`.
- **#82 (`origin/chore/revision-prs-74-81`):** toca `planificacion/README.md` y archivos dentro de `planificacion/etapas/22-revision-prs-74-81/` (35 archivos, +2930). Excepciones (todas dentro de `planificacion/etapas/22-revision-prs-74-81/revision/`): `v2-sondas-e22.test.jsx.txt` (`.txt`) y 19 capturas `.png` en `revision/v3/`. Nada fuera de `planificacion/`.
- **#84 (`origin/chore/etapa-23-hallazgos-revision`):** toca `planificacion/README.md` y archivos dentro de `planificacion/etapas/23-hallazgos-revision-74-81/` (20 archivos, +1876). Excepciones (todas dentro de `planificacion/etapas/23-hallazgos-revision-74-81/revision/`): `antes-76.txt`, `despues-76.txt`, `descartada-despues.json`, `descartada-asistente.mjs`, `medir-pastillas.mjs` y 2 capturas `.png` en `revision/capturas-descartada/`. Nada fuera de `planificacion/`.

## 2. Pruebas nuevas de #80

Diferencia de casos (`git diff d57e955 cd3486a -- '*.test.js' '*.test.jsx'`): **14 casos nuevos** (ninguno borrado ni renombrado).

- `src/components/canchas/VistaCanchas.test.jsx › torneo descartado por choque en Cuartos: "Elegir otro horario" quita solo la hora chocada y conserva las demás horas de Cuartos, Semifinal, Final y contacto`
- `src/components/canchas/VistaCanchas.test.jsx › torneo descartado por choque en la última fase (Final): Cuartos y Semifinal conservan todas sus horas y Final queda sin la hora que chocó`
- `src/components/canchas/VistaCanchas.test.jsx › camino exitoso de torneo: confirma con código y QR sin mostrar mensajes de error`
- `src/components/reservas/torneo/AsistenteTorneo.test.jsx › en móvil (< 64em) al descartar un torneo por choque en Cuartos, "Elegir otro horario" lleva a "Fechas por fase" y conserva las horas no chocadas`
- `src/context/ReservasContext.test.jsx › C1 (N1): por storage, una reserva externa ausente de ocupados descarta la pendiente con aviso, repara ocupados y rechaza re-reservar`
- `src/context/ReservasContext.test.jsx › C2: por leerEstadoFresco (sin evento storage), reservar sobre una reserva externa ausente de ocupados se rechaza y repara la celda`
- `src/context/ReservasContext.test.jsx › C3: sin la clave de la fecha en ocupados del JSON externo, storage y leerEstadoFresco ocupan la hora de la reserva`
- `src/context/ReservasContext.test.jsx › C4: en la carga inicial, las horas de reservas guardadas ausentes de ocupados se reponen en ocupados y disponibilidad`
- `src/context/ReservasContext.test.jsx › C5: un evento con 2 canchas, varias horas y 2 fechas repone todas sus celdas (incluida la segunda y la última)`
- `src/context/ReservasContext.test.jsx › C6: no crea claves fuera de la ventana, no duplica horas existentes y sincronizar dos veces seguidas deja el mismo ocupados`
- `src/context/ReservasContext.test.jsx › C7: cancelación pendiente por storage libera la hora (con y sin la hora en ocupados) salvo que otra reserva activa la use`
- `src/context/ReservasContext.test.jsx › C9: ni la carga inicial ni la sincronización (storage, leerEstadoFresco, cambio de día) mutan el objeto parseado de lo leído`
- `src/lib/cancelacion.test.js › quitarReservasDeEstado descarta entradas null o sin id al quitar y devuelve la misma referencia si no quita nada (H6)`
- `src/lib/cancelacion.test.js › aplicarCancelacion sobre un estado con null y entradas sin id cancela bien y no los deja en reservas (H6)`

## 3. RED

### #80 (`origin/refactor/sincronizacion-64`, base `d57e955`)

- **R1 (`src/context/ReservasContext.jsx`):** 8 fallos, 111 pasan (de 119 en los 4 archivos).
- **R2 (`src/lib/cancelacion.js`):** 2 fallos, 117 pasan.
- **R3 (`src/components/reservas/useReserva.js`):** 3 fallos, 116 pasan.

| caso | R1 | R2 | R3 | ¿lo prueba? |
| --- | --- | --- | --- | --- |
| `VistaCanchas.test.jsx › torneo descartado por choque en Cuartos: "Elegir otro horario" quita solo la hora chocada y conserva las demás horas de Cuartos, Semifinal, Final y contacto` | Pasa | Pasa | **Falla** (`Expected the element to have attribute: aria-pressed="true"`) | Sí (R3) |
| `VistaCanchas.test.jsx › torneo descartado por choque en la última fase (Final): Cuartos y Semifinal conservan todas sus horas y Final queda sin la hora que chocó` | Pasa | Pasa | **Falla** (`Expected the element to have attribute: aria-pressed="true"`) | Sí (R3) |
| `VistaCanchas.test.jsx › camino exitoso de torneo: confirma con código y QR sin mostrar mensajes de error` | Pasa | Pasa | Pasa | Pasa en los tres (no prueba el arreglo; prueba camino feliz) |
| `AsistenteTorneo.test.jsx › en móvil (< 64em) al descartar un torneo por choque en Cuartos, "Elegir otro horario" lleva a "Fechas por fase" y conserva las horas no chocadas` | Pasa | Pasa | **Falla** (`Expected the element to have attribute: aria-pressed="true"`) | Sí (R3) |
| `ReservasContext.test.jsx › C1 (N1): por storage, una reserva externa ausente de ocupados descarta la pendiente con aviso, repara ocupados y rechaza re-reservar` | **Falla** (`AssertionError: expected [ '12:00', '13:00' ] to deeply equal [ '12:00', '13:00', '16:00' ]`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C2: por leerEstadoFresco (sin evento storage), reservar sobre una reserva externa ausente de ocupados se rechaza y repara la celda` | **Falla** (`AssertionError: expected { ok: true, codigo: 'SPF-MDYF52' } to deeply equal { ok: false, …(1) }`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C3: sin la clave de la fecha en ocupados del JSON externo, storage y leerEstadoFresco ocupan la hora de la reserva` | **Falla** (`AssertionError: expected [ '12:00', '13:00' ] to deeply equal [ '12:00', '13:00', '16:00' ]`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C4: en la carga inicial, las horas de reservas guardadas ausentes de ocupados se reponen en ocupados y disponibilidad` | **Falla** (`AssertionError: expected [ '12:00', '13:00' ] to deeply equal [ '12:00', '13:00', '16:00' ]`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C5: un evento con 2 canchas, varias horas y 2 fechas repone todas sus celdas (incluida la segunda y la última)` | **Falla** (`AssertionError: expected [ '12:00', '13:00', '16:00' ] to deeply equal [ '12:00', '13:00', '16:00', '18:00' ]`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C6: no crea claves fuera de la ventana, no duplica horas existentes y sincronizar dos veces seguidas deja el mismo ocupados` | **Falla** (`AssertionError: expected [ '12:00', '13:00' ] to deeply equal [ '12:00', '13:00', '16:00' ]`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C7: cancelación pendiente por storage libera la hora (con y sin la hora en ocupados) salvo que otra reserva activa la use` | **Falla** (`AssertionError: expected [ '12:00', '13:00' ] to deeply equal [ '12:00', '13:00', '16:00' ]`) | Pasa | Pasa | Sí (R1) |
| `ReservasContext.test.jsx › C9: ni la carga inicial ni la sincronización (storage, leerEstadoFresco, cambio de día) mutan el objeto parseado de lo leído` | **Falla** (`AssertionError: expected [ '12:00', '13:00' ] to deeply equal [ '12:00', '13:00', '16:00' ]`) | Pasa | Pasa | Sí (R1) |
| `cancelacion.test.js › quitarReservasDeEstado descarta entradas null o sin id al quitar y devuelve la misma referencia si no quita nada (H6)` | Pasa | **Falla** (`AssertionError: expected [ null, { sinId: true }, …(1) ] to deeply equal [ { id: 'r2', …(7) } ]`) | Pasa | Sí (R2) |
| `cancelacion.test.js › aplicarCancelacion sobre un estado con null y entradas sin id cancela bien y no los deja en reservas (H6)` | Pasa | **Falla** (`AssertionError: expected [ null, { sinId: true }, …(1) ] to deeply equal [ { id: 'r2', …(7) } ]`) | Pasa | Sí (R2) |

### #76 (`origin/fix/issue-70`, devolviendo `src/components/shared/SelectorDia.css` a `origin/main`)

- Comando: `npx vitest run --maxWorkers=1 src/components/shared`
- Resultado: **2 archivos pasan, 4 casos pasan, 0 fallos** (ningún caso falla al revertir `SelectorDia.css`; las pruebas unitarias en jsdom no evalúan reglas CSS ni `cqi`/`@supports`).

## 4. Mutación

Sobre `origin/refactor/sincronizacion-64` (`cd3486a`), corriendo `npx vitest run --maxWorkers=1 src/context/ReservasContext.test.jsx` (82 casos en total):

| mutación | casos que fallan | camino |
| --- | --- | --- |
| **M1** (`leerGuardado`: `ocupados` con `fusionarConSemilla(...)` sin `aplicarHorasDeReservas`) | 3 fallos / 79 pasan:<br>- `C4: en la carga inicial, las horas de reservas guardadas ausentes de ocupados se reponen en ocupados y disponibilidad`<br>- `C6: no crea claves fuera de la ventana, no duplica horas existentes y sincronizar dos veces seguidas deja el mismo ocupados`<br>- `C9: ni la carga inicial ni la sincronización (storage, leerEstadoFresco, cambio de día) mutan el objeto parseado de lo leído` | Carga inicial (`crearEstadoInicial` / `leerGuardado`) |
| **M2** (`sincronizarConLeido`: pasar `base` en vez de `baseReparada` a `conciliarLecturaExterna`) | 8 fallos / 74 pasan:<br>- `S13 (#62): choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados)`<br>- `#62: un evento con bloques pendiente cuyo último bloque choca con una reserva guardada ausente de ocupados se descarta entero con un aviso`<br>- `C1 (N1): por storage, una reserva externa ausente de ocupados descarta la pendiente con aviso, repara ocupados y rechaza re-reservar`<br>- `C2: por leerEstadoFresco (sin evento storage), reservar sobre una reserva externa ausente de ocupados se rechaza y repara la celda`<br>- `C3: sin la clave de la fecha en ocupados del JSON externo, storage y leerEstadoFresco ocupan la hora de la reserva`<br>- `C5: un evento con 2 canchas, varias horas y 2 fechas repone todas sus celdas (incluida la segunda y la última)`<br>- `C6: no crea claves fuera de la ventana, no duplica horas existentes y sincronizar dos veces seguidas deja el mismo ocupados`<br>- `C7: cancelación pendiente por storage libera la hora (con y sin la hora en ocupados) salvo que otra reserva activa la use` | Ver clasificación por camino debajo |
| **M3** (M1 + M2 juntas) | 10 fallos / 72 pasan: los 2 de `#62` (`S13` y evento con bloques) + los 8 de `H2` (`C1`, `C2`, `C3`, `C4`, `C5`, `C6`, `C7`, `C9`) | Carga inicial + `storage` + `leerEstadoFresco` + cambio de día |

### Clasificación de los fallos de M2 por camino

- **Evento `storage`:** `C1 (N1)`, `C3` (falla en el 1.er subcaso, por `storage`), `C5`, `C6` (falla en el 2.º subcaso, línea 5439, al sincronizar por `storage`), `C7` (5 casos).
- **`leerEstadoFresco` / lectura antes de guardar:** `C2` (1 caso; `C3` también prueba este camino en su 2.º subcaso tras el de `storage`).
- **Cambio de día (`renovarSiCambioElDia`):** `S13 (#62)` y `#62: un evento con bloques pendiente cuyo último bloque choca con una reserva guardada ausente de ocupados se descarta entero con un aviso` (2 casos).
- **Otros caminos:** ninguno de los 3 caminos principales de M2 queda sin cobertura (todos tienen al menos 1 caso que falla). La carga inicial no se prueba en M2 sino en M1.

## 5. Snapshot (#83)

1. En `origin/fix/snapshots-eol` (`11873d8`):
   - `git ls-files --eol api/_lib/__snapshots__/instrucciones.test.js.snap`:
     ```text
     i/lf    w/lf    attr/text eol=lf      	api/_lib/__snapshots__/instrucciones.test.js.snap
     ```
   - `git config core.autocrlf`:
     ```text
     true
     ```
2. En el clon existente desde `origin/main` (`39d64c7`):
   - `npm test -- --maxWorkers=1`: 39 archivos, 511 pasan, 0 fallan.
   - `git status --porcelain` tras `npm test`: *(vacío)* (nota: en la corrida previa de línea base sobre `origin/main` y `#83` sí había aparecido `M api/_lib/__snapshots__/instrucciones.test.js.snap`, pero tras hacer checkout previo a `#83` en 5.1 el archivo en disco ya había quedado normalizado en LF).
3. `git checkout --detach origin/fix/snapshots-eol` **sin** tocar el snapshot:
   - `git ls-files --eol api/_lib/__snapshots__/instrucciones.test.js.snap`:
     ```text
     i/lf    w/lf    attr/text eol=lf      	api/_lib/__snapshots__/instrucciones.test.js.snap
     ```
   - `git status --porcelain` (antes de `npm test`): *(vacío)*
   - `npm test -- --maxWorkers=1`: 39 archivos, 511 pasan, 0 fallan.
   - `git status --porcelain` (tras `npm test`): *(vacío)*
4. `git checkout -- api/_lib/__snapshots__/instrucciones.test.js.snap`:
   - `git ls-files --eol api/_lib/__snapshots__/instrucciones.test.js.snap`:
     ```text
     i/lf    w/lf    attr/text eol=lf      	api/_lib/__snapshots__/instrucciones.test.js.snap
     ```
   - `npm test -- --maxWorkers=1`: 39 archivos, 511 pasan, 0 fallan.
   - `git status --porcelain` (tras `npm test`): *(vacío)*

## 6. Secuencia de fusión

| paso | ref | conflicto | archivos | casos | lint | build | árbol tras la suite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `origin/docs/issue-67` | No | — | *(solo docs)* | — | — | — |
| 2 | `origin/fix/issue-69` | No | 39 | 515 pasan, 0 fallan | 0 errores, 0 avisos | OK (sin avisos nuevos) | *(vacío)* |
| 3 | `origin/fix/issue-70` | No | 40 | 518 pasan, 0 fallan | 0 errores, 0 avisos | OK (sin avisos nuevos) | *(vacío)* |
| 4 | `origin/fix/issue-71` | No | 40 | 520 pasan, 0 fallan | 0 errores, 0 avisos | OK (sin avisos nuevos) | *(vacío)* |
| 5 | `origin/fix/sincronizacion-pestanas-62-66` | No | 40 | 540 pasan, 0 fallan | 0 errores, 0 avisos | OK (sin avisos nuevos) | *(vacío)* |
| 6 | `origin/refactor/sincronizacion-64` | No (auto-merge en `pagina-reserva.md` y `useReserva.js`) | 40 | 560 pasan, 0 fallan | 0 errores, 0 avisos | OK (sin avisos nuevos) | *(vacío)* |
| 7 | `origin/fix/snapshots-eol` | No | 40 | 560 pasan, 0 fallan | 0 errores, 0 avisos | OK (sin avisos nuevos) | *(vacío)* |
| 8 | `origin/chore/etapa-21-issues-61-71` | No | — | *(solo docs)* | — | — | — |
| 9 | `origin/chore/revision-prs-74-81` | Sí (`planificacion/README.md`, tabla de etapas; resuelto dejando HEAD + entrante) | — | *(solo docs)* | — | — | — |
| 10 | `origin/chore/etapa-23-hallazgos-revision` | Sí (`planificacion/README.md`, tabla de etapas; resuelto dejando HEAD + entrante) | — | *(solo docs)* | — | — | — |

### Bloques de conflicto en `planificacion/README.md`

#### Paso 9 (`origin/chore/revision-prs-74-81`)

```markdown
<<<<<<< HEAD
| `21-issues-61-71` | Issues #61 a #71 de la revisión de la etapa 20: casos de riesgo en pruebas (#66), choque contra reservas guardadas (#62), lo último guardado ilegible (#63), sincronización unificada (#64), aviso con una región viva y tokens (#65), confirmación descartada (#61), fecha del torneo en un día (#69), pastillas del selector de día desde 320 px (#70), texto del primer hero (#71) y doc ODD (#67); #68 cerrada con D1 y D2 confirmadas; nueva #73 (20-11, 7 PR) | Juan Fierro | sí | no | sí | b1 a b10 (ciclo verificado) |
=======
| `22-revision-prs-74-81` | Revisión de las PR #74 a #81 de la etapa 21 (issues #61 a #71): diffs, RED, impacto, 24 sondas, `judgment-day` y app real. Veredicto: ninguna bloquea; orden probado #74-#77, #79, #80 (trae #78), #81 (#78 y #79 chocan entre sí). Hallazgos H1 a H6 (rama `chore/revision-prs-74-81`, 20-11) | Miguel Medina | sí | no | sí | v1, v2, v3 |
>>>>>>> origin/chore/revision-prs-74-81
```

#### Paso 10 (`origin/chore/etapa-23-hallazgos-revision`)

```markdown
<<<<<<< HEAD
| `21-issues-61-71` | Issues #61 a #71 de la revisión de la etapa 20: casos de riesgo en pruebas (#66), choque contra reservas guardadas (#62), lo último guardado ilegible (#63), sincronización unificada (#64), aviso con una región viva y tokens (#65), confirmación descartada (#61), fecha del torneo en un día (#69), pastillas del selector de día desde 320 px (#70), texto del primer hero (#71) y doc ODD (#67); #68 cerrada con D1 y D2 confirmadas; nueva #73 (20-11, 7 PR) | Juan Fierro | sí | no | sí | b1 a b10 (ciclo verificado) |
| `22-revision-prs-74-81` | Revisión de las PR #74 a #81 de la etapa 21 (issues #61 a #71): diffs, RED, impacto, 24 sondas, `judgment-day` y app real. Veredicto: ninguna bloquea; orden probado #74-#77, #79, #80 (trae #78), #81 (#78 y #79 chocan entre sí). Hallazgos H1 a H6 (rama `chore/revision-prs-74-81`, 20-11) | Miguel Medina | sí | no | sí | v1, v2, v3 |
=======
| `23-hallazgos-revision-74-81` | Corrección de los hallazgos de la revisión de la etapa 22 en sus PR: pastillas por ancho real con `cqi` (#76, H1), horas de reservas guardadas en todos los caminos de lectura y `null` en reservas (#80, H2 y H6), `.gitattributes` de snapshots (#83, H3), orden de fusión (#81, H4) y doc ODD (#74, H5); además, "Elegir otro horario" en torneo conserva las horas que no chocaron (#80, #61). Ensayo de fusión: 560 pruebas (20-11) | Juan Fierro | sí | no | sí | p1, n1, n2 (ciclo verificado) |
>>>>>>> origin/chore/etapa-23-hallazgos-revision
```

### Comprobación de #78 incluida

- `git merge-base --is-ancestor origin/fix/aviso-conflicto-61-65 HEAD; echo $?`: **`0`** (`#78` quedó incluida en `HEAD` vía `#80`).

### Filas `| \`2` en `planificacion/README.md`

```markdown
| `2-carrusel-y-pagina-de-reserva` | Fotos protagonistas en el carrusel, detalle sobre la foto en fútbol y la reserva como página propia (23-10) | Juan Fierro | no | no | sí | c1, k1, p1 |
| `20-revision-prs-57-60` | Revisión de las PR encadenadas #57 a #60 (issues #53 a #56) antes de fusionarlas: diffs, RED, impacto, 14 sondas adversariales, `judgment-day` y app real. Veredicto: ninguna bloquea. Fusionadas en orden el 20-11 (`main` en `22efa01`); hallazgos en las issues #61 a #71 (rama `chore/revision-prs-57-60`, 19/20-11) | Miguel Medina | sí | no | sí | v1, v2, v3 |
| `21-issues-61-71` | Issues #61 a #71 de la revisión de la etapa 20: casos de riesgo en pruebas (#66), choque contra reservas guardadas (#62), lo último guardado ilegible (#63), sincronización unificada (#64), aviso con una región viva y tokens (#65), confirmación descartada (#61), fecha del torneo en un día (#69), pastillas del selector de día desde 320 px (#70), texto del primer hero (#71) y doc ODD (#67); #68 cerrada con D1 y D2 confirmadas; nueva #73 (20-11, 7 PR) | Juan Fierro | sí | no | sí | b1 a b10 (ciclo verificado) |
| `22-revision-prs-74-81` | Revisión de las PR #74 a #81 de la etapa 21 (issues #61 a #71): diffs, RED, impacto, 24 sondas, `judgment-day` y app real. Veredicto: ninguna bloquea; orden probado #74-#77, #79, #80 (trae #78), #81 (#78 y #79 chocan entre sí). Hallazgos H1 a H6 (rama `chore/revision-prs-74-81`, 20-11) | Miguel Medina | sí | no | sí | v1, v2, v3 |
| `23-hallazgos-revision-74-81` | Corrección de los hallazgos de la revisión de la etapa 22 en sus PR: pastillas por ancho real con `cqi` (#76, H1), horas de reservas guardadas en todos los caminos de lectura y `null` en reservas (#80, H2 y H6), `.gitattributes` de snapshots (#83, H3), orden de fusión (#81, H4) y doc ODD (#74, H5); además, "Elegir otro horario" en torneo conserva las horas que no chocaron (#80, #61). Ensayo de fusión: 560 pruebas (20-11) | Juan Fierro | sí | no | sí | p1, n1, n2 (ciclo verificado) |
```

- Orden de etapas: **sí**, `20`, `21`, `22`, `23` están en orden ascendente y **sin filas repetidas** (`24` no está en `planificacion/README.md` todavía).

### `git log --oneline -12` (HEAD final `5d4f43b`)

```text
5d4f43b Merge remote-tracking branch 'origin/chore/etapa-23-hallazgos-revision' into HEAD
e7a1576 Merge remote-tracking branch 'origin/chore/revision-prs-74-81' into HEAD
d728ccb Merge remote-tracking branch 'origin/chore/etapa-21-issues-61-71' into HEAD
f960e7e Merge remote-tracking branch 'origin/fix/snapshots-eol' into HEAD
6b79754 Merge remote-tracking branch 'origin/refactor/sincronizacion-64' into HEAD
f1dc3ad Merge remote-tracking branch 'origin/fix/sincronizacion-pestanas-62-66' into HEAD
51aabf2 Merge remote-tracking branch 'origin/fix/issue-71' into HEAD
c71b0cb Merge remote-tracking branch 'origin/fix/issue-70' into HEAD
f75ad0b Merge remote-tracking branch 'origin/fix/issue-69' into HEAD
969a631 Merge remote-tracking branch 'origin/docs/issue-67' into HEAD
3d5f930 docs: plan y reporte de la etapa 23 (hallazgos de la revisión de las PR #74 a #81)
cd3486a fix: conserva las horas del torneo que no chocaron al elegir otro horario (#61)
```

## 7. Observaciones

- **Avisos de `act(...)`:** ninguno observado en ninguna corrida.
- **Errores/mensajes en consola:** únicamente `Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package` durante pruebas con QR en jsdom (5 ocurrencias en corridas de 39–40 archivos antes de `#80`, y 26 ocurrencias tras integrar `#80`). Ningún otro error en consola; `eslint` reportó 0 errores y 0 avisos; `vite build` no emitió avisos distintos de los esperados (`Invalid media query` de Foundation y tamaño de chunk `> 500 kB`).
- **`skip` / `only`:** 0 ocurrencias en `*.test.js` y `*.test.jsx` (`git grep -nE '\b(it|test|describe)\.(skip|only)\b' -- '*.test.js' '*.test.jsx'` sin coincidencias).
- **Pruebas lentas / rendimiento:** todas las corridas se ejecutaron con `--maxWorkers=1` para evitar falta de recursos (`0xC0000142`). La suite completa de 39–40 archivos tardó ~146–159 s por corrida (~63–66 % en creación repetida de `jsdom`: ~91–95 s). En las corridas acotadas de 4 archivos (`steps/31` y `steps/42`), `VistaCanchas.test.jsx` (~5,1 s) y `AsistenteTorneo.test.jsx` (~2,0 s) concentraron casi todo el tiempo frente a `ReservasContext.test.jsx` (~0,34–0,41 s) y `cancelacion.test.js` (~0,02 s).
- **Estado final del worktree:** `git status --porcelain` vacío en `5d4f43b`.
