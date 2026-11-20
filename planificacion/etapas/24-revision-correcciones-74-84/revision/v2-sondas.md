# Informe v2: sondas adversariales de las correcciones de #80

Las sondas las escribió agy (Hydrogen high) y corrió la integración; se cortó
por recursos (`0xc0000142`) antes de la segunda corrida. Las dos corridas de
este informe las repitió el coordinador con
`npx vitest run --maxWorkers=1 src/verificacion/`, en el worktree de pruebas.

- **Integración** (`5d4f43b`, todas las PR fusionadas): 40 pasan, 1 falla.
- **Antes de las correcciones** (los tres archivos de producción en `d57e955`):
  30 pasan, 11 fallan.

Copia de las sondas nuevas: `v2-sondas-e24.test.jsx.txt`.

## Resultado por sonda

| Sonda | Integración | Antes (`d57e955`) |
| --- | --- | --- |
| 14 sondas de la etapa 20 | 14/14 | 14/14 |
| 10 sondas de la etapa 22 | 10/10 | 9/10 (falla N1, el H2 original) |
| P1a carga inicial (H2) | pasa | falla |
| P1b evento `storage` (H2) | pasa | falla |
| P1c `leerEstadoFresco` (H2) | pasa | falla |
| P1d cambio de día (H2) | pasa | pasa (ese camino ya reparaba) |
| P2 idempotencia | pasa | pasa |
| P3a a P3c cancelada no revive | pasan | pasan |
| P4 torneo de 2 canchas y 3 días (H2) | pasa | falla |
| P5 pura, `quitarReservasDeEstado` con basura (H6) | pasa | falla |
| P5 proveedor, `localStorage` con basura y cancelar | **falla** | falla |
| P6a choque en fase intermedia (n2) | pasa | falla |
| P6b choque en la última fase (n2) | pasa | falla |
| P6c hora conservada ocupada por una tercera pestaña (n2) | pasa | falla |
| P6d dos descartes seguidos (n2) | pasa | falla |
| P7 torneo confirmado con éxito y nueva reserva | pasa | pasa |
| P8 cancha y cumpleaños descartados (regresión de #78) | pasa | pasa |

## El fallo en la integración (P5 proveedor)

- **Qué esperaba:** con `reservas` = `[null, 5, [], {}, R válida, ...]` en
  `localStorage`, cancelar `R` devuelve `ok` y libera su hora.
- **Qué pasó:** `{ ok: false, error: "No encontré esa reserva. Puede que ya se
  haya cancelado." }`.
- **Causa (leída en el código):** `parsearDatosGuardados`
  (`src/context/ReservasContext.jsx`, línea 165) hace `r.tipo` sobre cada
  entrada; con `null` lanza `TypeError`, el `catch` devuelve `null` y la app
  trata lo guardado como si no hubiera nada. La línea es idéntica en
  `origin/main`: **ya existía**, no la introduce #80.
- **Relación con H6:** una entrada `null` nunca llega a
  `quitarReservasDeEstado` desde lo guardado, porque la lectura ya descartó
  todo. El filtro de objetos sin `id` (`{}`) sí sirve: esos pasan la lectura.
- La sonda está bien escrita: falla por la causa descrita, en las dos
  versiones.

## Observaciones

- agy ajustó P6d para avanzar el reloj 1 s entre las dos confirmaciones (con
  el reloj congelado, los dos intentos generaban el mismo código).
- Sin avisos de `act(...)`. `src/verificacion/` borrado y worktree limpio en
  `5d4f43b`.
