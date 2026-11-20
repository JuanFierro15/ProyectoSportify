# Retoma de v1 (segundo intento)

El primer intento se detuvo en el paso 2: `npm test` abrió varios procesos de
Vitest a la vez y el equipo se quedó sin recursos (`0xC0000142`).

## Regla nueva (obligatoria en todo el bloque)

- **Toda corrida de pruebas va con un solo worker:** `npm test -- --maxWorkers=1`
  y `npx vitest run --maxWorkers=1 <archivos>`. Nunca `npm test` a secas.
- Antes de empezar, y si algo falla con `0xC0000142` o falta de memoria, revisa
  que no haya procesos `node.exe` colgados de una corrida anterior
  (`tasklist | findstr node`); si una corrida se corta, repítela una vez y, si
  vuelve a fallar, anótalo y sigue con el paso siguiente.

## Lo que ya está hecho (no lo repitas)

El informe `v1-pruebas.md` ya tiene, y **se conserva tal cual**:

- dependencias: ninguna rama cambia `package.json` ni `package-lock.json`
  (`npm ci` ya corrido; `node_modules` está instalado);
- línea base de `origin/main` y `origin/fix/issue-70`;
- el detalle de `cqi` y `@supports` de #76;
- la comprobación de las ramas de documentación (#74, #81, #82 y #84).

## Lo que falta

Continúa el informe donde quedó (reemplaza la fila `*(pendiente)*`):

1. Paso 2 para `origin/refactor/sincronizacion-64` y `origin/fix/snapshots-eol`.
2. Pasos 3 a 7 completos, tal como dice la tarea de abajo.

El worktree está limpio en `cd3486a` (#80).
