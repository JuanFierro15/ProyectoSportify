
# Tarea r2 — Día, Horario, Tus datos y piezas del torneo en oscuro

Antes de editar, lee completos:

- `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (secciones A, B, C6, C7, C8, C10 —solo `AlertaTiempo` y `AsignacionManual`— y D).
- `planificacion/etapas/9-rediseno-pagina-de-reserva/PLAN.md` (E2, Tokens, "Textos e íconos" y la fila `r2`).
- La maqueta `planificacion/etapas/9-rediseno-pagina-de-reserva/referencia/cancha.html`.

Si el PROMPT y el PLAN no coinciden, manda el PLAN (está aprobado). El bloque `r1` ya está hecho y en un commit: los tokens `--reserva-*` existen en `src/App.css` y `.vista-canchas` ya es oscuro, con overrides de Foundation. Úsalos; no los redefinas.

## Qué hacer (solo este bloque)

1. **Tarjetas de sección**: Día, Horario y Tus datos (y en torneo las secciones del formulario: canchas, formato, fechas por fase) van dentro de tarjetas `var(--reserva-seccion)`, borde `1px var(--reserva-seccion-borde)`, radio 16 px, con su título.
2. **C6 Día** (`SelectorDia`): siete casillas iguales en una fila, fondo `var(--reserva-control)`, borde `var(--reserva-control-borde)`. La elegida: borde de 2 px del acento (`var(--accent)`) y el nombre del día en color de acento. El mismo componente lo usa `CalendarioTorneo`: debe verse igual ahí. Conserva `aria-pressed`, los textos (incluido "bloqueado") y el **orden del DOM** (las pruebas toman `getAllByRole('button')[n]` y los 7 días van primero).
3. **C7 Horario** (`FormularioReserva`):
   - Agrupa `reserva.horasBase` en tres franjas con su etiqueta a la izquierda: Mañana (hora < 12), Tarde (12 a 17) y Noche (≥ 18). Calcula los grupos en el componente a partir de `horasBase`; no escribas horas a mano.
   - Botones de 84 × 44 px. Libre: fondo `#1f1f1f`, borde `#4a4a4a`. Elegida: fondo del acento, texto `var(--reserva-sobre-acento)` en negrilla. Reservada: borde punteado `#3a3a3a`, texto `var(--reserva-reservada)` (`#808080`) tachado, `disabled` y `aria-label` "HH:00, reservada" (con la hora real).
   - Las libres y elegidas conservan "HH:00" en su nombre accesible (la prueba busca `getByRole('button', { name: /14:00/i })`). Conserva el clic `reserva.elegirHora(hora)` y toda la lógica actual.
   - Debajo, una leyenda: Libre, Elegida y Reservada, cada una con su muestra.
   - El aviso del beneficio ("Desde 2 horas seguidas…") se queda, con fondo oscuro tintado del acento (por ejemplo `color-mix(in srgb, var(--accent) 12%, var(--reserva-seccion))`) y texto que pase 4,5:1. Sus valores siguen saliendo de `src/lib/precios.js`.
   - Haz lo mismo con los botones de hora de `CalendarioTorneo` (mismas clases y estilos; conserva su orden de DOM y sus textos, por ejemplo "Cuartos de final 14:00").
4. **C8 Tus datos**: nombre y teléfono (e invitados en cumpleaños) en una tarjeta de sección, campos de 46 px de alto, fondo `var(--reserva-campo)`, borde `var(--reserva-campo-borde)`, texto claro, foco visible con el acento. No cambies validaciones, textos, `label`s ni mensajes de error.
5. **`CanchasElegidas`** en oscuro, coherente con las tarjetas de sección.
6. **C10 `AlertaTiempo`**: versión oscura que conserva el tono ámbar: fondo ámbar muy tenue sobre `#161616`, borde ámbar, texto claro que pase 4,5:1. Conserva textos y el botón "Cambiar a 15 min por partido".
7. **C10 `AsignacionManual`**: versión oscura (selects con el estilo de campo). **No cambies** todavía sus etiquetas `R1-P…` ni sus `aria-label`: eso es del bloque r4.
8. Objetivos táctiles de 44 px como mínimo, `:focus-visible` en todo control, contraste 4,5:1 en todo texto (también en el de 12 px).

## Archivos que puedes editar

- `src/components/reservas/FormularioReserva.jsx`, `src/components/reservas/FormularioReserva.css`
- `src/components/shared/SelectorDia.jsx`, `src/components/shared/SelectorDia.css`
- `src/components/reservas/CanchasElegidas.jsx`, `src/components/reservas/CanchasElegidas.css`
- `src/components/reservas/torneo/CalendarioTorneo.jsx` y su CSS si existe
- `src/components/reservas/torneo/AlertaTiempo.jsx`, `src/components/reservas/torneo/AsignacionManual.jsx` y sus CSS si existen (solo estilo y clases)

No toques `src/lib/`, `src/data/`, `src/context/`, `api/`, `useReserva.js`, `VistaCanchas.*`, `VoucherReserva.*`, `ConfirmacionReserva.*`, `torneo/Bracket.*`, ni las pruebas. No muevas el bloque de llaves del formulario (es de r4).

## Reglas

- Conserva clases, roles y textos que usan las pruebas (PLAN E2).
- Sin dependencias ni tipografías nuevas. Animaciones: solo las que ya existen.
- Textos con tuteo, sin detalles de implementación.
- Al terminar corre `npm test` y `npm run lint` (sin `dev`, `preview` ni `vercel dev`) y reporta el resultado.
