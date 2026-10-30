# Etapa 4 — Organizar la planificación

Aprobado por Juan el 30-10-2026.

## Qué se pidió

Ordenar `planificacion/` con el mismo flujo del proyecto Convite antes de
seguir registrando etapas: nada de planes sueltos en la raíz ni scripts
perdidos en carpetas temporales.

## Qué había

- `PLAN_CHATBOT.md` suelto en la raíz (ignorado por git).
- Instrucciones y salidas de agy del 23-10 y el script de capturas
  (`capturas.mjs`, con rutas absolutas) en una carpeta temporal de una sesión
  anterior.
- La etapa del `GEMINI.md` numerada como 1.

## Decisiones

- Etapas en orden cronológico: 1 chatbot (12/13-10), 2 carrusel y página de
  reserva (23-10), 3 `GEMINI.md` y 4 esta.
- Los bloques 1 a 5 del proyecto son anteriores al flujo: quedan como nota en
  el README con sus commits, sin inventar planes ni reportes.
- El script de capturas pasa a `herramientas/capturas/` con rutas relativas
  al repositorio y la carpeta temporal del sistema.
- Antes de versionar se quitan las rutas personales y las menciones a la
  herramienta del coordinador (regla del repositorio).
- No hay carpeta `datos/`: el proyecto no maneja datos reales.
- No se toca nada fuera del proyecto.
- El trabajo de torneos (PR #1) no pasó por este flujo: su documentación queda
  como siguiente etapa.
- Lo hace el coordinador directamente (mover y adaptar archivos), sin agy.

## Verificación

- Ningún archivo versionado de `planificacion/` con rutas personales ni
  menciones a la herramienta.
- `node --check` del script de capturas.
- `git status` solo con lo de esta etapa.

## Commit

`docs: reorganiza la planificación por etapas`
