# Etapa 9 — Avance (para retomar)

**Última actualización:** 06-11-2026. Rama `etapa-9-rediseno-reserva` (sin push). Worktree: `.claude/worktrees/etapa-9-rediseno-reserva`.

## Hecho

| Bloque | Commit | Verificación |
| --- | --- | --- |
| PLAN (aprobado por Miguel Medina) | `e212d47` | — |
| `a0` capturas "antes" (`revision/antes/`, 20) | `41538fd` | — |
| `r1` tema oscuro, navbar, encabezado, modos, pestañas, carrusel | `4ed9980` | `v1` + corrección + `v1b`: pasa |
| `r2` día, horario por franjas, tus datos, alerta y asignación oscuras | `fa9c96b` | `v2` (7 defectos) + corrección + `v2b`: pasa |
| `r3` comprobante tiquete y confirmación oscura | `deaecc3` | `v3` (2 defectos) + corrección + `v3b`: pasa |
| `r4` llaves simétricas, `SeccionLlaves`, "Partido N", indicador de pasos, pruebas | `f063059` | `v4` (5 defectos) + corrección aplicada; **`v4b` (recomprobación) interrumpida** |

Al cerrar `r4`: `npm test` 197 de 197, `npm run lint` 0 advertencias, `npm run build` OK (corridos a mano el 06-11).

## Pendiente

1. **Recomprobación `v4b`** de los cinco defectos de `r4` en el navegador: `bloques/v4-verificacion-r4/instruccion-recomprobacion.md` (Argon). Si falla algo, una corrección más con flash y commit aparte.
2. **`r5`** (Argon): `bloques/r5-verificacion/tarea.md` → capturas "después", casos A1-A5, B1-B7 y C1-C4 de la etapa 8, teclado, movimiento reducido, tabla de contraste y las 5 capturas de `docs/capturas/`.
3. README si hace falta (con flash), `REPORTE.md` (respuestas de E, capturas, tabla de contraste, pruebas que cambiaron: `Torneo.test.jsx` pruebas 1, 4 y 5 actualizadas y 11 y 12 nuevas) y fila del índice.
4. Con las capturas aprobadas: push de la rama y PR a `main` antes del 18-11.

## Cómo se trabaja (reparto acordado)

- Código: `agy` con `gemini-3.8-flash-high`, `--mode accept-edits --sandbox`, en segundo plano.
- Pruebas: `agy` con `gemini-4-argon-medium`, en segundo plano; si se corta por memoria (PC de 8 GB), relanzar. Nunca dos agentes pesados a la vez.
- `--dangerously-skip-permissions` lo bloquea el filtro de permisos: no usarlo.
- Lanzar desde la raíz del worktree: `cat planificacion/comun/base.md <bloque>/tarea.md > <bloque>/instruccion.md` y `agy -p "Lee el archivo <bloque>/instruccion.md (UTF-8) y ejecuta ..." --model ... --output-format json > <etapa>/logs/<id>.log`.
- El worktree necesita `GEMINI.md` y `CLAUDE.md` (copias locales, ignoradas por git) y `node_modules` (ya instalados).
