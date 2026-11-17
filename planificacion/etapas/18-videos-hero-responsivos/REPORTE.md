# Reporte de la etapa 18: videos responsivos en los heros (720p en celular, 1080p desde `large`)

Fecha: 17-11-2026. Rama: `feat/videos-hero-responsivos` (desde `main`, `5d8064b`).
Nota de numeración: la etapa 17 corresponde al PR #48 (`fix/issues-40-41-42`, aún abierto), por lo que esta etapa usa el número 18 para no colisionar al integrarse en `main`.

## Commits

1. `b16bbdd` — `feat: videos 1080p en pantallas grandes y 720p en móvil`
2. `docs: documenta las dos calidades de video del hero y registra etapa 18`

## Bloques y olas

| Ola | Bloque | Intentos | Resultado |
| --- | --- | --- | --- |
| Preparación | Coordinador | — | Extracción desde `54d87138` de `hero_voleyplaya-lg.mp4` (`10.164.888` B), `hero_padel-lg.mp4` (`9.657.224` B) y `hero_futbol-lg.mp4` (`10.571.893` B) y verificación con `ffprobe` (1920×1080, 30 fps, duraciones exactas 4,0 s / 4,0 s / 5,0 s) |
| 1 | `v1-videos-responsivos` (`gemini-4-hydrogen-high`) | 1 | Prop `videoSrcLg` y `<source media="(min-width: 64em)">` en `DeporteHero.jsx`, mapa `VIDEOS_LG` en `PaginaInicio.jsx`, 4 pruebas nuevas (`DeporteHero.test.jsx` y `PaginaInicio.test.jsx`), actualización de `docs/agentes/pagina-reserva.md` y `README.md`. `HEAD` quedó intacto en `5d8064b`. |

Nota sobre `v1.log`: `agy` entregó todos los cambios solicitados y las pruebas en verde; devolvió código de salida 1 en PowerShell por el aviso en stderr `root agent idle; waiting for 1 background task(s) to finish`, y el snapshot `api/_lib/__snapshots__/instrucciones.test.js.snap` se restauró con `git checkout --` tras quedar marcado solo por fin de línea (LF/CRLF) al ejecutar Vitest.

## Archivos modificados o creados

- Videos nuevos (1080p con Lanczos de `54d87138`):
  - `public/media/hero_voleyplaya-lg.mp4` (`1920×1080`, `30/1`, `4.000000` s, `10.164.888` B)
  - `public/media/hero_padel-lg.mp4` (`1920×1080`, `30/1`, `4.000000` s, `9.657.224` B)
  - `public/media/hero_futbol-lg.mp4` (`1920×1080`, `30/1`, `5.000000` s, `10.571.893` B)
- Código y pruebas:
  - `src/components/hero/DeporteHero.jsx`
  - `src/components/layout/PaginaInicio.jsx`
  - `src/components/hero/DeporteHero.test.jsx` (3 pruebas nuevas)
  - `src/components/layout/PaginaInicio.test.jsx` (1 prueba nueva)
- Documentación y planificación:
  - `docs/agentes/pagina-reserva.md`
  - `README.md`
  - `planificacion/etapas/18-videos-hero-responsivos/` y `planificacion/README.md`

## Verificación

- `npm test`: **38 archivos, 473/473 pruebas en verde** (17 en `DeporteHero.test.jsx`, 2 en `PaginaInicio.test.jsx`).
- `npm run lint`: **0 errores, 0 warnings**.
- `npm run build`: **OK** (compilado en 728 ms en `dist/`).
- Verificación en navegador headless (Chrome vía CDP contra `npm run preview` en `http://localhost:4173`, servidor cerrado en `finally` con el puerto 4173 libre al terminar, 0 errores de consola y 0 excepciones):
  - `390×844` (móvil, `matchMedia('(min-width: 64em)') === false`): los tres heros cargaron `/media/hero_<deporte>.mp4` con `1280×720` (4 s, 4 s, 5 s).
  - `1023×800` (valor límite `< 64em`, `matchMedia === false`): los tres heros cargaron `/media/hero_<deporte>.mp4` con `1280×720` (4 s, 4 s, 5 s).
  - `1024×800` (valor límite `64em`, `matchMedia === true`): los tres heros cargaron `/media/hero_<deporte>-lg.mp4` con `1920×1080` (4 s, 4 s, 5 s).
  - `1440×900` (escritorio, `matchMedia === true`): los tres heros cargaron `/media/hero_<deporte>-lg.mp4` con `1920×1080` (4 s, 4 s, 5 s).

## Riesgo

- El tamaño total de `public/media/` en despliegue pasa de ~18 MB a ~48 MB (sumando ambos juegos de 720p y 1080p), pero cada navegador descarga solo la variante que coincide con su `media` query (`720p` en celular/`< 64em`, `1080p` en `>= 64em`).
- No modifica estado persistido, seguridad ni reglas de negocio.
