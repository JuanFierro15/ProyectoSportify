
# Tarea v2 — Verificación final del frente B (solo lectura)

Eres el verificador independiente. **No edites ningún archivo de `src/`, `api/` ni de la raíz.** Solo escribes lo que pide "Entregables".

Lee antes:

- `AGENTS.md` (raíz).
- `odd/tasks/asistente-torneo-movil.md` hasta `## Log`: specs **S2**, **S7** y **S8**.
- `planificacion/etapas/10-asistente-torneo-secciones/PLAN.md`.
- `planificacion/etapas/10-asistente-torneo-secciones/revision/v1/medicion.md`: la medición **antes** de B2. Reutiliza su método.
- `git log --oneline -4` y `git show 2eafffa`: el CSS que agregó B2.

## Preparación

Carpeta temporal **fuera del proyecto** con `mktemp -d` (script y perfil de Chrome). Luego `npm run build` y `npm run preview` en segundo plano (4173). Chrome headless por CDP como `planificacion/herramientas/capturas/capturas.mjs`.

## 1. Móvil 390×844 (S8)

Igual que en v1 (`mobile: true`, DPR 2): recorre los seis pasos de `/reservar/futbol?modo=torneo` (`canchas`, `formato` con 8 y 16 equipos, `fechas`, `llaves` en Aleatorio y en Manual, `datos`, `resumen`), la confirmación y el `resumen` con "Torneos reservados" abierto. En cada uno registra:

- `document.documentElement.scrollWidth`, `document.body.scrollWidth`, `.vista-canchas__marco.scrollWidth` e `innerWidth`.
- Los elementos desbordados, con el mismo criterio de v1.
- Del contenedor de scroll del bracket (`.bracket-torneo__movil`): `clientWidth` y `scrollWidth`. Haz `scrollLeft = scrollWidth` y comprueba que se ve la última ronda (la final) entera dentro de la caja: toma una captura del viewport en ese estado.
- El `font-size` más chico de una tarjeta de partido (debe seguir en 12 px o más).
- Que **cada paso muestra solo su bloque** (S7): en `formato` no aparecen "Emparejamiento de 1.ª ronda", "Capacidad y tiempo estimado", "Programación por fases" ni "Tus datos"; en `fechas` no aparecen "Cantidad de equipos" ni "Tus datos"; en `llaves` no aparecen "Cantidad de equipos", "Programación por fases" ni "Tus datos"; en `datos` solo "Tus datos". Escribe qué textos encontraste.

Falla si `doc`, `body` o `marco` superan `innerWidth` en más de 2 px. Los 2 px de las muescas del voucher en `resumen` ya están documentados y se aceptan.

## 2. Tableta 960×800 (corte intermedio)

Con `mobile: true`, DPR 1. Entre 900 px y 64em el bracket usa `.bracket-torneo__canvas-scroll` y no `.bracket-torneo__movil`. Mide los pasos `llaves` y `resumen` con "Torneos reservados" abierto, con los mismos valores del punto 1. Si hay desborde, identifica el elemento causante y el porqué, como en el diagnóstico de v1.

## 3. Escritorio 1440×900 (S2, sin cambios)

Repite exactamente las capturas de base de v1: torneo con `y` = 0, 700, 1400 y 2100; cancha y cumpleaños con `y` = 0 y 700, con el mismo estado y los mismos pasos que v1. Compara cada una con su par en `revision/v1/` píxel por píxel: decodifica los WebP en tu carpeta temporal con lo que tengas a mano (ffmpeg o un canvas de Chrome), y para cada par reporta el porcentaje de píxeles distintos. Si alguna difiere en más de 0,5 %, genera una imagen de diferencias y explica qué región cambió (los videos, los cursores parpadeantes o la animación del carrusel pueden variar: dilo si es eso).

## Entregables

- `planificacion/etapas/10-asistente-torneo-secciones/revision/v2/verificacion.md`: tablas por paso de los puntos 1 a 3, el veredicto por spec (S2, S7, S8: PASA / FALLA, con la evidencia) y la lista de fallas, si hay.
- Capturas en `revision/v2/`: solo `390-llaves-final.webp` (el bracket desplazado hasta la final), `390-resumen-guardados.webp` y las imágenes de diferencias, si las hubo. Las demás se quedan en tu carpeta temporal.

## Al terminar

Detén `preview` matando el árbol de su proceso (`taskkill /PID <pid> /T /F`), comprueba que el 4173 quedó libre y cierra Chrome (que no quede ningún `chrome.exe` con `--remote-debugging-port=9333`). Responde con la ruta de tu carpeta temporal y el veredicto por spec.
