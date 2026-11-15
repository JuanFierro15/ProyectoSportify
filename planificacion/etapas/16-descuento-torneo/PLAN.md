# Etapa 16: descuento de $15.000 por hora en torneos

Estado: **Aprobado** por Juan el 15-11-2026 (pedido directo y decisión del descuento).
Rama: `feat/descuento-torneo` (desde `main`, `85f2501`).
Responsable: Juan Fierro.

## Qué se pidió y qué hay hoy

Juan pidió que en el modo torneo todas las canchas tengan $15.000 de descuento
en cada hora, aunque las horas no sean seguidas. Eligió que aplique **desde 1
hora** y que **reemplace** los $5.000 de hoy en el torneo.

Hoy `calcularPrecioJornadas` (`src/lib/precios.js`) usa `calcularPrecio`:
$5.000 menos por hora y pack de agua solo desde 2 horas de una cancha en la
fase. El calendario del torneo no muestra la promoción.

## Decisiones

1. `DESCUENTO_HORA_TORNEO = 15000` en `precios.js`. En
   `calcularPrecioJornadas`, cada hora de cada cancha baja $15.000 siempre
   (desde 1 hora); el precio por hora nunca baja de 0.
2. El pack de agua se mantiene como hoy: uno por cancha y fase con 2 horas o
   más (`MIN_HORAS_BENEFICIO`).
3. Reserva individual y cumpleaños no cambian ($5.000 desde 2 horas seguidas).
4. Las reservas ya guardadas conservan el total con el que se reservaron (no
   se recalculan).
5. Textos: promoción visible en el calendario del torneo, instrucciones del
   chat (y snapshot), README, `docs/agentes/reservas.md` y `torneo.md`.

Precios por hora en torneo: vóley $30.000, pádel $50.000, fútbol $105.000.

## Bloques

| Bloque | Agente | Rutas |
| --- | --- | --- |
| `d1-descuento-torneo` | agy, Hydrogen `high` | `src/lib/precios.js` y su test, `src/components/reservas/torneo/CalendarioTorneo.jsx` y su test, pruebas de torneo que comparen totales |

El coordinador actualiza `api/_lib/instrucciones.js` y su snapshot, README y
`docs/agentes/`.

## Verificación

- 1 hora de pádel en torneo: $50.000, `descuentoHora` 15.000, `ahorro`
  15.000, sin agua. 2 horas salteadas: $100.000, ahorro 30.000, con agua.
- Fútbol 3 horas en dos fases: total exacto. Segunda y última línea del
  desglose correctas.
- Cumpleaños e individual siguen con $5.000 desde 2 horas (pruebas actuales).
- Mutación: con `DESCUENTO_HORA_TORNEO` en 5.000 falla alguna prueba.
- `npm test`, `npm run lint`, `npm run build`. Voucher del torneo en la app a
  390 y 1440 px con el descuento visible; servidor cerrado al terminar.

## Commits

1. `feat: descuento de $15.000 por hora en torneos`
2. `docs: descuento del torneo en la guía, el README y el asistente`
3. `docs: plan y reporte de la etapa 16`
