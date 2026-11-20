- C1: Torneo descartado (escritorio): con `setItem` fallando, se confirma un
  torneo con Cuartos el 2.º día a las 11:00 y 12:00, Semifinal el 3.er día a
  las 11:00 y Final el 4.º día a las 11:00 en Pádel 1; un `storage` externo
  ocupa Pádel 1, 2.º día, 11:00. Tras "Elegir otro horario": en Cuartos, 12:00
  sigue elegida (`aria-pressed="true"`) y 11:00 está deshabilitada y sin
  elegir; Semifinal conserva 11:00 del 3.er día y Final conserva 11:00 del 4.º
  día; nombre y teléfono se conservan.
- C2: El mismo escenario con el choque en la **última** fase (Final, 4.º día,
  11:00): Cuartos y Semifinal conservan todas sus horas y Final queda sin la
  hora que chocó.
- C3: El mismo escenario de C1 en el asistente móvil (`matchMedia` de móvil):
  "Elegir otro horario" lleva al paso "Fechas por fase" y se cumplen las mismas
  horas de C1.
- C4: El camino exitoso no cambia: al confirmar un torneo sin choque se ve
  "Reserva confirmada" con código y QR, sin mensaje de error en pantalla.
- C5: Sin confirmación en pantalla, el efecto sigue funcionando como antes: si
  otra pestaña ocupa una hora de fase ya elegida mientras se llena el
  formulario, esa hora se quita y aparece el aviso de siempre
  (`formatearAvisoChoqueJornadas`). Las pruebas existentes de ese caso pasan
  sin cambios.
- C6: Las pruebas nuevas de C1 y C2 fallan sin el cambio del efecto.
  Cómo comprobarlo: deshacer temporalmente el cambio de `useReserva.js`, correr
  las pruebas nuevas y volver a aplicarlo.
- C7: `npm test` completo pasa y `npm run lint` termina con 0 avisos; ninguna
  prueba existente cambió sus valores esperados.
- C8: Las pruebas nuevas cumplen las reglas de arriba.
