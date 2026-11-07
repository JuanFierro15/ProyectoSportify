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

# Retoma r2 — Corrección de lo que encontró la verificación

El bloque r2 ya está implementado en el árbol de trabajo (`git diff`; r1 está en un commit). La verificación encontró estos defectos. Corrige **solo** esto, sin rehacer nada más:

1. **Tarjetas `fieldset` sin borde ni padding.** `.vista-canchas fieldset` (`VistaCanchas.css`, `border: none; margin: 0; padding: 0`, especificidad 0,1,1) gana sobre `.formulario-reserva__campo` (0,1,0). Resultado: Día, Horario, Formato, Programación por fases y Tus datos quedan sin borde `#2a2a2a`, sin padding y sin separación. Sube la especificidad de las tarjetas (por ejemplo `.vista-canchas .formulario-reserva__campo`) para que tengan fondo `var(--reserva-seccion)`, borde `1px var(--reserva-seccion-borde)`, radio 16 px, padding y separación entre ellas. En torneo, evita tarjeta dentro de tarjeta: si cada `.calendario-torneo__fase` ya es una tarjeta, el `fieldset` de "Programación por fases" no debe tener otro recuadro con el mismo fondo alrededor (o las fases dentro van con un fondo distinto, por ejemplo `var(--reserva-fondo)`), lo que se vea más limpio.
2. **`.vista-canchas .button.hollow` (`VistaCanchas.css`, 0,3,0, importado después) pisa** a `.formulario-reserva__hora.button.hollow`, `.formulario-reserva__pill.button.hollow` y `.alerta-tiempo__accion.button.hollow`. Horas libres: deben ser fondo `#1f1f1f` (`var(--reserva-control)`), borde `#4a4a4a`, radio 10 px. Pastillas inactivas del torneo: fondo `#1f1f1f` y radio 999 px. Botón "Cambiar a 15 min por partido" de `AlertaTiempo`: borde y texto ámbar. Sube la especificidad de esas reglas (por ejemplo, prefijándolas con `.vista-canchas`) o baja la de la regla general; comprueba con los estilos computados que gana la específica.
3. **Horas tachadas como "reservadas" sin canchas elegidas.** En modos de evento (Torneo y Cumpleaños), sin ninguna cancha elegida, las 13 horas salen con la clase de ocupada, tachadas, con borde punteado y `aria-label` "HH:00, reservada": parece que todo el día está reservado cuando falta elegir cancha. Antes del cambio, en evento sin canchas no se marcaban como reservadas (la condición era `!libre && (!reserva.esEvento || reserva.canchaIds.length > 0)`). Recupera esa condición: en evento sin canchas, las horas se ven deshabilitadas pero **no** como reservadas (sin tachado ni "reservada"; el aviso de que falta elegir canchas ya existe). El estilo y el `aria-label` de "reservada" solo cuando de verdad está ocupada. Aplica lo mismo en `CalendarioTorneo`.
4. **`CalendarioTorneo`: horas ocupadas sin "reservada".** Su `aria-label` es siempre `` `${fase.nombreRonda} ${hora}` ``. Cuando la hora está ocupada de verdad (hay canchas y no está libre), agrega ", reservada" al final: `` `${fase.nombreRonda} ${hora}, reservada` ``. Las libres conservan exactamente `` `${fase.nombreRonda} ${hora}` `` (lo buscan las pruebas: "Cuartos de final 14:00").
5. **`SelectorDia` a 390 px y contraste de los días bloqueados.** `.selector-dia__opcion` tiene `min-width: 44px` en un grid de 7 columnas con `gap: 8px`: necesita 356 px y el contenedor mide unos 320 px, así que se desborda y "Mañana" se sale del botón. Haz que las 7 casillas quepan en una fila a 390 px (gap más chico en celular, `min-width: 0`, texto que se ajuste o abreviado con el nombre completo accesible) manteniendo los 44 px de alto. Los días deshabilitados/bloqueados: texto `#808080` sobre `#1f1f1f` da 4,17:1 y además llevan `opacity: 0.45`. Quita la opacidad y usa un color que dé al menos 4,5:1 sobre su fondo (mídelo; por ejemplo `#8c8c8c` u otro), conservando el texto "bloqueado".
6. **Foco visible anulado en campos.** `.vista-canchas select:focus, .vista-canchas input:not([type="checkbox"]):not([type="radio"]):focus` (`VistaCanchas.css`, `outline: none`, 0,4,1) pisa el `outline` de `:focus-visible` del formulario. Haz que con teclado (`:focus-visible`) se vea el foco con el acento en todo `input` y `select` de la página.
7. **Clase `formulario-reserva__horas` eliminada.** Rompe el script de capturas (`#reserva-horario .formulario-reserva__horas button` y `<fase> .formulario-reserva__horas button[data-hora="..."]`). Agrega de nuevo la clase `formulario-reserva__horas` a los contenedores de botones de hora de cada franja (en `FormularioReserva` y en `CalendarioTorneo`), sin cambiar la nueva estructura.

Archivos que puedes editar: los de `tarea.md` y además `src/components/canchas/VistaCanchas.css` (solo para los puntos 1, 2 y 6). Al terminar corre `npm test` y `npm run lint` y reporta.

---

La tarea original del bloque, para contexto:

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
