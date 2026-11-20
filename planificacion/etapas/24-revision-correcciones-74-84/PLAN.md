# Plan de la etapa 24: revisión de las correcciones de las PR #74 a #84

Responsable: Miguel Medina. Fecha: 20-11-2026. Estado: **aprobado por Miguel el 20-11-2026**.
Rama: `chore/revision-prs-74-84`, desde `origin/main`.
Revisión de origen: etapa 22 (PR #82). Respuesta de Juan: etapa 23 (PR #84).

## Qué se pidió

Revisar todas las PR abiertas ahora que Juan respondió a los hallazgos H1 a H6
de la etapa 22.

## Qué hay hoy (heads del 20-11, 17:30)

| PR | Rama | Head revisado en e22 | Head actual | Qué cambió | Revisión en esta etapa |
| --- | --- | --- | --- | --- | --- |
| #74 | `docs/issue-67` | `a695074` | `a4d77c7` | H5: una línea de `odd/tasks/issues-53-54-55-56.md` | Lectura |
| #75 | `fix/issue-69` | `5fe9c7d` | `5fe9c7d` | nada | Confirmar head |
| #76 | `fix/issue-70` | `28f5040` | `7ed54ea` | H1: `SelectorDia.css` con `@container`, `cqi` y `@supports` (+27 −13) | **Completa** |
| #77 | `fix/issue-71` | `c663e51` | `c663e51` | nada | Confirmar head |
| #78 | `fix/aviso-conflicto-61-65` | `89c4514` | `89c4514` | nada (entra con #80) | Confirmar head |
| #79 | `fix/sincronizacion-pestanas-62-66` | `40c992f` | `40c992f` | nada | Confirmar head |
| #80 | `refactor/sincronizacion-64` | `d57e955` | `cd3486a` | H2 (`1f74353`), H6 (`a84484a`) y **n2 nuevo** (`cd3486a`, torneo descartado): 10 archivos, +1149 −22 (27 en `ReservasContext.jsx`, 4 en `useReserva.js`, 5 en `cancelacion.js`, ~1100 de pruebas) | **Completa, alto riesgo** |
| #81 | `chore/etapa-21-issues-61-71` | `a9b86a5` | `6806acd` | H4: reporte de la etapa 21 y su fila del índice | Lectura |
| #82 | `chore/revision-prs-74-81` | — | — | nuestra etapa 22 | La revisa Juan, no nosotros |
| #83 | `fix/snapshots-eol` | — | `11873d8` | H3: `.gitattributes` con `*.snap text eol=lf` | **Completa** (es config de repo) |
| #84 | `chore/etapa-23-hallazgos-revision` | — | `3d5f930` | Plan y reporte de la etapa 23, scripts de medición y capturas | Lectura + reutilizar sus scripts |

## Decisiones

1. **Revisión por diferencia, no desde cero.** #75, #77, #78 y #79 no cambiaron
   desde la etapa 22: solo se confirma que el head sigue igual. El esfuerzo va
   a #80 y #76.
2. **#80 es alto riesgo** (sincronización entre pestañas y datos guardados:
   ítems 1 y 4). Lleva sondas adversariales y segunda opinión
   (`judgment-day`). Además `cd3486a` es alcance nuevo (n2) que nadie revisó:
   cambia el comportamiento de "Elegir otro horario" del torneo.
3. **No confiar en las mediciones de Juan como única prueba de H1.** Se corre
   su `medir-pastillas.mjs` y además una medición propia en anchos que el
   script no fija (412, 414, 430 y 768 px como mínimo), con capturas.
4. **Worktree de pruebas en ruta corta.** Este worktree anidado no puede
   escribir los archivos de #84 ni varios de etapas viejas ("Filename too
   long"). Las pruebas van en un worktree con ruta corta (o con
   `core.longpaths=true`), creado por el agente de pruebas. Que una ruta de
   #84 rompa un clon normal de Windows se mide (sonda D1); en este worktree no
   cuenta como hallazgo.
5. **Reparto de subagentes** (CLAUDE.md global): pruebas con `agy`
   `gemini-4-hydrogen-high`, lectura con Claude `haiku`, respaldo Argon. Esta
   etapa no escribe código del proyecto: no hay bloques de `medium`.
6. **Los hallazgos se publican como comentario en cada PR**, igual que en la
   etapa 22.

## Bloques

| Ola | Bloque | Quién | Qué |
| --- | --- | --- | --- |
| 1 | `v1-linea-base` | agy Hydrogen high | Suite, lint y build en #76, #80 y #83; RED de las pruebas nuevas; ensayo del orden de fusión completo |
| 2 | `v2-sondas` | agy Hydrogen high | Sondas adversariales de H2, H6 y n2 contra `cd3486a` y contra `d57e955` |
| 3 | `v3-app-real` | agy Hydrogen high | Medición de H1 y recorridos de n2 en `npm run preview` de la integración |
| 3 | `jd-80` | `judgment-day` (2 jueces ciegos) | `git diff d57e955 cd3486a` de `ReservasContext.jsx`, `useReserva.js` y `cancelacion.js` |
| — | revisión del coordinador | Miguel/Claude | Lectura de los diffs, docs y commits |

Olas en serie (8 GB de RAM: nunca dos agentes pesados a la vez). `jd-80` son
lecturas de Claude y puede ir en paralelo con v3.

## Verificación (criterios de aceptación)

### v1 — línea base

- Suite, lint y build en verde en `7ed54ea`, `cd3486a` y `11873d8`; números
  por ref.
- **RED:** las 10 pruebas de H2/H6 y las 3 de n2 fallan sobre `d57e955`
  (copiándolas encima); la de control de n2 pasa en los dos. Las pruebas de
  `SelectorDia` de #76: decir si alguna falla sin el arreglo (en e22 ninguna lo
  hacía).
- **Mutación de H2:** quitar `aplicarHorasDeReservas` de cada camino por
  separado (storage, `leerEstadoFresco`, carga inicial, cambio de día) y decir
  qué prueba falla en cada uno. Un camino sin prueba que falle es hallazgo.
- **Ensayo de fusión** desde `origin/main` en el orden de Juan (#74–#77, #79,
  #80, #83, #81, #82, #84), con commit de fusión y suite, lint y build tras
  cada PR de código. Comprobar que #78 queda incluida (`merge-base
  --is-ancestor`), que el único conflicto es la tabla de
  `planificacion/README.md` y que resolverlo en orden 21, 22, 23 deja la tabla
  bien.
- **H3:** en un clon nuevo, `npm test` deja el árbol limpio; y en un clon con
  el `.snap` ya sacado con CRLF, confirmar que basta el
  `git checkout -- <snap>` que indica Juan (o si hace falta
  `git add --renormalize`). Ver si el `.snap` del índice está en LF o CRLF.

### v2 — sondas adversariales

- **N1 de la etapa 22** (reserva guardada sin su hora en `ocupados`) pasa
  ahora por los cuatro caminos: evento `storage`, `leerEstadoFresco`, carga
  inicial y cambio de día.
- **Idempotencia:** aplicar la reparación dos veces no duplica horas ni
  cambia `ocupados` si ya estaba completo.
- **No revive canceladas:** una reserva cancelada en otra pestaña no vuelve a
  ocupar su hora al repararse.
- **Evento multi-cancha/multi-día:** la reparación cubre todas las canchas y
  jornadas de un torneo, no solo la primera; segundo y último bloque, no solo
  el primero.
- **H6:** `reservas` con `null`, sin `id` o con `id` repetido: cancelar y
  quitar no truena ni borra de más.
- **n2:** torneo descartado con choque en la **última** fase y en una
  intermedia; dos descartes seguidos; "Elegir otro horario" después de que la
  hora conservada también quedó ocupada en otra pestaña (no debe ofrecerla
  como libre); cancha y cumpleaños descartados se comportan igual que en e22
  (regresión).
- Las 24 sondas de la etapa 22 siguen pasando en la integración.

### v3 — app real (`npm run preview` de la integración, 1 sola instancia)

- **H1:** correr `revision/medir-pastillas.mjs` de #84 y una medición propia a
  320, 360, 375, 390, 400, 412, 414, 430, 768 y 1440 px en torneo (asistente
  y escritorio), cancha y cumpleaños: sin texto cortado ni montado, letra ≥ 8
  px, sin desborde horizontal. Capturas a 360, 400, 412 y 430 px. Confirmar
  que el `@supports not (font-size: 1cqi)` llega a `dist/`.
- **n2:** torneo descartado en el asistente a 390 px y en escritorio a 1440 px:
  un solo `role="alert"`, foco en el título, sin QR, "Elegir otro horario"
  conserva las horas que no chocaron y deja deshabilitada la que chocó.
- Regresión rápida: reserva de 1 y 3 horas, cancelar en una pestaña y verla
  libre en la otra, consola sin errores.
- El coordinador revisa las capturas clave una por una (agy a veces inventa
  capturas).

### Revisión del coordinador

- Diffs: `28f5040..7ed54ea`, `d57e955..cd3486a`, `11873d8`, `a695074..a4d77c7`,
  `a9b86a5..6806acd`.
- #80: que `aplicarHorasDeReservas` vaya en `sincronizarConLeido` sin romper el
  orden de reconciliación; que el cambio de `useReserva.js` solo afecte al
  torneo; que docs de `docs/agentes/` (reservas, torneo, página de reserva)
  describan lo nuevo.
- #84: que el reporte no diga nada que la medición contradiga; que no versione
  nada con datos personales ni rutas locales (en e20 ya pasó).
- Commits: español, prefijo, sin menciones a IA.

## Commits

En `chore/revision-prs-74-84`, sin trailers:

1. `docs: plan de la etapa 24 (revisión de las correcciones de las PR #74 a #84)`
2. `docs: reporte de la etapa 24 (revisión de las correcciones de las PR #74 a #84)`

PR a `main` con la fila de la etapa en `planificacion/README.md` (choca con
#81, #82 y #84 en la misma tabla; se resuelve en orden).

## Por aprobar

- El plan completo, en particular revisar por diferencia (#75, #77, #78 y #79
  solo se confirman) y hacer `judgment-day` solo sobre #80.
- Crear la rama `chore/revision-prs-74-84` desde `origin/main` en este
  worktree (hoy está en la rama de la etapa 22, #82).
