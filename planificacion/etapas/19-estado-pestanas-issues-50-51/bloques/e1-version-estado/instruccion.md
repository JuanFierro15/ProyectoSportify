[MODO EJECUTOR]

# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `AGENTS.md` (raíz, versionado): léela
  antes de empezar y respétala. La parte del plan que te toca va copiada en tu
  tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

---

# Tarea del bloque e1: el render no debe pisar el avance de `despachar` (issue #51)

## Objetivo

En `src/context/ReservasContext.jsx`, `ReservasProvider` hace
`estadoRef.current = state` en cada render (cerca de la línea 738) y
`despachar` adelanta `estadoRef.current` con el `reducer` de forma síncrona
(cerca de la línea 753). Si React confirma un render que todavía no incluye
una acción ya adelantada (una acción dentro de `startTransition`, o un render
del padre que React procesa antes que la transición), la asignación del render
pisa el avance. Entonces `leerEstadoFresco` y `disponibilidad` vuelven a ver el
estado anterior y una segunda reserva de la misma hora en el mismo tick se
acepta (doble reserva). Corrígelo.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx` y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador), ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Diseño (parte del plan aprobado)

Usa un contador de versión, no `useLayoutEffect`: un efecto de layout corre
después de confirmar, y el estado confirmado puede seguir sin la acción de la
transición, así que también pisaría el avance.

1. Agrega en el mismo archivo una función `reducerVersionado(state, action)`
   que llama al `reducer` exportado y:
   - si el `reducer` devuelve **el mismo objeto** (`siguiente === state`),
     devuelve `state` tal cual (sin subir la versión);
   - si devuelve otro objeto, devuelve `{ ...siguiente, version: (state.version || 0) + 1 }`.
2. `useReducer` y `despachar` usan `reducerVersionado`. El `reducer` exportado
   **no cambia** (sus pruebas lo llaman directo).
3. `crearEstadoInicial` agrega `version: 0` al estado que devuelve.
4. En el render, reemplaza `estadoRef.current = state;` por:

   ```js
   if ((state.version || 0) >= (estadoRef.current.version || 0)) {
     estadoRef.current = state;
   }
   ```

5. `version` no se guarda en `localStorage`: el efecto espejo ya escribe solo
   `ocupados` y `reservas`; no lo cambies.
6. Deja un comentario corto en español junto al `if` explicando por qué
   (el render puede traer un estado más viejo que el que adelantó `despachar`).

## Prueba que reproduce el fallo (escríbela primero)

Antes de cambiar el código, escribe la prueba nueva en
`src/context/ReservasContext.test.jsx` y comprueba que **falla** con el código
actual (RED). Reproducción sugerida:

- Un componente padre con su propio `useState` envuelve a `ReservasProvider`.
- Dentro de `act`: `startTransition(() => reservar({ ...hora H }))`, después
  `flushSync(() => setEstadoDelPadre((n) => n + 1))` para forzar un render
  síncrono del provider sin la transición, y después `reservar({ ...hora H })`
  otra vez.
- Con el código actual la segunda devuelve `ok: true` (doble reserva).

Si esa secuencia no reproduce el fallo, busca otra que sí lo haga y explica en
tu reporte cuál usaste y por qué. **No se acepta una prueba que pase igual con
el código actual.** En tu reporte final pega la salida resumida del RED (la
prueba fallando antes del cambio) y del GREEN.

Usa los datos y ayudantes que ya tienen las pruebas de ese archivo (canchas,
fechas de la ventana, `renderHook`, relojes falsos con `vi` si hacen falta).
Toma una hora libre real de la semilla (`src/data/canchas.json`).

## Documentación

En `docs/agentes/reservas.md`, en el párrafo de "Sincronización entre
pestañas" donde se describe `estadoRef`, explica en una o dos frases la
versión: `reducerVersionado` sube `version` solo cuando el estado cambia, y el
render solo reemplaza `estadoRef` si trae una versión igual o mayor, para no
pisar lo que `despachar` adelantó. No toques la "limitación conocida" de la
issue #50 (es de otro bloque).

## Criterios de aceptación (te los va a exigir el verificador)

- C1: Con la reproducción de arriba (u otra que falle con el código actual), la segunda reserva de la misma hora devuelve `ok: false` con el error `Ese horario ya está reservado. Elige otro.` y `result.current.reservas` queda con una sola reserva de esa hora.
- C2: Con tres llamadas en esa misma situación (horas H, H+1 y H), la tercera se rechaza y quedan exactamente dos reservas.
- C3: Sin transiciones, dos `reservar` de la misma hora en el mismo `act`: la segunda se rechaza (comportamiento de hoy).
- C4: Tras un evento `storage` de otra pestaña que ocupa la hora H, `reservar(H)` devuelve `ok: false` y `disponibilidad` marca H ocupada en el mismo tick.
- C5: Una acción que no cambia nada (por ejemplo, `CANCELAR` de un id que no existe, o reservar una hora ya ocupada) deja el mismo objeto de estado y la misma `version`.
- C6: El `reducer` exportado no cambia de comportamiento: las pruebas que lo llaman directo pasan sin tocar sus aserciones.
- C7: Las pruebas previas de `ReservasContext.test.jsx` y las de `src/components/reservas/` pasan sin cambiar sus aserciones; `npm run lint` termina sin errores ni avisos.
- C8: `docs/agentes/reservas.md` explica la versión y por qué el render no pisa a `despachar`.

## Comandos

```bash
npm test -- src/context src/components/reservas
npm run lint
```

Al terminar, responde con: archivos cambiados, la prueba nueva (nombre), la
salida resumida del RED y del GREEN, y el resultado de los dos comandos.
