# Etapa 9 — Avance (para retomar)

**Última actualización:** 07-11-2026. Rama `etapa-9-rediseno-reserva` (fusionada en `main` en `307d883`, PR #5). Worktree: `.claude/worktrees/etapa-9-rediseno-reserva`.

## Hecho

| Bloque | Commit | Verificación |
| --- | --- | --- |
| PLAN (aprobado por Miguel Medina) | `e212d47` | — |
| `a0` capturas "antes" (`revision/antes/`, 20) | `41538fd` | — |
| `r1` tema oscuro, navbar, encabezado, modos, pestañas, carrusel | `4ed9980` | `v1` + corrección + `v1b`: pasa |
| `r2` día, horario por franjas, tus datos, alerta y asignación oscuras | `fa9c96b` | `v2` (7 defectos) + corrección + `v2b`: pasa |
| `r3` comprobante tiquete y confirmación oscura | `deaecc3` | `v3` (2 defectos) + corrección + `v3b`: pasa |
| `r4` llaves simétricas, `SeccionLlaves`, "Partido N", indicador de pasos, pruebas | `f063059` | `v4` (5 defectos) + corrección + `v4b`: pasa |

Al cerrar `r4`: `npm test` 197 de 197, `npm run lint` 0 advertencias, `npm run build` OK (corridos a mano el 06-11).

Al retomar el 07-11: `v4b` pasa (los cinco defectos de `r4`), `r5` hecho (`276e3d5`: los 16 casos de la etapa 8 pasan, teclado y movimiento reducido bien, contraste ≥ 4,5:1, capturas "después" y 5 de `docs/capturas/`), `r6` README al día y `REPORTE.md` escrito (`a660ad7`), `r7` conectores de las llaves corregidos y verificados con `v7` (`4083de8`), y ajustes de revisión aplicados (`66d60a2`).

## Pendiente

Cerrada: capturas aprobadas y PR #5 fusionado en `main` (`307d883`) el 07-11-2026.

## Cómo se trabaja (reparto acordado)

- Código: `agy` con `gemini-3.8-flash-high`, `--mode accept-edits --sandbox`, en segundo plano.
- Pruebas: `agy` con `gemini-4-argon-medium`, en segundo plano; si se corta por memoria (PC de 8 GB), relanzar. Nunca dos agentes pesados a la vez.
- `--dangerously-skip-permissions` lo bloquea el filtro de permisos: no usarlo.
- Lanzar desde la raíz del worktree: `cat planificacion/comun/base.md <bloque>/tarea.md > <bloque>/instruccion.md` y `agy -p "Lee el archivo <bloque>/instruccion.md (UTF-8) y ejecuta ..." --model ... --output-format json > <etapa>/logs/<id>.log`.
- `AGENTS.md` y `CLAUDE.md` ya se versionan en el repositorio (desde el 07-11); el worktree solo necesita `GEMINI.md` local y `node_modules` (ya instalados).
