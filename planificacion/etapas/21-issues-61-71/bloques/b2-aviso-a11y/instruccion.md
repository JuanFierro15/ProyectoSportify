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

# Tarea del bloque b2: el aviso de conflicto se anuncia una vez y usa tokens (issue #65)

## Objetivo

El aviso global de conflicto (`src/components/shared/AvisoConflictoReserva.jsx`)
tiene dos problemas (lee `gh issue view 65`):

1. Tiene `aria-live="assertive"` en el contenedor y `role="alert"` en cada
   aviso, que ya es una región viva: algunos lectores de pantalla lo anuncian
   dos veces.
2. Sus reglas `.avisos-conflicto*` de `src/App.css` usan colores fijos en
   lugar de tokens.

## Archivos

- Puedes editar solo: `src/components/shared/AvisoConflictoReserva.jsx`,
  `src/components/shared/AvisoConflictoReserva.test.jsx`, `src/App.css` y
  `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. **Una sola región viva.** Quita `aria-live` del contenedor
   `.avisos-conflicto` y conserva `role="alert"` en cada
   `.avisos-conflicto__item`. No agregues otro `role` ni `aria-live`.
2. **Tokens.** En el bloque `:root` de `src/App.css`, junto a los tokens de la
   marca, agrega tokens con prefijo `--aviso-` y un comentario corto, y úsalos
   en todas las reglas `.avisos-conflicto*`. Los valores deben dar **el mismo
   color que hoy** (no cambia nada visible):
   - `--aviso-fondo`: hoy `rgba(26, 26, 26, 0.96)`.
   - `--aviso-texto`: hoy `#fde68a`.
   - `--aviso-borde`: hoy `rgba(246, 169, 75, 0.55)`, que repite
     `--color-marca`; derívalo con
     `color-mix(in srgb, var(--color-marca) 55%, transparent)`.
   - `--aviso-cerrar`: hoy `#f2f2f2` (color del botón de cerrar).
   - `--aviso-cerrar-hover`: hoy `rgba(255, 255, 255, 0.12)`.
   - `--aviso-sombra`: hoy `rgba(0, 0, 0, 0.45)` (en el `box-shadow`).
   Al terminar, ninguna regla `.avisos-conflicto*` tiene un color literal
   (hex, `rgb`, `rgba` ni nombre de color); solo `var(...)`, `transparent` o
   `currentColor`.
3. **Pruebas** en `AvisoConflictoReserva.test.jsx`: con dos avisos, el
   contenedor no tiene `aria-live`, no hay ningún elemento con `aria-live`
   dentro del componente y hay exactamente dos `role="alert"`. Cerrar el
   segundo aviso deja solo el primero (y cerrar el último deja el componente
   vacío).
4. Si `docs/agentes/reservas.md` describe la región viva o los colores del
   aviso, actualízalo.

## Comandos

- `npm test -- src/components/shared src/App.test.jsx`
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b2/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: Con dos avisos en pantalla, el contenedor `.avisos-conflicto` no tiene `aria-live`, ningún elemento del componente tiene `aria-live` y hay exactamente dos elementos con `role="alert"`, uno por aviso.
  Cómo comprobarlo: prueba con Testing Library (la del implementador y una propia).
- C2: Con un aviso hay exactamente un `role="alert"`, y con cero avisos el componente no renderiza nada.
- C3: Cerrar el segundo aviso deja solo el primero; cerrar después el último deja el componente vacío. El botón conserva `aria-label="Cerrar aviso"`.
- C4: Ninguna regla `.avisos-conflicto*` de `src/App.css` tiene un color literal (hex, `rgb()`, `rgba()`, `hsl()` ni nombre de color); solo `var(--…)`, `transparent` o `currentColor`.
  Cómo comprobarlo: leer las reglas, o con un `grep` sobre el bloque de reglas del aviso.
- C5: Los tokens `--aviso-*` están definidos una sola vez, en el `:root` de `src/App.css`, con un comentario. `--aviso-borde` usa `color-mix` con `var(--color-marca)` y el valor `246, 169, 75` ya no aparece repetido en el CSS del aviso.
- C6: Los valores no cambian el color visible: cada token da el mismo color que el literal que reemplaza (fondo `rgba(26,26,26,.96)`, texto `#fde68a`, borde `rgba(246,169,75,.55)`, botón `#f2f2f2`, hover `rgba(255,255,255,.12)`, sombra `rgba(0,0,0,.45)`). El contraste del texto y del botón sobre el fondo sigue siendo al menos 4.5:1.
  Cómo comprobarlo: comparar los valores y calcular el contraste con la fórmula de WCAG (anotar los números). No levantes servidores.
- C7: `z-index` sigue con `var(--z-aviso-conflicto)` y no se agregan `z-index` sueltos.
- C8: `npm test -- src/components/shared src/App.test.jsx` y `npm run lint` terminan con código 0 (lint sin avisos). Las pruebas que ya existían no cambiaron sus aserciones.
