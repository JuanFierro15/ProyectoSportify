# Etapa 23: hallazgos de la revisión de las PR #74 a #81

Estado: **aprobado** (Juan pidió corregir todos los hallazgos el 20-11-2026,
sin apurarse por la sustentación: "la idea es dejarlo muy bien").

## Qué se pidió y qué hay hoy

Miguel revisó las PR #74 a #81 (su etapa 22) y dejó seis hallazgos, ninguno
bloqueante. Todos se comprobaron contra las ramas antes de planear:

| Id | PR (rama) | Hallazgo | Comprobado |
| --- | --- | --- | --- |
| H1 | #76 (`fix/issue-70`) | "bloqueado" se sigue cortando desde 400 px: la regla nueva es `max-width: 399px` | Medido (`revision/antes-76.txt`): falla a **320, 400, 412 y 414 px**; a 430 px entra con 0,2 px. Desde 480 px cabe |
| H2 | #79 / #80 (`refactor/sincronizacion-64`) | `aplicarHorasDeReservas` solo se aplica en `renovarSiCambioElDia`; el listener `storage` y `leerEstadoFresco` arman la base solo con `fusionarConSemilla` | `ReservasContext.jsx:1270` (sí) frente a `:1334` y `:1390` (no). La carga inicial (`leerGuardado`, `:179`) tampoco repara |
| H3 | todas | `npm test` deja modificado `api/_lib/__snapshots__/instrucciones.test.js.snap` (fin de línea con `core.autocrlf=true`) | Sin `.gitattributes` en el repo |
| H4 | #81 (`chore/etapa-21-issues-61-71`) | El `REPORTE.md` de la etapa 21 dice que el aviso (#78) y el núcleo (#79) van "en cualquier orden" | `git merge-tree`: chocan en `docs/agentes/reservas.md` y `AvisoConflictoReserva.test.jsx` |
| H5 | #74 (`docs/issue-67`) | `L2` del log ODD todavía nombra la rama `fix/issues-53-54-55-56` | `odd/tasks/issues-53-54-55-56.md:27` |
| H6 | #80 | `quitarReservasDeEstado` conserva entradas `null` de `reservas`, que `aplicarCancelacion` filtraba antes | `cancelacion.js:129-134` frente a `main:258` |

Pendientes manuales que dejó Miguel en #78 (entra con #80): el aviso con NVDA o
Narrador (lo prueba Juan) y una reserva descartada dentro del asistente móvil
del torneo (lo prueba el coordinador en la app real).

### Por qué el orden de fusión de Miguel es distinto al nuestro

El orden del reporte de la etapa 21 salió del plan, antes de armar las ramas.
Al construir #80 encima de #79 apareció el choque con #78 y se resolvió dentro
de #80 (`498785b`), pero el reporte no se actualizó. Por eso #78 no se fusiona
sola: entra al fusionar #80.

## Decisiones

- **H1 se arregla por el ancho real de la pastilla, no por una lista de
  anchos.** El texto usa `clamp(9px, 2.2vw, 12px)` y la pastilla mide un
  séptimo del ancho disponible, así que el problema reaparece en cualquier
  ancho que la regla no cubra. El implementador elige la técnica (unidades de
  contenedor `cqi`, subir el corte con otra regla bajo 360 px, menos `gap`),
  pero el criterio se mide con un script en el navegador real, en los anchos
  de la lista y en anchos intermedios que no conoce de antemano. El texto no
  cambia ("bloqueado", "N libres", "completo") ni baja de 8 px.
- **H2 y H6 van en #80, en un commit `fix:` aparte del refactor.** #80 unifica
  los caminos en `sincronizarConLeido`, así que es el lugar natural (lo sugirió
  Miguel). #79 se fusiona como está. La reparación se aplica una sola vez,
  dentro de `sincronizarConLeido`, sobre la base que recibe (cubre `storage`,
  `leerEstadoFresco` y `renovarSiCambioElDia`), y también en la carga inicial
  (`leerGuardado`), que es el camino más probable para datos de una versión
  anterior.
- **H3 va en una PR aparte** (`fix/snapshots-eol`) con `.gitattributes`
  (`*.snap text eol=lf`): afecta a todas las ramas y no es de ninguna PR.
- **H4 y H5** son una línea de docs cada uno: los hace el coordinador en su
  rama (#81 y #74).
- **Las pruebas del verificador** (`src/verificacion/n1`) se borran al cerrar,
  como en las etapas 19 y 21; lo que valga la pena queda en las pruebas del
  implementador.
- **El script de medición** queda versionado en `revision/medir-pastillas.mjs`
  para que cualquiera repita la medición (levanta y cierra su propio servidor
  con `--preview`).

## Bloques

| Id | Hallazgo | Rama (worktree) | Implementador | Verificador | Ola |
| --- | --- | --- | --- | --- | --- |
| p1 | H1 | `fix/issue-70` (`ProyectoSportify-worktrees/pastilla`) | `gemini-4-hydrogen-high` (CSS) | `gemini-4-argon-high` | 1 |
| n1 | H2 + H6 | `refactor/sincronizacion-64` (`ProyectoSportify-worktrees/nucleo`) | `gemini-4-neon-high` (alto riesgo: datos persistidos y orden entre pestañas) | `gemini-4-argon-high` | 1 |
| — | H3 | `fix/snapshots-eol` desde `main` | coordinador (una línea de config) | — | 1 |
| — | H4, H5 | `chore/etapa-21-issues-61-71`, `docs/issue-67` | coordinador (una línea de docs cada uno) | — | 1 |

p1 y n1 corren en paralelo, cada uno en su worktree (memoria libre al empezar:
unos 2,9 GB). Solo p1 levanta servidor (puerto 4174, lo cierra el script).

**Agregado durante la etapa (n2).** La prueba en la app del pendiente de #78
(`revision/descartada-asistente.mjs`) mostró que "Elegir otro horario" en un
torneo descartado vuelve bien a "Fechas por fase", pero con **todas** las horas
de las fases vacías, no solo la que chocó. Causa: el efecto de
`useReserva.js:915` corre también con la confirmación en pantalla y borra las
horas que ocupa el propio torneo recién confirmado. Se comprobó en la app que
saltar ese efecto mientras hay `confirmado` lo arregla (Cuartos conserva las
12:00 y Semifinal sus 11:00). Va en #80 (que trae la #61) como bloque n2:

| Id | Hallazgo | Rama (worktree) | Implementador | Verificador | Ola |
| --- | --- | --- | --- | --- | --- |
| n2 | Horas de torneo al elegir otro horario (#61) | `refactor/sincronizacion-64` (`nucleo`) | `gemini-4-hydrogen-high` | `gemini-4-argon-high` | 2 (después de n1) |

## Verificación

### p1 (H1): criterios

- C1: Con un build nuevo, `node "<etapa>/revision/medir-pastillas.mjs" --preview <worktree>`
  termina con código 0 y "RESULTADO: todas las pastillas caben" en los 21 anchos
  por defecto (320 a 1440 px), en las escenas torneo (Semifinal con 2 días
  "bloqueado") y cancha.
- C2: También pasa con `--anchos 330,345,405,420,445,460,500,560` (anchos que la
  solución no puede haber fijado a mano).
- C3: En todos los anchos medidos, `font-size` del estado es de al menos 8 px y
  el texto queda a 1 px o más del borde interno de su pastilla (lo exige el
  script).
- C4: Desde 600 px, el estado sigue con `font-size: 12px` y `letter-spacing`
  normal en las dos escenas (sin cambio visual en tableta ni escritorio).
- C5: No hay desplazamiento horizontal de la página en ningún ancho medido
  (`desbordePagina=0`).
- C6: Los textos no cambian: `SelectorDia.jsx` no se toca.
- C7: El comentario del CSS explica la regla nueva y no menciona anchos o
  valores que ya no aplican.
- C8: `npm test -- src/components/shared`, `npm run lint` (0 avisos) y
  `npm run build` pasan.

### n1 (H2 + H6): criterios

Ver `bloques/n1-horas-reservas-sync/criterios.md` (C1 a C12): el escenario N1
de Miguel por el listener `storage`, por `leerEstadoFresco` y en la carga
inicial; eventos con varias celdas (segunda y última, no solo la primera);
que la reparación no invente horas ni fechas, no duplique y sea idempotente;
cancelaciones pendientes; que no mute sus argumentos; `null` en `reservas`
(H6); suite completa y lint.

### Después de los ciclos (coordinador)

- Suite completa, lint y build en cada rama tocada.
- Medición de p1 repetida por el coordinador con el script.
- En la app real (build de #80, 390 px): reserva descartada dentro del
  asistente móvil del torneo (pendiente de #78): a qué paso vuelve "Elegir otro
  horario" y que no queden código ni QR.
- Revisión dirigida de los dos diffs (alto riesgo de n1 a fondo).
- Ensayo del orden de fusión de Miguel con las ramas corregidas
  (`git merge-tree` y suite en verde en cada paso).

## Commits

- `fix/issue-70`: `fix: ajusta el estado de las pastillas al ancho real del selector de día (#70)`.
- `refactor/sincronizacion-64`: `fix: repone las horas de las reservas guardadas en todos los caminos de lectura`
  (H2) y, si queda separado, `fix: descarta entradas vacías de reservas al quitar reservas` (H6).
- `docs/issue-67`: `docs: aclara que la rama de trabajo de las issues #53 a #56 no se publicó (#67)`.
- `chore/etapa-21-issues-61-71`: `docs: corrige el orden de fusión de la etapa 21`.
- `fix/snapshots-eol`: `fix: fija fin de línea LF en los snapshots de las pruebas`.
- Rama nueva `chore/etapa-23-hallazgos-revision`: plan, reporte, bloques y
  script de medición de esta etapa.

## Por aprobar

Nada: Juan pidió corregir los hallazgos. La fusión sigue siendo decisión de
Juan, con la revisión de Argon de cada PR como manda el `CLAUDE.md`.
