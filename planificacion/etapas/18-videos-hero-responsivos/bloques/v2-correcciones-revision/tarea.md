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
