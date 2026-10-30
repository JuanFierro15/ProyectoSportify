# Reporte — Etapa 2: carrusel y página de reserva (23-10-2026)

Reconstruido el 30-10-2026 a partir de las instrucciones, las salidas de agy y
el historial de git. No hubo `PLAN.md` escrito: el plan se acordó en la sesión.

## Qué se pidió

- Fotos de las canchas como protagonistas del carrusel: sin escenario ni
  degradados, tarjetas más grandes y poco texto encima.
- Características y descripción sobre la foto solo en fútbol.
- La reserva deja de ser un modal y pasa a página propia (`/reservar/<deporte>`).
- README y capturas al día.

## Bloques

| Bloque | Qué hizo | Intentos | Commits |
| --- | --- | --- | --- |
| `c1-fotos-protagonistas` | Carrusel con las fotos protagonistas, `autoScale` en `DepthCarousel`, `TarjetaCanchaCarrusel` y README | 2: el primero se cortó por cuota (429) tras dejar parte del trabajo; el segundo lleva la retoma al inicio | `d8cd353` |
| `k1-capturas` | Script de capturas por CDP (`herramientas/capturas/capturas.mjs`) y capturas del carrusel | 1 (`SUCCESS`) | `68542dc` |
| `p1-pagina-de-reserva` | Detalle sobre la foto en fútbol y página de reserva con rutas | 1 (`ERROR` tras 790 s, después de entregar el trabajo) | `f33b29a`, `1a3dc54` |

Las capturas de la página de reserva (`297afde`) las tomó el coordinador con el
mismo script, sin agy.

## Notas

- Las instrucciones se guardaron tal cual se lanzaron, salvo la ruta absoluta
  del proyecto (ahora "raíz del repositorio") y la carpeta de trabajo del
  script (`<carpeta temporal>`).
- Logs en `logs/` (no se versionan).
