# Retoma de v3 (intento 2)

El primer intento lo cortó el sistema por falta de memoria antes de escribir
nada (no hay `revision/v3/`). Empiezas de cero, con estas reglas extra para
gastar poca RAM (la PC tiene 8 GB y quedan ~1,1 GB libres):

- Un solo navegador, en modo headless, y **como mucho dos páginas abiertas a
  la vez** (solo R5 y R6 necesitan dos). Cierra cada página al terminar su
  recorrido.
- No abras otro navegador ni otro MCP de navegador en paralelo.
- `npm run build` una vez y `npm run preview` en segundo plano; nada más
  corriendo.
- **Escribe `informe.md` a medida que terminas cada recorrido** (agrega la
  sección del recorrido al terminarlo), para no perder lo hecho si te vuelven a
  cortar.
- Si un recorrido no se puede completar, anótalo con el motivo y sigue con el
  siguiente.
- Al terminar: cierra el navegador y el `preview` y comprueba que nada escucha
  en 4173.

La tarea completa sigue a continuación.

