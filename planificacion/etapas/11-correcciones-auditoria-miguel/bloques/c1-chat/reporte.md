# Reporte c1 — Correcciones del chat (issue #13)

Rama `fix/chat-cancelar-errores`. Escribió agy `gemini-3.8-flash-high` (un intento, 17 min, sin errores); verificó un subagente independiente en lugar de Argon.

## Commits

| Commit | Qué |
| --- | --- |
| `ac40d88` | `formatoPrecioCorto` en `precios.js` y `fechaEnFrase` en `fechas.js`; se borran las copias de `instrucciones.js`, `funciones.js` y `chat.js` (S4) |
| `ed2737b` | `fechaHoy` tiene que ser una fecha real (400); armar contexto e instrucciones va dentro de un `try` (500 con el JSON del contrato); `contexto.canchas` ya no se exige (S3, S4) |
| `c2856ac` | `detectarSiNo(texto, tipo)`: "cancelar" confirma una cancelación, rechaza una reserva y en la lista de opciones no cuenta; `!res.ok` → `error: true`; se quita el estado `error`; `horas` con defecto y `reservas` actuales en la búsqueda (S1, S2, S5) |

## Verificación

- `npx vitest run src/lib/chat.test.js src/components/chatbot/useChatbot.test.jsx api/_lib/`: 5 archivos, 34 tests en verde (repetido por el coordinador).
- `npm test`: 23 archivos, 245 tests en verde. `npm run lint`: 0 warnings.
- Diferencial: el snapshot de `construirInstrucciones` pasa contra el código de `db1ff02`, así que el texto que llega al modelo no cambió. Por eso no se corrió `probar-chat.mjs` (sin gastar cuota de Gemini).
- RED contra `db1ff02`: fallan 8 tests nuevos (S1 `detectarSiNo` y "cancelar" con tarjeta de cancelación; S2 429 y 502; S3 `2026-13-45`/`2026-02-30` en `validarPeticion` y en el handler, que daba 500; S4 `contextoChat` y la petición sin `canchas`).
- S5 no tiene test propio (opcional en el plan): queda cubierto por el código.

## Pendiente

- Escape con el foco fuera del panel del chat (opcional de la issue, sin confirmar): fuera de alcance.
