# Reporte — Etapa 4: organizar la planificación

- Commit: `docs: reorganiza la planificación por etapas`. Sin agy.
- `PLAN_CHATBOT.md` salió de la raíz a `etapas/1-chatbot/PLAN.md`; se quitó
  `PLAN_CHATBOT.md` del `.gitignore` y las guías apuntan a la ruta nueva.
- Etapa 2 rescatada de una carpeta temporal de una sesión anterior: cuatro
  instrucciones (c1 en dos intentos, k1, p1), sus salidas en `logs/` y un
  reporte reconstruido desde el historial de git.
- La etapa del `GEMINI.md` pasó de 1 a 3 y su bloque de `A` a `g1`.
- `capturas.mjs` quedó en `herramientas/capturas/` con la raíz del proyecto
  calculada desde el propio archivo, la carpeta temporal del sistema y
  `CHROME_PATH` configurable. Verificado con `node --check`; no se volvió a
  correr contra el sitio.
- Se quitaron las rutas personales y las menciones a la herramienta del
  coordinador en todo lo versionado (7 en el plan del chatbot y la ruta del
  proyecto en las cuatro instrucciones).
- README al estilo de Convite: tabla de etapas con responsable, nota de lo
  anterior al flujo, índice de bloques, cómo agregar etapas y bloques y
  herramientas.
- Pendiente: documentar en las guías el trabajo de torneos (PR #1).
