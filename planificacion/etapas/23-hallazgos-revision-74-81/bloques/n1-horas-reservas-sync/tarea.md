# Tarea n1: reponer las horas de las reservas guardadas en todos los caminos de lectura (hallazgos H2 y H6)

Lee antes `AGENTS.md` y `docs/agentes/reservas.md` (sección "Sincronización
entre pestañas"). Es código de alto riesgo: datos persistidos y orden entre
pestañas. Trabaja con cuidado y prueba con valores exactos.

## Contexto (rama `refactor/sincronizacion-64`, PR #80)

En `src/context/ReservasContext.jsx`:

- `aplicarHorasDeReservas(ocupados, reservas)` (cerca de la línea 214) asegura
  que las horas de cada reserva figuren en `ocupados`, solo para las fechas que
  ya están en `ocupados`. No muta sus argumentos.
- `sincronizarConLeido({ raw, datos, base, actual, conservarCancelacionesPendientes })`
  (cerca de la línea 1108) es la secuencia única que usan los tres caminos de
  lectura externa: el listener `storage` (cerca de 1322), `leerEstadoFresco`
  (cerca de 1380) y `renovarSiCambioElDia` (cerca de 1255). Llama a
  `conciliarLecturaExterna`, que aplica las cancelaciones pendientes
  (`quitarReservasDeEstado`) y fusiona las altas pendientes
  (`conciliarReservasSinGuardar`).
- **El problema (H2):** solo `renovarSiCambioElDia` repara la base con
  `aplicarHorasDeReservas` antes de llamar a `sincronizarConLeido`. El listener
  `storage` y `leerEstadoFresco` arman la base solo con `fusionarConSemilla`.
  La carga inicial (`leerGuardado`, usada por `crearEstadoInicial`) tampoco
  repara.

Escenario que lo muestra (sonda N1 de la revisión):

1. La pestaña A no puede guardar (`setItem` lanza) y reserva `R` en `padel-1`,
   `dias[3]`, `16:00`.
2. Llega un evento `storage` cuyo JSON trae `Rb` en esa misma celda **en
   `reservas`, pero sin `16:00` en `ocupados['padel-1'][dias[3]]`**.
3. Resultado hoy: `R` se descarta bien (queda solo `Rb` y sale el aviso), pero
   `16:00` queda **libre** aunque `Rb` siga activa, y se podría volver a
   reservar.

Desde la interfaz no se llega a ese estado: hacen falta datos guardados
incompletos (de una versión anterior o editados a mano). Igual, el estado debe
quedar coherente: toda reserva activa ocupa sus horas.

**H6:** `quitarReservasDeEstado` (`src/lib/cancelacion.js`, cerca de la
línea 115) conserva las entradas `null` o sin `id` de `reservas` cuando quita
algo. Antes del refactor, `aplicarCancelacion` las filtraba
(`reservas.filter((r) => r && r.id !== reservaId)`). Solo afecta a datos
corruptos.

## Qué hacer

1. **H2, un solo punto para los tres caminos:** dentro de
   `sincronizarConLeido`, repara `base.ocupados` con
   `aplicarHorasDeReservas(base.ocupados, base.reservas)` antes de pasar la base
   a `conciliarLecturaExterna`. Así quedan cubiertos `storage`,
   `leerEstadoFresco` y `renovarSiCambioElDia`. Quita la llamada que hoy hace
   `renovarSiCambioElDia` antes de `sincronizarConLeido` solo si con eso el
   comportamiento queda igual (las pruebas existentes del cambio de día deben
   seguir pasando sin cambios). Si `base.reservas` no es un arreglo o está
   vacío, la base no cambia (misma referencia).
2. **H2, carga inicial:** en `leerGuardado`, repara `ocupados` con las horas de
   `datos.reservas` de la misma forma.
3. **H6:** en `quitarReservasDeEstado`, cuando quita al menos una reserva,
   descarta también las entradas que no son un objeto con `id`. Si no quita
   nada, sigue devolviendo el mismo objeto `guardado` (misma referencia).
4. **Pruebas** en `src/context/ReservasContext.test.jsx` (un `describe` nuevo,
   por ejemplo `'ReservasContext — horas de reservas guardadas al leer (H2)'`)
   y en `src/lib/cancelacion.test.js` (H6). Usa como modelo el `describe` de
   la #62 (`crearReservaExterna`, `mockearSetItemFalla`, `horaDisponible`,
   `setItemOriginal`, relojes falsos con `vi.setSystemTime`).
5. **Docs:** actualiza `docs/agentes/reservas.md` en la misma sección: la
   reparación con `aplicarHorasDeReservas` se aplica en `sincronizarConLeido`
   (los tres caminos) y en la carga inicial. Corrige la frase que hoy la
   atribuye solo a `renovarSiCambioElDia`.

No cambies nada más del comportamiento: es una PR de refactor con este
arreglo encima, y las 537 pruebas actuales deben seguir pasando sin tocar sus
valores esperados. Si alguna prueba existente fallara por el arreglo, para y
explica por qué en tu resumen, en vez de cambiar lo que espera.

## Rutas

- Permitidas: `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx`, `src/lib/cancelacion.js`,
  `src/lib/cancelacion.test.js`, `docs/agentes/reservas.md`.
- Prohibidas: todo lo demás, incluida `src/verificacion/` (es del verificador).

## Pruebas

Comando final: `npm test && npm run lint`.

Reglas de las pruebas (se revisan):

- cada prueba ejercita lo que dice su título;
- valores exactos (`toEqual` con el arreglo de horas completo, no
  `toContain` cuando el arreglo entero se conoce);
- un rechazo esperado se acota al error exacto (código o mensaje), nunca un
  `toThrow()` a secas;
- nada de `try/catch` sin una aserción que falle si no se lanza.

## Criterios de aceptación

Los mismos de `criterios.md`, copiados aquí (C13 son las reglas de las pruebas de arriba):

- C1: Escenario N1 por el listener `storage`: con `setItem` fallando, la pestaña
  reserva `R` (`padel-1`, `dias[3]`, `16:00`); llega un `storage` con `Rb` en
  esa celda en `reservas` pero sin `16:00` en `ocupados`. Después: `reservas`
  tiene solo `Rb`, hay un aviso con el código de `R`,
  `ocupados['padel-1'][dias[3]]` incluye `16:00` (sin duplicados),
  `disponibilidad` marca `16:00` como no disponible y un nuevo `reservar` a esa
  hora se rechaza.
- C2: El mismo escenario por `leerEstadoFresco`: otra pestaña escribe el JSON
  con `Rb` sin `16:00` (sin evento `storage`) y esta pestaña intenta
  `reservar` `padel-1`, `dias[3]`, `16:00`: se rechaza por hora ocupada, no
  queda una segunda reserva en esa celda y `16:00` queda ocupada.
- C3: La variante sin la clave de la fecha: el JSON externo no trae
  `ocupados['padel-1'][dias[3]]` y `Rb` sigue en `reservas`; por `storage` y
  por `leerEstadoFresco`, `16:00` queda ocupada después de sincronizar.
- C4: Carga inicial: con `localStorage` precargado con `Rb` en `reservas` y sin
  su hora en `ocupados`, al montar el provider esa hora figura en `ocupados` y
  `disponibilidad` la marca no disponible.
- C5: Un evento (torneo o cumpleaños, `celdasDeReserva` con 2 canchas, varias
  horas y 2 fechas) al que le faltan horas en `ocupados`: tras sincronizar,
  están todas sus celdas, incluidas la segunda y la última, no solo la primera.
- C6: La reparación no inventa nada: una reserva con fecha fuera de la ventana
  no crea claves nuevas en `ocupados`; las horas que ya estaban no se duplican;
  aplicar la sincronización dos veces seguidas con el mismo JSON deja el mismo
  `ocupados`.
- C7: Cancelación pendiente: con `setItem` fallando, la pestaña cancela `Rc`, y
  llega un `storage` cuyo JSON todavía tiene `Rc` en `reservas` (con y sin su
  hora en `ocupados`). Después, `Rc` no está en `reservas` y su hora queda
  libre, salvo que otra reserva activa de esa misma celda la use (ese caso
  también se prueba: la hora sigue ocupada).
- C8: El cambio de día (`renovarSiCambioElDia`) sigue reparando como antes: las
  pruebas existentes de ese camino pasan sin cambios.
- C9: Ni la sincronización ni la carga inicial mutan lo que reciben: el objeto
  parseado de lo leído y la base quedan iguales (comparar con una copia
  profunda tomada antes).
- C10 (H6): `quitarReservasDeEstado` con `reservas = [null, R1, { sinId: true }, R2]`
  quitando `R1` devuelve `reservas` igual a `[R2]` exactamente; quitando un id
  que no existe devuelve el mismo objeto (`toBe`); `aplicarCancelacion` sobre
  un estado con un `null` en `reservas` cancela bien y no deja el `null`.
- C11: `npm test` completo pasa (las 537 pruebas de antes más las nuevas) y
  `npm run lint` termina con 0 avisos; ninguna prueba existente cambió sus
  valores esperados.
- C12: `docs/agentes/reservas.md` describe la reparación en
  `sincronizarConLeido` (los tres caminos) y en la carga inicial, sin dejar la
  frase que la atribuía solo al cambio de día.
