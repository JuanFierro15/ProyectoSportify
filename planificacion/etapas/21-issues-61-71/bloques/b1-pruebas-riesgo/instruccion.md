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

# Tarea del bloque b1: pruebas de los casos de riesgo de la sincronización entre pestañas (issue #66)

## Objetivo

Las PR #57 a #60 cubren los caminos principales de la sincronización entre
pestañas, pero varios casos de riesgo no están fijados por la suite. Agrega
pruebas que fijen el comportamiento **actual** de `main` en esos casos, para
que una regresión las rompa. Lee la issue completa con
`gh issue view 66` y el contexto en `docs/agentes/reservas.md`.

Este bloque **solo agrega pruebas**: no cambies código de producción.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.test.jsx`,
  `src/components/shared/AvisoConflictoReserva.test.jsx` y
  `src/lib/cancelacion.test.js`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- Para el caso 1 puedes invertir **temporalmente** el orden de llamadas en
  `src/context/ReservasContext.jsx` para comprobar que tu prueba falla, pero
  debes dejar el archivo exactamente como estaba (`git diff` vacío en ese
  archivo al terminar). Anota en tu resumen la salida de esa corrida.
- No hagas commits, ni push, ni cambies de rama.

## Fuente de las pruebas

Las sondas de la revisión están en
`planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.test.jsx.txt`
(y su informe en `v2-sondas.md` de la misma carpeta). Lleva a la suite las
sondas **S2, S5, S6 y S14**, adaptadas al estilo y a los helpers que ya usa
`src/context/ReservasContext.test.jsx` (no dupliques helpers que ya existan
ahí). Después agrega los casos 2 y 5 de la issue, que no tienen sonda.

## Casos (numeración de la issue #66)

1. **Cancelar y volver a reservar la misma celda** con una cancelación
   pendiente (sonda S2): sin poder guardar (`setItem` falla), cancelar `R1` y
   reservar `R2` en la misma cancha, fecha y hora; luego llega `storage` de
   otra pestaña con `R1` y `Rb` (en otra hora). `R2` debe sobrevivir sin aviso,
   porque `quitarReservasDeEstado` corre antes que
   `conciliarReservasSinGuardar` dentro de `conciliarLecturaExterna`.
2. **Choque de un evento** (`tipo: 'evento'` con `bloques`: torneo o
   cumpleaños) pendiente contra una reserva individual guardada por otra
   pestaña. Haz dos variantes: el choque en el **segundo** bloque y en el
   **último** bloque (no en el primero). Fija qué pasa con el evento completo:
   códigos que quedan en `reservas`, `disponibilidad` de las horas de los
   bloques que no chocaban y los avisos de `avisosConflicto`.
3. **Cancelación pendiente cuando otra pestaña borra la clave** (sonda S6, con
   `removeItem` y con `localStorage.clear()`).
4. **`ultimoRawStorageRef` nulo o ilegible** en los casos comunes (sonda S14,
   sus dos variantes).
5. **Varias pendientes en la misma pestaña** donde una choca y otra no: debe
   quedar la que no choca y avisar solo de la otra. Dos variantes: choca la
   primera pendiente, y choca la segunda. En
   `AvisoConflictoReserva.test.jsx` agrega la versión de interfaz: un solo
   `role="alert"` y su texto trae el código de la que chocó.

Más la sonda **S5** (horas compartidas al cancelar con `aplicarCancelacion` y
`quitarReservasDeEstado`, incluida la última hora del día y un evento con
`bloques`).

## Reglas para las pruebas

- Valores exactos: compara listas de `codigo` con `toEqual([...])`,
  `disponibilidad(canchaId, fecha)` hora por hora en las horas implicadas, y
  `avisosConflicto` por cantidad y por el código que nombra cada mensaje. Nada
  de comprobar solo longitudes.
- Nada de `toThrow()` a secas ni `try/catch` sin aserción.
- El título de cada prueba nombra la issue y el caso, por ejemplo
  `#66 caso 2: un torneo pendiente que choca en su segundo bloque ...`.
- Restaura `Storage.prototype.setItem` y los relojes falsos al terminar cada
  prueba (como hacen las pruebas existentes).
- **Si un caso falla con el código actual**, no cambies el código de
  producción: deja esa prueba con `it.fails(...)`, un comentario
  `// Falla en main: <qué pasa>` y repórtalo en tu resumen.

## Comandos

- `npm test -- src/context src/components/shared src/lib/cancelacion`
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b1/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: Existe una prueba del caso 1 (sonda S2): con `setItem` fallando, cancelar `R1` y reservar `R2` en la misma celda, y luego un `storage` con `R1` y `Rb`, deja exactamente los códigos de `R2` y `Rb` en `reservas`, la hora de `R2` ocupada en `disponibilidad` y `avisosConflicto` vacío.
  Cómo comprobarlo: leer la prueba y correrla. Leer `conciliarLecturaExterna` en `src/context/ReservasContext.jsx` y confirmar que, con el orden invertido (conciliar antes de quitar), `R2` chocaría con la hora de `R1` y la aserción fallaría. El resumen del implementador trae la salida de esa mutación.
- C2: Existen dos pruebas del caso 2: un evento con `bloques` (torneo o cumpleaños) pendiente que choca con una individual guardada en su **segundo** bloque, y otra en su **último** bloque. Cada una fija con valores exactos los códigos de `reservas`, la `disponibilidad` de las horas de los bloques que no chocaban y los avisos (cantidad y código).
- C3: Existe la prueba del caso 3 (sonda S6) con `removeItem` y con `localStorage.clear()`, con cancelación pendiente y con alta pendiente, y fija con valores exactos qué reservas quedan y que la pendiente que sobrevive se guarda una sola vez.
- C4: Existe la prueba del caso 4 (sonda S14) con sus dos variantes (JSON ilegible + cambio de día + `storage` válido sin `R1`, y clave borrada + `setItem` fallando + `storage` válido con `Rb`), con valores exactos.
- C5: Existen las pruebas del caso 5 en `ReservasContext.test.jsx` con dos variantes (choca la primera pendiente; choca la segunda): queda la que no choca, se descarta la otra y hay exactamente un aviso, con el código de la que chocó.
- C6: `AvisoConflictoReserva.test.jsx` tiene la versión de interfaz del caso 5: con dos pendientes y una sola que choca, hay exactamente un `role="alert"` y su texto contiene el código de la que chocó (y no el de la otra).
- C7: Existe la prueba de la sonda S5 (horas compartidas al cancelar con `aplicarCancelacion` y `quitarReservasDeEstado`, incluida la última hora del día y un evento con `bloques`) con valores exactos.
- C8: No hay cambios en código de producción: `git diff --stat` solo muestra los archivos de prueba permitidos. Las pruebas que ya existían no cambiaron sus aserciones (el diff de esos archivos solo agrega casos).
- C9: Las pruebas nuevas cumplen las reglas: títulos con `#66` y el caso, valores exactos (no solo longitudes), sin `toThrow()` a secas ni `try/catch` sin aserción, y restauran `setItem` y los relojes. Si alguna está como `it.fails`, tiene el comentario `// Falla en main: ...` y el caso está explicado en el resumen.
- C10: `npm test -- src/context src/components/shared src/lib/cancelacion` y `npm run lint` terminan con código 0 (lint sin avisos).
