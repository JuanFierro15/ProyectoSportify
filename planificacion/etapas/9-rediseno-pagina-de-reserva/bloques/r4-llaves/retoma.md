
# Retoma r4 — Corrección de lo que encontró la verificación

El bloque r4 ya está implementado en el árbol de trabajo (`git diff` y archivos nuevos; r1 a r3 están en commits). La verificación encontró cinco defectos. Corrige **solo** esto, sin rehacer nada más:

1. **El comprobante `sticky` tapa las llaves en escritorio.** `.voucher-reserva` (`position: sticky; top: 5.5rem`) y `.seccion-llaves` son hermanos en la rejilla `.vista-canchas__reserva`. En una rejilla, el área de restricción del `sticky` es el contenedor completo (incluida la fila 2 de las llaves), así que al bajar el comprobante se monta sobre los 340 px derechos de las llaves. Solución pedida: envuelve `.vista-canchas__principal` y el comprobante en un contenedor propio (por ejemplo `.vista-canchas__fila-reserva`) que desde `large` sea la rejilla de dos columnas (`principal | comprobante`); `SeccionLlaves` queda después de ese contenedor, a ancho completo. Por debajo de `large`, ese contenedor va con `display: contents` para conservar el orden en celular: formulario, llaves, comprobante (con `order` o `grid-template-areas` en el padre). El comprobante sigue `sticky` en escritorio, pero ya no baja más allá de su fila.
2. **Trofeo encima del título "Final" con 4 equipos.** En `Bracket.jsx`, con 4 equipos `yCenterFinal = 62` → `topCaja = 14` y `topIcono = -42`: el ícono sale del lienzo y pisa "Final / fecha". Reserva espacio arriba del lienzo para el ícono y la caja de la final (por ejemplo, un `padding-top` o desplazamiento mínimo del lienzo calculado para que `topIcono >= 0`), en todos los tamaños (4, 8, 16), sin romper la alineación de conectores.
3. **Faltan los conectores en celular (< 900 px).** C11 pide "las rondas de izquierda a derecha, como hoy, con las tarjetas y los conectores nuevos y scroll horizontal dentro del recuadro". La rama `esMovil` no dibuja conectores. Agrégalos (2 px `#3a3a3a`, los que llegan a la final en acento), entre cada par de partidos y el de la ronda siguiente, alineados con las tarjetas.
4. **Conectores separados 10 px en la versión compacta.** `.bracket-torneo--compacto .bracket-torneo__caja` y `--final` fijan `width: 180px`, pero `layoutSimetrico` calcula las coordenadas con `colAncho = 190`. Usa un solo valor de ancho para tarjetas y cálculo (si el compacto necesita otro ancho, pásalo al cálculo), para que las líneas toquen las tarjetas.
5. **Recuadros con scroll horizontal no accesibles con teclado.** `.bracket-torneo__canvas-scroll` y `.bracket-torneo__movil` tienen overflow horizontal pero nada enfocable. Dales `tabIndex={0}`, `role="region"` y un `aria-label` ("Llaves del torneo"), con `:focus-visible` visible, para que con Tab se enfoquen y con las flechas se desplacen.

Archivos que puedes editar: `src/components/reservas/torneo/Bracket.jsx`, `Bracket.css`, `SeccionLlaves.jsx/.css`, `src/components/canchas/VistaCanchas.jsx` y `VistaCanchas.css` (solo para el punto 1). Si cambias algo que usen las pruebas, ajústalas sin debilitarlas. Al terminar corre `npm test` y `npm run lint` y reporta.

---

La tarea original del bloque, para contexto:
