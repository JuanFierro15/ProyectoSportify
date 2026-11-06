# Etapa 9 — Rediseño de la página de reserva y de las llaves

**Responsable:** Miguel Medina. **Revisa y fusiona:** Juan Fierro.
**Rama:** `etapa-9-rediseno-reserva`, desde `main` en `e00922e` (incluye `z2`, PR #4).
**Estado:** aprobado por Miguel Medina el 06-11-2026, con las tres decisiones de la sección 5 tal como se proponen (`#808080`, indicador de pasos con Formato siempre completo, subtítulos e ícono `LandPlot`). Juan Fierro revisa el PR.

El pedido completo está en `PROMPT.md` y las maquetas en `referencia/`. Este plan
responde la sección E, fija lo que el prompt deja abierto y reparte el trabajo en
bloques. Las líneas citadas son de `main` en `e00922e`.

## 1. Respuestas de la sección E

### E1. Llaves a ancho completo sin duplicar estado

- `useReserva` se llama una sola vez, en `VistaCanchas.jsx:181`. `FormularioReserva`
  no tiene estado propio: recibe `reserva` por props (`VistaCanchas.jsx:591`).
- Hoy las llaves están dentro del formulario: `FormularioReserva.jsx:336-345`
  (subtítulo "Llaves y cronograma del torneo" y `<Bracket>`), con
  `partidos = reserva.torneoPlan.partidos` y `canchas` de `useReservas()`.
- **Propuesta:** un componente nuevo `torneo/SeccionLlaves.jsx` (subtítulo +
  `Bracket`) que recibe `reserva` y `canchas`. `VistaCanchas` lo monta solo en
  modo torneo, **dentro** de `.vista-canchas__reserva` y como hermano de la
  columna principal y del comprobante. Se quita el bloque 336-345 del formulario.
- La rejilla de `.vista-canchas__reserva` pasa a `grid-template-areas`:
  - Desde `large`: fila 1 `principal | comprobante`, fila 2 `llaves` ocupando las
    dos columnas. El comprobante sigue `sticky` dentro de la fila 1.
  - Por debajo de `large`: `principal`, `llaves`, `comprobante`. Así las llaves
    quedan antes del botón de confirmar, como hoy.
- Es la misma `reserva` y el mismo `torneoPlan`: no se duplica estado.
- "Torneos reservados" (`FormularioReserva.jsx:347-425`, con el `Bracket compacto`)
  se queda en el formulario.
- `AsignacionManual`, `CalendarioTorneo` y `AlertaTiempo` se quedan en el
  formulario, donde están hoy.

### E2. Pruebas que dependen de lo que cambia

| Prueba | Depende de | Qué pasa |
| --- | --- | --- |
| `Torneo.test.jsx:185-187` | `getByText('R1-P1')`, `R1-P2`, `R2-P1` (insignia del `Bracket`) | Se actualiza a "Partido 1", "Partido 2", "Partido 3". |
| `Torneo.test.jsx:295`, `:298` | combobox `Llave R1-P1 equipo local / visitante` (`AsignacionManual.jsx:31`, `:58`) | Se actualiza a `Partido 1, equipo local / visitante`. |
| `Torneo.test.jsx:446-452` | `R1-P1`…`R3-P1` dentro de "Torneos reservados" | Pasan a "Partido 1"…"Partido 7". |
| `Torneo.test.jsx:84`, `:581` | Montan `FormularioReserva` solo | El arnés también monta `SeccionLlaves`, si no `:183-187` no encuentran las llaves. |
| `Torneo.test.jsx:183-184` | `heading` exacto `Semifinal` y `Final` | Se conservan los encabezados de ronda como `h4` con el nombre exacto. La fecha y el horario van en otro elemento. |
| `Torneo.test.jsx:207-358` | `getAllByRole('button')[n]` dentro de cada fase: los 7 días van primero | Se conserva el orden del DOM en `CalendarioTorneo` (días antes que horas). |
| `Torneo.test.jsx:367` | clase `.voucher-reserva__valor-total` | Se conserva. |
| `Torneo.test.jsx` (varias) | `Resumen de tu reserva`, `Confirmar reserva`, `Reserva confirmada`, `Código de reserva`, `Invitados: 20`, `Programación por fases:`, `/14:00/`, `Nombre`, `Invitados` | Se conservan. Las horas mantienen el texto "14:00" en su nombre accesible. |
| `App.test.jsx:17`, `:20` | `heading` "Reserva tu cancha" y enlace "Volver al inicio" | Se conservan. |
| `src/lib/torneo.test.js` | ids `R1-P1` y "Ganador R1-P1" como datos | No cambia: `src/lib/` no se toca. |

### E3. Indicador de pasos

Se deriva de lo que ya devuelve `useReserva` (`useReserva.js:1020-1077`), sin
tocar el archivo:

| Paso | Completo cuando |
| --- | --- |
| Canchas | `canchaIds.length > 0` y sin `torneoPlan.errorCanchas` |
| Formato | `equipos` está en `OPCIONES_EQUIPOS` y hay `duracionPartido`. Ojo: los valores por defecto (8 equipos, 20 min) ya son válidos, así que este paso queda completo desde el inicio. No hay forma de saber si la persona lo tocó. |
| Fechas por fase | Todas las fases con horas elegidas y ningún `torneoPlan.validacionesJornadas[i].error` |
| Llaves | `torneoPlan.partidos.length > 0` y sin `torneoPlan.errorCruces` |
| Tus datos | Nombre válido y teléfono sin error (`errNombre`, `errTelefono`) |

El paso actual es el primero incompleto. **Recomendación:** que entre, con la
regla de Formato tal cual. Si Juan prefiere que Formato no aparezca siempre
completo, se deja el indicador por fuera.

### E4. Foundation sobre el tema oscuro

`main.jsx:3` carga `foundation.min.css` 6.8.1 antes que `index.css`. Lo que hay que
sobrescribir dentro de `.vista-canchas` (y del `<dialog>` del visor si aplica):

- **Elementos sin clase:** `fieldset`, `legend`, `label`, `select`, `input`, `button`,
  `details`, `summary`.
- **`tabs`, `tabs-title`, `is-active`:** `VistaCanchas.jsx:406`, `:413`.
- **`switch`, `switch-input`, `switch-paddle`:** `VistaCanchas.jsx:440-449`. Ya hay
  un override en `VistaCanchas.css:146-148`.
- **`button hollow`, `small`, `success`, `clear secondary`, `expanded`:**
  - Formulario: `FormularioReserva.jsx:100-102`, `:245`.
  - Vista: `VistaCanchas.jsx:470`.
  - Torneo: `AlertaTiempo.jsx:42`, `CalendarioTorneo.jsx:163-165`.
  - Comprobante: `VoucherReserva.jsx:228`, `:241` (ya tiene overrides en
    `VoucherReserva.css:194`, `:213`).
  - Confirmación: `ConfirmacionReserva.jsx:114`, `:246`, `:255`.
- **`callout alert`, `callout warning`:** `FormularioReserva.jsx:44`, `:128`,
  `AlertaTiempo.jsx:22` y `CalendarioTorneo.jsx:192`.
- **`form-error`:** `FormularioReserva.jsx:477`, `AsignacionManual.jsx:87`.
- **`card cancha-card`** del grid estático (`VistaCanchas.css`).

`foundation-sites` no se toca.

### E5. Navbar oscuro solo en la reserva

`Navbar.jsx:28` ya lee `deporteAbierto` de `useVistaCanchas()`. En la reserva no
existe `#hero-placeholder`, así que hoy siempre cae en `site-header--scrolled`
(`Navbar.jsx:119-121`), que es blanco.

**Propuesta:** agregar en `Navbar.jsx` la clase `site-header--reserva` cuando
`deporteAbierto` no es nulo, y darle en `Navbar.css` el tema oscuro: fondo
`#0d0d0d`, borde `#262626`, enlaces blancos y "Mis reservas" con borde. Las reglas
de `--scrolled` usan `!important` (`Navbar.css:86-129`, `197-203`), así que las de
`--reserva` van con más especificidad (`.site-header.site-header--reserva`) y
también `!important`. El inicio no cambia porque ahí `deporteAbierto` es nulo.
Descartado: resolverlo solo con `:has()` en CSS (funciona, pero esconde la regla
lejos del navbar).

### E6. Numeración de los partidos

- Los ids salen de `torneo.js:349` (`` `R${ronda}-P${i + 1}` ``).
- `programarTorneo` (`torneo.js:313-404`) arma el arreglo por ronda y, dentro de
  cada ronda, en orden de juego. **"Partido N" = índice en `partidos` + 1.**
- `turno` no sirve: con jornadas se reinicia en cada ronda (`torneo.js:350-351`).
- Las rondas siguientes traen el texto `Ganador R1-P1` (`torneo.js:381-382`). Como
  `src/lib/` no se toca, el `Bracket` arma un mapa id → número y muestra
  "Ganador del partido N".
- `AsignacionManual.jsx:23` calcula hoy `R1-P${m+1}`. Pasa a "Partido ${m+1}", que
  es el mismo número porque los partidos de la ronda 1 van primero en el arreglo.
- El `aria-label` de `Bracket.jsx:124` ya empieza con "Partido": queda
  `Partido N: <local> contra <visitante>`, sin "Partido Partido".
- `textoQr` (`src/lib/codigoReserva.js`) no se toca.

## 2. Lo que este plan fija

### Tokens (`src/App.css`, junto a `--eventos-fondo`)

| Token | Valor |
| --- | --- |
| `--reserva-fondo` | `var(--eventos-fondo)` (`#0d0d0d`) |
| `--reserva-seccion` / `--reserva-seccion-borde` | `#161616` / `#2a2a2a` (radio 16 px) |
| `--reserva-elevada` / `--reserva-elevada-borde` | `#1a1a1a` / `#333333` (radio 18 px) |
| `--reserva-control` / `--reserva-control-borde` | `#1f1f1f` / `#4a4a4a` |
| `--reserva-campo` / `--reserva-campo-borde` | `#0f0f0f` / `#444444` |
| `--reserva-texto` | `#f2f2f2` |
| `--reserva-texto-2` | `#c4c4c4` |
| `--reserva-texto-tenue` | `#a8a8a8` |
| `--reserva-sobre-acento` | `#0d0d0d` |
| `--reserva-linea` | `#3a3a3a` (perforación y conectores) |
| `--reserva-reservada` | `#808080` (ver abajo) |

- `--accent-text` se sobrescribe dentro de `.vista-canchas` con el acento tal cual
  (`var(--accent)`). `estiloAcento` no se toca.
- **Ajuste propuesto al prompt:** el texto de una hora reservada en `#7a7a7a` sobre
  `#161616` da **4,22:1**, por debajo del 4,5:1 que pide el mismo prompt. Propongo
  `#808080` (4,58:1). Ya medidos: `#a8a8a8` sobre `#161616` da 7,61:1, sobre
  `#1f1f1f` 6,93:1 y sobre `#0d0d0d` 8,17:1; `#b3b3b3` sobre `#1a1a1a` da 8,30:1.
  La tabla completa con los tres acentos va en el REPORTE.

### Textos e íconos

- **Subtítulos:**
  - Cancha: "Elige la cancha, el día y hasta 3 horas seguidas." (el 3 sale de
    `MAX_HORAS_SEGUIDAS`).
  - Torneo: "Elige hasta 3 canchas de un deporte, el formato y la fecha de cada fase."
    (el 3 sale de `MAX_CANCHAS_TORNEO`).
  - Cumpleaños: "Elige las canchas, el día, el horario y cuántos invitados vienen."
- **Íconos del selector de modo** (`lucide-react`, ya instalado): `LandPlot` para
  Cancha, `Trophy` para Torneo y `Cake` para Cumpleaños.
- **Franjas de horas:** se arman en el componente filtrando `reserva.horasBase` por
  la hora (Mañana < 12, Tarde 12 a 17, Noche ≥ 18). Nada escrito a mano.
- **Hora reservada:** `aria-label` "HH:00, reservada". Las libres y las elegidas
  conservan "HH:00" en su nombre accesible.

### Fuera del alcance (como dice el prompt)

La página de inicio, el chat, "Mis reservas", el footer, la lógica de
`DepthCarousel` (solo cambia el CSS de flechas y puntos) y `useReserva.js`.
Tampoco se tocan `src/lib/`, `src/data/`, `api/` ni `src/context/`. La única pieza
fuera de la página que cambia es `Navbar.jsx` / `Navbar.css` (E5).

## 3. Bloques

Van en serie: varios bloques comparten `VistaCanchas.jsx`, `FormularioReserva.jsx`
y su CSS, y el equipo tiene poca RAM. Cada bloque lo implementa agy con
`gemini-3.8-flash-high` (`base.md` + `tarea.md`). Después, agy con Argon corre
`npm test`, `npm run lint` y `npm run build` y revisa en el navegador. Un commit por
bloque.

| Bloque | Contenido | Archivos |
| --- | --- | --- |
| `r1-tema-y-encabezado` | Tokens, navbar oscuro (C1), encabezado con foto y velo (C2), foco del `h1`, selector de modo (C3), pestañas y filtro (C4), flechas y puntos del carrusel (C5), overrides de Foundation de la página | `App.css`, `Navbar.jsx/.css`, `VistaCanchas.jsx/.css`, `SelectorModo.jsx/.css`, `DepthCarousel.css`, `TarjetaCanchaCarrusel.css` si hace falta |
| `r2-dia-horario-y-datos` | Tarjetas de sección, Día (C6, también en `CalendarioTorneo`), Horario por franjas con leyenda y aviso de beneficio (C7), Tus datos (C8), `CanchasElegidas`, `AlertaTiempo` y `AsignacionManual` oscuros (C10) | `FormularioReserva.jsx/.css`, `SelectorDia.jsx/.css`, `CanchasElegidas.css`, `torneo/CalendarioTorneo.jsx`, `AlertaTiempo.jsx`, `AsignacionManual.jsx` (solo estilo) |
| `r3-tiquete-y-confirmacion` | Comprobante tiquete (C9) y confirmación oscura con el QR sobre blanco (C12) | `VoucherReserva.jsx/.css`, `ConfirmacionReserva.jsx/.css` |
| `r4-llaves` | `SeccionLlaves` a ancho completo (E1), llaves simétricas en escritorio y por rondas en celular, conectores, final al centro (C11), "Partido N" y "Ganador del partido N" (E6), etiquetas de `AsignacionManual`, indicador de pasos (E3) y las pruebas de E2 | `torneo/Bracket.jsx/.css`, `torneo/SeccionLlaves.jsx` (nuevo), `torneo/IndicadorPasos.jsx` (nuevo), `AsignacionManual.jsx`, `FormularioReserva.jsx` (quitar 336-345), `VistaCanchas.jsx/.css`, `Torneo.test.jsx` |
| `r5-verificacion` | Capturas antes y después en `revision/` (1440×900 y 390×844, los casos de F), teclado, `prefers-reduced-motion`, casos A1-A5, B1-B7 y C1-C4 de la etapa 8 con `pasa`/`falla` y textos comprobados, y la tabla de contraste | `revision/`, `docs/capturas/` (las 5 que cambian), `README.md` si hace falta |

Las capturas "antes" se toman al empezar, sobre `main`, antes de `r1`.

## 4. Verificación y entrega

- Cada bloque: `npm test`, `npm run lint` y `npm run build` en verde.
- `r5`: lo de la sección F del prompt.
- Con las capturas aprobadas por Juan Fierro: push de la rama y PR a `main` antes
  del 18-11. Sin menciones a herramientas ni coautorías en commits ni en el PR.
- El REPORTE incluye las respuestas de E, las capturas, la tabla de contraste, las
  pruebas que cambiaron (E2) y lo pendiente.

## 5. Para que decida Juan Fierro

1. `#808080` en lugar de `#7a7a7a` para el texto de las horas reservadas.
2. El indicador de pasos con Formato siempre completo, o dejarlo por fuera.
3. Los subtítulos de Torneo y Cumpleaños, y el ícono `LandPlot` para Cancha.
