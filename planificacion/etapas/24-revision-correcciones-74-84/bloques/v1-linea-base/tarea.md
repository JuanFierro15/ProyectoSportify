# Tarea v1: línea base, RED, mutación y secuencia de fusión (PR #74 a #84)

[MODO EJECUTOR] Esta tarea es de **pruebas y medición**: no corriges código ni
escribes pruebas nuevas. Solo ejecutas comandos y escribes un informe.

## Contexto

Juan corrigió los hallazgos de una revisión anterior. Las ramas a probar
(todas remotas, ya descargadas; **no hagas `git fetch`**):

| PR | Rama | Head | Base |
| --- | --- | --- | --- |
| #74 | `origin/docs/issue-67` | `a4d77c7` | `origin/main` (solo docs) |
| #75 | `origin/fix/issue-69` | `5fe9c7d` | `origin/main` |
| #76 | `origin/fix/issue-70` | `7ed54ea` | `origin/main` |
| #77 | `origin/fix/issue-71` | `c663e51` | `origin/main` |
| #78 | `origin/fix/aviso-conflicto-61-65` | `89c4514` | `origin/main` (entra con #80) |
| #79 | `origin/fix/sincronizacion-pestanas-62-66` | `40c992f` | `origin/main` |
| #80 | `origin/refactor/sincronizacion-64` | `cd3486a` | #79 |
| #81 | `origin/chore/etapa-21-issues-61-71` | `6806acd` | `origin/main` (solo docs) |
| #82 | `origin/chore/revision-prs-74-81` | (el que haya) | `origin/main` (solo docs) |
| #83 | `origin/fix/snapshots-eol` | `11873d8` | `origin/main` (`.gitattributes`) |
| #84 | `origin/chore/etapa-23-hallazgos-revision` | `3d5f930` | `origin/main` (solo docs y scripts) |

`origin/main` = `39d64c7`. La revisión anterior ya probó #75, #77, #78 y #79;
aquí el foco son **#76, #80 y #83**.

## Dónde trabajas

- **Directorio de trabajo:** el directorio actual (worktree de git descartable,
  HEAD separado en `origin/main`). Todos los comandos se corren ahí.
- En ese worktree, y **solo ahí**, puedes usar: `git checkout --detach <ref>`,
  `git checkout <ref> -- <archivo>`, `git checkout -- .`,
  `git merge --no-ff --no-edit <ref>` (solo en el paso 6),
  `git add` y `git commit --no-edit` (solo para cerrar una fusión del paso 6),
  `git merge --abort`, `git status`, `git diff`, `git log`, `git ls-files`,
  `git merge-base`. Nada de push, `git stash`, crear ramas, `git reset`,
  `git clean` ni `git fetch`. Antes de cambiar de ref, deja el árbol limpio con
  `git checkout -- .`.
- Para mutaciones (paso 4) puedes editar archivos de `src/` del worktree, y
  siempre los devuelves con `git checkout -- .` al terminar cada una.
- **El único archivo que escribes fuera del worktree** es el informe (ruta
  relativa al worktree de pruebas):
  `../../../planificacion/etapas/24-revision-correcciones-74-84/revision/v1-pruebas.md`.
  Escríbelo **a medida que avanzas** (sección por sección), no al final.
- No ejecutes `npm run dev`, `npm run preview` ni `vercel dev`. Un comando
  pesado a la vez (la PC tiene 8 GB y poca memoria libre).

## Pasos

1. `npm ci` una sola vez. Comprueba con
   `git diff origin/main <rama> --stat -- package.json package-lock.json` que
   ninguna rama cambia dependencias; si alguna lo hace, `npm ci` en esa rama y
   anótalo.
2. **Línea base.** Para `origin/main`, `origin/fix/issue-70`,
   `origin/refactor/sincronizacion-64` y `origin/fix/snapshots-eol`:
   - `git checkout --detach <ref>`;
   - `npm test` → archivos de prueba, casos totales, pasados y fallidos (nombre
     exacto de cada fallido);
   - justo después `git status --porcelain` (anota si la suite dejó algo
     modificado) y `git checkout -- .`;
   - `npm run lint` → errores y avisos (deben ser 0);
   - `npm run build` → si termina bien y cualquier aviso **distinto** de
     "Invalid media query" y del de tamaño de chunk. En `origin/fix/issue-70`
     además: `grep -c "cqi" dist/assets/*.css` y si el texto
     `@supports not (font-size:1cqi)` (o con espacios) aparece en el CSS de
     `dist/`.
   - Para #74, #81, #82 y #84 basta con `git diff origin/main <rama> --stat`:
     comprueba que no tocan nada fuera de `odd/`, `planificacion/`, `.engram/`
     y `*.md` (anota cualquier excepción, por ejemplo `.mjs` o `.png` de
     `planificacion/`).
3. **RED.**
   - **#80 (correcciones):** `git checkout --detach origin/refactor/sincronizacion-64`.
     Lista los casos (`it(`/`test(`) que agrega o cambia
     `git diff d57e955 cd3486a -- '*.test.js' '*.test.jsx'` (archivo y nombre
     exacto, marcando borrados o renombrados). Luego, **por separado** para
     cada archivo de producción, devuélvelo a `d57e955`
     (`git checkout d57e955 -- <archivo>`), corre los 4 archivos de prueba
     cambiados con `npx vitest run src/context/ReservasContext.test.jsx src/lib/cancelacion.test.js src/components/canchas/VistaCanchas.test.jsx src/components/reservas/torneo/AsistenteTorneo.test.jsx`,
     anota qué casos fallan (con la primera línea del error) y limpia con
     `git checkout -- .`:
     - R1: `src/context/ReservasContext.jsx`
     - R2: `src/lib/cancelacion.js`
     - R3: `src/components/reservas/useReserva.js`
     Para cada caso nuevo, di si falla en algún R (bien) o pasa en los tres
     (no prueba el arreglo).
   - **#76:** en `origin/fix/issue-70`, devuelve
     `src/components/shared/SelectorDia.css` a `origin/main`, corre
     `npx vitest run src/components/shared` y anota qué casos fallan.
4. **Mutación de la reparación de horas (H2)** en
   `origin/refactor/sincronizacion-64`, una mutación a la vez, corriendo
   `npx vitest run src/context/ReservasContext.test.jsx` y anotando **nombre
   exacto** de cada caso que falla (o "ninguno"); después `git checkout -- .`:
   - M1: en `leerGuardado` de `src/context/ReservasContext.jsx`, deja
     `ocupados` como `fusionarConSemilla(...)` sin `aplicarHorasDeReservas`
     (carga inicial).
   - M2: en la función que arma `baseReparada` (justo antes de
     `conciliarLecturaExterna`), pasa `base` en lugar de `baseReparada`
     (caminos `storage`, `leerEstadoFresco` y cambio de día).
   - M3: M1 y M2 juntas.
   Para M2, clasifica cada caso que falla según el camino que prueba (evento
   `storage`, `leerEstadoFresco`/lectura antes de guardar, cambio de día u
   otro), leyendo el nombre y el cuerpo del caso. Si un camino no tiene ningún
   caso que falle, dilo explícitamente.
5. **Snapshot y `.gitattributes` (#83).**
   - En `origin/fix/snapshots-eol`: `git ls-files --eol api/_lib/__snapshots__/instrucciones.test.js.snap`
     (anota `i/` y `w/` y el atributo) y `git config core.autocrlf`.
   - Clon existente: `git checkout --detach origin/main`, `npm test`, anota
     `git status --porcelain`, `git checkout -- .`. Luego
     `git checkout --detach origin/fix/snapshots-eol` **sin** tocar el snapshot,
     anota `git ls-files --eol` del `.snap` y `git status --porcelain`; corre
     `npm test` y vuelve a anotar `git status --porcelain`. Después
     `git checkout -- api/_lib/__snapshots__/instrucciones.test.js.snap`,
     `npm test` otra vez y `git status --porcelain`. Deja el árbol limpio.
6. **Secuencia de fusión.** `git checkout --detach origin/main` y fusiona en
   este orden con `git merge --no-ff --no-edit <ref>`:
   1. `origin/docs/issue-67`
   2. `origin/fix/issue-69`
   3. `origin/fix/issue-70`
   4. `origin/fix/issue-71`
   5. `origin/fix/sincronizacion-pestanas-62-66`
   6. `origin/refactor/sincronizacion-64`
   7. `origin/fix/snapshots-eol`
   8. `origin/chore/etapa-21-issues-61-71`
   9. `origin/chore/revision-prs-74-81`
   10. `origin/chore/etapa-23-hallazgos-revision`

   Tras cada fusión:
   - Si hay conflicto **solo** en `planificacion/README.md` y solo en la tabla
     de etapas: copia al informe el bloque en conflicto tal cual, resuélvelo
     dejando las filas de los dos lados (primero las de HEAD, después las de la
     rama entrante), comprueba que no quedan marcadores (`<<<<<<<`, `=======`,
     `>>>>>>>`), `git add planificacion/README.md` y `git commit --no-edit`.
   - Cualquier otro conflicto: anota los archivos, `git merge --abort` y
     **detente** (no lo resuelvas).
   - Si la fusión falla por "Filename too long" u otro error de ruta, anótalo
     con el archivo exacto.
   - Tras los pasos 2 a 7 corre `npm test`, `npm run lint` y `npm run build`
     con los datos del paso 2 y `git status --porcelain` después de `npm test`
     (paso 7 en adelante: debe quedar vacío). Los pasos 1, 8, 9 y 10 son solo
     documentos.

   Al final:
   - `git merge-base --is-ancestor origin/fix/aviso-conflicto-61-65 HEAD; echo $?`
     (0 = #78 incluida);
   - copia al informe las filas de la tabla de etapas de
     `planificacion/README.md` que empiecen con `` | `2 `` y di si están en
     orden 20, 21, 22, 23, 24 (la 24 puede no estar) sin filas repetidas;
   - anota `git log --oneline -12`.
7. Deja el worktree limpio (`git status --porcelain` vacío) en el HEAD final del
   paso 6.

## Informe (`v1-pruebas.md`)

En español, UTF-8, con estas secciones:

1. **Línea base**: tabla `ref | commit | archivos | casos | pasan | fallan |
   árbol tras la suite | lint | build`, y debajo los fallidos, los avisos
   nuevos y lo de `cqi`/`@supports`. Luego la comprobación de las ramas de
   docs.
2. **Pruebas nuevas de #80**: `archivo › nombre del caso`.
3. **RED**: tabla `caso | R1 | R2 | R3 | ¿lo prueba?` para #80, y la lista de
   #76.
4. **Mutación**: tabla `mutación | casos que fallan | camino`, y los caminos
   sin cobertura.
5. **Snapshot (#83)**: cada comando con su salida.
6. **Secuencia de fusión**: tabla `paso | ref | conflicto | archivos | casos |
   lint | build | árbol tras la suite`, los bloques de conflicto, el resultado
   de #78, la tabla de etapas final y el `git log`.
7. **Observaciones**: avisos de `act(...)`, errores en consola, `skip`/`only`,
   pruebas lentas.

No inventes resultados: si un comando no se pudo correr, escríbelo así y pega
el error.

## Criterios de aceptación

- `origin/main`, #76, #80 y #83 con test, lint y build, con números; las ramas
  de docs comprobadas.
- RED de #80 con R1, R2 y R3 por caso, y de #76.
- M1, M2 y M3 hechas, con casos y camino.
- Paso 5 completo con las salidas.
- Los 10 pasos de la fusión hechos (o detenidos en un conflicto fuera de la
  tabla del README, dicho con los archivos).
- No se modificó ningún archivo fuera del worktree salvo el informe, y el
  worktree termina limpio.
