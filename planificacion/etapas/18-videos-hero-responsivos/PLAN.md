# Etapa 18: videos responsivos en los heros (720p en celular, 1080p desde `large`)

Estado: **Aprobado** por Juan el 17-11-2026.
Rama: `feat/videos-hero-responsivos` (desde `main`, `5d8064b`).
Responsable: Juan Fierro.

## Qué se pidió y qué hay hoy

Juan pidió conservar la versión ligera de los videos del hero para celulares (generalmente con menor velocidad de conexión), pero mostrar en pantallas grandes como computador la definición completa disponible para evitar que se vean pixelados.

Hoy en `public/media/`:
- `hero_voleyplaya.mp4` (6.150.918 bytes, `1280×720`, 30 fps, 4,0 s)
- `hero_padel.mp4` (5.689.023 bytes, `1280×720`, 30 fps, 4,0 s)
- `hero_futbol.mp4` (6.114.290 bytes, `1280×720`, 30 fps, 5,0 s)

En `54d87138` (justo antes de bajarlos a 720p en `4c3d5ee`) estaban las versiones de los mismos clips de Gemini escaladas a `1920×1080` con `scale=1920:1080:flags=lanczos`, 30 fps, *all-intra*, CRF 20 y `+faststart` (~30 MB en total).
Hoy `src/components/hero/DeporteHero.jsx` solo recibe `videoSrc` (asignado directamente en `<video src={videoSrc}>`), y `src/components/layout/PaginaInicio.jsx` define un único mapa `VIDEOS`.

## Decisiones

1. **Sufijo `-lg.mp4`**: extraer de `54d87138` las versiones 1080p con Lanczos como `public/media/hero_voleyplaya-lg.mp4` (10.164.888 B), `public/media/hero_padel-lg.mp4` (9.657.224 B) y `public/media/hero_futbol-lg.mp4` (10.571.893 B), manteniendo exactamente la misma duración que las versiones 720p (`4,0 s`, `4,0 s` y `5,0 s`) para no alterar el largo del pin de `ScrollTrigger`. El sufijo `-lg` coincide con el de las fotos de canchas (`img/canchas/<id>-lg.webp`).
2. **Selección nativa en `<video>` con `<source media>`**: en `DeporteHero.jsx`, agregar la prop opcional `videoSrcLg`.
   - Cuando `videoSrcLg` está presente, `<video>` **no** lleva atributo `src` directo (`src={undefined}`, porque según el estándar HTML un `src` en `<video>` hace ignorar los `<source>`) y renderiza en orden:
     1. `<source src={videoSrcLg} media="(min-width: 64em)" type="video/mp4" />` (breakpoint `large` de Foundation = `1024px`).
     2. `<source src={videoSrc} type="video/mp4" />` (720p para `< 64em` y respaldo).
   - Cuando `videoSrcLg` no se pasa (o es cadena vacía), `<video>` conserva `src={videoSrc}` sin hijos `<source>` para mantener compatibilidad hacia atrás.
3. **`PaginaInicio.jsx`**: agregar `VIDEOS_LG` junto a `VIDEOS` y pasar `videoSrcLg={VIDEOS_LG[d.slug]}` a cada `DeporteHero`.
4. **Documentación**: actualizar `docs/agentes/pagina-reserva.md` y `README.md`.

## Bloques

| Ola | Bloque | Agente | Rutas |
| --- | --- | --- | --- |
| 1 | `v1-videos-responsivos` | agy, `gemini-4-hydrogen-high` | `src/components/hero/DeporteHero.jsx`, `src/components/layout/PaginaInicio.jsx`, `src/components/hero/DeporteHero.test.jsx`, `src/components/layout/PaginaInicio.test.jsx`, `docs/agentes/pagina-reserva.md`, `README.md` |

El coordinador realiza previamente la extracción de los `-lg.mp4` desde `54d87138` y ejecuta la verificación completa (tests, lint, build y navegador headless contra `npm run preview`).

## Verificación

- **Pruebas unitarias**:
  - `DeporteHero.test.jsx`: sin `videoSrcLg` usa `src` directo sin `<source>`; con `videoSrcLg=""` usa `src` directo sin `<source>`; con `videoSrcLg` omite `src` en `<video>` y renderiza `<source media="(min-width: 64em)" type="video/mp4">` seguido de `<source type="video/mp4">` sin `media`.
  - `PaginaInicio.test.jsx`: los tres deportes en orden (`voley-playa`, `padel`, `futbol`) renderizan `<video>` sin `src` y ambos `<source>` con las rutas `-lg.mp4` y `.mp4` correctas.
- **Suite y build**: `npm test`, `npm run lint` (0 errores, 0 warnings) y `npm run build`.
- **Navegador headless contra `npm run preview` (puerto 4173, cerrando el servidor en `finally`)**:
  - Inspeccionar `video.currentSrc`, `video.videoWidth` y `video.videoHeight` en los 3 heros (primero, segundo y último) tras forzar carga de metadatos en:
    - `390×844` (celular) → 720p (`1280×720`, `/media/hero_<deporte>.mp4`)
    - `1023×800` (límite justo por debajo de `64em`) → 720p (`1280×720`, `/media/hero_<deporte>.mp4`)
    - `1024×800` (límite exacto de `64em`) → 1080p (`1920×1080`, `/media/hero_<deporte>-lg.mp4`)
    - `1440×900` (escritorio) → 1080p (`1920×1080`, `/media/hero_<deporte>-lg.mp4`)

## Commits previstos (solo cuando Juan lo pida)

1. `feat: carga videos 1080p en pantallas grandes y 720p en móvil`
2. `docs: documenta las dos calidades de video del hero y registra etapa 18`

## Correcciones de la revisión del PR #49 (19-11-2026)

La revisión no encontró bloqueantes. Advirtió que los `-lg.mp4` salen de reescalar clips de 720p (~30 MB sin detalle nuevo); Juan decidió conservar el 1080p. Se atienden las sugerencias:

| Bloque | Agente | Rutas permitidas |
| --- | --- | --- |
| `v2-correcciones-revision` | Ciclo verificado: Hydrogen `high` implementa, Argon `high` verifica | `src/lib/modoHero.js` y su prueba, `DeporteHero.jsx` y su prueba, `controladorSnapHero.js` (solo comentarios), `PaginaInicio.test.jsx`, `README.md`, `docs/agentes/pagina-reserva.md` |

Alcance: constante `MEDIA_VIDEO_GRANDE` en `src/lib/modoHero.js` (el CSS sigue con `64em` escrito porque las media queries no aceptan variables), `PaginaInicio.test.jsx` limitado a comprobar qué ruta recibe cada hero (con `BASE_URL`), y en README y guía que la calidad se elige al cargar la página. Los criterios C1 a C8 están en `bloques/v2-correcciones-revision/criterios.md`.

Sugerencia que no cambia código: el `error` de un `<source>` solo se dispara mientras el navegador elige la fuente, antes de tener metadatos; si ninguna carga, `duration` queda en `NaN` y `reproducir` ya pasa a `irAlSiguiente` sin `play()`. Los errores posteriores llegan al `<video>`. Se documenta con un comentario junto al listener.
