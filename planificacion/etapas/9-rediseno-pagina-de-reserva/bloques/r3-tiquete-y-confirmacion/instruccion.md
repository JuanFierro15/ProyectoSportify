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

# Retoma r3 — Corrección de lo que encontró la verificación

El bloque r3 ya está implementado en el árbol de trabajo (`git diff`; r1 y r2 están en commits). La verificación encontró dos defectos. Corrige **solo** esto:

1. **Confirmación de torneo recortada a 390 px.** `.vista-canchas__confirmacion` (con `margin: 0 auto`, sin `width: 100%` ni `min-width: 0`) y `.confirmacion-reserva` (`display: flex; flex-direction: column`, sin `width: 100%` ni `min-width: 0`) crecen con el ancho intrínseco del `<Bracket compacto />` hasta 615 px (la confirmación) y 665 px (su contenedor) en una ventana de 390 px. Como `.vista-canchas__marco` tiene `overflow-x: clip`, no hay scroll pero la mitad derecha (título, "Copiar código", medio QR, resumen y "Listo") queda cortada. Haz que ambos respeten el ancho disponible (`width: 100%; min-width: 0; box-sizing: border-box` o equivalente, con su `max-width` actual) y que `.confirmacion-reserva__bracket` tenga su propio `overflow-x: auto` (scroll horizontal solo dentro del recuadro de las llaves). La regla de `.vista-canchas__confirmacion` está en `ConfirmacionReserva.css`; si estuviera en `VistaCanchas.css`, puedes editar solo esa regla allí.
2. **Precio tachado con contraste 4,41:1.** `.voucher-reserva__linea-tachado` usa `--reserva-reservada` (`#808080`) sobre el comprobante `#1a1a1a`. Usa `var(--reserva-texto-tenue)` (`#a8a8a8`, 7,28:1) para ese texto, conservando el tachado.

Archivos que puedes editar: `src/components/reservas/ConfirmacionReserva.css`, `src/components/reservas/VoucherReserva.css` (y, solo si la regla está allí, la de `.vista-canchas__confirmacion` en `src/components/canchas/VistaCanchas.css`). Al terminar corre `npm test` y `npm run lint` y reporta.

---

La tarea original del bloque, para contexto:

# Tarea r3 — Comprobante tiquete y confirmación en oscuro

Antes de editar, lee completos:

- `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (secciones A, B, C9, C12 y D).
- `planificacion/etapas/9-rediseno-pagina-de-reserva/PLAN.md` (E2, Tokens y la fila `r3`).
- Las maquetas `referencia/cancha.html` y `referencia/torneo.html` de la misma carpeta (el comprobante).

Si el PROMPT y el PLAN no coinciden, manda el PLAN (está aprobado). Los bloques `r1` y `r2` ya están hechos: los tokens `--reserva-*` existen en `src/App.css` y la página ya es oscura. Úsalos; no los redefinas.

## Qué hacer (solo este bloque)

1. **C9 Comprobante (`VoucherReserva`)**, con forma de tiquete. Es el elemento llamativo de la página:
   - Fondo `var(--reserva-elevada)` (`#1a1a1a`), borde `1px var(--reserva-elevada-borde)` (`#333333`), radio 18 px. Sigue `sticky` como hoy (la regla está en `VistaCanchas.css`, `.vista-canchas__reserva > .voucher-reserva`; no la quites).
   - Arriba: título, pastilla del tipo de reserva con borde y texto del acento (`var(--accent)`), y los datos (cancha, fecha, horario; en torneo, formato y fecha de cada fase; en cumpleaños, la línea de invitados que ya existe).
   - Perforación: una línea punteada de 2 px `var(--reserva-linea)` (`#3a3a3a`) con dos semicírculos de 24 px del color del fondo de la página (`var(--reserva-fondo)`) en los bordes izquierdo y derecho, como un tiquete que se desprende. Hazlo con CSS (pseudo-elementos o un elemento decorativo `aria-hidden="true"`).
   - Abajo: el desglose (horas, descuento y pack de agua en color de acento), el total en 32 px y negrilla, "Confirmar reserva" con fondo del acento y texto `var(--reserva-sobre-acento)`, y "Limpiar selección" con borde.
   - Las cifras del desglose no se parten en dos líneas (`white-space: nowrap`) y tienen al menos 12 px de separación del texto.
   - El motivo por el que aún no se puede confirmar se sigue mostrando, legible en oscuro.
2. **C12 Confirmación (`ConfirmacionReserva`)**:
   - Fondo oscuro coherente con el comprobante, código `SPF-XXXXXX` grande, botones de copiar y descargar en el estilo nuevo (borde o acento, foco visible, 44 px).
   - **El QR se queda sobre fondo blanco con margen blanco alrededor** para que los lectores lo sigan leyendo.
   - Las condiciones de `negocio.json`, los invitados (cumpleaños) y el resumen del torneo, legibles en oscuro.
   - No cambies el `Bracket compacto` de la confirmación: eso es del bloque r4. Si se ve claro sobre el fondo oscuro, déjalo así y anótalo.
3. Objetivos táctiles de 44 px, `:focus-visible` en todo control, contraste 4,5:1 en todo texto (también en el de 12 px).

## Conserva (lo usan las pruebas)

`.voucher-reserva__valor-total`, `aria-label` "Resumen de tu reserva", los textos "Invitados", "Confirmar reserva", "Limpiar selección", "Reserva confirmada", "Código de reserva", "Invitados: N", "Programación por fases:", "N equipos · Eliminación directa (M partidos)" y el desglose por fase ("Cuartos de final: … 14:00 a 15:00 (3 canchas)"). No cambies lógica, cálculos ni el orden de los datos.

## Archivos que puedes editar

- `src/components/reservas/VoucherReserva.jsx`, `src/components/reservas/VoucherReserva.css`
- `src/components/reservas/ConfirmacionReserva.jsx`, `src/components/reservas/ConfirmacionReserva.css`

No toques nada más (ni `src/lib/`, `src/data/`, `src/context/`, `api/`, `useReserva.js`, `VistaCanchas.*`, `FormularioReserva.*`, `torneo/*`, ni las pruebas).

## Reglas

- Sin dependencias ni tipografías nuevas. Animaciones: solo las que ya existen.
- Textos con tuteo, sin detalles de implementación.
- Al terminar corre `npm test` y `npm run lint` (sin `dev`, `preview` ni `vercel dev`) y reporta el resultado.
