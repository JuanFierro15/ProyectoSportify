# Verificación final — Etapa 9: Rediseño de la página de reserva (Bloque R5)

Fecha de ejecución: 7 de noviembre de 2026 (`2026-11-07`).

---

## 1. Pruebas automatizadas, linter y build de producción

Se ejecutaron los tres chequeos base sobre el árbol de trabajo con los bloques R1–R4 integrados:

| Comando | Resultado | Detalle |
| --- | --- | --- |
| `npm test` | **Pasa** | 16 archivos de prueba (`src/lib/*.test.js`, `api/_lib/funciones.test.js`, `src/components/reservas/Torneo.test.jsx`, `src/components/layout/MisReservas.test.jsx`, `src/App.test.jsx`), **197 tests en verde** (0 fallos). |
| `npm run lint` | **Pasa** | `eslint .` sobre `src`, `api` y `scripts` finalizó con código `0` (**0 errores y 0 advertencias**). |
| `npm run build` | **Pasa** | `vite build` completado en `2,87 s`. Genera `dist/index.html` (`1,21 kB`), `dist/assets/index-Es_TFmQb.css` (`210,41 kB`, gzip `37,05 kB`) y `dist/assets/index-xOaTUSie.js` (`498,80 kB`, gzip `155,70 kB`). El único aviso de consola es el esperado de LightningCSS sobre el media query heredado de IE en `foundation.min.css`, descartado automáticamente con `errorRecovery`. |

---

## 2. Capturas «después» de la etapa 9 (`revision/despues/`)

Con `npm run preview` activo en `http://localhost:4173`, se ejecutó `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` hacia `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/despues/`.

> **Ajuste menor en el script de capturas (`capturas-etapa9.mjs`)**: en el bloque móvil de cancha, `cancha-futbol-horario-celular.webp` hacía scroll a `.voucher-reserva` (mostrando el comprobante en lugar de la grilla de horarios). Se ajustó el selector de desplazamiento en `capturas-etapa9.mjs` para que `cancha-futbol-horario-celular.webp` centre `#reserva-horario` y `cancha-futbol-celular.webp` muestre `.voucher-reserva`.

Se verificaron visualmente las **20 imágenes** (los mismos 20 nombres exactos que en `revision/antes/`):

| # | Archivo (`revision/despues/`) | Resolución | Peso | Verificación visual |
| --- | --- | --- | --- | --- |
| 1 | `cancha-futbol-arriba-escritorio.webp` | `1440×900` | `160,6 KB` (`164.416 B`) | Encabezado oscuro con fondo fotográfico difuminado, título «Reserva tu cancha», `SelectorModo` con íconos SVG, pestañas de deporte con `Fútbol` activo (`#5bd67d`), carrusel 3D con Cancha 1 y comprobante lateral oscuro «Tu reserva». |
| 2 | `cancha-futbol-escritorio.webp` | `1440×900` | `113,4 KB` (`116.170 B`) | Selector de día en tarjetas oscuras (`Mañana 8` activo con borde verde), bloque de horario con banner de beneficio y franjas `14:00` y `15:00` elegidas, y comprobante con `$ 120.000`, pack de agua gratis y descuento de `− $ 10.000`. |
| 3 | `cancha-futbol-horario-escritorio.webp` | `1440×900` | `113,4 KB` (`116.170 B`) | Vista completa del bloque `#reserva-horario` agrupado en Mañana, Tarde y Noche, leyenda `Libre / Elegida / Reservada`, campos de contacto oscuros y comprobante sticky a la derecha. |
| 4 | `cancha-futbol-arriba-celular.webp` | `390×844` | `64,5 KB` (`66.094 B`) | Cabecera compacta en móvil sin desborde horizontal, `SelectorModo`, pestañas de deporte y tarjeta activa de Cancha 1 en el carrusel. |
| 5 | `cancha-futbol-celular.webp` | `390×844` | `47,8 KB` (`48.970 B`) | Campos de contacto («Tu nombre *», «Teléfono (opcional)») y comprobante «Tu reserva» con total `$ 120.000` y botones de acción en móvil. |
| 6 | `cancha-futbol-horario-celular.webp` | `390×844` | `48,9 KB` (`50.056 B`) | Bloque «Horario · 14:00 a 16:00 (2 h)» en móvil con banner de beneficio, filas Mañana/Tarde/Noche, `14:00` y `15:00` seleccionadas y leyenda inferior. |
| 7 | `confirmacion-cancha-escritorio.webp` | `1440×900` | `78,1 KB` (`80.014 B`) | Tarjeta oscura «Reserva confirmada», código monoespaciado con botón «Copiar código», QR sobre placa blanca para lectura óptica, resumen (`Cancha Fútbol 1`, `Total $ 120.000`, `Incluye 1 pack de agua gratis`), condiciones y botones «Descargar QR» / «Listo». |
| 8 | `confirmacion-cancha-celular.webp` | `390×844` | `55,7 KB` (`56.998 B`) | Confirmación de cancha adaptada a `390×844`, código, QR centrado y resumen legible sin recorte. |
| 9 | `torneo-4-escritorio.webp` | `1440×900` | `78,4 KB` (`80.234 B`) | `SeccionLlaves` a ancho completo (`12/12`) con `Bracket` simétrico de 4 equipos (`Semifinal → Final ← Semifinal`), copa SVG sobre la Final y conectores ortogonales. |
| 10 | `torneo-4-celular.webp` | `390×844` | `47,8 KB` (`48.902 B`) | Vista lineal en móvil de las llaves de 4 equipos (`Semifinal → Final`) con tarjetas oscuras y meta de horario/cancha. |
| 11 | `torneo-8-escritorio.webp` | `1440×900` | `98,1 KB` (`100.478 B`) | `Bracket` simétrico de 8 equipos en 5 columnas (`Cuartos de final → Semifinal → Final ← Semifinal ← Cuartos de final`), 2 partidos por lado en cuartos y 1 por lado en semifinales. |
| 12 | `torneo-8-celular.webp` | `390×844` | `36,1 KB` (`36.932 B`) | Vista lineal con scroll horizontal en móvil para 8 equipos (`Cuartos de final → Semifinal → Final`). |
| 13 | `torneo-16-escritorio.webp` | `1440×900` | `83,8 KB` (`85.834 B`) | `Bracket` simétrico de 16 equipos en 7 columnas (`Octavos → Cuartos → Semifinal → Final ← Semifinal ← Cuartos ← Octavos`) con tarjeta de Final destacada en el centro. |
| 14 | `torneo-16-celular.webp` | `390×844` | `38,8 KB` (`39.762 B`) | Vista lineal en móvil para 16 equipos (`Octavos de final → Cuartos de final → Semifinal → Final`). |
| 15 | `confirmacion-torneo-escritorio.webp` | `1440×900` | `100,2 KB` (`102.584 B`) | Confirmación de torneo con código, QR, programación por fases (`Cuartos de final`, `Semifinal`, `Final`), `Total $ 760.000`, `Incluye 2 packs de agua gratis` y llaves compactas debajo. |
| 16 | `confirmacion-torneo-celular.webp` | `390×844` | `74,5 KB` (`76.274 B`) | Confirmación de torneo en móvil con código, QR y resumen de las 3 jornadas. |
| 17 | `cumpleanos-escritorio.webp` | `1440×900` | `129,5 KB` (`132.642 B`) | Modo cumpleaños con `IndicadorPasos`, `CanchasElegidas` (`Cancha Fútbol 1`), día y rango de horario `14:00 a 16:00`, campo de invitados (`20`) y comprobante con `$ 120.000`. |
| 18 | `cumpleanos-celular.webp` | `390×844` | `42,0 KB` (`43.032 B`) | Modo cumpleaños en móvil mostrando datos del evento (`20` invitados, contacto) y comprobante «Tu reserva». |
| 19 | `confirmacion-cumpleanos-escritorio.webp` | `1440×900` | `71,8 KB` (`73.482 B`) | Confirmación de cumpleaños en escritorio con código, QR, `Cumpleaños · Domingo 8 de noviembre · 14:00 a 16:00`, `Cancha Fútbol 1`, `Invitados: 20` y `Total $ 120.000`. |
| 20 | `confirmacion-cumpleanos-celular.webp` | `390×844` | `52,8 KB` (`54.114 B`) | Confirmación de cumpleaños en móvil con código, QR y detalles del evento. |

---

## 3. Verificación funcional de casos A1–A5, B1–B7 y C1–C4 (Etapa 8)

Cada caso se ejecutó en Chrome headless vía CDP sobre `http://localhost:4173` a `1440×900`, repitiendo **A1**, **B3** y **C3** en `390×844`, con `localStorage` limpio antes de cada flujo. Los textos reportados fueron extraídos directamente del DOM vivo.

### 3.1. Tabla de resultados en escritorio (`1440×900`)

| Caso | Descripción | Resultado | Texto real en la interfaz | Evidencia |
| --- | --- | --- | --- | --- |
| **A1** | Descuento de `$ 5.000/h` y pack de agua desde 2 h seguidas (Pádel 1, `$ 65.000/h`, 14:00 y 15:00) | **pasa** | Línea de cálculo: `2 horas de $ 60.000 (−$ 5.000/h)` · Subtotal tachado: `$ 130.000` · Línea: `$ 120.000` · Beneficio: `Pack de agua Gratis` · Ahorro: `Descuento por horas seguidas − $ 10.000` · Total: `$ 120.000`. | Comprobante `.voucher-reserva` y banner `.formulario-reserva__beneficio` (`Desde 2 horas seguidas: $ 5.000 menos por hora y un pack de agua gratis.`). |
| **A2** | Tope de 3 horas seguidas (elegir 14:00, 15:00, 16:00 e intentar 17:00) | **pasa** | Alerta `[role="alert"]`: `Puedes reservar hasta 3 horas seguidas.` | Las horas activas permanecen en `["14:00", "15:00", "16:00"]`; `17:00` no se agrega. |
| **A3** | Confirmación, código `SPF-XXXXXX`, QR y botón «Copiar código» | **pasa** | Título: `Reserva confirmada` · Código: `SPF-R2NV4M` · Botón antes/después del clic: `Copiar código` → `¡Copiado!` · Aviso QR: `Muestra este código al llegar: tiene los datos de tu reserva.` · Resumen: `Reserva de cancha · Domingo 8 de noviembre · 14:00 a 16:00`, `Cancha Pádel 1`, `Total $ 120.000`, `Incluye 1 pack de agua gratis`. | `<canvas role="img" title="Código QR de la reserva SPF-R2NV4M">` presente y botones `Descargar QR` y `Listo`. |
| **A4** | Persistencia en `localStorage`: volver a Pádel 1 el mismo día tras confirmar | **pasa** | Botón `14:00`: `aria-label="14:00, reservada"`, `disabled=true` · Botón `15:00`: `aria-label="15:00, reservada"`, `disabled=true`. | Ambos botones tienen clase `.formulario-reserva__hora--ocupado` y atributo `disabled`. |
| **A5** | Clic en hora ocupada no la agrega ni habilita confirmar | **pasa** | Motivo de bloqueo en comprobante: `Elige el horario.` | `horasSeleccionadas = []` tras hacer clic en `14:00` ocupada; botón `Confirmar reserva` permanece `disabled=true`. |
| **B1** | Entrada desde «Reserva un evento» sin canchas preseleccionadas | **pasa** | URL: `/reservar/voley-playa?modo=torneo` · `h1`: `Reserva tu torneo` · `CanchasElegidas`: `Aún no has elegido canchas. Agrégalas desde el carrusel.` · `CalendarioTorneo`: `Elige primero las canchas del torneo para habilitar los horarios de cada fase.` · Comprobante: `Elige cancha y horario para ver el total.` / `Elige al menos una cancha.` | `IndicadorPasos` marca como paso actual `1. Canchas` y ninguna cancha aparece preseleccionada. |
| **B2** | Tope de 3 canchas y un solo deporte por torneo | **pasa** | Con Cancha Voley Playa 1 elegida, al cambiar a la pestaña `Fútbol`: botón de tarjeta deshabilitado con texto `Solo canchas de Voley Playa` y botón «Elegir todas» deshabilitado con texto `Solo un deporte por torneo`. Al volver a Voley Playa y elegir las 3 canchas: chips `Cancha Voley Playa 1`, `Cancha Voley Playa 2`, `Cancha Voley Playa 3` y métrica `Canchas seleccionadas: 3 (hasta 6 equipos simultáneos)`. | `disabled=true` en botones de otros deportes; botón masivo cambia a `Quitar todas de Voley Playa`. |
| **B3** | Fases y llaves para 4, 8 y 16 equipos (`1440×900`) | **pasa** | **4 equipos**: `4 equipos (3 partidos)`, fases `Fase 1: Semifinal` y `Fase 2: Final`, 3 columnas simétricas (`Semifinal · Final · Semifinal`), 3 partidos. **8 equipos**: `8 equipos (7 partidos)`, fases `Fase 1: Cuartos de final`, `Fase 2: Semifinal`, `Fase 3: Final`, 5 columnas simétricas (`Cuartos de final · Semifinal · Final · Semifinal · Cuartos de final`), 7 partidos. **16 equipos**: `16 equipos (15 partidos)`, fases `Fase 1: Octavos de final` a `Fase 4: Final`, 7 columnas simétricas, 15 partidos. | `.bracket-torneo__simetrico` visible en escritorio (`contenedorSimetrico: true`, `contenedorMovil: false`). Capturas `torneo-4-escritorio.webp`, `torneo-8-escritorio.webp` y `torneo-16-escritorio.webp`. |
| **B4** | Orden cronológico entre fases (Cuartos en día 3, `14:00` y `15:00`) | **pasa** | En `Fase 2: Semifinal`, los días anteriores aparecen deshabilitados con texto `Hoy 7 bloqueado` (`disabled=true`) y `Mañana 8 bloqueado` (`disabled=true`). Al elegir el mismo día (`lun 9`), las horas `08:00` a `15:00` están `disabled=true` y `16:00` / `17:00` están habilitadas (`disabled=false`). | `CalendarioTorneo` bloquea tanto fechas previas como horas anteriores o iguales al cierre de la fase previa. |
| **B5** | Cruces manuales con intercambio automático sin duplicados | **pasa** | Nota: `Si eliges un equipo que ya está en otra llave, los dos cambian de lugar.` · Estado inicial: Partido 1 local = `Equipo 1`, Partido 2 local = `Equipo 6` (en el `<select>` de P1 aparece como `Equipo 6 (en otra llave)`). Al seleccionar `6` en Partido 1 local: Partido 1 local pasa a `6` y Partido 2 local pasa automáticamente a `1`. | Sin errores de duplicados (`errorCruces = null`) y los 8 equipos se conservan únicos en las 4 llaves. |
| **B6** | Alerta de tiempo insuficiente y botón «Cambiar a 15 min por partido» | **pasa** | Con 1 cancha, 8 equipos, `20 min` y 1 hora en Cuartos: título de alerta `Con 8 equipos y 1 cancha, el torneo tomará ~120 min en el peor caso.` · Detalle: `Reservaste 60 min: faltan 60 min para completar todas las rondas (incluyendo desempates y transición).` · Bloqueo en comprobante: `La franja de Cuartos de final no alcanza (faltan 60 min).` · Al pulsar `Cambiar a 15 min por partido`: la duración activa cambia a `15 min`, el botón desaparece y la alerta se actualiza a `Con 8 equipos y 1 cancha, el torneo tomará ~100 min en el peor caso.` (`Reservaste 60 min: faltan 40 min...`). | Componente `.alerta-tiempo` (`role="status"`) y sincronización inmediata con `duracionPartido` y `VoucherReserva`. |
| **B7** | Confirmación de torneo completo (Fútbol 1 y 2, 8 equipos, 3 días distintos) | **pasa** | Comprobante previo: `Cuartos de final: dom 8 nov · 11:00 a 13:00 (2 canchas)`, `Semifinal: lun 9 nov · 13:00 a 14:00 (2 canchas)`, `Final: mar 10 nov · 13:00 a 14:00 (1 cancha)`, `Packs de agua 2 gratis`, `Descuento por horas seguidas − $ 20.000`, `Total $ 760.000`. Confirmación: código `SPF-KY45EW`, `Torneo · Domingo 8 de noviembre a Martes 10 de noviembre · 3 jornadas`, `Cancha Fútbol 1 · Cancha Fútbol 2`, `8 equipos · Eliminación directa (7 partidos)`, `Desempate: Penales: 3 por equipo y, si sigue el empate, muerte súbita.`, `Total $ 760.000`, `Incluye 2 packs de agua gratis` y `Bracket` compacto con los 7 partidos. | Al volver a modo cancha sobre Fútbol 1, las horas `11:00` y `12:00` del día 2, `13:00` del día 3 y `13:00` del día 4 aparecen marcadas como `reservada` (`disabled=true`). |
| **C1** | Validación de invitados en cumpleaños (`> 100`) | **pasa** | Al ingresar `150` en `#cumple-invitados`: el comprobante muestra `Máximo 100 invitados.` y el botón `Confirmar reserva` queda `disabled=true`. | Validación en vivo en `useReserva` y `VoucherReserva`. |
| **C2** | Selección de canchas de distintos deportes en cumpleaños | **pasa** | Al agregar `Cancha Fútbol 1`, cambiar a `Pádel` y agregar `Cancha Pádel 1`, y cambiar a `Voley Playa` y agregar `Cancha Voley Playa 1`: `CanchasElegidas` conserva los 3 chips (`Cancha Fútbol 1`, `Cancha Pádel 1`, `Cancha Voley Playa 1`). Con horario `14:00 a 16:00`, el comprobante lista `Canchas Cancha Fútbol 1 · Cancha Pádel 1 · Cancha Voley Playa 1`, desglosa las 3 canchas y calcula `Total $ 430.000`. | A diferencia de torneo, cumpleaños permite combinar deportes y conserva la selección al cambiar de pestaña. |
| **C3** | Invitados visibles en comprobante y en confirmación de cumpleaños (`20` invitados) | **pasa** | En el comprobante antes de confirmar: fila `Invitados 20` (junto a `Cancha Cancha Fútbol 1`, `Fecha Domingo 8 de noviembre`, `Horario 14:00 a 16:00 · 2 horas`, `Total $ 230.000`). En la pantalla de confirmación (`SPF-4JUBQS`): `Cumpleaños · Domingo 8 de noviembre · 14:00 a 16:00`, `Cancha Fútbol 1`, `Invitados: 20`, `Total $ 230.000`. | Capturas `cumpleanos-escritorio.webp` y `confirmacion-cumpleanos-escritorio.webp`. |
| **C4** | Bloqueo de rango con hora ocupada intermedia en eventos (`seleccionarRango`) | **pasa** | En Fútbol 1 (donde `17:00` está ocupada), al pulsar `13:00` como inicio y `19:00` como fin: aparece alerta `[role="alert"]` con el texto `Entre esas horas hay horarios ocupados en alguna de las canchas elegidas. Elige otro rango.` y la selección permanece únicamente en `["13:00"]`. | No se aplica el rango si existe una franja ocupada en medio. |

### 3.2. Repetición de casos A1, B3 y C3 en vista móvil (`390×844`)

| Caso (`390×844`) | Resultado | Texto real en la interfaz y comportamiento móvil | Evidencia |
| --- | --- | --- | --- |
| **A1 (móvil)** | **pasa** | Sin desborde horizontal (`scrollWidth <= clientWidth`). Comprobante muestra `2 horas de $ 60.000 (−$ 5.000/h)`, subtotal tachado `$ 130.000`, línea `$ 120.000`, `Pack de agua Gratis`, `Descuento por horas seguidas − $ 10.000` y `Total $ 120.000`. | Capturas `cancha-futbol-celular.webp` y `cancha-futbol-horario-celular.webp`. |
| **B3 (móvil)** | **pasa** | En `390×844` se oculta el árbol simétrico (`contenedorSimetrico: false`) y se activa la vista lineal por columnas (`contenedorMovil: true`): **4 equipos** muestra columnas `Semifinal → Final` (3 partidos); **8 equipos** muestra `Cuartos de final → Semifinal → Final` (7 partidos); **16 equipos** muestra `Octavos de final → Cuartos de final → Semifinal → Final` (15 partidos). | Capturas `torneo-4-celular.webp`, `torneo-8-celular.webp` y `torneo-16-celular.webp`. |
| **C3 (móvil)** | **pasa** | En `390×844`, el comprobante muestra la fila `Invitados 20` y `Total $ 230.000`. Al confirmar (`SPF-HHQL6L`), la tarjeta de confirmación muestra `Cumpleaños · Domingo 8 de noviembre · 14:00 a 16:00`, `Cancha Fútbol 1`, `Invitados: 20` y `Total $ 230.000`. | Capturas `cumpleanos-celular.webp` y `confirmacion-cumpleanos-celular.webp`. |

---

## 4. Navegación por teclado y movimiento reducido (`prefers-reduced-motion: reduce`)

### 4.1. Recorrido con `Tab`, `:focus-visible`, foco en `<h1>` y pestañas de deporte

1. **Foco programático en `<h1>` (`#vista-canchas-titulo`) al abrir la vista**:
   - Al navegar desde el inicio hacia la página de reserva con un clic en «Canchas», `VistaCanchas` enfoca programáticamente `<h1 id="vista-canchas-titulo" tabIndex="-1">`.
   - Verificado en el DOM: `document.activeElement.id === "vista-canchas-titulo"`, `matches(":focus") === true`, `matches(":focus-visible") === false`, `outlineStyle === "none"`, `boxShadow === "none"`. No muestra anillo de foco intrusivo al cargar la página gracias a `.vista-canchas__titulo:focus:not(:focus-visible) { outline: none; }`.

2. **Pestañas de deporte (`role="tablist"`) con teclado**:
   - Se implementó y verificó el patrón WAI-ARIA de `tabIndex` móvil (`tabIndex={0}` en la pestaña activa y `tabIndex={-1}` en las demás) junto con navegación circular por flechas:
     - Estando en `Voley Playa` (`tabIndex=0`, `aria-selected="true"`), al pulsar `ArrowRight` el foco y la selección pasan a `Pádel` (`data-sport="padel"`).
     - Al pulsar `ArrowRight` de nuevo, pasan a `Fútbol` (`data-sport="futbol"`).
     - Al pulsar `ArrowRight` desde el último deporte, da la vuelta circularmente a `Voley Playa`.
     - Al pulsar `ArrowLeft` desde `Voley Playa`, da la vuelta circularmente a `Fútbol`.
     - `Home` lleva a `Voley Playa` (primera pestaña) y `End` lleva a `Fútbol` (última pestaña).

3. **Recorrido completo con `Tab` (`Input.dispatchKeyEvent`) en los 3 modos**:
   - **Modo `cancha`**: **34 paradas** dentro de `.vista-canchas` (`Volver al inicio` → botones de `SelectorModo` → pestaña activa de deporte → switch de filtro → carrusel, tarjeta activa, flechas y puntos → tarjetas de `SelectorDia` → botones de hora libres → inputs de nombre y teléfono → botones `Confirmar reserva` y `Limpiar selección`). **0 controles sin anillo `:focus-visible`**.
   - **Modo `torneo`**: **76 paradas** dentro de `.vista-canchas` (incluye botón `Quitar del evento` de la tarjeta, `Elegir todas de Fútbol`, botón `×` del chip en `CanchasElegidas`, botones de cantidad de equipos, duración y modo de emparejamiento, botón `Volver a sortear llaves`, selectores de día y hora de cada fase, inputs de contacto, acciones del comprobante y contenedor desplazable `.bracket-torneo__canvas-scroll`). **0 controles sin anillo `:focus-visible`**.
   - **Modo `cumpleanos`**: **38 paradas** dentro de `.vista-canchas` (incluye controles de canchas elegidas, día, horario, input `#cumple-invitados`, nombre, teléfono y acciones del comprobante). **0 controles sin anillo `:focus-visible`**.
   - Todos los controles interactivos exhiben un anillo de foco claro (`outline: 2px solid var(--accent)` o `2px solid rgb(242, 242, 242)` en los controles neutros, con `outline-offset: 2px`).

### 4.2. Movimiento reducido (`prefers-reduced-motion: reduce`)

Con `Emulation.setEmulatedMedia({ features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })` activo (`window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`):

- **Modo `cancha`, `torneo` y `cumpleanos`**:
  - La animación GSAP de entrada de `.vista-canchas` no se ejecuta (condicionada por `window.matchMedia('(prefers-reduced-motion: no-preference)').matches`); `.vista-canchas__marco` y `.vista-canchas__titulo` aparecen directamente en su estado final (`opacity: "1"`, `transform: "none"`).
  - El efecto Ken Burns sobre la imagen activa del carrusel (`.depth-carousel__card--active .depth-carousel__image`) queda desactivado (`animationName: "none"`, `animationDuration: "1e-06s"`).
  - En `torneo` y `cumpleanos`, `document.getAnimations()` dentro de `.vista-canchas` reporta `0` animaciones activas.
- **Pantalla de confirmación**:
  - `ConfirmacionReserva` se renderiza directamente con `opacity: "1"` sin animaciones de entrada ni transiciones largas.

---

## 5. Tabla de contraste (WCAG AA ≥ 4,5:1) con los tres acentos

Se midieron en el navegador los colores efectivos de texto (`color`) contra su fondo real compuesto (`backgroundColor` / mezcla sRGB sobre las superficies oscuras `#0d0d0d`, `#161616`, `#1a1a1a` y `#1f1f1f`) para los tres deportes (`futbol` `#5bd67d`, `padel` `#3fa9f5`, `voley-playa` `#f6a94b`):

| Elemento / Token de texto | Fondo efectivo | Color de texto (`futbol` / `padel` / `voley-playa`) | Ratio `futbol` (`#5bd67d`) | Ratio `padel` (`#3fa9f5`) | Ratio `voley-playa` (`#f6a94b`) | ¿Cumple ≥ 4,5:1? |
| --- | --- | --- | --- | --- | --- | --- |
| Título principal (`h1.vista-canchas__titulo`) | `#0d0d0d` | `#f2f2f2` (`--reserva-texto`) | **17,36:1** | **17,36:1** | **17,36:1** | Sí |
| Subtítulo de cabecera (`.vista-canchas__subtitulo`) | `#0d0d0d` | `#c4c4c4` (`--reserva-texto-secundario`) | **11,14:1** | **11,14:1** | **11,14:1** | Sí |
| Pestaña de deporte activa (`.vista-canchas__tab.is-active`) | `#0d0d0d` | `#f2f2f2` | **17,36:1** | **17,36:1** | **17,36:1** | Sí |
| Pestaña de deporte inactiva (`.vista-canchas__tab`) | `#0d0d0d` | `#a8a8a8` (`--reserva-texto-tenue`) | **8,17:1** | **8,17:1** | **8,17:1** | Sí |
| `SelectorModo` botón activo (`.selector-modo__boton.is-active`) | `#f2f2f2` | `#0d0d0d` | **17,36:1** | **17,36:1** | **17,36:1** | Sí |
| `SelectorModo` botón inactivo (`.selector-modo__boton`) | `#131313` | `#e6e6e6` | **14,89:1** | **14,89:1** | **14,89:1** | Sí |
| Títulos de bloque (`legend` en `.formulario-reserva__seccion`) | `#161616` | `#f2f2f2` | **16,16:1** | **16,16:1** | **16,16:1** | Sí |
| Texto secundario / ayuda (`.formulario-reserva__ayuda`) | `#161616` | `#c4c4c4` | **10,38:1** | **10,38:1** | **10,38:1** | Sí |
| Texto tenue / nota de contacto y leyenda | `#161616` | `#a8a8a8` | **7,61:1** | **7,61:1** | **7,61:1** | Sí |
| `SelectorDia` etiqueta día elegido (`.selector-dia__sem`) | `#1f1f1f` | `#5bd67d` / `#3fa9f5` / `#f6a94b` (`var(--accent)`) | **8,92:1** | **6,44:1** | **8,39:1** | Sí |
| `SelectorDia` número de día (`.selector-dia__num`) | `#1f1f1f` | `#f2f2f2` | **14,72:1** | **14,72:1** | **14,72:1** | Sí |
| `SelectorDia` conteo de libres (`.selector-dia__libres`) | `#1f1f1f` | `#a8a8a8` | **6,93:1** | **6,93:1** | **6,93:1** | Sí |
| Botón de hora libre (`.formulario-reserva__hora`) | `#1f1f1f` | `#f2f2f2` | **14,72:1** | **14,72:1** | **14,72:1** | Sí |
| Botón de hora elegida (`.formulario-reserva__hora--seleccionado`) | `#5bd67d` / `#3fa9f5` / `#f6a94b` | `#0d0d0d` (`--accent-contrast`) | **10,51:1** | **7,59:1** | **9,90:1** | Sí |
| Botón de hora reservada (`.formulario-reserva__hora--ocupado`, deshabilitado) | `#161616` | `#808080` (`--reserva-texto-deshabilitado`) | **4,58:1** | **4,58:1** | **4,58:1** | Sí (incluso siendo control `disabled`) |
| Banner de beneficio (`.formulario-reserva__beneficio`) | `#242e27` / `#222a30` / `#302a23` (`8%` acento sobre `#1f1f1f`) | `#f2f2f2` | **13,52:1** | **13,84:1** | **13,54:1** | Sí |
| Campos de texto (`.formulario-reserva__input`) | `#0f0f0f` | `#f2f2f2` | **17,12:1** | **17,12:1** | **17,12:1** | Sí |
| Error bajo campo (`.formulario-reserva__error-campo`) | `#161616` | `#f87171` (`--reserva-peligro`) | **6,54:1** | **6,54:1** | **6,54:1** | Sí |
| Alerta de error (`.formulario-reserva .callout.alert`) | `#281414` | `#fca5a5` | **9,22:1** | **9,22:1** | **9,22:1** | Sí |
| Comprobante: título «Tu reserva» (`.voucher-reserva__titulo`) | `#1a1a1a` | `#f2f2f2` | **15,55:1** | **15,55:1** | **15,55:1** | Sí |
| Comprobante: pastilla de tipo, pack de agua y descuento | `#1a1a1a` | `#5bd67d` / `#3fa9f5` / `#f6a94b` (`var(--accent)`) | **9,41:1** | **6,80:1** | **8,86:1** | Sí |
| Comprobante: etiquetas de metadatos y detalle de cálculo | `#1a1a1a` | `#a8a8a8` | **7,32:1** | **7,32:1** | **7,32:1** | Sí |
| Comprobante: valores de metadatos y cifra total | `#1a1a1a` | `#f2f2f2` | **15,55:1** | **15,55:1** | **15,55:1** | Sí |
| Botón primario «Confirmar reserva» (`.voucher-reserva__confirmar`) | `#5bd67d` / `#3fa9f5` / `#f6a94b` | `#0d0d0d` (`--accent-contrast`) | **10,51:1** | **7,59:1** | **9,90:1** | Sí |
| Botón secundario «Limpiar selección» (`.voucher-reserva__limpiar`) | `#1a1a1a` | `#f2f2f2` | **15,55:1** | **15,55:1** | **15,55:1** | Sí |
| Badge de fase en `CalendarioTorneo` (`.calendario-torneo__fase-badge--acento`) | `#1e2d22` / `#1b2831` / `#31281c` (`12%` acento sobre `#161616`) | `#5bd67d` / `#3fa9f5` / `#f6a94b` | **8,09:1** | **5,99:1** | **7,51:1** | Sí |
| `AlertaTiempo`: título y botón ámbar (`.alerta-tiempo__titulo`, `.alerta-tiempo__accion`) | `#2c2415` | `#fbbf24` (`--reserva-alerta`) | **9,18:1** | **9,18:1** | **9,18:1** | Sí |
| `AlertaTiempo`: texto de detalle y sugerencias | `#2c2415` | `#c4c4c4` | **8,79:1** | **8,79:1** | **8,79:1** | Sí |
| `Bracket`: encabezado de ronda (`.bracket-torneo__ronda-titulo`) | `#161616` | `#f2f2f2` | **16,16:1** | **16,16:1** | **16,16:1** | Sí |
| `Bracket`: encabezado de columna «Final» | `#161616` | `#5bd67d` / `#3fa9f5` / `#f6a94b` | **9,79:1** | **7,07:1** | **9,22:1** | Sí |
| `Bracket`: fecha de ronda y meta de partido (`12 px`) | `#161616` | `#a8a8a8` | **7,61:1** | **7,61:1** | **7,61:1** | Sí |
| `Bracket`: nombre de equipo confirmado (`.bracket-torneo__nombre`) | `#1f1f1f` | `#f2f2f2` | **14,72:1** | **14,72:1** | **14,72:1** | Sí |
| `Bracket`: «Ganador del partido N» (`.bracket-torneo__equipo--por-definir`) | `#1f1f1f` (o `#2c392f` / `#26333d` / `#3d3325` en la Final) | `#a8a8a8` | **6,93:1** (**5,76:1** en Final) | **6,93:1** (**6,00:1** en Final) | **6,93:1** (**5,78:1** en Final) | Sí |
| `Bracket`: nota «Trofeo y premiación al terminar.» | `#161616` | `#c4c4c4` | **10,38:1** | **10,38:1** | **10,38:1** | Sí |

**Conclusión de contraste**: **Ningún color de texto baja de `4,5:1`** en ninguno de los tres deportes. El valor más ajustado de toda la página es `4,58:1` en las horas reservadas deshabilitadas (`#808080` sobre `#161616`), superando también el umbral AA de texto normal.

---

## 6. Capturas actualizadas del README (`docs/capturas/`)

Se ejecutó `node planificacion/herramientas/capturas/capturas.mjs http://localhost:4173` y luego se restauraron con `git checkout --` todas las capturas ajenas a la página de reserva (`inicio.webp`, `hero-padel.webp`, `hero-futbol.webp`, `eventos.webp`, `ubicacion.webp`, `movil-inicio.webp` y `mis-reservas.webp`), dejando modificadas **únicamente las 5 capturas de la página de reserva**:

| Archivo (`docs/capturas/`) | Peso anterior | Peso nuevo | Rango esperado (`~35–90 KB`) | Verificación visual |
| --- | --- | --- | --- | --- |
| `docs/capturas/vista-canchas.webp` | `58,4 KB` (`59.756 B`) | **`62,4 KB`** (`63.946 B`) | Dentro de rango | Muestra la parte superior de `/reservar/padel` con el nuevo diseño oscuro, pestaña `Pádel` activa, Cancha 2 en el carrusel y el comprobante «Tu reserva». |
| `docs/capturas/reserva-voucher.webp` | `60,2 KB` (`61.660 B`) | **`60,6 KB`** (`62.076 B`) | Dentro de rango | Muestra Cancha 2 de Pádel, selector de día (`Mañana 8`), horario con `14:00` y `15:00` elegidas, banner de promoción y comprobante con total `$ 120.000`, pack de agua gratis y descuento de `− $ 10.000`. |
| `docs/capturas/confirmacion-qr.webp` | `41,1 KB` (`42.098 B`) | **`48,8 KB`** (`50.022 B`) | Dentro de rango | Muestra la tarjeta oscura «Reserva confirmada», el código `SPF-CCYU94` con botón «Copiar código» y el código QR sobre placa blanca. |
| `docs/capturas/modo-torneo.webp` | `80,6 KB` (`82.524 B`) | **`70,3 KB`** (`72.026 B`) | Dentro de rango | Muestra la programación por fases (`Fase 1: Cuartos de final`, `Fase 2: Semifinal`) en tema oscuro junto al comprobante lateral de torneo (`$ 435.000`). |
| `docs/capturas/torneo-bracket.webp` | `56,1 KB` (`57.408 B`) | **`43,9 KB`** (`44.934 B`) | Dentro de rango | Muestra la tarjeta «Llaves y cronograma del torneo» a ancho completo con el `Bracket` simétrico de 8 equipos (`Cuartos de final → Semifinal → Final ← Semifinal ← Cuartos de final`), ícono de copa y pie de página. |

---

## 7. Defectos encontrados

- **En el código de la aplicación (`src/`)**: **Ninguno**. No se requirió ni se realizó ninguna edición sobre `src/`.
- **En el script auxiliar de capturas de la etapa 9 (`planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs`)**: en las líneas 353–375, la captura `cancha-futbol-horario-celular.webp` desplazaba la vista a `.voucher-reserva` en lugar de `#reserva-horario`. Se invirtió el orden de scroll de esas dos capturas móviles en `capturas-etapa9.mjs` para que `cancha-futbol-horario-celular.webp` encuadre `#reserva-horario` y `cancha-futbol-celular.webp` encuadre `.voucher-reserva`.
