# Informe de revisión v3 — Recorridos en la app real (integración PR #74 a #81)

- Entorno: `npm run build` + `npm run preview` en `http://localhost:4173/` (sin `/api/chat`).
- Navegador: Playwright MCP en contexto aislado (`sportify-v3`), sin cookies ni sesión previa.
- Fecha: 2026-11-20

## R1 — Primer hero (#71)

- **Resultado:** Sí (coincide).
- **Consola:** 0 errores, 0 avisos.
- **Lo esperado:** En `/` con `scrollY = 0` y sin `prefers-reduced-motion`, el primer `.deporte-hero__bloque` ("Voley Playa") debe ser visible con `opacity: 1`, y los otros dos ("Pádel" y "Fútbol") deben estar ocultos (`opacity: 0`, `visibility: hidden`). Al bajar con la rueda al segundo hero y volver arriba al primero, el primer bloque debe volver a verse. Con `prefers-reduced-motion: reduce`, los tres bloques deben ser visibles desde la carga inicial sin errores.
- **Lo visto y mediciones:**
  - **1440×900 (`prefers-reduced-motion: no-preference`):**
    - Carga inicial (`scrollY = 0`):
      - `[0]` Voley Playa: `opacity: "1"`, `visibility: "visible"`
      - `[1]` Pádel: `opacity: "0"`, `visibility: "hidden"`
      - `[2]` Fútbol: `opacity: "0"`, `visibility: "hidden"`
    - Al bajar con rueda al segundo hero (`scrollY = 1590.4`):
      - `[0]` Voley Playa: `opacity: "0"`, `visibility: "hidden"`
      - `[1]` Pádel: `opacity: "1"`, `visibility: "visible"`
      - `[2]` Fútbol: `opacity: "0"`, `visibility: "hidden"`
    - Al volver arriba con la rueda (`scrollY = 89.6`, inicio del primer hero bajo el encabezado):
      - `[0]` Voley Playa: `opacity: "1"`, `visibility: "visible"`
      - `[1]` Pádel: `opacity: "0"`, `visibility: "hidden"`
      - `[2]` Fútbol: `opacity: "0"`, `visibility: "hidden"`
  - **1440×900 (`prefers-reduced-motion: reduce`):**
    - Carga inicial (`scrollY = 0`): los tres bloques visibles (`opacity: "1"`, `visibility: "visible"`).
  - **390×844 (`prefers-reduced-motion: no-preference`):**
    - Carga inicial (`scrollY = 0`): Voley Playa `opacity: "1"`, `visibility: "visible"`; Pádel y Fútbol `opacity: "0"`, `visibility: "hidden"`.
    - Al bajar al segundo hero (`scrollY = 1534.4`): Pádel `opacity: "1"`, `visibility: "visible"`; Voley Playa y Fútbol ocultos.
    - Al volver arriba (`scrollY = 89.6`): Voley Playa `opacity: "1"`, `visibility: "visible"`; Pádel y Fútbol ocultos.
  - **390×844 (`prefers-reduced-motion: reduce`):**
    - Carga inicial (`scrollY = 0`): los tres bloques visibles (`opacity: "1"`, `visibility: "visible"`).
- **Capturas:** `R1-hero-inicial-1440.png`, `R1-hero-inicial-390.png`, `R1-hero-vuelta-1440.png`.

## R2 — Selector de día (#70)

- **Resultado:** Parcial (no se monta sobre la pastilla vecina en ningún ancho, pero en el asistente del torneo la palabra `"bloqueado"` se recorta a `400×844` y excede el ancho útil a `360×780`).
- **Consola:** 0 errores, 0 avisos.
- **Lo esperado:** En `/reservar/padel` (modo Cancha) y en el asistente del torneo (paso "Fechas por fase" con un día `"bloqueado"`), a `360×780`, `390×844`, `400×844` y `1440×900`, los textos de `.selector-dia__libres` deben caber en el ancho útil de la pastilla sin cortarse ni montarse sobre la pastilla vecina.
- **Lo visto y mediciones:**
  - **Modo Cancha (`/reservar/padel`):** todas las pastillas mostraron `"10 libres"`, `"11 libres"` o `"13 libres"`, sin cortes ni solapamientos (`solapes: []`); además, al llenarse todas las horas de `Mañana 21` tras R5, se midió también `"completo"` en los 4 anchos:
    - `360×780`: `"11 libres"` `scrollWidth: 27 px` ≤ ancho útil `34–35 px`; `"completo"` `scrollWidth: 32 px` ≤ ancho útil `35 px` (`overflow: visible`).
    - `390×844`: `"11 libres"` `scrollWidth: 27 px` ≤ ancho útil `38–40 px`; `"completo"` `scrollWidth: 32 px` ≤ ancho útil `40 px`.
    - `400×844`: `"11 libres"` `scrollWidth: 33 px` ≤ ancho útil `37–39 px`; `"completo"` `scrollWidth: 38 px` ≤ ancho útil `39 px` (`overflow: hidden`).
    - `1440×900`: `"11 libres"` `scrollWidth: 45 px` ≤ ancho útil `89–90 px`; `"completo"` `scrollWidth: 50 px` ≤ ancho útil `90 px`.
  - **Asistente del torneo (paso "Fechas por fase", pestaña `Semifinal` tras fijar `Cuartos de final` en `dom 22`, generando `"bloqueado"` en `Hoy 20` y `Mañana 21`):**
    - `360×780` (en `.asistente-torneo`):
      - Pastillas `"bloqueado"`: `pillWidth: 38.85–38.86 px`, `pillClientWidth: 37 px`, ancho útil `35 px`, `libClientWidth: 35 px`, **`libScrollWidth: 37 px`** (`font-size: 9px`, `letter-spacing: -0.7px`, `overflow: visible`). El texto excede en `2 px` el ancho útil (llega junto al borde interno), sin solapar la pastilla vecina (`solapes: []`, hueco de `4 px`).
      - Pastillas `"11 libres"` / `"13 libres"`: `libScrollWidth: 27 px` ≤ ancho útil `34–35 px`.
    - `390×844` (en `.asistente-torneo`):
      - Pastillas `"bloqueado"`: `pillWidth: 43.20 px`, `pillClientWidth: 42 px`, ancho útil `40 px`, `libClientWidth: 37 px`, `libScrollWidth: 37 px` (cabe, sin solapes).
    - `400×844` (en `.asistente-torneo`):
      - Pastillas `"bloqueado"`: `pillWidth: 44.56–44.58 px`, `pillClientWidth: 43 px`, **ancho útil `39 px`**, `libClientWidth: 39 px`, **`libScrollWidth: 43 px` (`rangeWidth: 43 px`)**, `font-size: 9px`, `letter-spacing: normal`, **`overflow: hidden`**, `text-overflow: clip`. **El texto `"bloqueado"` se recorta en `4 px`** porque a `400 px` vuelve `letter-spacing: normal` con `overflow: hidden` mientras la pastilla solo tiene `39 px` útiles. Sin solapamientos (`solapes: []`).
    - `1440×900` (vista escritorio, fuera de `.asistente-torneo`):
      - Pastillas `"bloqueado"`: `pillWidth: 100.05–100.06 px`, ancho útil `90 px`, `libScrollWidth: 57 px`, `libClientWidth: 57 px`. Cabe holgadamente, `solapes: []`.
- **Capturas:** `R2-selector-360.png`, `R2-selector-390.png`, `R2-selector-400.png`, `R2-selector-1440.png`, `R2-asistente-bloqueado-360.png`, `R2-asistente-bloqueado-390.png`.

## R3 — Torneo el mismo día (#69)

- **Resultado:** Sí (coincide).
- **Consola:** 0 errores, 0 avisos.
- **Lo esperado:** Al crear un torneo de 4 equipos con semifinal y final el mismo día (dentro de 3 días), la fecha en la confirmación debe aparecer una sola vez (sin `"X a X"`). Al crear otro con las fases en días distintos, debe mostrarse el rango `"X a Y"`. Ambos deben aparecer en "Mis reservas".
- **Lo visto y mediciones:**
  - **Torneo mismo día (código `SPF-CFCH43`):**
    - Semifinal: `sáb 21 nov · Pádel 1: 11:00` (`1 h`, `$ 50.000`).
    - Final: `sáb 21 nov · Pádel 1: 13:00` (`1 h`, `$ 50.000`).
    - Total: `$ 100.000` (con descuento de torneo `−$ 30.000`).
    - Encabezado en confirmación: `"Torneo · Sábado 21 de noviembre · 2 jornadas"` (fecha única, sin rango duplicado `"X a X"`).
  - **Torneo días distintos (código `SPF-MA96NG`):**
    - Semifinal: `sáb 21 nov · Pádel 1: 15:00`.
    - Final: `dom 22 nov · Pádel 1: 15:00`.
    - Total: `$ 100.000`.
    - Encabezado en confirmación: `"Torneo · Sábado 21 de noviembre a Domingo 22 de noviembre · 2 jornadas"` (rango `"X a Y"` correcto).
  - **En "Mis reservas":** ambos códigos (`SPF-CFCH43` y `SPF-MA96NG`) y la búsqueda por nombre y teléfono (`Carlos Ruiz`, `3001112233`) devolvieron las reservas con sus jornadas, precios y el aviso `"Los torneos y cumpleaños no se cancelan desde aquí. Comunícate con el local al 310 774 0572."`.
- **Capturas:** `R3-mismo-dia-1440.png`, `R3-dias-distintos-1440.png`.

## R4 — Reserva normal

- **Resultado:** Sí (coincide).
- **Consola:** 0 errores, 0 avisos.
- **Lo esperado:** Validar nombre inválido (`A1`) y teléfono inválido (`123`) antes de corregirlos; reservar 1 hora en pádel y luego 3 horas seguidas comprobando el descuento; guardar ambos códigos.
- **Lo visto y mediciones:**
  - **Validación de formulario:**
    - Nombre `"A1"` → mensaje `"Solo letras y espacios"`.
    - Teléfono `"123"` → mensaje `"Debe empezar por 3 y tener 10 dígitos."`.
    - Botón `"Confirmar reserva"` deshabilitado mientras los campos son inválidos (`disabled: true`).
  - **Reserva de 1 hora (Cancha Pádel 1, Sábado 21 de noviembre, `12:00 a 13:00`):**
    - Titular: `Laura Méndez`, teléfono `3005556677`.
    - Código: **`SPF-ZWWFUU`**.
    - Total: `$ 65.000` (sin descuento ni pack de agua).
  - **Reserva de 3 horas seguidas (Cancha Pádel 1, Sábado 21 de noviembre, `16:00 a 19:00`):**
    - Titular: `Laura Méndez`, teléfono `3005556677`.
    - Código: **`SPF-TFDQ5D`**.
    - Precio base `$ 195.000`, descuento por horas seguidas `−$ 5.000 por hora` (`− $ 15.000`), total **`$ 180.000`**, más `"Incluye 1 pack de agua gratis"`.
- **Captura:** `R4-confirmacion-1440.png`.

## R5 — Confirmación descartada (#61 y #65)

- **Resultado:** Sí (coincide).
- **Consola:** Sin errores ni avisos ajenos al parche intencional de `Storage.prototype.setItem` (`Error('cuota')`).
- **Lo esperado:** Con el guardado roto solo en A (`Storage.prototype.setItem` lanzando `Error('cuota')`), al reservar una hora `H` en A (sale la confirmación) y luego reservar la misma `H` en B (queda confirmada), al llegar el evento `storage` a A:
  1. Aparece un único aviso con `role="alert"` dentro de `.avisos-conflicto` (sin duplicados `aria-live`).
  2. La confirmación cambia a `"Tu reserva no pudo completarse"`, sin código grande ni QR, y `document.activeElement` queda en ese título.
  3. Cerrar el aviso no devuelve el código ni el QR.
  4. `"Elegir otro horario"` regresa al formulario conservando nombre y teléfono, con `H` deshabilitada.
  5. Mismo comportamiento al repetir con un **cumpleaños** en A que incluya `H`, y en móvil `390×844`.
- **Lo visto y mediciones:**
  - **1440×900 — Modo Cancha (`H = 14:00`, sábado 21 de noviembre, Pádel 1):**
    - A antes de la colisión: título `"Reserva confirmada"`, código `SPF-VN4LKZ` y QR visibles.
    - B reserva `14:00` y queda `"Reserva confirmada"`.
    - Al llegar `storage` a A:
      - `.avisos-conflicto`: `1` elemento `[role="alert"]`, `0` `[aria-live]` adicionales. Texto: `"Tu reserva SPF-VN4LKZ (Cancha Pádel 1, sábado 21 de noviembre, 2:00 p. m.) no pudo completarse porque ese horario ya fue ocupado."`.
      - Confirmación en A: título `<h2 class="vista-canchas__descartada-titulo">` `"Tu reserva no pudo completarse"`, sin código grande ni QR (`tieneCodigoGrande: false`).
      - Foco: `document.activeElement` es `H2` `"Tu reserva no pudo completarse"`.
      - Tras cerrar el aviso: `0` alertas, sigue `"Tu reserva no pudo completarse"` sin código ni QR.
      - Tras pulsar `"Elegir otro horario"`: vuelve al formulario con `Nombre = "Pedro Díaz"`, `Teléfono = "3002223344"` y botón `14:00` deshabilitado (`disabled: true`, `aria-label="14:00, reservada"`).
  - **1440×900 — Modo Cumpleaños (`19:00` y `20:00` en A; B reserva `H = 19:00`):**
    - A antes de la colisión: `"Reserva confirmada"`, código `SPF-XYM7MY`.
    - B confirma `19:00`; al llegar `storage` a A:
      - `.avisos-conflicto`: `1` `[role="alert"]`, `0` `[aria-live]`. Texto: `"Tu reserva de evento (SPF-XYM7MY) no pudo completarse porque uno de los horarios ya fue ocupado."`.
      - Foco en `H2` `"Tu reserva no pudo completarse"`, sin código grande ni QR; cerrar aviso mantiene el estado descartado.
      - `"Elegir otro horario"`: conserva `Nombre = "Luis Rojas"`, `Teléfono = "3003334455"` y `19:00` deshabilitado (`disabled: true`, `aria-label="19:00, reservada"`).
  - **390×844 — Modo Cancha (`H = 20:00`):**
    - Tras confirmar `20:00` en B, A recibe `storage`: `1` `[role="alert"]`, `0` `[aria-live]`, foco en `H2` `"Tu reserva no pudo completarse"`, sin código ni QR.
- **Capturas:** `R5-aviso-1440.png`, `R5-descartada-1440.png`, `R5-elegir-otro-1440.png`, `R5-descartada-390.png`.

## R6 — Cancelar entre pestañas

- **Resultado:** Sí (coincide).
- **Consola:** 0 errores, 0 avisos (tras recargar ambas pestañas sin el parche de `setItem`).
- **Lo esperado:** Tras recargar A y B para quitar el parche de `setItem`, cancelar en B desde "Mis reservas" la reserva de 1 hora de R4 (`SPF-ZWWFUU`, `12:00` del sábado 21); en A, sin recargar, esa hora debe pasar a estar libre. Al intentar cancelar el torneo de R3 (`SPF-CFCH43`), debe indicar que los eventos no se cancelan ahí.
- **Lo visto y mediciones:**
  - Antes de cancelar, en A la pastilla `Mañana 21` aparecía como `"completo"` (`disabled: true`) por las reservas acumuladas en ese día.
  - En B, dentro de "Mis reservas", se buscó `SPF-ZWWFUU` (`$ 65.000`, `12:00 a 13:00`) y se pulsó `"Cancelar reserva"` → mensaje `"Tu reserva ha sido cancelada exitosamente."`.
  - Al volver a A **sin recargar**, `Mañana 21` pasó automáticamente de `"completo"` (`disabled: true`) a `"1 libres"` (`disabled: false`), y al seleccionarlo el botón `12:00` apareció habilitado (`disabled: false`).
  - En B, al buscar `SPF-CFCH43` (torneo de R3), no apareció ningún botón de cancelación (`0` botones) y se mostró el texto `"Los torneos y cumpleaños no se cancelan desde aquí. Comunícate con el local al 310 774 0572."`.
- **Captura:** `R6-hora-libre-1440.png`.

## R7 — Torneo en el asistente móvil

- **Resultado:** Sí (coincide).
- **Consola:** 0 errores, 0 avisos (incluyendo la apertura y cierre del widget del chatbot sin enviar mensajes).
- **Lo esperado:** Completar un torneo de 4 equipos de principio a fin en el asistente móvil a `390×844`, pasando por los 6 pasos (incluido el selector de día en "Fechas por fase") hasta la confirmación.
- **Lo visto y mediciones:**
  - Paso 1 (Canchas): `Cancha Pádel 1` seleccionada → `Siguiente`.
  - Paso 2 (Formato): `4 equipos (3 partidos)` → `Siguiente`.
  - Paso 3 (Fechas por fase): en `Semifinal` se seleccionó `lun 23 nov` en `.selector-dia` y `10:00`; con `"Siguiente fase: Final"` se seleccionó `mar 24 nov` en `.selector-dia` y `10:00` → `Siguiente`.
  - Paso 4 (`Llaves`): visualización de llaves → `Siguiente`.
  - Paso 5 (`Tus datos`): `Valeria Soto`, `3001239876` → `Siguiente`.
  - Paso 6 (`Resumen`): total `$ 100.000` (descuento de torneo `− $ 30.000`) → `"Confirmar reserva"`.
  - Confirmación: código **`SPF-GC647V`**, QR visible, `"Torneo · Lunes 23 de noviembre a Martes 24 de noviembre · 2 jornadas"`, programación por fases y llaves renderizadas correctamente.
  - Chatbot: el botón `"Abrir asistente"` abrió el diálogo y se cerró correctamente sin errores de red ni consola.
- **Captura:** `R7-asistente-390.png`.

## R8 — Consola (resumen R1 a R7)

- **Resultado:** Sí (sin errores ni avisos de consola de la aplicación en ninguno de los recorridos R1 a R7, excluyendo el fallo provocado en `Storage.prototype.setItem` en R5).
- **Resumen:**
  - `Errors: 0`, `Warnings: 0` en R1, R2, R3, R4, R6 y R7 (y durante la apertura/cierre del widget del chatbot).
  - La única advertencia/error esperada en el ciclo completo fue la excepción intencional `Error('cuota')` inyectada en `Storage.prototype.setItem` en la pestaña A durante R5.

## Hallazgos

1. **[R2 — Parcial] Recorte y desborde de `"bloqueado"` en `.selector-dia__libres` en vista móvil estrecha (`400×844` y `360×780`):**
   - **Qué ocurre:** En el paso `Fechas por fase` del asistente del torneo, cuando hay días bloqueados por una fase previa:
     - A **`400×844`**, `.selector-dia__libres` cambia a `letter-spacing: normal` con `font-size: 9px` y `overflow: hidden; text-overflow: clip`, pero la pastilla solo tiene `39 px` de ancho útil (`44.56 px` de ancho total menos bordes y `2 px` de relleno lateral) mientras `"bloqueado"` mide **`43 px`** (`scrollWidth: 43`, `rangeWidth: 43`), por lo que el texto queda recortado en `4 px`.
     - A **`360×780`**, con `letter-spacing: -0.7px` y `overflow: visible`, `"bloqueado"` mide `scrollWidth: 37 px` frente a `35 px` de ancho útil (`clientWidth: 35 px`), excediendo el área interna en `2 px` (sin llegar a montarse sobre la pastilla vecina gracias al hueco de `4 px`).
   - **Pasos para reproducir:**
     1. Abrir `/reservar/padel?modo=torneo` con viewport `400×844` (o `360×780`).
     2. Ir al paso 3 (`Fechas por fase`) del asistente.
     3. En `Cuartos de final`, elegir el día `dom 22` y marcar 2 horas (p. ej. `11:00` y `12:00`).
     4. Cambiar a la pestaña `Semifinal` para que `Hoy 20` y `Mañana 21` queden en estado `"bloqueado"`.
     5. Inspeccionar `scrollWidth` y `clientWidth` de `.selector-dia__libres` en esos días (`43` vs `39` a `400×844`; `37` vs `35` a `360×780`).
