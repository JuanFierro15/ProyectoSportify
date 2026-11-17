# Bloque c1-prueba-chat-choque (etapa 17 — issue #42)

Lee `AGENTS.md` y `docs/agentes/chatbot.md` antes de empezar.

## Rutas permitidas

- `src/components/chatbot/useChatbot.test.jsx`

Prohibido tocar cualquier otro archivo (no edites `src/context/`, `src/components/chatbot/useAccionesReserva.js`, `src/lib/`, `api/` ni `planificacion/`). No hagas `git commit`, `git push`, `git checkout` ni cambies de rama.

## Contexto y objetivo

Este bloque corre en paralelo con el bloque `r1-contexto-pestanas` (que modifica `src/context/ReservasContext.jsx` para que `disponibilidad` refleje el estado sincronizado en memoria inmediatamente tras un rechazo en `reservar()`).

Tu objetivo es agregar en `src/components/chatbot/useChatbot.test.jsx` la prueba de regresión de la **issue #42** (`fix: el chat lista como libre una hora que otra pestaña acaba de tomar`).

### Comportamiento que debe probar el test

1. Se prepara el hook con `renderHook(() => useTestChatbot(), { wrapper })` y se toma `const dia = result.current.reservasContext.dias[1];` (mañana; en `src/data/canchas.json`, para `voley-1` en el offset `1` solo están ocupadas `09:00`, `19:00` y `20:00`, así que `16:00` empieza libre junto con otras horas como `10:00` y `17:00`).
2. Se simula una respuesta de `fetch` que devuelve una propuesta `CONFIRMAR_RESERVA` pendiente para `voley-1` en `dia` a las `['16:00']` con `nombre: 'Carlos Gomez'` y `telefono: '3101234567'`, y se envía el mensaje del usuario (por ejemplo `'Reserva voley mañana a las 4 pm'`). Verificar que quedó el mensaje con `accion.tipo === 'CONFIRMAR_RESERVA'` y `estado === 'pendiente'`.
3. Antes de que el usuario confirme, **otra pestaña ocupa las `'16:00'` escribiendo directamente en `window.localStorage` (`STORAGE_KEY` importado de `../../context/ReservasContext`)** sin disparar el evento `storage`:
   - Leer `JSON.parse(window.localStorage.getItem(STORAGE_KEY))`.
   - Agregar `'16:00'` a `ocupados['voley-1'][dia]` y agregar una reserva válida al arreglo `reservas` (por ejemplo `{ id: \`voley-1__\${dia}__16:00__999\`, codigo: 'SPF-OTRA16', tipo: 'individual', canchaId: 'voley-1', fecha: dia, hora: '16:00', horas: ['16:00'], nombre: 'Otra Pestaña' }`).
   - Guardar con `window.localStorage.setItem(STORAGE_KEY, ...)`.
4. El usuario confirma en el chat enviando `'sí'`.
5. Verificar con exactitud:
   - La tarjeta propuesta pasa a `estado: 'fallida'`.
   - `result.current.reservasContext.reservas` tiene longitud `1` y su única reserva es `'SPF-OTRA16'` (no se creó la de Carlos Gomez).
   - El último mensaje del bot contiene `'Esa franja ya no está libre, así que no hice la reserva.'`, **NO contiene `'4:00 p. m.'`** (la hora que acaba de tomar la otra pestaña), y **SÍ contiene** otras horas libres de `voley-1` en `dia` (por ejemplo `'10:00 a. m.'` y `'5:00 p. m.'`, y no incluye las ocupadas por semilla como `'9:00 a. m.'`).

## Nota importante sobre ejecución en paralelo

Dado que `r1-contexto-pestanas` está modificando `src/context/ReservasContext.jsx` en paralelo, al correr `npx vitest run src/components/chatbot/useChatbot.test.jsx`:
- Si `r1` aún no ha terminado cuando ejecutes la prueba, la prueba nueva puede fallar justo en la aserción `expect(ultimo.texto).not.toContain('4:00 p. m.')` (lo cual demuestra la condición RED exacta de la issue #42), mientras que las 6 pruebas anteriores deben seguir pasando.
- Si `r1` ya terminó, todas las pruebas (las 6 existentes + la nueva) deben pasar.
Reporta exactamente qué resultado observaste al correr `npx vitest run src/components/chatbot/useChatbot.test.jsx` y `npx eslint src/components/chatbot/useChatbot.test.jsx` sin tocar ningún otro archivo.
