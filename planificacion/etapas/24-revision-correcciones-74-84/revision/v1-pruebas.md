# Informe v1: línea base, RED, mutación y secuencia de fusión (PR #74 a #84)

- **Worktree de pruebas:** `e24-rev`
- **Dependencias (`package.json`, `package-lock.json`):** ninguna de las 11 ramas (`#74` a `#84`) modifica `package.json` ni `package-lock.json` respecto a `origin/main`. Se ejecutó `npm ci` una sola vez al inicio.

## 1. Línea base

| ref | commit | archivos | casos | pasan | fallan | árbol tras la suite | lint | build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `origin/main` | `39d64c7` | 39 | 511 | 511 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (sin avisos nuevos) |
| `origin/fix/issue-70` | `7ed54ea` | 40 | 514 | 514 | 0 | `M api/_lib/__snapshots__/instrucciones.test.js.snap` | 0 errores, 0 avisos | OK (sin avisos nuevos) |
| *(pendiente)* | | | | | | | | |

### Detalle `cqi` / `@supports` en `origin/fix/issue-70` (`dist/assets/index-YvkDxtiH.css`)

- Líneas con `cqi` (equivalente a `grep -c "cqi"` sobre CSS minificado): **1** línea (con **3** ocurrencias totales de `cqi`: `clamp(8px,20cqi,12px)`, `clamp(8px,24cqi,9px)` y `@supports not (font-size:1cqi)`).
- Presencia de `@supports not (font-size:1cqi)`: **sí aparece** literalmente (`@supports not (font-size:1cqi){...}`).

### Comprobación de ramas de documentación (`git diff origin/main <rama> --stat`)

- **#74 (`origin/docs/issue-67`):** solo toca `odd/tasks/issues-53-54-55-56.md` (1 archivo, +12/-8). Sin excepciones fuera de `odd/`.
- **#81 (`origin/chore/etapa-21-issues-61-71`):** toca `planificacion/README.md` y archivos `*.md` dentro de `planificacion/etapas/21-issues-61-71/` (36 archivos, +2091). Sin excepciones fuera de `planificacion/` y `*.md`.
- **#82 (`origin/chore/revision-prs-74-81`):** toca `planificacion/README.md` y archivos dentro de `planificacion/etapas/22-revision-prs-74-81/` (35 archivos, +2930). Excepciones (todas dentro de `planificacion/etapas/22-revision-prs-74-81/revision/`): `v2-sondas-e22.test.jsx.txt` (`.txt`) y 19 capturas `.png` en `revision/v3/`. Nada fuera de `planificacion/`.
- **#84 (`origin/chore/etapa-23-hallazgos-revision`):** toca `planificacion/README.md` y archivos dentro de `planificacion/etapas/23-hallazgos-revision-74-81/` (20 archivos, +1876). Excepciones (todas dentro de `planificacion/etapas/23-hallazgos-revision-74-81/revision/`): `antes-76.txt`, `despues-76.txt`, `descartada-despues.json`, `descartada-asistente.mjs`, `medir-pastillas.mjs` y 2 capturas `.png` en `revision/capturas-descartada/`. Nada fuera de `planificacion/`.
