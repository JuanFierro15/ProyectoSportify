# Criterios de aceptación del bloque b3 (issue #69)

- C1: `textoRangoFechas(d, d)` devuelve exactamente `fechaCompleta(d)`, y `textoRangoFechas(a, b)` con `a !== b` devuelve exactamente `` `${fechaCompleta(a)} a ${fechaCompleta(b)}` ``, también con fechas de meses distintos (por ejemplo `2026-11-30` y `2026-12-01`).
- C2: Un torneo de 4 equipos con semifinal y final el mismo día, confirmado: `confirmado.resumen.fechaTexto` es exactamente `fechaCompleta(<ese día>)`, la confirmación en pantalla muestra esa fecha una sola vez junto a "2 jornadas", y en ningún texto visible aparece "<fecha> a <fecha>".
- C3: En ese mismo caso, el texto del QR (`confirmado.textoQr`) contiene la fecha una sola vez y no contiene " a " entre dos fechas iguales.
- C4: Un torneo con las fases en días distintos sigue mostrando el rango `"<primera> a <última>"`, igual que antes.
- C5: Un torneo de 8 equipos (cuartos, semifinal y final) con la primera y la última fase en días distintos y la del medio el mismo día que la primera muestra el rango de la primera a la última. Con las tres fases el mismo día muestra una sola fecha.
- C6: Las reservas de cancha y de cumpleaños, y un torneo de un solo bloque, no cambian su `fechaTexto`.
  Cómo comprobarlo: las pruebas existentes de `src/components/reservas` pasan sin cambiar sus aserciones.
- C7: `src/lib/fechas.js` no usa JSX ni importa nada nuevo (lo importa `api/`).
- C8: `npm test -- src/lib/fechas src/components/reservas` y `npm run lint` terminan con código 0 (lint sin avisos).
