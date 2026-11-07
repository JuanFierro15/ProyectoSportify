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

# Tarea v1 — Medir los pasos del asistente a 390 px y tomar la base a 1440 (solo lectura)

Eres el verificador. **No edites ningún archivo de `src/`, `api/` ni de la raíz.** Solo escribes lo que pide la sección "Entregables".

Antes de empezar, lee:

- `AGENTS.md` (raíz).
- `odd/tasks/asistente-torneo-movil.md` hasta `## Log`: specs **S3**, **S5** y **S8**.
- `planificacion/etapas/10-asistente-torneo-secciones/PLAN.md` (sección "Diseño (B2)").
- `planificacion/herramientas/capturas/capturas.mjs`: reutiliza su forma de manejar Chrome por CDP (puerto 9333, `--headless=new`, `--user-data-dir` temporal, `WebSocket` nativo). La escena del modo torneo (líneas 420-470) muestra cómo elegir día y horas de cada fase.

## Preparación

1. Crea una carpeta temporal **fuera del proyecto** con `mktemp -d` (por ejemplo, `sportify-v1-XXXX` en la carpeta temporal del sistema). Ahí van tu script, el perfil de Chrome y los archivos intermedios.
2. `npm run build` y luego `npm run preview` en segundo plano (puerto 4173). No corras `dev` ni `vercel dev`.

## Medición en móvil (390×844)

`Emulation.setDeviceMetricsOverride` con `width: 390`, `height: 844`, `deviceScaleFactor: 2` y `mobile: true`, más `Emulation.setTouchEmulationEnabled`. Comprueba que `matchMedia('(max-width: 63.9375em)').matches` sea `true`.

Abre `http://localhost:4173/reservar/futbol?modo=torneo` con `localStorage` limpio. Recorre los seis pasos del asistente (`canchas`, `formato`, `fechas`, `llaves`, `datos`, `resumen`) con su botón "Siguiente":

- `canchas`: agrega dos canchas de fútbol con "Agregar al evento" (solo existe en la tarjeta activa; avanza con `.depth-carousel__arrow--next`).
- `formato`: deja 8 equipos y prueba también con 16.
- `fechas`: elige **mañana** o un día posterior y horas libres para cada fase (como en `capturas.mjs`), hasta que el paso quede completo.
- `llaves`: mide con "Aleatorio" y otra vez con "Manual" (con `AsignacionManual` abierto).
- `datos`: escribe "Ana Gómez" y "3001234567" con `Input.insertText` tras enfocar cada campo.
- `resumen`: mide sin confirmar. Después confirma, vuelve a la página en modo torneo y mide el paso donde aparezca "Torneos reservados".

En **cada** paso (y en cada variante), espera a que termine cualquier animación y registra:

1. `document.documentElement.scrollWidth`, `document.body.scrollWidth` y `window.innerWidth`. Es falla si alguno de los dos primeros supera a `innerWidth`.
2. Los elementos cuyo `getBoundingClientRect().right` sea mayor que `innerWidth + 0.5` o cuyo `left` sea menor que `-0.5`, **excepto** los que estén dentro de un ancestro con `overflow-x` `auto`, `scroll`, `hidden` o `clip` cuyo propio rectángulo sí quepa. De cada uno: selector corto (etiqueta + clases), `left`, `right`, `width` y su texto, recortado a 60 caracteres. Máximo 15 por paso.
3. En el paso `llaves` y en la confirmación: el contenedor del bracket (`.bracket-torneo` o el que tenga `overflow-x: auto`), con su `clientWidth`, `scrollWidth` y `overflow-x`. Mide también el `font-size` calculado del texto más chico de una tarjeta de partido.
4. Una captura de página completa del paso (`Page.captureScreenshot` con `captureBeyondViewport: true`, `format: 'webp'`, calidad 70).

Cuidado: en este momento el frente B aún no tiene el CSS móvil. Lo que mides es el estado **antes** de B2: es esperable que haya fallas. No las arregles; solo regístralas.

## Base de escritorio (1440×900)

Con `mobile: false`, `deviceScaleFactor: 1`, abre `/reservar/futbol?modo=torneo` con `localStorage` limpio. Agrega dos canchas y completa las fechas igual que arriba. Toma cuatro capturas del viewport (no de página completa) con `window.scrollTo(0, y)` para `y` = 0, 700, 1400 y 2100. Repite con `/reservar/futbol` (modo cancha) y `/reservar/voley-playa?modo=cumpleanos`, solo con `y` = 0 y 700. Antes de cada captura espera 800 ms.

## Entregables

- Capturas en `planificacion/etapas/10-asistente-torneo-secciones/revision/v1/`: `390-<paso>[-variante].webp` y `1440-<modo>-<y>.webp`.
- `planificacion/etapas/10-asistente-torneo-secciones/revision/v1/medicion.md`: una tabla por paso con los valores de los puntos 1 a 3 y la lista de elementos desbordados, más un resumen de qué pasos fallan y por qué elemento.
- No dejes nada más en el proyecto: el script y el perfil se quedan en tu carpeta temporal.

## Al terminar

- Detén `preview` matando el árbol de su proceso (en Windows, `taskkill /PID <pid> /T /F`; comprueba que el puerto 4173 quede libre) y cierra Chrome. Comprueba que no quedó ningún `chrome.exe` con `--remote-debugging-port=9333`.
- Responde con: la ruta de tu carpeta temporal, el resumen de `medicion.md` y la lista de capturas.
