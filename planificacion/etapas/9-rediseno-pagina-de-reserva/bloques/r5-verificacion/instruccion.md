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

# Tarea r5 — Verificación final, capturas "después" y capturas del README

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (sección F), `PLAN.md` y la tabla de casos A1 a A5, B1 a B7 y C1 a C4 de `planificacion/etapas/8-cierre-sustentacion/PLAN.md` (líneas 120-145 aprox.). Los bloques r1 a r4 ya están en commits. **No edites código de `src/`.**

Trabaja con un solo servidor: `npm run build` y luego `npm run preview` (4173). Chrome headless por CDP, perfil temporal fuera del repositorio. No levantes `npm run dev` ni `vercel dev`. Cada escena empieza en `about:blank` con estado limpio (perfil o `localStorage` vacíos).

## 1. Capturas "después"

Ejecuta `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` con `BASE_URL=http://localhost:4173 OUT_DIR=planificacion/etapas/9-rediseno-pagina-de-reserva/revision/despues`. Deben salir las mismas 20 capturas que hay en `revision/antes/`, con los mismos nombres. Si el script necesita un ajuste por el rediseño (selectores), puedes editar **solo** `revision/capturas-etapa9.mjs`. Mira las imágenes y confirma que cada una muestra lo que dice su nombre.

## 2. Casos A1-A5, B1-B7 y C1-C4 de la etapa 8

Ejecuta cada caso en el navegador (1440×900; repite A1, B3 y C3 a 390×844) y regístralo como `pasa` o `falla` con la evidencia. **Comprueba cada texto citado contra la interfaz real** (el reporte de la etapa 8 tenía citas que no existen): copia el texto exacto que muestra la página. Si un texto esperado no coincide pero el comportamiento es correcto, anótalo como `pasa` con el texto real.

## 3. Teclado y movimiento reducido

- Recorre con Tab toda la página de reserva en los tres modos (`Input.dispatchKeyEvent`): orden lógico, foco visible en cada control (mide el `outline` o el `box-shadow` de `:focus-visible`), pestañas de deporte con flechas, Inicio y Fin, selector de modo, días, horas, campos, comprobante y llaves. Anota cualquier control sin foco visible o fuera de orden.
- Con `Emulation.setEmulatedMedia` y `prefers-reduced-motion: reduce`: carga la reserva en los tres modos y la confirmación; anota si hay animaciones (GSAP, Ken Burns, transiciones largas) que sigan corriendo.

## 4. Tabla de contraste

Mide en el navegador, para cada color de texto nuevo de la página de reserva contra su fondo real, la razón de contraste con los tres acentos (fútbol `#5bd67d`, pádel `#3fa9f5`, vóley `#f6a94b`): texto principal, secundario y tenue sobre la página, las tarjetas de sección, el comprobante y los controles; texto sobre el acento (botón de confirmar, hora elegida, selector de modo activo); acento como texto (pastilla, día elegido, descuento, pack de agua); horas reservadas; textos de 12 px de las llaves; alerta ámbar; mensajes de error. Indica cualquiera por debajo de 4,5:1.

## 5. Capturas del README

Ejecuta el script original `node planificacion/herramientas/capturas/capturas.mjs` (con el `preview` arriba). Escribe en `docs/capturas/`. Después, **restaura con `git checkout -- <archivo>`** todas las capturas que el rediseño no cambia, para que solo queden modificadas las cinco que pide el PROMPT: `vista-canchas.webp`, `reserva-voucher.webp`, `confirmacion-qr.webp`, `modo-torneo.webp` y `torneo-bracket.webp`. Mira esas cinco y confirma que muestran el diseño nuevo y lo que dice su nombre. Revisa que su peso sea parecido al de las anteriores (35-90 KB).

## 6. Resultado

Escribe todo en `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/verificacion-final.md` (en español, tablas Markdown): `npm test`, `npm run lint` y `npm run build`; la lista de capturas "después"; la tabla de casos (caso, resultado, texto real, evidencia); teclado; movimiento reducido; tabla de contraste; capturas del README cambiadas; defectos encontrados (archivo, descripción, cómo reproducirlo).

Al terminar, **mata el árbol del proceso de `preview`** (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

## Archivos que puedes crear o editar

- `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/despues/*.webp`
- `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` (solo selectores, si hace falta)
- `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/verificacion-final.md`
- `docs/capturas/vista-canchas.webp`, `reserva-voucher.webp`, `confirmacion-qr.webp`, `modo-torneo.webp`, `torneo-bracket.webp`

Nada más. No hagas commits.
