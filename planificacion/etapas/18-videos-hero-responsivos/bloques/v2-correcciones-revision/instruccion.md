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

# Bloque v2-correcciones-revision (etapa 18: correcciones de la revisión del PR #49)

Lee `AGENTS.md`, `docs/agentes/pagina-reserva.md` y `planificacion/etapas/18-videos-hero-responsivos/PLAN.md` antes de empezar.

## Rutas permitidas

- `src/lib/modoHero.js`
- `src/lib/modoHero.test.js`
- `src/components/hero/DeporteHero.jsx`
- `src/components/hero/DeporteHero.test.jsx`
- `src/components/hero/controladorSnapHero.js` (solo comentarios)
- `src/components/layout/PaginaInicio.test.jsx`
- `README.md`
- `docs/agentes/pagina-reserva.md`

No toques ningún otro archivo, en especial nada de `public/` (los videos no cambian). No hagas `git commit`, `git push`, `git checkout`, `git stash` ni cambies de rama. Si `npm test` cambia `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por finales de línea, no lo edites (el coordinador lo restaura). La carpeta `src/__verificacion__/` es del verificador: no la crees ni la toques.

## Contexto

El PR #49 sirve los videos de los heros en dos calidades con `<source media="(min-width: 64em)">` (1080p) y `<source>` (720p). La revisión no encontró bloqueantes y dejó cuatro sugerencias. Juan decidió conservar los videos 1080p, así que este bloque solo atiende esas sugerencias.

## Cambios

### 1. Constante del breakpoint

En `src/lib/modoHero.js` (junto a las demás constantes del hero), agrega:

```js
// Breakpoint `large` de Foundation (1024 px), el mismo de las media queries de
// CSS: desde ahí los heros piden el video 1080p (`hero_<deporte>-lg.mp4`).
export const MEDIA_VIDEO_GRANDE = '(min-width: 64em)';
```

Úsala en `DeporteHero.jsx` (atributo `media` del primer `<source>`; actualiza también la línea de la prop `videoSrcLg` en el JSDoc para que nombre la constante) y en la aserción de `media` de `DeporteHero.test.jsx`. En `modoHero.test.js`, agrega una prueba que compruebe el valor exacto (`toBe('(min-width: 64em)')`), para que un cambio accidental de la constante se note. El CSS (`DeporteHero.css` y otros) sigue con `64em` escrito: las media queries de CSS no aceptan variables.

### 2. Pruebas sin repetir

- `DeporteHero.test.jsx` es la dueña de los atributos del `<video>` y sus `<source>` (criterio C3). Deja sus tres pruebas actuales y cambia solo la aserción de `media` para usar la constante.
- `PaginaInicio.test.jsx`: la prueba de fuentes debe comprobar solo el cableado por deporte en los tres heros. Que el primer `<source>` apunte al `-lg.mp4` del deporte y el segundo al `.mp4`, construyendo las rutas con `import.meta.env.BASE_URL` (ya termina en `/`) en lugar de `/media/...` fijo. Quita las aserciones de `media`, `type` y ausencia de `src` que repite. Ajusta el título de la prueba para que diga lo que comprueba.

### 3. Comentario sobre el error de carga en `controladorSnapHero.js`

La revisión notó que con hijos `<source>` un fallo de carga dispara `error` en el `<source>`, no en el `<video>`, y que el listener de `reproducir` no lo ve. Según el estándar HTML, ese `error` de `<source>` solo ocurre mientras el navegador elige la fuente (antes de tener metadatos). Si ninguna fuente carga, `video.duration` queda en `NaN`, y `reproducir` ya sale por `irAlSiguiente(hero)` sin llamar a `play()`. Los errores después de cargar (red o decodificación) sí se disparan en el `<video>`. No cambies la lógica: agrega un comentario corto junto al `video.addEventListener('error', ...)` que lo explique (criterio C5).

### 4. Documentación

- `README.md`, viñeta de los videos de los heros (cerca de la línea 545): aclara que la calidad se elige al cargar la página y que si la ventana cambia de tamaño después, el video sigue en la calidad con la que cargó hasta recargar.
- `docs/agentes/pagina-reserva.md`, viñeta de `DeporteHero` (línea 48): lo mismo (el `media` de `<source>` solo se evalúa al elegir la fuente), que la query vive en `MEDIA_VIDEO_GRANDE` (`src/lib/modoHero.js`) y una frase sobre por qué el respaldo de error sigue cubriendo los fallos de carga. Esa viñeta es larga: cambia solo lo necesario y no reescribas el resto.

## Prueba

```
npm test
npx eslint src/components/hero src/components/layout src/lib --max-warnings=0
```

## Criterios de aceptación (te los va a exigir un verificador independiente)

- C1: `src/lib/modoHero.js` exporta `MEDIA_VIDEO_GRANDE` con el valor exacto `'(min-width: 64em)'` y un comentario que dice que es el breakpoint `large` de Foundation (el mismo de las media queries de CSS). `src/lib/modoHero.test.js` comprueba ese valor exacto con `toBe`.
- C2: `src/components/hero/DeporteHero.jsx` importa `MEDIA_VIDEO_GRANDE` y lo usa en el atributo `media` del primer `<source>`. En `src/**/*.{js,jsx}`, la cadena `'(min-width: 64em)'` (o con comillas dobles) solo aparece como literal en `src/lib/modoHero.js` y en la aserción de valor de `src/lib/modoHero.test.js`. Los comentarios y los títulos de las pruebas pueden mencionar `64em`.
  Cómo comprobarlo: `git grep -n "min-width: 64em" -- "src/*.js" "src/*.jsx"` y leer cada coincidencia.
- C3: `src/components/hero/DeporteHero.test.jsx` sigue cubriendo los tres casos: sin `videoSrcLg` y con `videoSrcLg=""`, el `<video>` tiene `src` igual a `videoSrc` y 0 `<source>`; con `videoSrcLg`, el `<video>` no tiene `src`, hay exactamente 2 `<source>` en orden, el primero con `src` igual a `videoSrcLg`, `media` igual a `MEDIA_VIDEO_GRANDE` y `type="video/mp4"`, y el segundo con `src` igual a `videoSrc`, `type="video/mp4"` y sin `media`.
- C4: La prueba de fuentes de `src/components/layout/PaginaInicio.test.jsx` solo comprueba el cableado por deporte en los tres heros (`voley-playa`, `padel` y `futbol`): el primer `<source>` apunta a `${import.meta.env.BASE_URL}media/<archivo>-lg.mp4` y el segundo a `${import.meta.env.BASE_URL}media/<archivo>.mp4`. No repite las aserciones de `media`, `type` ni la ausencia de `src` (ya están en `DeporteHero.test.jsx`) y no tiene rutas que empiecen con `/media/` fijas.
- C5: En `src/components/hero/controladorSnapHero.js`, junto al `addEventListener('error', ...)` de `reproducir`, hay un comentario que explica: con hijos `<source>`, un fallo de carga dispara `error` en el `<source>` mientras el navegador elige la fuente, antes de tener metadatos; ese caso lo cubre la comprobación de `duration` al inicio de `reproducir` (sin duración finita mayor que 0 pasa a `irAlSiguiente` sin llamar a `play()`), y los errores posteriores (red o decodificación) llegan al `<video>`. El diff de ese archivo solo agrega líneas de comentario: ninguna línea de código cambia.
  Cómo comprobarlo: `git diff src/components/hero/controladorSnapHero.js`, y que la prueba `it.each([NaN, 0, Infinity])` y la del evento `error` de `controladorSnapHero.test.js` sigan pasando.
- C6: `README.md` (viñeta de los videos de los heros) y `docs/agentes/pagina-reserva.md` (viñeta de `DeporteHero`) dicen que la calidad del video se elige al cargar la página: el navegador evalúa el `media` de `<source>` solo cuando elige la fuente, así que si después cambia el tamaño de la ventana el video sigue en la calidad con la que cargó hasta recargar. La guía, además, nombra `MEDIA_VIDEO_GRANDE` (`src/lib/modoHero.js`) y resume en una frase por qué el respaldo de error del controlador sigue cubriendo los fallos de carga. Español con tildes y tuteo, sin mencionar IA ni modelos.
- C7: Solo cambiaron los archivos permitidos. Ningún archivo de `public/` cambió (`git status --short public` sale vacío).
- C8: `npm test` pasa completo y `npx eslint src/components/hero src/components/layout src/lib --max-warnings=0` termina sin errores ni avisos.
