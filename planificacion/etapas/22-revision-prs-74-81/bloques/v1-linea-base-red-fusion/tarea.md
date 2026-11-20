# Tarea v1: línea base, RED y secuencia de fusión de las PR #74 a #81

[MODO EJECUTOR] Esta tarea es de **pruebas y medición**: no corriges código ni
escribes pruebas nuevas. Solo ejecutas comandos y escribes un informe.

## Contexto

Ocho PR abiertas que se van a fusionar en `main`:

| PR | Rama (remota) | Base |
| --- | --- | --- |
| #74 | `origin/docs/issue-67` | `origin/main` |
| #75 | `origin/fix/issue-69` | `origin/main` |
| #76 | `origin/fix/issue-70` | `origin/main` |
| #77 | `origin/fix/issue-71` | `origin/main` |
| #78 | `origin/fix/aviso-conflicto-61-65` | `origin/main` |
| #79 | `origin/fix/sincronizacion-pestanas-62-66` | `origin/main` |
| #80 | `origin/refactor/sincronizacion-64` | `origin/fix/sincronizacion-pestanas-62-66` (y trae #78 fusionada) |
| #81 | `origin/chore/etapa-21-issues-61-71` | `origin/main` (solo documentos) |

## Dónde trabajas

- **Directorio de trabajo:** el directorio actual (un worktree de git
  descartable, en `origin/main` = `39d64c7` con HEAD separado). Todos los
  comandos se corren ahí.
- En ese worktree, y **solo ahí**, tienes permiso para: `git checkout --detach
  <ref>`, `git checkout <ref> -- <archivo>`, `git checkout -- .`,
  `git merge --no-ff --no-edit <ref>` (solo en el paso 5, con HEAD separado) y
  `git status`/`git diff`/`git log`. Nada de push, `git stash`, crear ramas,
  `git reset` ni `git fetch`. Antes de cambiar de ref deja el árbol limpio con
  `git checkout -- .`.
- **El único archivo que escribes** es el informe (ruta absoluta):
  `C:\Users\MIGUEL ANGEL\Documents\UNIVERSIDAD\VI SEMESTRE\Lenguajes para la Web\ProyectoSportify\.claude\worktrees\plan-pestanas-fases-torneo\.claude\worktrees\revision-prs-74-81\planificacion\etapas\22-revision-prs-74-81\revision\v1-pruebas.md`
- No ejecutes `npm run dev`, `npm run preview` ni `vercel dev`. Un comando
  pesado a la vez (la PC tiene 8 GB).

## Pasos

1. `npm ci` una sola vez. Si alguna rama cambia `package.json` o
   `package-lock.json` (compruébalo con `git diff origin/main <rama> --stat --
   package.json package-lock.json`), vuelve a correr `npm ci` en esa rama y
   anótalo.
2. **Línea base.** Para cada ref, en este orden: `origin/main` y las 8 ramas de
   la tabla:
   - `git checkout --detach <ref>`;
   - `npm test` → archivos de prueba, casos totales, pasados y fallidos (con el
     nombre exacto de cada fallido);
   - justo después, `git status --porcelain`: anota si la suite dejó archivos
     modificados (por ejemplo el snapshot
     `api/_lib/__snapshots__/instrucciones.test.js.snap`) y luego
     `git checkout -- .`;
   - `npm run lint` → errores y avisos (deben ser 0);
   - `npm run build` → si termina bien y cualquier aviso **distinto** de
     "Invalid media query" (esperado) y del aviso de tamaño de chunk.
   - Para #74 y #81 (solo documentos) basta con comprobar con
     `git diff origin/main <rama> --stat` que no tocan nada fuera de `odd/`,
     `planificacion/` y `*.md`; si es así, no corras test/lint/build y anótalo.
3. **Pruebas nuevas de cada PR.** Para #75 a #80, lista los casos (`it(` /
   `test(`) que la PR agrega, modifica o borra:
   `git diff <base> <rama> -- '*.test.js' '*.test.jsx'`. Para #80 usa como base
   `498785b` (el commit de fusión de #78 dentro de #80), así solo ves los
   cambios del refactor. Anota archivo y nombre exacto de cada caso, y marca
   los casos **borrados o renombrados**.
4. **RED.** Para cada PR, `git checkout --detach <rama>`, devuelve **solo el
   código de producción** a su base con `git checkout <base> -- <archivos>`,
   corre solo los archivos de prueba que la PR cambió con
   `npx vitest run <archivos>`, anota por cada caso nuevo si **falla** (bien) o
   **pasa** (no prueba el arreglo) con la primera línea del error, y limpia con
   `git checkout -- .`. Archivos de producción por PR:
   - #75: `src/lib/fechas.js src/components/reservas/useReserva.js`
   - #76: `src/components/shared/SelectorDia.css`
   - #77: `src/components/hero/DeporteHero.jsx src/components/layout/PaginaInicio.jsx`
   - #78: `src/components/canchas/VistaCanchas.jsx src/components/canchas/VistaCanchas.css src/components/reservas/useReserva.js src/components/shared/AvisoConflictoReserva.jsx src/App.css src/context/ReservasContext.jsx`
   - #79: `src/context/ReservasContext.jsx`
   - #80 es un refactor: aquí el resultado esperado es el contrario. En
     `origin/refactor/sincronizacion-64`, devuelve
     `src/context/ReservasContext.jsx src/lib/cancelacion.js` a `498785b` y
     corre `src/context/ReservasContext.test.jsx src/lib/cancelacion.test.js
     src/components/shared/AvisoConflictoReserva.test.jsx`. Todos los casos
     deberían **pasar** con el código de antes y con el de después; anota los
     que fallen en alguno de los dos lados.
5. **Secuencia de fusión.** `git checkout --detach origin/main` y fusiona en
   este orden con `git merge --no-ff --no-edit <ref>`:
   1. `origin/docs/issue-67`
   2. `origin/fix/issue-69`
   3. `origin/fix/issue-70`
   4. `origin/fix/issue-71`
   5. `origin/fix/sincronizacion-pestanas-62-66`
   6. `origin/refactor/sincronizacion-64`
   7. `origin/chore/etapa-21-issues-61-71`
   Después de cada fusión: si hubo conflicto, anota los archivos, haz
   `git merge --abort` y **detente** (no lo resuelvas). Si no, tras los pasos
   2, 3, 4, 5 y 6 corre `npm test`, `npm run lint` y `npm run build` con los
   mismos datos del paso 2 (los pasos 1 y 7 son solo documentos). Al final
   comprueba con `git merge-base --is-ancestor origin/fix/aviso-conflicto-61-65
   HEAD` que #78 quedó incluida, y anota el resultado.
6. Deja el worktree con el árbol limpio (`git status --porcelain` vacío) en el
   HEAD final del paso 5.

## Informe (`v1-pruebas.md`)

En español, UTF-8, con estas secciones:

1. **Línea base**: tabla `ref | commit | archivos | casos | pasan | fallan |
   árbol tras la suite | lint | build` y, debajo, los nombres de los fallidos y
   los avisos nuevos.
2. **Pruebas nuevas por PR**: `archivo › nombre del caso`, marcando borrados y
   renombrados.
3. **RED por PR**: tabla `caso | contra la base (falla/pasa) | primera línea
   del error`. Para #80, `caso | antes del refactor | después`.
4. **Secuencia de fusión**: tabla `paso | ref | conflicto | archivos | casos |
   lint | build`, y el resultado de la comprobación de #78.
5. **Observaciones**: pruebas lentas, avisos de `act(...)`, errores en la
   consola de las pruebas, `skip` u `only`.

No inventes resultados: si un comando no se pudo correr, escríbelo así y pega
el error.

## Criterios de aceptación

- `origin/main` y las 6 ramas de código con test, lint y build, con números;
  #74 y #81 comprobadas como solo documentos.
- Cada caso nuevo de #75 a #79 con su resultado de RED y los de #80 en los dos
  lados.
- Los 7 pasos de la secuencia de fusión hechos (o detenidos en un conflicto,
  dicho con los archivos).
- No se modificó ningún archivo fuera del informe y el worktree termina limpio.
