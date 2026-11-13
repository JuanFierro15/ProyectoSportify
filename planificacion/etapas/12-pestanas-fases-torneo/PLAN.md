# Etapa 12: fases del torneo en pestañas y footer sin "Volver arriba"

Plan aprobado por Miguel el 13-11-2026. Rama: `feat/pestanas-fases-torneo`
(desde `main`, `ffdf143`). La implementación se suma a esta misma rama y PR.

## Contexto

En modo torneo, `CalendarioTorneo` apila un contenedor por fase (octavos, cuartos,
semifinal, final), cada uno con selector de día, 13 botones de hora, leyenda y
alertas. Con 16 equipos son 4 bloques seguidos y la página se alarga mucho. Se
quiere un solo contenedor con pestañas, una por fase, que muestre una fase a la
vez. Aparte, quitar el enlace "Volver arriba" de la franja inferior del footer.

## Cambio 1: pestañas por fase en `CalendarioTorneo`

Archivo principal: `src/components/reservas/torneo/CalendarioTorneo.jsx` (+ su `.css`).
Sirve para escritorio y para el paso `fechas` del asistente móvil
(`PasoFechas.jsx` lo usa tal cual), así que no hay que tocar `useReserva`,
`PasoFechas` ni `FormularioReserva`.

### Comportamiento

1. Estado local `faseActiva` (número de `ronda`), arranca en la primera fase.
   Si cambian las fases (p. ej. de 16 a 8 equipos) y la activa ya no existe,
   vuelve a la primera (`useEffect` sobre `fases`).
2. Encima del contenido, un `role="tablist"` con `aria-label="Fases del torneo"`
   y un `<button role="tab">` por fase:
   - Texto: `fase.nombreRonda` (p. ej. "Cuartos de final").
   - Subtexto de estado: el día y horario ya elegidos (etiqueta de fecha de
     `src/lib/fechas.js` + `"11:00 a 13:00"` con `finDeFranja`) o "Sin horario".
   - Si esa fase tiene alerta (`val.ordenValido === false` o `val.alcanza === false`
     con horas elegidas), un ícono de aviso (`AlertTriangle` de `lucide-react`,
     `aria-hidden`) + texto para lectores ("tiene un aviso"). Así un problema en
     una pestaña oculta no pasa desapercibido.
   - `id="tab-fase-<ronda>"`, `aria-controls="panel-fase-<ronda>"`,
     `aria-selected`, `tabIndex` móvil (0 en la activa, -1 en el resto).
   - Teclado igual que las pestañas de deporte (`manejarTecladoPestana` en
     `src/components/canchas/VistaCanchas.jsx`): flechas izquierda/derecha
     circulares, Inicio y Fin, moviendo el foco a la pestaña nueva.
3. Cada fase sigue siendo el mismo `<section className="calendario-torneo__fase">`
   de hoy, ahora con `role="tabpanel"`, `id="panel-fase-<ronda>"`,
   `aria-labelledby="tab-fase-<ronda>"` **pero conservando** el `aria-label`
   `"Fase N: <nombre>"` y `data-ronda` (los usan `Torneo.test.jsx` y los scripts de
   capturas). Las fases no activas se renderizan con el atributo `hidden`: siguen
   montadas, así no se pierde nada y los tests que buscan por label no se rompen.
4. La nota "Para elegir 2 o más horas seguidas…" (hoy dentro de
   `fase.ronda === 1`) pasa arriba de las pestañas, porque aplica a todas. La nota
   "Elige primero las canchas…" se queda donde está.
5. Sin avance automático de pestaña al elegir horario (elegir un rango son 2 clics).
   Al pie de cada panel salvo el último, un botón `hollow` "Siguiente fase: <nombre>"
   que activa la pestaña siguiente y le pasa el foco.
6. GSAP: hoy el `gsap.from('.calendario-torneo__fase', …)` anima todas las fases
   cuando cambia `fases.length`. Cambiarlo a animar solo el panel activo cuando
   cambia `faseActiva` (mismo `gsap.context` +
   `matchMedia('(prefers-reduced-motion: no-preference)')`, `ctx.revert()` en el
   cleanup).
7. La lógica interna de cada panel (bloqueo por fase previa, `esLibreFase`,
   `AlertaTiempo`, alerta de orden) **no cambia**: solo se envuelve.

### Estilos (`CalendarioTorneo.css`)

- Reutilizar el look de las pestañas de deporte / `mis-reservas__pestanas`
  (subrayado o fondo con `var(--accent)`; nunca colores de deporte a mano).
- La lista de pestañas hace scroll horizontal en celular (`overflow-x: auto`,
  `scroll-snap-type: x mandatory`), sin provocar scroll horizontal de la página.
- Pestañas + panel forman una sola tarjeta (un borde), en vez de una tarjeta por
  fase.
- Respetar el tema oscuro actual y el contraste AA (el badge de fase ya se verificó
  en la etapa 9).

### Tests (Vitest + Testing Library)

- `Torneo.test.jsx`: los existentes deberían seguir verdes porque las fases siguen
  montadas. Revisar los que hacen clic dentro de las fases 2 y 3: con `hidden`,
  `fireEvent` funciona, pero si alguno usa `userEvent` o `getByRole` hay que
  activar antes la pestaña. Ajustar solo lo necesario.
- Nuevo `src/components/reservas/torneo/CalendarioTorneo.test.jsx`:
  - Renderiza una pestaña por fase y solo el panel activo visible.
  - Clic en otra pestaña la activa (`aria-selected`) y muestra su panel.
  - Flechas, Inicio y Fin mueven la pestaña activa y el foco.
  - Elegir día y hora en una fase y cambiar de pestaña conserva la selección
    (el subtexto de la pestaña muestra el horario).
  - Una fase con `ordenValido: false` muestra el aviso en su pestaña.
  - Si `fases` se reduce y la activa desaparece, vuelve a la primera.
  - "Siguiente fase" activa la siguiente.

### Scripts de capturas

`planificacion/herramientas/capturas/capturas.mjs` hace clic en
`.calendario-torneo__fase[data-ronda="2"] …`; con `hidden` ese clic fallaría.
Antes de cada fase, hacer clic en `#tab-fase-<ronda>`. Volver a tomar
`docs/capturas/modo-torneo.webp` y actualizar el README si cambia cómo se ve.

## Cambio 2: quitar "Volver arriba" del footer

- `src/components/layout/Footer.jsx`: borrar el `<a className="footer__volver">`
  y `ArrowUp` del import de `lucide-react`. La fila inferior queda solo con el
  copyright.
- `src/components/layout/Footer.css`: borrar `.footer__volver` y su `:hover/:focus`,
  y quitarlo del bloque `prefers-reduced-motion`. `.footer__inferior-fila` puede
  quedarse (flex con un solo hijo no rompe nada).
- `manejarSeccion` se sigue usando en la navegación del footer: no borrarlo.

## Documentación

- `AGENTS.md`: en "Componentes de reserva → `torneo/`", decir que
  `CalendarioTorneo` muestra las fases en pestañas (una visible, todas montadas con
  `hidden`).
- `README.md`: actualizar la descripción del modo torneo y la captura si cambió.

## Commits sugeridos (en español, con prefijo)

1. `feat: muestra las fases del torneo en pestañas`
2. `test: cubre las pestañas de fases del torneo`
3. `fix: quita el enlace volver arriba del footer`
4. `docs: documenta las pestañas de fases del torneo`

## Verificación

1. `npm test` y `npm run lint` en verde (0 warnings).
2. `npm run dev` → `/reservar/futbol?modo=torneo`, 16 equipos, 3 canchas:
   - Escritorio (1440): 4 pestañas, una fase visible; elegir horarios en cada una,
     cambiar de pestaña y volver: la selección sigue; el voucher suma bien.
   - Elegir en Cuartos un horario anterior al de Octavos el mismo día: la pestaña
     de Cuartos muestra el aviso.
   - Cambiar a 8 equipos estando en la pestaña "Octavos": vuelve a la primera.
   - Celular (390): paso "Fechas" del asistente, pestañas con scroll horizontal y
     sin scroll horizontal de la página; "Siguiente" del asistente sigue exigiendo
     todas las fases completas.
   - Teclado: Tab llega a la pestaña activa y las flechas cambian de fase.
3. Footer en el inicio y en la página de reserva: ya no aparece "Volver arriba".
4. Confirmar un torneo y revisar que `ConfirmacionReserva` y el bracket muestren
   bien las fechas por fase (no deberían cambiar).
