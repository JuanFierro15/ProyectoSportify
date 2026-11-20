
# Tarea v2: sondas adversariales sobre la cadena de PR #57 a #60

[MODO EJECUTOR] Esta tarea es de **pruebas**: escribes pruebas de sondeo en
una carpeta temporal y las corres contra dos versiones del código. **No
corriges el código de producción**, aunque una sonda falle: el fallo es el
resultado que buscamos.

## Dónde trabajas

- **Directorio de trabajo:** `C:/Users/MIGUEL ANGEL/.claude/jobs/73d64523/tmp/rev`
  (worktree de git descartable con `node_modules` ya instalado). Debe estar en
  `origin/fix/issue-54` (punta de la cadena) y limpio; si no, `git checkout
  --detach origin/fix/issue-54` y `git checkout HEAD -- .`.
- **Archivo que creas ahí:** `src/verificacion/sondas.test.jsx` (solo ese).
- En ese worktree, y solo ahí, puedes usar `git checkout origin/main --
  src/context/ReservasContext.jsx src/lib/cancelacion.js` para probar contra
  `main`, y `git checkout HEAD -- .` para volver. Nada de commits, push, `stash` ni
  ramas.
- **Archivos que escribes fuera:**
  `C:/Users/MIGUEL ANGEL/Documents/UNIVERSIDAD/VI SEMESTRE/Lenguajes para la Web/ProyectoSportify/.claude/worktrees/plan-pestanas-fases-torneo/planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.md`
  (informe) y una copia de las sondas en la misma carpeta con el nombre
  `v2-sondas.test.jsx.txt` (con `.txt` al final para que Vitest no la corra).
- No ejecutes `npm run dev`, `npm run preview` ni `vercel dev`.

## Cómo escribir las sondas

- Usa la interfaz pública: `ReservasProvider` y `useReservas` de
  `src/context/ReservasContext.jsx` con `renderHook` y `act` de
  `@testing-library/react`, y las funciones exportadas de
  `src/lib/cancelacion.js` (`aplicarCancelacion`, `quitarReservasDeEstado`).
  Copia el estilo de `src/context/ReservasContext.test.jsx` (lee primero sus
  bloques `#50`, `#51`, `#53`, `#54`, `#55` y `#56`: ahí está cómo simular otra
  pestaña escribiendo en `localStorage` y despachando
  `new StorageEvent('storage', { key: STORAGE_KEY, newValue })`, y cómo hacer
  fallar `setItem` con `vi.spyOn(Storage.prototype, 'setItem')`).
- `beforeEach`: `localStorage.clear()`; `afterEach`: `vi.restoreAllMocks()` y
  `vi.useRealTimers()`.
- Usa fechas `dias[3]` o más adelante (nunca horas pasadas) y canchas y horas
  reales de `src/data/canchas.json`. Para "otra pestaña" arma el JSON a partir
  de `JSON.parse(localStorage.getItem(STORAGE_KEY))` y modifícalo.
- Cada caso tiene un id `S1`…`S12` en su nombre y comprueba **todos** los
  valores esperados que se listan (reservas por `codigo`, `disponibilidad` de
  la hora, contenido de `localStorage`, `avisosConflicto`).
- `avisosConflicto` y `descartarAvisoConflicto` no existen en `main`: en esos
  casos, si `result.current.avisosConflicto` es `undefined`, la prueba debe
  fallar con un mensaje claro, no lanzar un `TypeError`.

## Casos y resultado esperado

1. **S1 alta y cancelación sin guardar, luego `storage`.** A reserva `R1`
   (`padel-1`, `dias[3]`, `14:00`) con `setItem` funcionando. Luego `setItem`
   falla para A: A reserva `R2` (`padel-1`, `dias[3]`, `16:00`) y cancela `R1`.
   Llega `storage` con el estado guardado más una reserva `Rb` de otra pestaña
   (`padel-1`, `dias[3]`, `18:00`). Esperado: reservas = {`R2`, `Rb`};
   `14:00` libre; `16:00` y `18:00` ocupadas; `avisosConflicto` vacío.
2. **S2 orden inverso y la misma hora.** Igual que S1, pero A primero cancela
   `R1` y después reserva `R2` en **`14:00`** (la hora que liberó). Llega
   `storage` con el estado guardado (todavía con `R1`) más `Rb` a `18:00`.
   Esperado: reservas = {`R2`, `Rb`}; `14:00` ocupada (por `R2`); ningún aviso
   de conflicto.
3. **S3 cancelar una pendiente que nunca se guardó.** `setItem` falla desde el
   principio: A reserva `R` y la cancela. Llega `storage` con una reserva `Rb`
   de otra pestaña en otra hora. Esperado: reservas = {`Rb`}; la hora de `R`
   libre; ningún aviso.
4. **S4 choque.** `setItem` falla para A: A reserva `R` (`padel-1`, `dias[3]`,
   `16:00`). Llega `storage` con `Rb` en la misma cancha, fecha y hora.
   Esperado: reservas = {`Rb`} (no dos en `16:00`); `16:00` ocupada;
   `avisosConflicto` con 1 aviso cuyo `mensaje` incluye el código de `R` y no
   contiene "localStorage", "pestaña" ni "storage". Llamar
   `descartarAvisoConflicto(id)` lo deja vacío. Repetir el mismo evento
   `storage` no vuelve a crear el aviso.
5. **S5 horas compartidas (función pura).** Con `aplicarCancelacion`, un estado
   con dos reservas individuales activas `X` e `Y` en la misma cancha, fecha y
   hora `H` (y `H` en `ocupados`): cancelar `X` deja `H` en `ocupados`;
   cancelar después `Y` la quita. Repetir con la **última hora del día** de
   `canchas.json` y con una reserva de tipo `evento` con `bloques` que cubra
   `H` en lugar de `Y`: cancelar `X` deja `H`. Con `quitarReservasDeEstado`,
   quitar `X` e `Y` a la vez libera `H`. Usa `ahora` lejos del plazo de
   cancelación.
6. **S6 borrar la clave con y sin pendientes.** (a) Sin pendientes: A reserva
   con `setItem` funcionando; otra pestaña hace `removeItem` (evento con
   `newValue: null`). Esperado: reservas = []; la hora libre;
   `localStorage.getItem(STORAGE_KEY)` sigue siendo `null` después del render
   (A no recrea la clave). (b) Igual con `clear()` y `key: null`. (c) Con una
   pendiente (`setItem` fallando) y luego `setItem` restaurado y otra acción
   cualquiera: la pendiente sigue y queda guardada una sola vez.
7. **S7 `setItem` que falla y se recupera.** `setItem` falla: A reserva `R1` y
   `R2`. Se restaura `setItem` y A reserva `R3`. Esperado: `localStorage` tiene
   `R1`, `R2` y `R3`, cada `id` una sola vez, y sus horas en `ocupados` sin
   repetidos. Luego llega `storage` con ese mismo JSON más `Rb`: reservas =
   {`R1`, `R2`, `R3`, `Rb`}, sin duplicados.
8. **S8 `startTransition`.** Dentro de `startTransition` (de `react`) A reserva
   `R` y, en el mismo `act`, antes de que React confirme, llega `storage` con
   `Rb` en otra hora. Esperado: reservas = {`R`, `Rb`}. Repetir dos veces
   seguidas con reservas distintas. Variante: A cancela una reserva guardada
   dentro de `startTransition` y llega `storage` que todavía la tiene:
   esperado, no reaparece.
9. **S9 cambio de día.** Con `vi.useFakeTimers({ toFake: ['Date'] })` y
   `vi.setSystemTime`, montar el provider un día `D`; con `setItem` fallando,
   A reserva `R` en `dias[3]` y cancela una reserva guardada `G`; otra pestaña
   escribe un estado con `G` y una `Rb`; avanzar la hora al día `D+1` y
   despachar `window.dispatchEvent(new Event('focus'))`. Esperado: `R` y `Rb`
   presentes, `G` ausente, `dias[0]` es el nuevo día.
10. **S10 datos raros.** (a) `storage` con `newValue: '{no es json'`: no lanza
    y las reservas de A no cambian. (b) `storage` con un JSON de formato viejo
    (reservas sin `tipo`, una con `canchaIds`): se infiere `tipo`
    (`individual` / `evento`) y no se pierde ninguna.
11. **S11 pestaña que arranca sin clave y sin `setItem`.** `localStorage`
    vacío y `setItem` fallando desde antes de montar: A reserva `R`. Llega
    `storage` con un estado de otra pestaña que tiene `Rb`. Esperado:
    reservas = {`R`, `Rb`}; `Rb` no se trata como cancelada. Luego llega otro
    `storage` sin `Rb` (la otra pestaña la canceló): esperado, `Rb` desaparece
    y `R` sigue.
12. **S12 caso feliz sin errores.** Con `setItem` funcionando: reservar 1 hora,
    reservar 3 horas seguidas, `reservarEvento` de un cumpleaños (copia los
    datos de un caso de `Torneo.test.jsx` o `ReservasContext.test.jsx`),
    cancelar la de 1 hora y recibir `storage` de otra pestaña con una reserva
    más. Comprueba con valores exactos las reservas finales (por `codigo`),
    `ocupados` de las celdas tocadas y que `localStorage` termina con el mismo
    contenido que `result.current` (mismas reservas y horas). Debe pasar
    igual en `main` y en la punta.
13. **S13 choque en el cambio de día.** Como S9 (día `D`, `setItem` fallando
    para A), A reserva `R` (`padel-1`, `dias[3]`, `16:00`). Otra pestaña
    escribe un estado con `Rb` en la misma cancha, fecha y hora (y `16:00` en
    sus `ocupados`). **Sin** despachar `storage`, avanzar al día `D+1` y
    despachar `focus`. Esperado: una sola reserva en esa celda (`Rb`), `R`
    ausente y 1 aviso en `avisosConflicto`. Variante: el JSON de la otra
    pestaña **no** trae la clave de esa fecha en `ocupados['padel-1']` (sí
    trae `Rb` en `reservas`): esperado igual, una sola reserva en esa celda.
14. **S14 JSON corrupto y luego un estado válido.** A tiene una reserva
    guardada `R1` (`setItem` funcionando). Otra pestaña deja
    `'{no es json'` en la clave **sin** evento; avanzar al día `D+1` y
    despachar `focus` (como S9). Después la otra pestaña escribe un estado
    válido **sin** `R1` (la canceló) con una `Rb`, y llega su `storage`.
    Esperado: reservas = {`Rb`}; `R1` no reaparece ni vuelve a quedar en
    `localStorage`. Variante con la clave borrada: A con `R1` guardada; otra
    pestaña borra la clave (`storage` con `newValue: null`); luego `setItem`
    falla para A; otra pestaña escribe un estado válido con `Rb`. Esperado:
    reservas = {`Rb`}.

## Corridas

1. En la punta (`origin/fix/issue-54`): `npx vitest run src/verificacion`.
2. Contra `main`: `git checkout origin/main -- src/context/ReservasContext.jsx
   src/lib/cancelacion.js`, la misma corrida, y `git checkout HEAD -- .`.
3. Si una sonda falla en la punta, revisa primero que la sonda esté bien
   escrita (que el escenario sea el de arriba y que use la API real). Si la
   sonda está bien, **no la cambies para que pase**: anótala como hallazgo.
4. Al terminar: copia la sonda a `v2-sondas.test.jsx.txt`, borra
   `src/verificacion/` del worktree y deja `git status` limpio.

## Informe (`v2-sondas.md`)

En español y UTF-8:

1. Tabla `caso | punta (pasa/falla) | main (pasa/falla) | nota`.
2. Para cada fallo en la punta: valor esperado, valor obtenido (copiado de la
   salida de Vitest) y por qué crees que la sonda está bien escrita.
3. Avisos raros en la consola de las pruebas (`act(...)`, errores de React).

No inventes resultados: pega la salida real.

## Criterios de aceptación

- Los 12 casos escritos y corridos en los dos lados, con resultado anotado.
- Ninguna sonda se ajustó para pasar después de ver un fallo en la punta.
- Copia de las sondas en `v2-sondas.test.jsx.txt`; `src/verificacion/`
  borrada; worktree limpio.
- No se modificó ningún archivo fuera de los indicados.
