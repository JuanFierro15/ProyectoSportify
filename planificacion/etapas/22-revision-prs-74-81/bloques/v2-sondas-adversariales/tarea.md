# Tarea v2: sondas adversariales sobre la sincronización (PR #79 y #80)

[MODO EJECUTOR] Esta tarea es de **pruebas**: escribes pruebas de sondeo en
una carpeta temporal y las corres contra tres versiones del código. **No
corriges el código de producción**, aunque una sonda falle: el fallo es el
resultado que buscamos.

## Dónde trabajas

- **Directorio de trabajo:** el directorio actual (worktree de git descartable
  con `node_modules` ya instalado). Está en un HEAD separado que es la
  integración de `origin/main` con las PR de la etapa (el último commit de
  fusión de la tarea v1). Antes de empezar, comprueba con `git status
  --porcelain` que está limpio; si no, `git checkout -- .`.
- **Archivos que creas ahí (y solo esos):**
  `src/verificacion/sondas-e20.test.jsx` y `src/verificacion/sondas-e22.test.jsx`.
- En ese worktree, y solo ahí, puedes usar
  `git checkout <ref> -- src/context/ReservasContext.jsx src/lib/cancelacion.js`
  para probar otra versión, y `git checkout HEAD -- src/context/ReservasContext.jsx src/lib/cancelacion.js`
  para volver. Nada de commits, push, `stash`, `reset` ni ramas.
- **Archivos que escribes fuera** (carpeta
  `<raíz del repositorio>\planificacion\etapas\22-revision-prs-74-81\revision\`):
  `v2-sondas.md` (informe) y una copia de `sondas-e22.test.jsx` con el nombre
  `v2-sondas-e22.test.jsx.txt`.
- No ejecutes `npm run dev`, `npm run preview` ni `vercel dev`. Un comando
  pesado a la vez.

## Parte A: las 14 sondas de la etapa 20

Copia el contenido de
`planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.test.jsx.txt`
(de este mismo worktree) a `src/verificacion/sondas-e20.test.jsx` y ajusta
solo las rutas de import si hace falta. No cambies lo que comprueban.

## Parte B: 10 sondas nuevas (`sondas-e22.test.jsx`)

Mismo estilo que la parte A y que `src/context/ReservasContext.test.jsx` (lee
antes sus bloques de las issues #62, #63 y #66: ahí está cómo simular otra
pestaña escribiendo en `localStorage` y despachando
`new StorageEvent('storage', { key: STORAGE_KEY, newValue })`, cómo hacer
fallar `setItem` con `vi.spyOn(Storage.prototype, 'setItem')` y cómo simular
el cambio de día). Usa la interfaz pública (`ReservasProvider`, `useReservas`,
y las funciones exportadas de `src/lib/cancelacion.js`), fechas `dias[3]` o
posteriores y canchas y horas reales de `src/data/canchas.json`. Cada caso
lleva su id en el nombre y comprueba **todos** los valores listados.

1. **N1 choque contra una reserva guardada (#62).** `setItem` falla para A; A
   reserva `R` (`padel-1`, `dias[3]`, `16:00`). Llega `storage` cuyo JSON trae
   `Rb` en la misma celda **en `reservas` pero sin esa hora en `ocupados`**.
   Esperado: reservas = {`Rb`}; un aviso con el `codigo` de `R`; `16:00`
   ocupada.
2. **N2 choque de un evento en su segundo y en su último bloque.** A (con
   `setItem` fallando) reserva un torneo con 3 bloques en días distintos; llega
   `storage` con `Rb` que choca solo con el bloque 2. Esperado: el torneo
   entero descartado, un aviso con su código, ninguna hora del torneo ocupada
   salvo la de `Rb`. Repetir chocando solo con el último bloque.
3. **N3 dos pendientes y un solo choque.** A (`setItem` fallando) reserva `R1`
   (`16:00`) y `R2` (`18:00`); llega `storage` con `Rb` en `16:00`. Esperado:
   reservas = {`Rb`, `R2`}; un solo aviso (de `R1`); cuando `setItem` vuelve y
   A hace otra acción, `localStorage` tiene `R2` una sola vez.
4. **N4 dos pendientes que chocan entre sí no se aceptan dobles.** Dos
   pestañas sin guardar con la misma celda: arma el caso con la pura
   `conciliarReservasSinGuardar` (exportada de `ReservasContext.jsx`) con dos
   candidatas en la misma celda: solo una aceptada, la otra en `conflictos`.
5. **N5 último guardado ilegible con cancelación sin guardar (#63).** A tiene
   `R` guardada; luego `setItem` falla; otra pestaña escribe en la clave un
   texto ilegible (`'{roto'`) y despacha `storage`; A cancela `R`; después
   otra pestaña escribe un JSON válido que **todavía contiene `R`** y despacha
   `storage`. Esperado: `R` no reaparece en A y su hora queda libre. Variante:
   el texto ilegible lo deja `renovarSiCambioElDia` (cambio de día) en vez de
   `storage`.
6. **N6 `startTransition` dos veces.** Dentro de `act`, con `setItem`
   fallando: `startTransition(() => reservar(R1))` y en el mismo tick un
   `storage` con `Rb`; repetir con `R2`. Esperado: `R1`, `R2` y `Rb` presentes,
   sin duplicados, y lo mismo cancelando `R1` dentro de `startTransition`.
7. **N7 cambio de día con pendientes y fechas fuera de la ventana (#62).**
   `localStorage` trae ocupados en una fecha posterior a la ventana (`+7`); A
   tiene una alta y una cancelación pendientes; cambia el día (simúlalo como lo
   hacen las pruebas de #62). Esperado: la fecha `+7` se conserva en lo que A
   guarda después, la alta sigue, la cancelada no vuelve, y el nuevo último
   día toma la semilla.
8. **N8 clave borrada con cancelación pendiente.** A tiene `G` guardada y
   cancela `G` con `setItem` fallando; otra pestaña hace `removeItem`
   (`newValue: null`). Esperado: reservas = []; la hora de `G` libre; ninguna
   excepción. Variante con una alta pendiente: la alta sobrevive.
9. **N9 cancelar desde el flujo del chat.** Con `useReservas().cancelar` (lo
   que usa `useAccionesReserva`): una reserva individual guardada, cancelar
   con plazo suficiente; esperado `ok` y hora libre; cancelar un evento debe
   devolver el error de evento y no tocar nada; cancelar dentro del plazo
   mínimo devuelve el error de plazo.
10. **N10 caso feliz idéntico.** Sin errores de `setItem`: reservar 1 h y 3 h,
    un cumpleaños, cancelar la de 1 h, y un `storage` con `Rb`. Esperado:
    mismo `localStorage` (como objeto, ordenando reservas por `id`) y misma
    disponibilidad en las tres versiones de abajo.

## Corridas

Corre `npx vitest run src/verificacion/` con estas tres versiones de
`src/context/ReservasContext.jsx` y `src/lib/cancelacion.js`:

1. **`main`:** `git checkout origin/main -- <los dos archivos>`.
2. **`#79`:** `git checkout origin/fix/sincronizacion-pestanas-62-66 -- <los dos archivos>`.
3. **Integración (`#80`):** `git checkout HEAD -- <los dos archivos>`.

Si una sonda usa algo que no existe en una versión (por ejemplo
`avisosConflicto[i].codigo` en #79, que no trae #78), debe fallar con un
mensaje claro y se anota así, no como bug.

## Informe (`v2-sondas.md`)

En español, UTF-8:

1. Tabla `sonda | main | #79 | integración` con pasa/falla (y la primera línea
   del error de cada fallo).
2. Para cada fallo en la integración: qué esperaba la sonda, qué pasó y si la
   sonda está bien escrita (revisa que no sea un error de la propia prueba
   antes de anotarlo como bug; si lo era, corrígela y vuelve a correr).
3. Diferencias entre #79 y la integración (el refactor #80 no debería cambiar
   ninguna salvo las que dependan de #78).
4. Observaciones (avisos de `act(...)`, errores en consola, pruebas lentas).

Al terminar, borra `src/verificacion/` y deja el worktree limpio
(`git status --porcelain` vacío) en el mismo HEAD.

## Criterios de aceptación

- Las 24 sondas (14 + 10) corridas en las tres versiones, con resultado.
- Cada fallo en la integración explicado y comprobado que no es error de la
  sonda.
- Copia de las sondas nuevas en `revision/`.
- El worktree queda limpio y sin `src/verificacion/`.
