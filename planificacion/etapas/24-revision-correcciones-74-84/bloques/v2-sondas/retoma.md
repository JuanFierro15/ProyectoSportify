# Retoma de v2 (segundo intento)

El primer intento se cortó por falta de recursos del equipo (`0xc0000142`)
después de terminar la corrida en la integración.

## Lo que ya está hecho (no lo repitas ni reescribas las sondas)

- `src/verificacion/` ya tiene `sondas-e20.test.jsx` (14), `sondas-e22.test.jsx`
  (10) y `sondas-e24.test.jsx` (17 casos: P1a a P1d, P2, P3a a P3c, P4,
  P5 pura, P5 proveedor, P6a a P6d, P7 y P8). En P6d ya se avanza el reloj 1 s
  antes del segundo "Confirmar reserva".
- **Corrida en la integración (`HEAD`, `5d4f43b`):** 40 pasan y 1 falla
  (`sondas-e20` 14/14, `sondas-e22` 10/10, `sondas-e24` 16/17). El fallo es
  `P5 proveedor`: `cancelar(reservaValida.id)` devolvió
  `{ ok: false, error: "No encontré esa reserva. Puede que ya se haya cancelado." }`
  porque `parsearDatosGuardados` hace `r.tipo` sobre la entrada `null`, lanza
  `TypeError` y descarta todo lo guardado. El coordinador ya comprobó en el
  código que esto también ocurre en `origin/main`: no lo corrijas, anótalo.

## Lo que falta

1. Vuelve a correr la integración **una vez** con
   `npx vitest run --maxWorkers=1 --reporter=verbose src/verificacion/` para
   tener la tabla por caso (nombres y pasa/falla) en el informe.
2. Corrida **antes de las correcciones**: `git checkout d57e955 -- src/context/ReservasContext.jsx src/lib/cancelacion.js src/components/reservas/useReserva.js`,
   el mismo comando, y `git checkout HEAD -- <los tres archivos>`.
3. Además, solo para `P5 proveedor`, córrela con los tres archivos en
   `origin/main` (`git checkout origin/main -- <los tres>`, y vuelve a `HEAD`)
   y anota si falla igual.
4. Escribe `v2-sondas.md` con las secciones de la tarea y copia
   `sondas-e24.test.jsx` como `v2-sondas-e24.test.jsx.txt`, los dos en
   `../../../planificacion/etapas/24-revision-correcciones-74-84/revision/`.
5. Borra `src/verificacion/` y deja `git status --porcelain` vacío en `5d4f43b`.

Regla: toda corrida con `--maxWorkers=1`. Si una corrida se corta por
recursos, repítela una vez; si vuelve a fallar, escribe lo que tengas en el
informe y termina.
