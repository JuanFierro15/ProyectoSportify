# Reporte de la etapa 16: descuento de $15.000 por hora en torneos

Fecha: 15-11-2026. Rama: `feat/descuento-torneo` (desde `main`, `85f2501`).

## Commits

1. `feat: descuento de $15.000 por hora en torneos`
2. `docs: descuento del torneo en la guía, el README y el asistente`
3. `docs: plan y reporte de la etapa 16`

## Bloques

| Bloque | Intentos | Resultado |
| --- | --- | --- |
| `d1-descuento-torneo` | 1 | `DESCUENTO_HORA_TORNEO`, precio por línea desde 1 hora sin bajar de 0, agua desde 2 horas, promoción en el calendario |

HEAD no cambió durante el bloque.

## Ajustes del coordinador

- `VoucherReserva.jsx`: la fila de ahorro del torneo decía "Descuento desde 2 h por cancha"; ahora "Descuento de torneo por hora".
- `api/_lib/instrucciones.js` y su snapshot, README, `docs/agentes/reservas.md` y `torneo.md`.

## Verificación

- `npm test`: 34 archivos, 346 pruebas en verde. `npm run lint`: 0 warnings. `npm run build`: OK.
- Casos exactos: 1 hora de pádel = $50.000 sin agua; 2 horas salteadas = $100.000 con agua; fútbol en dos fases = $315.000 con la segunda y la última línea exactas; una cancha de $10.000 no queda negativa. Cumpleaños e individual siguen con $5.000 desde 2 horas.
- Mutación: con el descuento en 5.000 fallan 8 de 17 pruebas de precios.
- Headless sobre `npm run preview` en pádel a 390 y 1440 px: voucher con $50.000 y "−$15.000 por hora", promoción visible, sin desborde ni errores de consola. Servidor cerrado.

## Riesgo

Cambia una regla de precio de las reservas nuevas de torneo; las guardadas conservan su total. No toca seguridad ni despliegue.

## Revisión del PR #30

APROBADO sin bloqueantes. Se arreglaron en la misma entrega: README y comentario de `ReservasContext.jsx` con las reglas de torneo y cumpleaños por separado, `DESCUENTO_HORA_TORNEO` en `AGENTS.md`, y pruebas de la etiqueta del ahorro (torneo y cumpleaños), la posición de la promoción, la segunda y la última línea del precio y el límite exacto del tope (15.000 → 0; 15.001 → 1). Queda el prefijo `docs:` del commit de las instrucciones del chat. Suite final: 34 archivos, 348 pruebas.
