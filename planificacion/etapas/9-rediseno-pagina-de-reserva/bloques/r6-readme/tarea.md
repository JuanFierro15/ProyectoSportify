
# Tarea r6 — README al día con el rediseño de la etapa 9

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md`, `PLAN.md` y `revision/verificacion-final.md`. El rediseño ya está hecho y en commits; las 5 capturas de `docs/capturas/` que cambian (`vista-canchas`, `reserva-voucher`, `confirmacion-qr`, `modo-torneo`, `torneo-bracket`) ya están actualizadas. Ábrelas para describirlas bien.

## Qué hacer

Actualiza **solo `README.md`** para que describa la página de reserva tal como quedó, sin reescribir lo que sigue siendo cierto:

1. En la descripción de la página de reserva y sus modos: tema oscuro igual al inicio (encabezado con la foto de la cancha, selector de modo con íconos, pestañas con el color de cada deporte), horario agrupado en Mañana, Tarde y Noche con leyenda (Libre, Elegida, Reservada), y el comprobante con forma de tiquete.
2. En torneos: llaves simétricas en escritorio con la final al centro y el trofeo, por rondas con scroll horizontal en celular, partidos numerados "Partido N" en orden de juego, e indicador de pasos (Canchas, Formato, Fechas por fase, Llaves, Tus datos).
3. En la confirmación: tema oscuro, el QR sigue sobre fondo blanco.
4. El texto alternativo (`alt`) de las 5 capturas que cambiaron, para que describa lo que muestran ahora.
5. El conteo de pruebas: ahora son **197 pruebas en 16 archivos** (comprueba con `npm test`). Si el README nombra pruebas de `Torneo.test.jsx`, agrega que cubren "Ganador del partido N", la final con el trofeo y el indicador de pasos.
6. Si el README tiene una sección de accesibilidad, agrega lo verificado en la etapa: contraste mínimo 4,5:1 medido en todo texto de la reserva con los tres acentos, foco visible con teclado y `prefers-reduced-motion` respetado.

## Reglas

- Español con tildes, tuteo neutro, el mismo tono y formato del README actual. Sin menciones a herramientas de desarrollo, IA ni asistentes.
- No inventes funciones que no existan ni cifras que no estén en el código o en `revision/verificacion-final.md`.
- No toques ningún otro archivo. No hagas commits.
- Al terminar, responde con la lista de secciones que cambiaste.
