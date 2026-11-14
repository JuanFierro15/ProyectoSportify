
---

# Retoma del bloque t1 (intento 2)

En el intento 1 ya quedaron hechos P2, P3, P5 y el primer caso de P4 (429, 503, 429 → 502) en los archivos permitidos: revísalos, no los rehagas. Corrección del plan: el segundo caso de P4 estaba mal. `respuestaFinal` devuelve 504 si **alguno** de los errores es tiempo agotado (`errores.some(esTiempoAgotado)`, contrato documentado en `docs/agentes/chatbot.md`). El segundo caso queda así:

- 429, 429, timeout (`name: 'TimeoutError'`) → status **504** (no 429), cuerpo `{ respuesta: TEXTOS.generico, sugerencias: [], accion: null }`, 3 llamadas. Título: que un tiempo agotado manda sobre los 429 parciales.

Luego haz la verificación con mutación completa (sección final de la tarea), restaura el código de producción, corre `npm test` y `npm run lint`, y responde en español con tuteo (sin voseo) con archivos, número de pruebas y resultado de cada mutación. No hagas preguntas: si algo no cuadra, repórtalo al final.
