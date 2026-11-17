# [MODO EJECUTOR] Bloque v1-videos-responsivos (etapa 18)

Lee `AGENTS.md`, `planificacion/etapas/18-videos-hero-responsivos/PLAN.md` y `docs/agentes/pagina-reserva.md` antes de empezar.

## Objetivo

Hacer que los heros de la página de inicio carguen el video de 1080p (`hero_*-lg.mp4`) en pantallas grandes (`min-width: 64em`, `>= 1024px`) y conserven el video ligero de 720p (`hero_*.mp4`) en celular y ventanas menores a `64em`, con sus pruebas unitarias y documentación actualizadas.

Los archivos de video en `public/media/` (`hero_voleyplaya.mp4`, `hero_voleyplaya-lg.mp4`, `hero_padel.mp4`, `hero_padel-lg.mp4`, `hero_futbol.mp4`, `hero_futbol-lg.mp4`) ya existen en el disco.

## Rutas permitidas

- `src/components/hero/DeporteHero.jsx`
- `src/components/layout/PaginaInicio.jsx`
- `src/components/hero/DeporteHero.test.jsx`
- `src/components/layout/PaginaInicio.test.jsx`
- `docs/agentes/pagina-reserva.md`
- `README.md`

Prohibido tocar cualquier otro archivo (no toques `public/media/`, `planificacion/`, `api/`, `src/components/hero/controladorSnapHero.js`, `src/lib/modoHero.js`, ni hagas `git commit`, `git push`, `git checkout` u otra operación de escritura en git).

## Cambios exactos requeridos

### 1. `src/components/hero/DeporteHero.jsx`

1. En el JSDoc de `DeporteHero`, actualiza la línea de `videoSrc` y agrega `videoSrcLg`:
   - `- videoSrc      {string}  ruta del video de fondo (720p para móvil y respaldo)`
   - `- videoSrcLg    {string}  [opcional] ruta del video en 1080p para pantallas grandes (min-width: 64em)`
2. Agrega la prop `videoSrcLg` (sin valor por defecto o `undefined`) en la desestructuración de props de `DeporteHero`.
3. En el `<video>` renderizado:
   - Cuando `videoSrcLg` sea truthy, NO pongas el atributo `src` en `<video>` (`src={videoSrcLg ? undefined : videoSrc}`) y renderiza dentro de `<video>` los dos `<source>` en este orden exacto:
     ```jsx
     <video
       ref={videoRef}
       className="deporte-hero__video"
       src={videoSrcLg ? undefined : videoSrc}
       poster={posterSrc}
       muted
       playsInline
       preload={preload}
       tabIndex="-1"
       aria-hidden="true"
     >
       {videoSrcLg ? (
         <>
           <source
             src={videoSrcLg}
             media="(min-width: 64em)"
             type="video/mp4"
           />
           <source src={videoSrc} type="video/mp4" />
         </>
       ) : null}
     </video>
     ```
   - Cuando `videoSrcLg` no se pase o sea cadena vacía, conserva `src={videoSrc}` directamente en `<video>` y no renderices ningún `<source>`.

### 2. `src/components/layout/PaginaInicio.jsx`

1. Actualiza el comentario sobre `VIDEOS` (líneas 12-17) para explicar que en `public/media/` están las dos versiones all-intra a 30 fps con `+faststart`: `hero_<deporte>.mp4` (720p para celular / `< 64em`) y `hero_<deporte>-lg.mp4` (1080p con Lanczos desde `large`, `min-width: 64em`), mientras los originales en alta calidad están en `public/media/fuente/` (fuera del repo). Conserva la nota de `BASE_URL`.
2. Define `VIDEOS_LG` junto a `VIDEOS`:
   ```js
   const VIDEOS_LG = {
     'voley-playa': `${BASE}media/hero_voleyplaya-lg.mp4`,
     padel: `${BASE}media/hero_padel-lg.mp4`,
     futbol: `${BASE}media/hero_futbol-lg.mp4`,
   };
   ```
3. Pasa `videoSrcLg={VIDEOS_LG[d.slug]}` a `<DeporteHero>` dentro de `DEPORTES.map(...)`.

### 3. `src/components/hero/DeporteHero.test.jsx`

Agrega un bloque `describe('DeporteHero - fuentes de video responsivas', () => { ... })` con estas 3 pruebas:

1. `usa src directo en <video> y no renderiza <source> cuando no se pasa videoSrcLg`:
   - Renderiza `<DeporteHero {...PROPS_VALIDAS} />`.
   - Verifica `expect(video).toHaveAttribute('src', '/media/hero_voleyplaya.mp4')` y `expect(video.querySelectorAll('source')).toHaveLength(0)`.
2. `usa src directo en <video> cuando videoSrcLg es cadena vacía`:
   - Renderiza `<DeporteHero {...PROPS_VALIDAS} videoSrcLg="" />`.
   - Verifica `expect(video).toHaveAttribute('src', '/media/hero_voleyplaya.mp4')` y `expect(video.querySelectorAll('source')).toHaveLength(0)`.
3. `renderiza dos <source> en orden (1080p con min-width: 64em y 720p de respaldo) y omite src en <video> cuando recibe videoSrcLg`:
   - Renderiza `<DeporteHero {...PROPS_VALIDAS} videoSrcLg="/media/hero_voleyplaya-lg.mp4" />`.
   - Verifica `expect(video).not.toHaveAttribute('src')`.
   - Obtiene `const sources = video.querySelectorAll('source');` y verifica `expect(sources).toHaveLength(2)`.
   - `sources[0]`: `toHaveAttribute('src', '/media/hero_voleyplaya-lg.mp4')`, `toHaveAttribute('media', '(min-width: 64em)')`, `toHaveAttribute('type', 'video/mp4')`.
   - `sources[1]`: `toHaveAttribute('src', '/media/hero_voleyplaya.mp4')`, `toHaveAttribute('type', 'video/mp4')`, `not.toHaveAttribute('media')`.

### 4. `src/components/layout/PaginaInicio.test.jsx`

Agrega dentro del `describe('PaginaInicio', ...)` una nueva prueba:

`configura cada DeporteHero con fuente 1080p (-lg.mp4) desde 64em y 720p (.mp4) de respaldo en los tres deportes`

- Recorre los tres deportes en orden (`['voley-playa', 'hero_voleyplaya']`, `['padel', 'hero_padel']`, `['futbol', 'hero_futbol']`).
- Para cada `section.deporte-hero[data-sport="${slug}"]`, obtiene `const video = seccion.querySelector('video')`, verifica `expect(video).not.toBeNull()` y `expect(video).not.toHaveAttribute('src')`.
- Verifica `const sources = video.querySelectorAll('source')` con longitud `2`:
  - `sources[0]` tiene `src="/media/${archivo}-lg.mp4"`, `media="(min-width: 64em)"`, `type="video/mp4"`.
  - `sources[1]` tiene `src="/media/${archivo}.mp4"`, `type="video/mp4"` y `not.toHaveAttribute('media')`.

### 5. `docs/agentes/pagina-reserva.md` y `README.md`

- En `docs/agentes/pagina-reserva.md` (línea 48, ítem `DeporteHero`): actualiza la descripción de los archivos de video para reflejar que en `public/media/` conviven `hero_*.mp4` (720p30, ~18 MB entre los tres, para celular y ventanas `< 64em`) y `hero_*-lg.mp4` (1080p30 con `scale=1920:1080:flags=lanczos`, ~30 MB entre los tres, para pantallas desde `large` `min-width: 64em`), ambos all-intra (`keyint=1`), CRF 20, sin audio y con `+faststart`, seleccionados en `DeporteHero` mediante `<source media="(min-width: 64em)" type="video/mp4">` + `<source type="video/mp4">` cuando recibe `videoSrcLg`. No cambies el resto de la descripción de `DeporteHero` ni otras secciones.
- En `README.md` (alrededor de la línea 545, viñeta de los videos de los heros): actualiza esa viñeta para indicar que los videos de los heros son *all-intra* (un keyframe por cuadro), 30 fps, sin audio y cuentan con imagen `poster` de respaldo, servidos en dos calidades según la pantalla (`720p` en móvil y `1080p` desde `large` con `<source media="(min-width: 64em)">`).

## Verificación requerida antes de reportar

1. Ejecuta `npm test` y asegúrate de que pasen todas las suites.
2. Ejecuta `npm run lint` (0 errores, 0 warnings).
3. Ejecuta `npm run build`.
4. Si `npm test` deja modificado algún archivo no permitido (como un snapshot), revísalo y no modifiques archivos fuera de tu lista.
5. No dejes procesos ni servidores abiertos.

Termina con un reporte corto: archivos cambiados, comandos de prueba con su resultado real, fallos o pendientes, y riesgos.
