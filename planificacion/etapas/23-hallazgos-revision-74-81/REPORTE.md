# Reporte de la etapa 23: hallazgos de la revisión de las PR #74 a #81

Fecha: 20-11-2026. Responsable: Juan Fierro. Revisión de origen: etapa 22 de
Miguel Medina (PR #82).

## Resultado

Los seis hallazgos de la revisión (H1 a H6) quedaron corregidos en sus PR, y
el pendiente manual de #78 se probó en la app real. En esa prueba apareció un
defecto más (n2), que también quedó corregido. Nada se fusionó: la fusión la
decide Juan, con la revisión de otro modelo por PR.

| Id | PR | Qué se hizo | Commit |
| --- | --- | --- | --- |
| H1 | #76 | La letra del estado de las pastillas depende del ancho real de cada pastilla (`cqi` + `@container`), en vez de un corte por ancho de ventana | `7ed54ea` (`fix/issue-70`) |
| H2 | #80 | `aplicarHorasDeReservas` corre en `sincronizarConLeido` (storage, `leerEstadoFresco` y cambio de día) y en la carga inicial | `1f74353` (`refactor/sincronizacion-64`) |
| H3 | #83 (nueva) | `.gitattributes` con `*.snap text eol=lf` | `11873d8` (`fix/snapshots-eol`) |
| H4 | #81 | El reporte de la etapa 21 trae el orden de fusión que funciona y por qué el del plan no servía; la fila del índice cubre la #70 desde 320 px | `5f193d1`, `6806acd` (`chore/etapa-21-issues-61-71`) |
| H5 | #74 | `L2` aclara que `fix/issues-53-54-55-56` fue una rama local que no se publicó | `a4d77c7` (`docs/issue-67`) |
| H6 | #80 | `quitarReservasDeEstado` descarta entradas `null` o sin `id` al quitar | `a84484a` (`refactor/sincronizacion-64`) |
| n2 | #80 | "Elegir otro horario" en un torneo descartado conserva las horas que no chocaron | `cd3486a` (`refactor/sincronizacion-64`) |

## Bloques

| Bloque | Implementador | Veredicto | Correcciones | Ajustes del coordinador |
| --- | --- | --- | --- | --- |
| p1 (H1) | Hydrogen `high` | APROBADO | 0 | Ver abajo |
| n1 (H2 + H6) | Neon `high` | APROBADO | 0 | Ninguno |
| n2 (#61) | Hydrogen `high` | APROBADO | 0 | Ninguno |

H3, H4 y H5 los hizo el coordinador (una línea de config o de docs cada uno).

### Ajustes del coordinador en p1

1. **Respaldo sin `cqi`.** Si un navegador no entiende `cqi`, descarta toda la
   declaración y el estado hereda la letra del botón. Primero se probó con dos
   declaraciones seguidas, pero Lightning CSS borra la primera al minificar
   (comprobado en `dist/`). Se dejó un `@supports not (font-size: 1cqi)`, que sí
   llega al build.
2. **Letra de 9 px en los anchos comunes.** El bloque aprobado cumplía los
   criterios, pero a 360 y 390 px la letra bajaba de 9 px (antes) a 8 px. Por
   eso, dentro de `@container`, la letra pasó a `clamp(8px, 24cqi, 9px)` y el
   corte subió de 41 px a 45 px útiles, donde "bloqueado" a 9 px todavía cabe
   con espaciado negativo. Resultado: 9 px entre 375 y 414 px, sin bajar al
   pasar a la regla general.

## Verificación

- **H1, medición en el navegador** (`revision/medir-pastillas.mjs`, build de
  producción, Chrome sin interfaz). Escenas: torneo (Semifinal con 2 días
  "bloqueado") y cancha. Falla si el texto se recorta, si queda a menos de 1 px
  del borde, si la letra baja de 8 px o si la página se desborda.
  - Antes (`revision/antes-76.txt`): 8 fallos, a 320, 400, 412 y 414 px.
  - Después (`revision/despues-76.txt`): 46 anchos entre 320 y 1920 px, 92
    líneas OK y 0 fallos.
- **H2 y H6:** 10 pruebas nuevas (8 en `ReservasContext.test.jsx` y 2 en
  `cancelacion.test.js`). Las 10 fallan sin el arreglo. Mutación: si se quita
  la reparación de `sincronizarConLeido`, falla la prueba existente S13 (cambio
  de día), así que mover la llamada no dejó ese camino sin cubrir.
- **n2:** 3 pruebas nuevas que fallan sin el arreglo, más una de control del
  camino exitoso. En la app real (`revision/descartada-asistente.mjs`, 390 px,
  dos pestañas y el guardado fallando en una):
  - un solo `role="alert"`, sin `aria-live` duplicado;
  - foco en "Tu reserva no pudo completarse", sin código ni QR;
  - "Elegir otro horario" vuelve a "Fechas por fase";
  - Cuartos conserva las 12:00, con las 11:00 deshabilitadas, y Semifinal
    conserva sus 11:00.

  Antes del arreglo, todas las horas de las fases quedaban vacías.
- **H3:** reproducido en un checkout nuevo de `main` (el `.snap` quedaba
  modificado tras la prueba); con el cambio, `npm test` completo (511) deja el
  árbol limpio.
- **Por rama:** #76 con pruebas de `shared`, lint y build en verde; #80 con 551
  pruebas, lint sin avisos y build correcto; #83 con 511 pruebas y lint.
- **Ensayo del orden de fusión** sobre `main` (`39d64c7`), con commit de fusión:
  1. #74, #75, #76, #77 y #79: sin conflictos; 540 pruebas, lint y build en
     verde.
  2. #80, #81 y #83: sin conflictos; 40 archivos y **560 pruebas**, lint sin
     avisos y build correcto.

  #78 queda incluida al entrar #80.

## Orden de fusión

1. #74, #75, #76 y #77, en cualquier orden.
2. #79.
3. #80, que trae #78 con su choque resuelto. Si la rama de #79 no se borra al
   fusionarla, antes hay que cambiar la base de #80 a `main`.
4. #83 (`.gitattributes`), en cualquier momento.
5. #81, #82 (etapa 22) y la PR de esta etapa. Las tres agregan su fila al
   final de la tabla de `planificacion/README.md`, así que la segunda y la
   tercera en entrar chocan ahí. Se resuelve dejando las tres filas en orden
   (21, 22, 23).

Siempre con commit de fusión, nunca squash: un squash de #79 dejaría a #80 con
commits que ya no están en `main`.

## Pendientes

- Prueba manual de Juan con NVDA o Narrador: que el aviso de conflicto se lea
  una sola vez (#65). Viene de la etapa 21.
- Revisión de cada PR por otro modelo antes de fusionar, cuando Juan lo pida.
- Después de fusionar #83, en los clones que ya existen hay que correr una vez
  `git checkout -- api/_lib/__snapshots__/instrucciones.test.js.snap`: el
  archivo se sacó con las reglas anteriores y seguiría apareciendo modificado.
- La issue #73 (comprobante del chat) sigue abierta, fuera del alcance.

## Cambios en la forma de trabajar

- **Un cambio de CSS se verifica midiendo en el navegador, no estimando.** En
  la etapa 21, el bloque de la #70 se verificó con un cálculo y una medición a
  360 y 390 px, y el corte a 400 px se escapó. Ahora el criterio de aceptación
  es un script que mide en el build real, en anchos que el implementador no
  conoce de antemano, y que levanta y cierra su propio servidor (`--preview`).
- **Los pendientes manuales de una revisión se prueban con un script en la app
  real.** Así apareció n2, que ninguna prueba unitaria cubría.
