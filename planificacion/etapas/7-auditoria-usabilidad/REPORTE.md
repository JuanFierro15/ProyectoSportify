# Reporte — Etapa 7: auditoría de usabilidad (31-10)

Rama `usability-improve` (sobre `f77e283`, merge del PR #2). Auditoría de Miguel
Medina; ejecución y revisión de Juan Fierro.

## Commits

| Bloque | Commit | Contenido |
| --- | --- | --- |
| u1 | `1f4874e` | Prevención de errores: canchas en torneo (deporte y tope), intercambio en cruces manuales, días sin horarios deshabilitados, resumen de franja, acción rápida de 15 min y tope de invitados |
| u3 | `4e23d3a` | `--accent-text`, `:focus-visible`, movimiento reducido, sin `side-tab`, `scroll-snap` y áreas táctiles en chips y visor |
| u4 | `2bca2a0` | Rueda vertical libre sobre el carrusel, dots y flechas accesibles, cerrar del chat de 44 px, detalle en los tres deportes, posters de los heros y `will-change` |
| u2 | `a98ef61` | Mis reservas (código o nombre + teléfono, QR y cancelación), copiar código, condiciones de `negocio.json`, "Limpiar selección" y marca Sportify |
| docs | `2f5cd89` y el de este reporte | Tareas corregidas contra el código real |

## Correcciones a las tareas originales

Las cuatro `tarea.md` usaban nombres o rutas que no existían. Se reescribieron
y los borradores quedaron como `instruccion-borrador.md`:

- u1: `marcada` y `.tarjeta-cancha__boton` (no `seleccionada`/`.cancha-carrusel__cta`),
  `setDuracionPartido`, `contarLibresFase` sin canchas. Con 3 canchas por deporte, el bloqueo real
  es por deporte ("Solo canchas de Fútbol"), en todos los puntos de entrada. El intercambio también
  cubre la posición vacía. El tope de invitados también se valida en `motivoBloqueo`.
- u2: "Mis reservas" como componente propio, cifras desde `negocio.json`.
- u3: el movimiento reducido no puede forzar `transform: none` (rompe `DepthCarousel`); el detector
  `impeccable` no está en esta máquina (se verifica con `grep`).
- u4: `PaginaInicio` está en `components/layout/`; los posters se generaron con ffmpeg (primer
  cuadro de cada video).

Decisiones de Juan: mensaje por deporte en torneo, detalle sobre la foto en los tres deportes (cambia
lo pedido el 23-10), marca Sportify y búsqueda por código o nombre + teléfono.

## Verificación

- `npm test`: 191 pruebas en 15 suites. `npm run lint`: 0 avisos. `npm run build`: limpio.
- Pruebas headless (Chrome por CDP contra `npm run preview`): 32 de 32 casos de u1 a u4. Entre
  ellos, reserva → confirmación → Mis reservas por código → QR → cancelar, el bloqueo de pádel en un
  torneo de fútbol, la rueda del carrusel y "Mis reservas" a pantalla completa en celular.
- Ajustes del coordinador tras las pruebas: "Mis reservas" ya no muestra "No encontramos reservas"
  junto al aviso de cancelación, y la condición de cancelación se lee como frase aparte.

## Pendiente

- README y capturas (marca, Mis reservas, detalle en pádel y vóley) y `CLAUDE.md` (torneos,
  "Limpiar selección", `detalleEnTarjeta` en los tres deportes, Mis reservas y la relación con el
  Bloque 7).
- Al entrar directo a `/reservar/<deporte>?modo=torneo` no hay canchas elegidas (comportamiento
  previo, no de esta etapa).
- PR de `usability-improve` a `main`.
