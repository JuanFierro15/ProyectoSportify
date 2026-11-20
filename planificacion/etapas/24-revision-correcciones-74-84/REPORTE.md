# Reporte de la etapa 24: revisión de las correcciones de las PR #74 a #84

Responsable: Miguel Medina. Fecha: 20-11-2026. Plan: [PLAN.md](PLAN.md)
(aprobado el 20-11). Rama: `chore/revision-prs-74-84`.

## Veredicto

**Todas las PR se pueden fusionar.** Juan corrigió los seis hallazgos de la
etapa 22 (H1 a H6) y el arreglo nuevo de #80 (n2) funciona. Ninguna PR tiene
un bug que bloquee. Quedan dos detalles en documentos (rutas locales) y un
defecto que **ya existía en `main`** (hallazgo K2), para una issue nueva.

| PR | Corrige | Veredicto |
| --- | --- | --- |
| #74 | H5 | Fusionar |
| #75 | — | Fusionar (sin cambios desde la etapa 22) |
| #76 | H1 | Fusionar: medido en el navegador, 42/42 OK de 320 a 1440 px |
| #77 | — | Fusionar (sin cambios) |
| #78 | — | Entra con #80 (sin cambios) |
| #79 | — | Fusionar (sin cambios) |
| #80 | H2, H6 y n2 | Fusionar (sugerencia J1) |
| #81 | H4 | Fusionar |
| #82 | (etapa 22, nuestra) | Fusionar tras quitar rutas locales (K1) |
| #83 | H3 | Fusionar |
| #84 | (etapa 23) | Fusionar tras quitar rutas locales (K1) |

## Orden de fusión (probado)

El de Juan funciona tal cual, con commit de fusión y sin squash:

1. #74, #75, #76 y #77;
2. #79;
3. #80 (trae #78; si la rama de #79 no se borra al fusionarla, cambiar antes
   la base de #80 a `main`);
4. #83;
5. #81, #82, #84 y la PR de esta etapa.

Ensayo en `e24-rev` desde `origin/main` (`39d64c7`): sin conflictos de código.
Después de #80 y de #83: **560/560 pruebas**, lint sin avisos y build
correcto, sin archivos modificados tras la suite. #78 quedó incluida
(`merge-base --is-ancestor` = 0). Las PR de documentos chocan solo en la tabla
de `planificacion/README.md`; se resuelve dejando las filas en orden (21, 22,
23, 24).

## Hallazgos

| ID | PR | Gravedad | Hallazgo | Evidencia |
| --- | --- | --- | --- | --- |
| K1 | #84 y #82 | Detalle (privacidad) | Rutas absolutas con el usuario de Windows en archivos versionados: `C:/Users/juand/...` en 5 líneas de `bloques/p1-pastilla-ancho-real/` (#84) y la nuestra en 7 archivos de `bloques/` de la etapa 22 (#82). Ya se había limpiado en la etapa 20 (`de72ba8`). | `git grep "C:/Users"` |
| K2 | ya existía en `main` | Conviene arreglar (issue nueva) | Si una entrada de `reservas` guardada es `null`, `parsearDatosGuardados` lanza `TypeError` en `r.tipo` (`ReservasContext.jsx`, línea 165), el `catch` devuelve `null` y la app ignora **todo** lo guardado: no encuentra las reservas válidas. No se probó qué pasa en el siguiente guardado (podría sobrescribirlas). Además deja sin efecto la parte de `null` de H6 cuando los datos llegan desde lo guardado. | Sonda P5 proveedor (falla en la integración y en `d57e955`); línea idéntica en `origin/main` |
| J1 | #80 | Sugerencia | El filtro de H6 en `quitarReservasDeEstado` solo se aplica si se quita algo; si no, la basura queda. Cuando sí la quita, las horas que esa entrada había puesto en `ocupados` no se liberan. Solo con datos corruptos. | `judgment-day` (los dos jueces) |
| J2 | #76 | Detalle | Las pruebas de `SelectorDia` pasan igual sin el arreglo (jsdom no aplica CSS). La garantía real es `medir-pastillas.mjs` de la etapa 23. | RED de v1 |

## Verificación

### v1: línea base, RED, mutación y fusión (agy Hydrogen high)

| Ref | Pruebas | Lint | Build |
| --- | --- | --- | --- |
| `origin/main` (`39d64c7`) | 511/511 | 0 | ok |
| #76 (`7ed54ea`) | 514/514 | 0 | ok |
| #80 (`cd3486a`) | 551/551 | 0 | ok |
| #83 (`11873d8`) | 511/511 | 0 | ok |
| Integración (`5d4f43b`) | 560/560 | 0 | ok |

- **RED de #80:** las 13 pruebas nuevas de H2, H6 y n2 fallan al devolver su
  archivo de producción a `d57e955`; la prueba de control (torneo exitoso)
  pasa en los dos.
- **Mutación de H2:** cada camino tiene al menos una prueba que falla. Sin la
  reparación en `leerGuardado` fallan 3 (carga inicial). Sin la de
  `sincronizarConLeido` fallan 8: `storage` (C1, C3, C5, C6, C7),
  `leerEstadoFresco` (C2, C3) y cambio de día (S13 y la del evento de #62).
- **#83:** el `.snap` queda `i/lf w/lf attr/text eol=lf`. En un clon que venía
  de `main` con el archivo en CRLF, el `.snap` aparece modificado hasta
  sacarlo de nuevo: hace falta el `git checkout --` que indica Juan.
- `@supports not (font-size:1cqi)` llega al CSS de `dist/`.

Detalle: `revision/v1-pruebas.md`.

### v2: sondas (agy escribió, coordinador corrió)

| Versión | Pasan | Fallan |
| --- | --- | --- |
| Antes de las correcciones (`d57e955`) | 30/41 | N1, P1a-c, P4, P5 (2), P6a-d |
| Integración | 40/41 | P5 proveedor (K2, ya existía) |

- Las correcciones arreglan 10 sondas, incluida N1 (el H2 de la etapa 22).
- Siguen pasando: las 14 de la etapa 20, las 10 de la 22, idempotencia, que
  una cancelada no reviva, cancha y cumpleaños descartados, y P7: después de
  un torneo confirmado con éxito no aparece un aviso de choque falso.

Detalle: `revision/v2-sondas.md`.

### v3: app real (coordinador, con los scripts de la etapa 23)

- **H1:** `medir-pastillas.mjs` sobre el build de la integración da 42/42 OK
  (21 anchos de 320 a 1440 px, torneo y cancha). A 400, 412, 414 y 430 px,
  "bloqueado" entra con 2 a 5 px de margen y letra de 9 px, sin desborde de
  página. El mismo script sobre `main` falla en torneo a 360, 390 y 412 px.
  Salidas: `revision/v3-medir-integracion.txt` y `v3-medir-main.txt`.
- **Ancho de las pastillas sin cambios:** el ancho útil de cada pastilla es
  idéntico en `main` y en la integración (39 / 43,3 / 46,4 / 89,4 / 98 px a
  360 / 390 / 412 / 768 / 1440 px). `container-type: inline-size` no alteró el
  tamaño.
- **n2 (`descartada-asistente.mjs`, 390 px, asistente móvil):** un solo
  `role="alert"`, ningún `aria-live`, foco en el título, sin código ni QR.
  "Elegir otro horario" vuelve a "Fechas por fase" (paso 3). Cuartos conserva
  las 12:00 con las 11:00 deshabilitadas, y Semifinal conserva sus 11:00. Se
  revisó la captura `revision/v3/B-390/4-a-fechas.png`: coincide. Salida:
  `revision/v3-descartada-390.txt`.

### `judgment-day` sobre #80

**APPROVED.** Ningún hallazgo grave. Coinciden en la sugerencia J1. Detalle:
`revision/judgment-day.md`.

### Revisión del coordinador

- H5 (#74) y H4 (#81) corregidos. Los docs de `docs/agentes/` de #80 explican
  la reparación y el cambio de `confirmado`.
- Los 9 commits nuevos de Juan van en español, con prefijo y sin menciones a
  IA.

## Desvíos del plan

- **agy se cortó dos veces por recursos** (8 GB, `0xC0000142`): v1 en el
  primer intento, y v2 cuando terminaba. Un relanzamiento de v1 se detuvo a
  mano porque el lanzador no había incluido la retoma (ruta con espacios). Desde la retoma, toda corrida de
  Vitest va con `--maxWorkers=1`. Las instrucciones de los primeros intentos
  quedaron como `instruccion-intento1.md`.
- **Por velocidad (pedido de Miguel),** el coordinador corrió la segunda
  corrida de v2 y toda la v3, sin agy. v3 se acortó: se usaron tal cual los
  scripts de la etapa 23, sin escenas nuevas (cumpleaños, otro deporte, 1440
  px en n2). Tampoco se hizo la regresión manual de la parte C, que ya cubren
  las 560 pruebas. Se usó una sola captura propia (la de Juan cubre el resto).
- **Worktree anidado:** la ruta era tan larga que Windows no podía escribir
  archivos de #84 y de etapas viejas. Se activó `core.longpaths` en la config
  local de git.

## Pendientes

- **Juan:** quitar las rutas locales de #84 (K1). Las de #82 ya se quitaron
  (`bdbd72a`).
- Borrar a mano el worktree temporal `.claude/worktrees/e24-rev` (y el
  `e22fix` anidado), que `git worktree remove` no pudo quitar por la longitud
  de la ruta.
- **Abrir una issue para K2**, si el equipo está de acuerdo: que
  `parsearDatosGuardados` descarte solo la entrada inválida y no todo.
- Fusionar en el orden de arriba. Después de #83, en los clones que ya
  existen, correr una vez
  `git checkout -- api/_lib/__snapshots__/instrucciones.test.js.snap`.
- **Pruebas manuales que siguen pendientes:**
  - lector de pantalla sobre el aviso de #65;
  - el chat en producción después de fusionar.
