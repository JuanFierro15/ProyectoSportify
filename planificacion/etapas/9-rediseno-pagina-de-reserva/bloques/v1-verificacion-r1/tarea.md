
# Tarea v1 — Verificación del bloque r1 (solo pruebas, no edites código)

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (B, C1 a C5), `PLAN.md` (Tokens, Textos e íconos) y `bloques/r1-tema-y-encabezado/tarea.md`. El bloque r1 ya está implementado en el árbol de trabajo (`git diff`). Tu trabajo es **verificarlo**, no corregirlo.

## Qué hacer

1. Corre `npm test`, `npm run lint` y `npm run build`. Anota el resultado real (número de pruebas, errores, advertencias).
2. Levanta **solo** `npm run preview` (puerto 4173) y usa `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` con `BASE_URL=http://localhost:4173 OUT_DIR=<carpeta temporal del sistema>/sportify-v1` (fuera del repositorio) para capturar las escenas `cancha-futbol`, `torneo-8` y `cumpleanos` en escritorio y celular. Mira las imágenes.
3. Comprueba contra el PROMPT y el PLAN, y anota `pasa` o `falla` con la evidencia:
   - C1: navbar oscuro en la reserva (`#0d0d0d`, borde `#262626`, enlaces blancos, "Mis reservas" con borde). Y que el inicio (`/`) sigue igual que antes (compáralo con `revision/antes/` si aplica, o describe lo que ves en `/`).
   - C2: franja con foto y velo sin línea de corte, 320 px (260 px en torneo), `h1` grande, subtítulo correcto según el modo, y sin contorno verde al cargar.
   - C3: selector segmentado con íconos, activo claro con texto oscuro, botones de 44 px.
   - C4: pestañas con subrayado del acento en la activa, inactivas grises, filtro a la derecha en escritorio. Flechas izquierda/derecha, Inicio y Fin funcionan en las pestañas (puedes probarlo por CDP con `Input.dispatchKeyEvent`).
   - C5: flechas y puntos del carrusel oscuros.
   - Que no quede ninguna zona blanca ni texto azul de Foundation en la parte que cubre r1. Lo que todavía no cubre r1 (Día, Horario, Tus datos, comprobante, llaves) puede verse sin terminar: solo anótalo.
   - Que no haya scroll horizontal en 390 px.
4. Al terminar, **mata el árbol del proceso de `preview`** (en Windows, `taskkill /PID <pid> /T /F`) y cierra Chrome. Borra la carpeta temporal.

## Restricciones

- No edites ningún archivo del repositorio. No hagas commits.
- No levantes `npm run dev` ni `vercel dev`.

## Al terminar

Responde con: resultados de test, lint y build; tabla de verificación (punto, pasa/falla, evidencia); defectos encontrados, con archivo y descripción concreta; y confirmación de que no quedó ningún proceso de `preview` ni de Chrome.
