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

# Tarea del bloque b3: un torneo con todas las fases el mismo día no repite la fecha (issue #69)

## Objetivo

Un torneo con varias fases jugadas **el mismo día** muestra la fecha repetida
en la confirmación y en el texto del QR: "Viernes 20 de noviembre a Viernes 20
de noviembre · 2 jornadas". Lee `gh issue view 69`.

La causa está en `src/components/reservas/useReserva.js` (cerca de la línea
1269): con más de un bloque, `fechaTexto` arma
`` `${fechaCompleta(primerBloque.fecha)} a ${fechaCompleta(ultimoBloque.fecha)}` ``
sin comprobar si las dos fechas son iguales.

## Archivos

- Puedes editar solo: `src/components/reservas/useReserva.js`,
  `src/components/reservas/Torneo.test.jsx`, `src/lib/fechas.js` y
  `src/lib/fechas.test.js`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. Agrega en `src/lib/fechas.js` una función pura y exportada
   `textoRangoFechas(desde, hasta)` (fechas ISO `YYYY-MM-DD`): si son iguales
   devuelve `fechaCompleta(desde)`; si no, `` `${fechaCompleta(desde)} a ${fechaCompleta(hasta)}` ``.
   `src/lib/fechas.js` lo importa también `api/`: sin JSX y sin dependencias
   nuevas.
2. En `useReserva.js`, `fechaTexto` usa `textoRangoFechas` en la rama de
   torneo con más de un bloque. El resto (`horario`, `totalJornadas`, las otras
   modalidades) no cambia.
3. Pruebas:
   - `src/lib/fechas.test.js`: misma fecha → una sola; fechas distintas →
     rango; fechas de meses distintos → rango con los dos meses.
   - `src/components/reservas/Torneo.test.jsx`: un torneo de 4 equipos
     (semifinal y final) con las dos fases el mismo día, confirmado: la
     confirmación muestra una sola fecha y "2 jornadas", y el texto no contiene
     "<fecha> a <fecha>". Usa como modelo la prueba 5 de ese archivo
     (confirmación multi-día).

## Comandos

- `npm test -- src/lib/fechas src/components/reservas`
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b3/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: `textoRangoFechas(d, d)` devuelve exactamente `fechaCompleta(d)`, y `textoRangoFechas(a, b)` con `a !== b` devuelve exactamente `` `${fechaCompleta(a)} a ${fechaCompleta(b)}` ``, también con fechas de meses distintos (por ejemplo `2026-11-30` y `2026-12-01`).
- C2: Un torneo de 4 equipos con semifinal y final el mismo día, confirmado: `confirmado.resumen.fechaTexto` es exactamente `fechaCompleta(<ese día>)`, la confirmación en pantalla muestra esa fecha una sola vez junto a "2 jornadas", y en ningún texto visible aparece "<fecha> a <fecha>".
- C3: En ese mismo caso, el texto del QR (`confirmado.textoQr`) contiene la fecha una sola vez y no contiene " a " entre dos fechas iguales.
- C4: Un torneo con las fases en días distintos sigue mostrando el rango `"<primera> a <última>"`, igual que antes.
- C5: Un torneo de 8 equipos (cuartos, semifinal y final) con la primera y la última fase en días distintos y la del medio el mismo día que la primera muestra el rango de la primera a la última. Con las tres fases el mismo día muestra una sola fecha.
- C6: Las reservas de cancha y de cumpleaños, y un torneo de un solo bloque, no cambian su `fechaTexto`.
  Cómo comprobarlo: las pruebas existentes de `src/components/reservas` pasan sin cambiar sus aserciones.
- C7: `src/lib/fechas.js` no usa JSX ni importa nada nuevo (lo importa `api/`).
- C8: `npm test -- src/lib/fechas src/components/reservas` y `npm run lint` terminan con código 0 (lint sin avisos).
