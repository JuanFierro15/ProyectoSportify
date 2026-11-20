# Tarea del bloque b3: un torneo con todas las fases el mismo día no repite la fecha (issue #69)

## Objetivo

Un torneo con varias fases jugadas **el mismo día** muestra la fecha repetida
en la confirmación y en el texto del QR: "Viernes 20 de noviembre a Viernes 20
de noviembre · 2 jornadas". Lee `gh issue view 69`.

La causa está en `src/components/reservas/useReserva.js` (cerca de la línea
1269): con más de un bloque, `fechaTexto` arma
`` `${fechaCompleta(primerBloque.fecha)} a ${fechaCompleta(ultimoBloque.fecha)}` ``
sin comprobar si las dos fechas son iguales.

## Archivos

- Puedes editar solo: `src/components/reservas/useReserva.js`,
  `src/components/reservas/Torneo.test.jsx`, `src/lib/fechas.js` y
  `src/lib/fechas.test.js`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. Agrega en `src/lib/fechas.js` una función pura y exportada
   `textoRangoFechas(desde, hasta)` (fechas ISO `YYYY-MM-DD`): si son iguales
   devuelve `fechaCompleta(desde)`; si no, `` `${fechaCompleta(desde)} a ${fechaCompleta(hasta)}` ``.
   `src/lib/fechas.js` lo importa también `api/`: sin JSX y sin dependencias
   nuevas.
2. En `useReserva.js`, `fechaTexto` usa `textoRangoFechas` en la rama de
   torneo con más de un bloque. El resto (`horario`, `totalJornadas`, las otras
   modalidades) no cambia.
3. Pruebas:
   - `src/lib/fechas.test.js`: misma fecha → una sola; fechas distintas →
     rango; fechas de meses distintos → rango con los dos meses.
   - `src/components/reservas/Torneo.test.jsx`: un torneo de 4 equipos
     (semifinal y final) con las dos fases el mismo día, confirmado: la
     confirmación muestra una sola fecha y "2 jornadas", y el texto no contiene
     "<fecha> a <fecha>". Usa como modelo la prueba 5 de ese archivo
     (confirmación multi-día).

## Comandos

- `npm test -- src/lib/fechas src/components/reservas`
- `npm run lint` (0 errores y 0 avisos)
