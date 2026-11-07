# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `GEMINI.md` (raíz; cada integrante lo
  tiene en local): léela antes de empezar y respétala. La parte del plan que
  te toca va copiada en tu tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

# Tarea v3 — Verificación del bloque r3 (solo pruebas, no edites código)

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (B, C9, C12), `PLAN.md` (E2, Tokens) y `bloques/r3-tiquete-y-confirmacion/tarea.md`. El bloque r3 ya está implementado en el árbol de trabajo (`git diff`; r1 y r2 ya están en commits). Tu trabajo es **verificarlo**, no corregirlo.

## Qué hacer

1. **Revisión del diff (sin lógica nueva):** lee `git diff -w -- src/components/reservas/VoucherReserva.jsx src/components/reservas/ConfirmacionReserva.jsx` y confirma que no cambió ninguna lógica: manejadores (`onClick`, `onConfirmar`, copiar, descargar QR), cálculos, condiciones de qué se muestra, el orden de los datos ni los textos que usan las pruebas (`.voucher-reserva__valor-total`, "Resumen de tu reserva", "Invitados", "Confirmar reserva", "Limpiar selección", "Reserva confirmada", "Código de reserva", "Invitados: N", "Programación por fases:", "N equipos · Eliminación directa (M partidos)", desglose por fase). Lista cualquier cambio que no sea de marcado o estilo.
2. Corre `npm test`, `npm run lint` y `npm run build`. Anota el resultado real.
3. Levanta **solo** `npm run preview` (4173) y usa `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` con `BASE_URL=http://localhost:4173 OUT_DIR=<carpeta temporal del sistema>/sportify-v3` (fuera del repositorio) para las escenas `cancha-futbol`, `torneo-8`, `cumpleanos` y las tres de confirmación, en escritorio y celular. Mira las imágenes y mide estilos computados por CDP.
4. Comprueba y anota `pasa`/`falla` con evidencia:
   - C9 comprobante: fondo `#1a1a1a`, borde `#333333`, radio 18 px, `sticky` en escritorio (al bajar sigue visible); pastilla del tipo con borde y texto del acento; datos según el modo (torneo: formato y fecha de cada fase; cumpleaños: invitados); perforación punteada de 2 px `#3a3a3a` con dos semicírculos de 24 px del color de fondo de la página (`#0d0d0d`) en los bordes; desglose con descuento y pack de agua en acento; total 32 px negrilla; "Confirmar reserva" con fondo de acento y texto `#0d0d0d`; "Limpiar selección" con borde; cifras con `white-space: nowrap` y ≥ 12 px de separación del texto (mídelo en la línea más larga del torneo de 8); el motivo de bloqueo legible.
   - C12 confirmación: fondo oscuro, código `SPF-XXXXXX` grande, copiar y descargar con el estilo nuevo (≥ 44 px, foco visible), **QR sobre fondo blanco con margen blanco alrededor**, condiciones, invitados y resumen del torneo legibles. Anota cómo se ve el `Bracket compacto` dentro de la confirmación de torneo (se rediseña en r4; solo descríbelo).
   - Contraste ≥ 4,5:1 de cada texto nuevo contra su fondo, también el de 12 px, con los tres acentos (fútbol `#5bd67d`, pádel `#3fa9f5`, vóley `#f6a94b`), en especial el texto sobre el botón de acento.
   - Sin scroll horizontal a 390 px (incluida la confirmación de torneo).
5. Al terminar, **mata el árbol del proceso de `preview`** (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

## Restricciones

- No edites ningún archivo del repositorio. No hagas commits. No levantes `npm run dev` ni `vercel dev`.

## Al terminar

Responde con: resultado de la revisión del diff; resultados de test, lint y build; tabla de verificación (punto, pasa/falla, evidencia con medidas); tabla de contrastes medidos; defectos concretos con archivo y descripción; y confirmación de que no quedó ningún proceso de `preview` ni de Chrome.
