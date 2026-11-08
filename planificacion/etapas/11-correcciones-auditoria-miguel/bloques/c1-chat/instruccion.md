# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `GEMINI.md` (raíz; cada integrante lo
  tiene en local): léela antes de empezar y respétala. La parte del plan que
  te toca va copiada en tu tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

# Tarea c1 — Correcciones del chat (issue #13, specs S1 a S5)

Antes de editar, lee completos:

- `AGENTS.md` (raíz): guía del proyecto. Reemplaza a `GEMINI.md`. Lee la sección "Chatbot" con cuidado.
- `odd/tasks/correcciones-auditoria-miguel.md` hasta `## Log` incluido. Tu tarea es **T1** y cubre **S1 a S5**.
- `planificacion/etapas/11-correcciones-auditoria-miguel/PLAN.md` (aprobado; si choca con la spec, manda el PLAN).
- La issue completa: `gh issue view 13` (solo lectura).
- `src/lib/chat.js`, `src/lib/chat.test.js`, `src/components/chatbot/useChatbot.js`, `src/components/chatbot/useAccionesReserva.js`, `api/chat.js`, `api/_lib/peticion.js`, `api/_lib/instrucciones.js`, `api/_lib/funciones.js` (líneas 200-260).

## Archivos que puedes tocar

```
src/lib/chat.js
src/lib/chat.test.js
src/lib/precios.js
src/lib/precios.test.js
src/lib/fechas.js
src/lib/fechas.test.js
src/components/chatbot/useChatbot.js
src/components/chatbot/useChatbot.test.jsx
src/components/chatbot/useAccionesReserva.js
api/chat.js
api/_lib/peticion.js
api/_lib/peticion.test.js
api/_lib/instrucciones.js
api/_lib/instrucciones.test.js
api/_lib/__snapshots__/
api/_lib/funciones.js
api/_lib/funciones.test.js
```

Archivos `*.test.*` nuevos de esa lista: créalos si no existen. Nada fuera de la lista.

## Reglas

- `src/lib/*.js` sigue siendo JS puro sin JSX (lo importa `api/`).
- No cambies la forma del handler `export default { fetch }` de `api/chat.js`.
- No cambies ningún texto fijo (`MENSAJES_CHAT`, `TEXTOS`, mensajes de `chat.js`).
- Tests a través de la interfaz pública: funciones exportadas, el hook con `renderHook` o el handler con un `Request` real. Relojes falsos con `vi` (`import { vi } from 'vitest'`).
- No corras `npm run dev`, `vercel dev`, `npm run preview` ni `scripts/probar-chat.mjs` (gasta cuota de Gemini).
- Archivos temporales fuera del repositorio (`mktemp -d`); si dejas alguno, dime su ruta exacta.

## Qué hacer

### 0. Prueba diferencial de las instrucciones (antes de tocar nada)

Crea `api/_lib/instrucciones.test.js` con un test que llame `construirInstrucciones` (y `prepararContexto` si hace falta para armar su entrada) con un contexto fijo: `fechaHoy: '2026-11-09'`, `horaActual: '07:00'`, disponibilidad de dos canchas reales de `src/data/canchas.json` en dos fechas de la ventana. Compara el texto con `toMatchSnapshot()`. Córrelo **con el código sin cambios** (`npx vitest run api/_lib/instrucciones.test.js`) para escribir la línea base, y otra vez para comprobar que es determinista. Ese snapshot se queda en el repo: al final del paso 4 tiene que seguir pasando sin actualizarlo (`-u` prohibido).

### 1. Tests en RED

Escribe primero estos tests y comprueba que **fallan** con el código actual. Anota cuáles fallaron.

- **S1** en `src/lib/chat.test.js`: cambia el test de la línea ~227. `detectarSiNo` recibe un segundo argumento con el tipo de lo pendiente (`'reserva'`, `'cancelacion'` u `'opciones'`; sin tipo, igual que hoy):
  - con `'cancelacion'`: "cancelar", "cancela", "Cancelar." y "sí, cancélala" → `'si'`; "no" → `'no'`.
  - con `'reserva'`: "cancelar" y "cancela" → `'no'`; "sí" → `'si'`.
  - con `'opciones'`: "cancelar" y "cancela" → `null`; "no" → `'no'`.
  - sin tipo: los casos de hoy siguen igual (prueba que no cambió el comportamiento previo).
- **S1** en `src/components/chatbot/useChatbot.test.jsx` (nuevo): con una tarjeta de cancelación pendiente, enviar "cancelar" confirma la cancelación (la reserva desaparece del contexto y no aparece "Listo, no cancelé la reserva"). Con una tarjeta de reserva pendiente, "cancelar" la rechaza (no se crea la reserva). Arma las tarjetas como lo hace el hook de verdad: con un `fetch` simulado (`vi.fn`) que devuelve una `accion` `CONFIRMAR_RESERVA` o `BUSCAR_CANCELACION` del contrato, y los proveedores que el hook necesite (mira `App.jsx` y `src/components/reservas/Torneo.test.jsx`).
- **S2** en `useChatbot.test.jsx`: con `fetch` que responde 429 (y otro caso 502) con el cuerpo real del servidor (`{ respuesta: <texto>, sugerencias: [], accion: null }`), el mensaje del bot se ve con el texto, queda con `error: true` y el siguiente envío no lo incluye en `historial` (revisa el cuerpo del segundo `fetch`). Caso previo que debe seguir: una respuesta 200 entra al historial.
- **S3** en `api/_lib/peticion.test.js` (nuevo) y/o un test del handler: `fechaHoy: '2026-13-45'` y `'2026-02-30'` → 400 con `{ respuesta: TEXTOS.invalida, sugerencias: [], accion: null }` (usa la forma real que devuelva el handler). Una fecha válida sigue pasando la validación.
- **S4**: sin `contexto.canchas` la petición es válida; con `canchas` también (se ignora). `contextoChat` ya no incluye `canchas`.

### 2. S1: "cancelar" según la tarjeta

- `detectarSiNo(texto, tipo)`: con `'cancelacion'`, "cancelar"/"cancela" (y sus variantes que ya normaliza) cuentan como sí; con `'opciones'` no cuentan ni como sí ni como no; con `'reserva'` o sin tipo, como hoy.
- `useChatbot.js` (~165-214) calcula el tipo de lo pendiente con los mismos campos que ya usa (`accion.tipo === 'CONFIRMAR_RESERVA'`, `tarjeta.tipo === 'cancelacion'`, `Array.isArray(pendiente.opciones)`) y se lo pasa a `detectarSiNo`.

### 3. S2: errores del servidor

- En el envío (~242-300), si `!res.ok`, el mensaje del bot se guarda con `error: true` (con el `respuesta` del cuerpo si lo trae, si no el texto genérico que ya usa el hook). `historialParaEnviar` ya excluye `m.error`: no lo cambies.
- Quita el estado `error` del hook (`useState` ~41, sus `setError` y el valor devuelto ~358). Comprueba con búsqueda que nadie lo lee.

### 4. S3 y S4: servidor y helpers

- `peticion.js`: `fechaHoy` debe ser una fecha real del calendario (año-mes-día que existe), no solo el formato. Mismo 400 que hoy.
- `api/chat.js`: mueve `prepararContexto` y `construirInstrucciones` dentro de un `try` (el que ya existe o uno nuevo) para que cualquier excepción responda el JSON del contrato con el texto genérico y status 500, igual que el resto de errores del handler. Registra el error en consola como ya hacen los otros `catch` (`error.name`), sin datos del usuario.
- Una sola función de precio corto: muévela a `src/lib/precios.js` (nombre `formatoPrecioCorto(valor)`, misma salida que `precioTexto`/`precioChat`), con test en `precios.test.js`. `chat.js` y `instrucciones.js` la importan; borra las copias.
- Una sola `fechaEnFrase(fecha)` en `src/lib/fechas.js` (la versión con `.replace(/^\p{Lu}/u, ...)` de `funciones.js`), con test en `fechas.test.js`. `chat.js` y `funciones.js` la usan; borra las copias.
- `peticion.js` deja de exigir `contexto.canchas` (si viene, lo ignora; no valides su forma) y `contextoChat` (`chat.js`) deja de mandarlo. Actualiza el JSDoc del contrato donde se mencione.
- El snapshot del paso 0 tiene que pasar igual.

### 5. S5: opcionales

- `useAccionesReserva.js` (~35-63): `horas` con defecto `[]`; si viene vacío, no llames `reservar` y deja la tarjeta como `fallida` con el texto de error que ya usa ese flujo.
- `manejarBusqueda` en `useChatbot.js`: después del `await`, usa las `reservas` actuales (un `useRef` que se actualiza en cada render), no las del render anterior.

## Verificación

Corre, en primer plano, y responde con `<comando>: <resultado observado>` de cada uno:

- `npx vitest run src/lib/chat.test.js src/components/chatbot/useChatbot.test.jsx api/_lib/`
- `npm test`
- `npm run lint`

Si algo falla, corrígelo dentro de los archivos permitidos. Al final responde con: archivos cambiados, tests que fallaron en RED, qué spec (S1-S5) cubriste y cualquier ruta temporal que hayas dejado.
