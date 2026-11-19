# Plan de la etapa 19: issues #50 y #51 (estado de reservas entre renders y pestañas)

**Estado:** aprobado por Miguel Medina el 19-11-2026. Rama `fix/issues-50-51`, creada desde
`main` en `f4baa69`. Un solo PR a `main` que cierra las dos issues; lo revisa y
fusiona Juan Fierro.

## Qué se pidió

Resolver las dos issues abiertas, que salieron de la revisión del PR #48
(etapa 17). Las dos están en `src/context/ReservasContext.jsx`.

- **#51.** `ReservasProvider` hace `estadoRef.current = state` en cada render
  (línea 738) y `despachar` adelanta `estadoRef.current` con el `reducer` de
  forma síncrona (línea 753). Si React confirma un render que todavía no
  incluye una acción ya adelantada (una acción dentro de `startTransition`, o
  un render del padre que React procesa antes que la transición), la
  asignación del render pisa el avance. `leerEstadoFresco` y `disponibilidad`
  vuelven a ver el estado anterior y una segunda reserva en el mismo tick se
  valida contra datos viejos. Hoy no pasa porque ningún manejador usa
  transiciones.
- **#50.** Si una pestaña no pudo guardar (el `setItem` del efecto espejo
  lanza: cuota llena o modo privado) y otra pestaña sí guarda, la primera
  pierde las reservas que solo tenía en memoria por dos caminos:
  1. listener `storage` y `leerEstadoFresco` despachan `SINCRONIZAR`, que
     reemplaza `reservas` y `ocupados` por lo guardado;
  2. `renovarSiCambioElDia` detecta la escritura externa y despacha
     `RENOVAR_VENTANA` con `conservarMemoriaEnVentanaPrevia: false`, y el
     `reducer` toma `reservas` de `datosStorage`.
  `docs/agentes/reservas.md` (línea 9) lo anota como limitación conocida.

## Qué hay hoy

- `src/context/ReservasContext.jsx` (1035 líneas): `reducer` exportado
  (línea 459), `ReservasProvider` (734), efecto espejo con el `try/catch` del
  `setItem` (757-791), `renovarSiCambioElDia` (793-834), listener `storage`
  (836-882), `leerEstadoFresco` (884-912), `reservar`, `reservarEvento` y
  `cancelar` (922-997).
- `src/context/ReservasContext.test.jsx`: 34 pruebas (las de la etapa 17).
- `src/lib/cancelacion.js`: `horasDeReserva` y `aplicarCancelacion`.
- Ids de reserva: `<cancha>__<fecha>__<hora>__<marca>` para las individuales y
  `evento__<fecha>__<marca>` para torneos y cumpleaños.

## Decisiones

1. **#51 con un contador de versión, no con `useLayoutEffect`.** Un efecto de
   layout corre después de confirmar, y el estado confirmado puede seguir sin
   la acción de la transición, así que también pisaría el avance. Con una
   versión el render solo reemplaza el ref si trae un estado igual o más nuevo.
   - Se envuelve el `reducer`: `reducerVersionado(state, action)` llama al
     `reducer` exportado y, si devuelve otro objeto, le suma 1 a `version`; si
     devuelve el mismo, devuelve el mismo. `useReducer` y `despachar` usan el
     envoltorio. El `reducer` exportado no cambia (sus pruebas siguen igual).
   - `crearEstadoInicial` arranca con `version: 0`.
   - En el render: `if (state.version >= estadoRef.current.version) estadoRef.current = state;`.
   - `version` no se guarda en `localStorage` (el espejo solo escribe
     `ocupados` y `reservas`).
2. **#50 con un registro de reservas sin guardar y una fusión por `id`.**
   - Un ref `idsSinGuardarRef` (`Set`). Si el `setItem` del espejo lanza, se
     agregan los ids de `state.reservas` que no están en lo último guardado con
     éxito. Si el `setItem` funciona, se vacía.
   - Una función pura exportada, `conservarReservasSinGuardar(guardado, reservasMemoria, idsSinGuardar)`,
     devuelve `{ ocupados, reservas }`: las reservas de `guardado` más las
     pendientes cuyo `id` no esté ya ahí, y sus horas agregadas a `ocupados`
     (individual: `canchaId`, `fecha`, `horasDeReserva`; evento: cada bloque),
     solo en fechas de la ventana, sin duplicar horas y sin mutar.
   - Se aplica en los tres caminos de la issue: el listener `storage` cuando hay
     datos, `leerEstadoFresco` y `renovarSiCambioElDia` cuando hubo cambio
     externo (sobre `datosStorage` antes de despachar `RENOVAR_VENTANA`).
   - Si después de fusionar quedan pendientes, el listener no marca
     `syncDesdeStorageRef`, para que el espejo vuelva a intentar guardar el
     estado fusionado (si ahora hay espacio, las pendientes quedan guardadas y
     llegan a las demás pestañas). No hay bucle: la otra pestaña recibe el
     evento y su propio `syncDesdeStorageRef` evita que lo reescriba.
   - Cancelar en la pestaña A una reserva pendiente la saca del conjunto.
   - **Fuera de alcance:** si otra pestaña borra la clave (`removeItem` o
     `clear`), se sigue reiniciando a la semilla y a `reservas: []`, como hoy.
     Tampoco se cubren cancelaciones que no se pudieron guardar.
3. **Dos bloques en secuencia, en el mismo worktree.** Tocan el mismo archivo y
   `#50` usa el `despachar` que deja `#51`. Primero `e1` (#51), después `e2`
   (#50). Un solo ciclo a la vez, también por la RAM.

## Bloques

| Id | Issue | Implementador | Verificador | Ola |
| --- | --- | --- | --- | --- |
| `e1-version-estado` | #51 | `gemini-4-neon-high` (concurrencia de React: algo delicado) | `gemini-4-argon-high` | 1 |
| `e2-reservas-sin-guardar` | #50 | `gemini-4-hydrogen-high` | `gemini-4-argon-high` | 2 |

Los dos con `maxCorrecciones: 2`, `timeoutMinutos: 60` y `repo` = este
worktree.

- **Permitidos (los dos):** `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx`, `docs/agentes/reservas.md`.
- **Carpeta del verificador:** `src/verificacion/e1/` y `src/verificacion/e2/`.
- **`comandoPrueba`:** `npm test -- src/context src/components/reservas src/verificacion/<id>`
  (incluye `Torneo.test.jsx`, que cubre `RENOVAR_VENTANA` con eventos).

### Reproducción sugerida para #51 (va en la tarea de `e1`)

Un componente padre con su propio estado envuelve al provider. Dentro de
`act`: `startTransition(() => reservar(hora H))`, después
`flushSync(() => setEstadoDelPadre(...))` para forzar un render síncrono del
provider sin la transición, y después `reservar(hora H)` otra vez. En `main`
la segunda devuelve `ok: true` (doble reserva). Si esa secuencia no reproduce
el fallo, el implementador busca otra que sí lo haga y la explica; no se
acepta una prueba que pase igual en `main`.

## Verificación

### `e1-version-estado` (#51)

- C1: Con la reproducción de arriba (u otra que falle en `main`), la segunda
  reserva de la misma hora devuelve `ok: false` con
  `Ese horario ya está reservado. Elige otro.` y `result.current.reservas`
  queda con una sola reserva de esa hora.
  Cómo comprobarlo: prueba nueva en `ReservasContext.test.jsx`; el
  orquestador la corre también contra el archivo de `f4baa69` para ver el RED.
- C2: Lo mismo con la segunda y la tercera reserva seguidas (tres llamadas,
  horas H, H+1 y H): la tercera se rechaza y quedan exactamente dos.
- C3: Sin transiciones, dos `reservar` de la misma hora en el mismo `act`: la
  segunda se rechaza (comportamiento de hoy, no se rompe).
- C4: Tras un evento `storage` de otra pestaña que ocupa la hora H, `reservar(H)`
  devuelve `ok: false` y `disponibilidad` marca H ocupada en el mismo tick
  (`SINCRONIZAR` también sube la versión).
- C5: Una acción que no cambia nada (reservar una hora ya ocupada directo con
  `despachar`, o `CANCELAR` de un id que no existe) deja el mismo objeto de
  estado y la misma `version`.
- C6: El `reducer` exportado no cambia de comportamiento: las pruebas que lo
  llaman directo pasan sin tocar sus aserciones.
- C7: Las 34 pruebas previas de `ReservasContext.test.jsx` y las de
  `Torneo.test.jsx` pasan sin cambiar sus aserciones; `npm run lint` sin
  avisos.
- C8: `docs/agentes/reservas.md` explica la versión y por qué el render no
  pisa a `despachar`, y quita #51 de lo pendiente si lo nombra.

### `e2-reservas-sin-guardar` (#50)

En todas, la pestaña A tiene un `setItem` que lanza y la otra pestaña se
simula escribiendo `localStorage` directo (con el `getItem` real).

- C1: A reserva la hora H (cancha X, día D). Otra pestaña escribe un estado
  con una reserva R2 en otra hora y se despacha el evento `storage`.
  `result.current.reservas` tiene las dos (ids exactos) y `disponibilidad`
  marca ocupadas H y la hora de R2.
- C2: Igual que C1 pero sin evento: A reserva otra hora después de la
  escritura externa (camino `leerEstadoFresco`). Quedan tres reservas (la
  pendiente, R2 y la nueva) y `reservar(H)` se rechaza.
- C3: Cambio de día con escritura externa (relojes falsos y `focus`): una
  reserva pendiente para mañana sigue en `reservas` y su hora sigue ocupada en
  el nuevo día 0.
- C4: Un torneo o cumpleaños pendiente (`reservarEvento` con varias canchas y
  bloques) sobrevive a C1 con todas sus celdas ocupadas.
- C5: Si lo que escribió la otra pestaña ya trae una reserva con el mismo
  `id`, no se duplica (queda exactamente una).
- C6: Si después el `setItem` de A vuelve a funcionar, la siguiente escritura
  guarda la pendiente en `localStorage` y el conjunto se vacía: una escritura
  externa posterior sin esa reserva la reemplaza, como hoy.
- C7: Si A cancela una reserva pendiente, no vuelve a aparecer tras un evento
  `storage` ni tras un cambio de día.
- C8: Con `setItem` funcionando siempre, el comportamiento es el de hoy: una
  reserva cancelada en otra pestaña desaparece de A tras el evento `storage`.
- C9: Si otra pestaña borra la clave (`removeItem` o `clear`), A vuelve a la
  semilla con `reservas: []`, como hoy.
- C10: `conservarReservasSinGuardar` no muta sus argumentos (prueba con
  `Object.freeze` o comparando copias).
- C11: Las pruebas previas (incluidas las de `e1`) y las de `Torneo.test.jsx`
  pasan sin cambiar sus aserciones; `npm run lint` sin avisos.
- C12: `docs/agentes/reservas.md` describe el registro de pendientes y la
  fusión por `id`, y cambia la "limitación conocida": queda la falta de
  bloqueo atómico y lo que sigue fuera de alcance (clave borrada,
  cancelaciones sin guardar).

### Al cerrar (orquestador)

- `npm test`, `npm run lint` y `npm run build` completos sobre la rama.
- RED de `e1`: la prueba nueva corrida contra `ReservasContext.jsx` de
  `f4baa69` tiene que fallar.
- Revisión dirigida: los dos `resultado.json`, el punto donde se juntan
  (`despachar` versionado más la fusión en `leerEstadoFresco`) y lo que
  ningún criterio cubre.
- Prueba manual en el navegador (`npm run build` + `npm run preview`, sin otro
  servidor abierto): dos pestañas, en una se fuerza el fallo de `setItem`
  desde la consola, se reserva en las dos y se confirma que "Mis reservas" de
  la primera conserva su reserva. No se usa producción (tocaría el
  `localStorage` real).

## Commits

1. `fix: el render ya no pisa el avance síncrono de despachar (#51)` (código,
   pruebas y docs de `e1`).
2. `fix: conserva las reservas sin guardar al sincronizar pestañas (#50)`
   (código, pruebas y docs de `e2`).
3. `docs: plan y reporte de la etapa 19` (`planificacion/`).

Sin trailers ni menciones de IA. Push de la rama y PR a `main` con
`Closes #50` y `Closes #51`; antes de fusionar, la revisión del PR la hace
`gemini-4-argon-high`.

**Riesgo:** ítem 4 (concurrencia, #51) e ítem 1 (estado de reservas que se
persiste, #50).

## Por aprobar

1. Implementador de `e1` con `gemini-4-neon-high` (lo trato como "algo
   delicado" por ser concurrencia de React) y de `e2` con
   `gemini-4-hydrogen-high`.
2. Un solo PR para las dos issues.
3. Lo que queda fuera de alcance en #50 (clave borrada y cancelaciones sin
   guardar).
4. Las pruebas del verificador (`src/verificacion/`) se borran al cerrar; las
   del implementador quedan en `ReservasContext.test.jsx`.
