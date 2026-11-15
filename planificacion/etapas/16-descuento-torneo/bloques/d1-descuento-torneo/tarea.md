
---

# [MODO EJECUTOR] Bloque d1-descuento-torneo (etapa 16)

Lee `planificacion/etapas/16-descuento-torneo/PLAN.md` y `docs/agentes/reservas.md`.

## Rutas permitidas
- `src/lib/precios.js` y `src/lib/precios.test.js`
- `src/components/reservas/torneo/CalendarioTorneo.jsx` y `CalendarioTorneo.test.jsx`
- las pruebas existentes que comparen totales o descuentos de torneo (`src/components/reservas/Torneo.test.jsx`, `src/context/ReservasContext.test.jsx`, `src/components/layout/MisReservas.test.jsx`, `src/components/reservas/torneo/PasoGuardados.test.jsx`): solo ajustar valores esperados
- `planificacion/etapas/16-descuento-torneo/revision/`

Prohibido `api/`, `docs/`, `README.md`, `src/context/ReservasContext.jsx` y el resto. No hagas commits.

## Cambios
1. `precios.js`: exporta `DESCUENTO_HORA_TORNEO = 15000`. En
   `calcularPrecioJornadas`, cada línea (fase y cancha) usa
   `descuentoHora = Math.min(DESCUENTO_HORA_TORNEO, precioHora)` desde 1
   hora; `precioHoraFinal = precioHora - descuentoHora`; `subtotal`,
   `total`, `ahorro` coherentes; `aguaGratis` solo con
   `nHoras >= MIN_HORAS_BENEFICIO`. La salida mantiene la misma forma.
   `calcularPrecio` y `calcularPrecioEvento` no cambian. Actualiza el
   comentario de cabecera.
2. `CalendarioTorneo.jsx`: debajo del texto de ayuda, una línea de promoción
   con la misma clase e icono que la del formulario
   (`formulario-reserva__promo` con `Gift` de `lucide-react`):
   `En torneo, cada hora cuesta $15.000 menos en todas las canchas, aunque no sean seguidas. Con 2 horas o más en una cancha por fase, te regalamos un pack de agua.`
   Usa `formatoPrecio.format(DESCUENTO_HORA_TORNEO)` y `MIN_HORAS_BENEFICIO`,
   no números sueltos.

## Pruebas (valores exactos)
- 1 hora de pádel ($65.000) en una fase: `total` 50.000, `descuentoHora`
  15.000, `ahorro` 15.000, `aguaGratis` false.
- 2 horas salteadas de pádel en una cancha y fase: `total` 100.000, `ahorro`
  30.000, `aguaGratis` true, `packsAgua` 1.
- Fútbol: 2 horas en la cancha 1 de cuartos y 1 hora en la cancha 2 de la
  final → 2 líneas (210.000 y 105.000), `total` 315.000, y la **segunda** y la
  **última** línea con su total exacto.
- Una cancha con `precioHora` 10.000 (catálogo de prueba) no queda negativa.
- `calcularPrecio` y `calcularPrecioEvento` siguen con $5.000 desde 2 horas
  (pruebas actuales en verde).
- El calendario muestra el texto de promoción exacto.
Ajusta los totales esperados de las pruebas de torneo que cambien; no
cambies lo que prueban.

## Verificación
- `npm test` en verde, `npm run lint` 0 warnings, `npm run build` OK. Si
  `npm test` deja modificado `api/_lib/__snapshots__/instrucciones.test.js.snap`
  solo por fin de línea, restáuralo con `git checkout -- <archivo>`.
- Mutación: con `DESCUENTO_HORA_TORNEO` en 5000 falla alguna prueba;
  restaura.
- Headless (`npm run build` + `npm run preview`, puerto 4173, Chrome por CDP;
  parte de `planificacion/etapas/15-horas-torneo-por-cancha/revision/v1-prueba.mjs`):
  en `/reservar/padel?modo=torneo` a 390 y 1440 px, con 1 hora en una cancha,
  el voucher muestra $50.000 y "−$15.000 por hora"; la promoción se ve en el
  calendario; sin desborde. Capturas en `revision/`. **Cierra el preview y
  Chrome al terminar** y comprueba que el puerto 4173 quede libre. No abras
  el chat.

Responde con los archivos cambiados, el número de pruebas, la mutación y lo visto en headless.
