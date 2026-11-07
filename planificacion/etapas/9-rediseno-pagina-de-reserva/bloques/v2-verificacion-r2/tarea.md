
# Tarea v2 — Verificación del bloque r2 (solo pruebas, no edites código)

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (B, C6, C7, C8, C10), `PLAN.md` (E2, Tokens) y `bloques/r2-dia-horario-y-datos/tarea.md`. El bloque r2 ya está implementado en el árbol de trabajo (`git diff`; r1 ya está en un commit). Tu trabajo es **verificarlo**, no corregirlo.

## Qué hacer

1. Corre `npm test`, `npm run lint` y `npm run build`. Anota el resultado real.
2. Levanta **solo** `npm run preview` (4173) y usa `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` con `BASE_URL=http://localhost:4173 OUT_DIR=<carpeta temporal del sistema>/sportify-v2` (fuera del repositorio) para las escenas `cancha-futbol`, `torneo-8` y `cumpleanos`, en escritorio y celular. Mira las imágenes. Además, por CDP, mide estilos computados donde haga falta.
3. Comprueba y anota `pasa`/`falla` con evidencia:
   - Tarjetas de sección (Día, Horario, Tus datos; en torneo también canchas, formato y fechas por fase): fondo `#161616`, borde `#2a2a2a`, radio 16 px.
   - C6 Día: 7 casillas iguales en una fila (también a 390 px, sin scroll horizontal de la página); la elegida con borde de 2 px del acento y el nombre del día en acento. Igual en `CalendarioTorneo`.
   - C7 Horario: franjas Mañana (<12), Tarde (12-17), Noche (≥18) con su etiqueta, sacadas de las horas del negocio (13 horas, de 08:00 a 20:00); botones de 84×44 px; libre `#1f1f1f`/borde `#4a4a4a`; elegida fondo acento y texto `#0d0d0d` negrilla; reservada borde punteado `#3a3a3a`, texto `#808080` tachado, `disabled` y `aria-label` "HH:00, reservada"; leyenda Libre/Elegida/Reservada; aviso del beneficio con fondo tintado y contraste ≥ 4,5:1 (mídelo).
   - **Caso especial a revisar:** en modo Torneo y en Cumpleaños, **sin ninguna cancha elegida**, ¿cómo se ven las horas? Antes del cambio, una hora no libre en un modo de evento sin canchas no se marcaba como "reservada". Di si ahora aparecen todas tachadas y con `aria-label` "…, reservada" aunque no haya canchas (sería un defecto: no están reservadas, falta elegir canchas). Compara con lo que hace la versión anterior en `revision/antes/` o en producción (`https://proyecto-sportify.vercel.app/reservar/futbol?modo=torneo`).
   - C8 Tus datos: campos de 46 px, fondo `#0f0f0f`, borde `#444444`, foco visible; los mensajes de error siguen apareciendo (escribe un nombre con números y un teléfono inválido y sal del campo).
   - `CanchasElegidas`, `AlertaTiempo` (tono ámbar sobre `#161616`, texto ≥ 4,5:1; para que aparezca, elige pocas horas para 8 equipos) y `AsignacionManual` (botón "Manual" en el formato del torneo) en oscuro; las etiquetas `R1-P…` siguen igual (se cambian en r4).
   - Contraste ≥ 4,5:1 de cada texto nuevo contra su fondo, también el de 12 px, con los tres acentos (fútbol `#5bd67d`, pádel `#3fa9f5`, vóley `#f6a94b`).
   - Navegación con teclado por días, horas y campos: orden lógico y foco visible.
   - Sin scroll horizontal a 390 px.
4. Al terminar, **mata el árbol del proceso de `preview`** (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

## Restricciones

- No edites ningún archivo del repositorio. No hagas commits. No levantes `npm run dev` ni `vercel dev`.

## Al terminar

Responde con: resultados de test, lint y build; tabla de verificación (punto, pasa/falla, evidencia con medidas); la tabla de contrastes medidos (texto, fondo, razón); defectos concretos con archivo y descripción; y confirmación de que no quedó ningún proceso de `preview` ni de Chrome.
