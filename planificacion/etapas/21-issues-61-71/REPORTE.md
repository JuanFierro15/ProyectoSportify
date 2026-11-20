# Reporte de la etapa 21: issues #61 a #71

Responsable: Juan Fierro. Fecha: 20-11-2026. Plan: [PLAN.md](PLAN.md). Índice
de bloques: [bloques/INDICE-BLOQUES.md](bloques/INDICE-BLOQUES.md).

## Resultado

Las 11 issues que dejó la revisión de las PR #57 a #60 quedaron resueltas en
10 bloques y 7 PR de código, más la PR de esta etapa con el plan y el reporte (todas abiertas; la fusión la decide Juan). La #68 se cerró con la
decisión de Juan: D1 y D2 se quedan como están.

| Issue | Qué se hizo | Rama | Commit(s) |
|---|---|---|---|
| #66 | Pruebas de los casos de riesgo de la sincronización (sondas S2, S5, S6 y S14, choque de eventos en el segundo y el último bloque, dos pendientes con un solo choque); +800 líneas, solo pruebas | `fix/sincronizacion-pestanas-62-66` | `aadd847` |
| #62 | El choque al sincronizar se busca también en las celdas de las reservas guardadas y en las candidatas ya aceptadas; el cambio de día completa la base con la semilla sin perder fechas fuera de la ventana | `fix/sincronizacion-pestanas-62-66` | `f21e8ed` |
| #63 | `renovarSiCambioElDia` ya no guarda un texto ilegible como lo último guardado; con texto ilegible solo cuentan los ids registrados; `despachar` registra altas y cancelaciones al despachar | `fix/sincronizacion-pestanas-62-66` | `40c992f` |
| #64 | `sincronizarConLeido` única para los tres caminos y la clave borrada; `aplicarCancelacion` delega en `quitarReservasDeEstado`; fuera `conservarReservasSinGuardar`, el `export` de `horasUsadasEnCelda` y el id de respaldo; un solo parseo por evento | `refactor/sincronizacion-64` | `d57e955` |
| #65 | Una sola región viva en el aviso (`role="alert"` por aviso) y colores en tokens `--aviso-*` | `fix/aviso-conflicto-61-65` | `0764ade` |
| #61 | El aviso trae `codigo`; la confirmación descartada cambia a "Tu reserva no pudo completarse" sin QR, con "Elegir otro horario" | `fix/aviso-conflicto-61-65` | `89c4514` |
| #69 | `textoRangoFechas` en `src/lib/fechas.js`: una sola fecha si todas las fases son el mismo día | `fix/issue-69` | `5fe9c7d` |
| #70 | El estado de las pastillas cabe a 360 y 390 px (tracking y relleno en `< 400 px`); la barra inferior no se cambió (ya es opaca) | `fix/issue-70` | `c55df0a`, `28f5040` |
| #71 | Prop `textoVisibleAlInicio` en `DeporteHero`: el primer hero arranca con el texto visible y conserva la salida | `fix/issue-71` | `c663e51` |
| #67 | Ramas, commits y log de `odd/tasks/issues-53-54-55-56.md` al día | `docs/issue-67` | `a695074` |
| #68 | D1 y D2 confirmadas por Juan; issue cerrada con comentario | — | — |

## Verificación

- **Ciclos verificados:** los 10 bloques quedaron `APROBADO` por el
  verificador independiente, sin rondas de corrección. b7 y b9 escalaron una
  vez con `FUERA_DE_PERMITIDOS`: correr la suite completa reescribe con LF el
  snapshot `api/_lib/__snapshots__/instrucciones.test.js.snap` (git tiene
  `autocrlf`); se restauró, se agregó `**/__snapshots__/**` a `ignorar` y se
  relanzaron con una retoma (los intentos están en `intento-1/`).
- **Integración** (worktree local con las 7 ramas fusionadas): `npm test`
  40 archivos y 546 pruebas en verde, `npm run lint` sin avisos y
  `npm run build` correcto.
- **App real** (`npm run build` + `vite preview`, Chrome headless por CDP):
  - #71: con `scrollY = 0`, el bloque del primer hero tiene `opacity: 1` a
    1440 y a 390 px, y los otros dos siguen ocultos; cerca del final del pin
    baja a 0,16 y al volver arriba vuelve a 1.
  - #70: a 360 px la pastilla mide 41 px y "bloqueado" ocupa 37 px de 37
    útiles; a 390 px, 37 de 41. **Hallazgo y arreglo:** con
    `letter-spacing: -0.7px` y `overflow: hidden`, la última letra de todas
    las pastillas se cortaba ("11 libre"). Se agregó `overflow: visible` en esa
    media query (`28f5040`) y se comprobó a 360 y 390 px.
  - #61 y #65, a 1440 y 390 px: con `setItem` fallando, reservar 17:00
    muestra el código y el QR; al llegar el `storage` de otra pestaña con la
    misma celda aparece un solo `role="alert"` (sin `aria-live`), el bloque
    "Tu reserva no pudo completarse" recibe el foco y desaparecen el QR y el
    código; cerrar el aviso no los trae de vuelta; "Elegir otro horario" vuelve
    al formulario con el nombre y con las 17:00 deshabilitadas.
  - #69 se cubrió con pruebas (`Torneo.test.jsx` y `fechas.test.js`), no en el
    navegador.
- **Revisión dirigida (Opus):** el núcleo a fondo (#62, #63 y #64). El
  refactor conserva el comportamiento de los cuatro caminos, y
  `ultimoDatosStorageRef` se actualiza siempre junto con
  `ultimoRawStorageRef` (montaje, `sincronizarConLeido` y espejo). La fusión
  del aviso en el núcleo tuvo dos conflictos (prueba del aviso y una frase de
  `reservas.md`), resueltos a mano conservando los dos cambios.

## Desvíos del plan

- El núcleo salió en dos PR encadenadas, como preveía el plan para un diff
  grande: #66, #62 y #63 (1746 líneas, casi todas pruebas) y #64 aparte.
- b8 (#63) agregó que `despachar` registre altas y cancelaciones en el momento
  de despachar. Es necesario para la regla del texto ilegible (solo cuentan los
  ids registrados) sin perder una reserva hecha dentro de `startTransition`.
- El ajuste de `overflow: visible` de la #70 lo hizo el coordinador (una
  línea), tras verlo en el navegador.
- El orden de fusión del plan (el aviso antes que el núcleo) no sirve: las PR
  del aviso (#78) y del núcleo (#79) chocan en `docs/agentes/reservas.md` y
  `AvisoConflictoReserva.test.jsx`. El choque se resolvió dentro de la PR del
  refactor (#80, merge `498785b`), así que el aviso entra con ella.

## Pendientes

- Nueva issue #73: el comprobante del chat tiene la misma contradicción que
  la #61 (lo detectó el bloque b9; no estaba en el alcance).
- Prueba manual de Juan con NVDA o Narrador: que el aviso de conflicto se lea
  una sola vez (#65).
- Revisión de cada PR por otro modelo antes de fusionar, cuando Juan lo pida.
  Orden de fusión, siempre con commit de fusión (un squash de #79 dejaría a
  #80 con commits que ya no están en `main`):
  1. #74, #75, #76 y #77, en cualquier orden.
  2. #79 (núcleo: #66, #62 y #63).
  3. #80 (refactor #64). Trae el aviso (#78, #65 y #61) con el choque ya
     resuelto, así que al entrar GitHub marca #78 como fusionada; #78 no se
     fusiona sola. Si la rama de #79 no se borra al fusionarla, hay que cambiar
     antes la base de #80 a `main`.
  4. #81 (este plan y reporte).
