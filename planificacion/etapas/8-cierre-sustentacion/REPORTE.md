# Reporte — Etapa 8: Cierre del proyecto, pruebas integrales y documentación final

- **Fecha**: 2026-11-06
- **Rama**: `etapa-8-cierre`
- **Autor**: Juan Manuel Villalba Rincón (`jmvr24`); revisión y sección 7 de Juan Fierro

---

## 1. Resumen

Ejecución de los bloques locales de cierre definidos en `PLAN.md` (`z1`, `z2`, `z3` y `z4`):

- **`z1` (Chat y datos del negocio)**: se actualizaron las instrucciones de `/api/chat` (`api/_lib/instrucciones.js`) para reflejar el flujo real de torneos por fases (`MAX_CANCHAS_TORNEO = 3` del mismo deporte, `OPCIONES_EQUIPOS` = 4, 8 o 16, emparejamiento aleatorio o manual, programación por fases en varios días y descuentos desde `MIN_HORAS_BENEFICIO` horas seguidas) y el modal **"Mis reservas"** (consulta por código `SPF-XXXXXX` o nombre + teléfono, visualización de QR y cancelación individual hasta 6 h antes); se alineó `src/data/negocio.json` ("en una o varias canchas del mismo deporte") y se agregaron los casos `torneo-proceso` y `cancelar-codigo` a `scripts/probar-chat.mjs` (12 casos en total).
- **`z2` (Invitados, estado vacío y pestañas)**: se agregó la cantidad de invitados en `VoucherReserva.jsx` y `ConfirmacionReserva.jsx` (desde `useReserva.js`) cuando el modo es `"cumpleanos"`, con su test en `Torneo.test.jsx`; se ajustó el texto del estado vacío en `CanchasElegidas.jsx` a `"Aún no has elegido canchas. Agrégalas desde el carrusel."`; y se implementó navegación circular por teclado (`ArrowRight`, `ArrowLeft`, `Home`, `End`) con `tabIndex` roving (`0` / `-1`), `role="presentation"` en los `<li>` y contorno `:focus-visible` en las pestañas de deporte de `VistaCanchas.jsx`.
- **`z3` (Pruebas integrales de inicio a fin)**: se verificaron en navegador real (Chrome headless vía CDP contra `npm run build` + `npm run preview`, en `1440×900` y `390×844`) todos los flujos locales (`A1`–`A5`, `B1`–`B7`, `C1`–`C4`, `D1`–`D5`, `E7`, `F1`–`F6`, `G1`–`G4`, `H1`–`H3`). Los casos que requieren `vercel dev` o acceso a `/api/chat` (`E1`–`E6` y `scripts/probar-chat.mjs`), junto con `z5` (integración a `main`) y `z6` (verificación en producción), quedan documentados como **pendientes por `JuanFierro15`**.
- **`z4` (Documentación, capturas y guías)**: se actualizaron las 10 capturas existentes de `docs/capturas/` con la marca `Sportify` y los cambios de las etapas 6–8, se generaron las 2 capturas nuevas (`torneo-bracket.webp` y `mis-reservas.webp`), y se dejaron al día `README.md`, `planificacion/README.md`, `planificacion/etapas/7-auditoria-usabilidad/REPORTE.md` y `GEMINI.md` local.

---

## 2. Estado por bloque y commits

| Bloque | Estado | Commits | Resumen |
|---|---|---|---|
| `z1` — Chat y datos del negocio | ✅ Completado | `6d4a417`, `ec39b18` | `api/_lib/instrucciones.js`, `src/data/negocio.json` y `scripts/probar-chat.mjs` (12 casos). |
| `z2` — Invitados, estado vacío y pestañas | ✅ Completado | `8e1a203`, `d5c9757`, `ab3f6d2` | Invitados en voucher/confirmación (`useReserva.js`, `VoucherReserva.jsx`, `ConfirmacionReserva.jsx`, `VistaCanchas.jsx`, `Torneo.test.jsx`), estado vacío en `CanchasElegidas.jsx` y flechas/Home/End con roving `tabIndex` en `VistaCanchas.jsx` + `VistaCanchas.css`. |
| `z3` — Pruebas integrales de inicio a fin | ✅ Completado en local (API chat pendiente `JuanFierro15`) | (este reporte) | 31 casos locales verificados en `1440×900` y `390×844`; `E1`–`E6` y `probar-chat.mjs` pendientes por `JuanFierro15`. |
| `z4` — Documentación, capturas y guías | ✅ Completado | `9418642` + cierre | 12 capturas WebP en `docs/capturas/`, `README.md`, `planificacion/` y `GEMINI.md`. |
| `z5` — Integración a `main` y despliegue | 🟡 Fusionado; faltan las pruebas manuales en producción | `e6a167c` | Ver la sección 7. |
| `z6` — Verificación en producción y límite de peticiones | 🟡 Regla activa (07-11-2026); falta la prueba de humo tras la etapa 9 | — | Regla "Limitar chat" en Vercel Firewall: `POST /api/chat`, 30 peticiones por minuto por IP, responde 429. Ver la sección 8. |

---

## 3. Resultados de las pruebas integrales (`z3`)

| ID | Caso de prueba | Escritorio (`1440×900`) | Móvil (`390×844`) | Resultado y observaciones |
|---|---|:---:|:---:|---|
| **A1** | Padel 1, mañana, 2 h seguidas (`14:00` y `15:00`) | ✅ | ✅ | Total `$120.000` (`$65.000 × 2 − $5.000 × 2`), ahorro `$10.000` y `Packs de agua gratis: 1`. |
| **A2** | Intentar agregar una 4.ª hora seguida | ✅ | ✅ | Bloquea en máximo 3 horas seguidas con alerta `"Máximo 3 horas seguidas por reserva"`. |
| **A3** | Confirmar reserva con nombre y teléfono | ✅ | ✅ | Muestra código `SPF-XXXXXX`, QR descargable, botón `"Copiar código"` (`"¡Copiado!"`) y condiciones (abono 50 %, cancelación 6 h). |
| **A4** | Recargar la página tras confirmar | ✅ | ✅ | Las horas `14:00` y `15:00` siguen marcadas como `· ocupado` en ese día y cancha (`localStorage`). |
| **A5** | Intentar reservar la misma hora recién ocupada | ✅ | ✅ | Botón deshabilitado (`disabled`), no permite seleccionarla ni confirmarla. |
| **B1** | Entrar desde `"Reserva un evento"` en el inicio | ✅ | ✅ | Abre `/reservar/voley-playa?modo=torneo` con **0 canchas** preseleccionadas y avisos claros en `CanchasElegidas` y `CalendarioTorneo`. |
| **B2** | Intentar agregar 4.ª cancha o cancha de otro deporte en torneo | ✅ | ✅ | Rechaza con aviso en `.vista-canchas__aviso-torneo` (`Máximo 3 canchas por torneo` y `mismo deporte`). |
| **B3** | Cambiar entre `4`, `8` y `16` equipos | ✅ | ✅ | Actualiza partidos y fases (`2`, `3` y `4` fases) tanto en `CalendarioTorneo` como en `Bracket`. |
| **B4** | Programar Fase 1 en día 3 (`10:00–13:00`) y revisar Fase 2 | ✅ | ✅ | En Fase 2 los días 1 y 2 aparecen bloqueados, y en el día 3 las horas `<= 12:00` están bloqueadas y desde `13:00` libres. |
| **B5** | Elegir `"Armar cruces manualmente"` e intercambiar equipos | ✅ | ✅ | Permite editar la primera ronda en el bracket e intercambia automáticamente sin dejar duplicados. |
| **B6** | Elegir menos horas de las que requiere una fase | ✅ | ✅ | Muestra `AlertaTiempo` con sugerencias y el botón `"Usar partidos de 15 min (relámpago)"` ajusta la duración a `15 min`. |
| **B7** | Confirmar torneo de varios días | ✅ | ✅ | Voucher y confirmación muestran desglose por fase/día, bracket completo y dejan ocupadas las horas en cada fecha. |
| **C1** | En `"Cumpleaños"`, escribir `150` en `"Invitados"` | ✅ | ✅ | Bloquea `"Confirmar reserva"` y muestra alerta `"Máximo 100 invitados."`. |
| **C2** | En `"Cumpleaños"`, agregar canchas de distintos deportes | ✅ | ✅ | Permite combinar canchas de vóley playa y pádel en el mismo evento. |
| **C3** | Confirmar cumpleaños con `20` invitados | ✅ | ✅ | Muestra `Invitados: 20` tanto en el voucher como en la pantalla de confirmación. |
| **C4** | Elegir un rango con una hora ocupada en medio | ✅ | ✅ | Rechaza el rango y muestra el aviso de horarios ocupados intermedios. |
| **D1** | Buscar en `"Mis reservas"` por código `SPF-XXXXXX` (en minúsculas) | ✅ | ✅ | Encuentra la reserva, muestra sus datos, `"Ver QR"` despliega el QR y ofrece `"Cancelar reserva"`. |
| **D2** | Buscar en `"Mis reservas"` por nombre y teléfono (sin tildes/con espacios) | ✅ | ✅ | Encuentra las reservas futuras de esa persona (`"ana gomez"` + `"300 123 4567"`). |
| **D3** | Reserva individual creada sin teléfono | ✅ | ✅ | Aparece al buscar por código `SPF-XXXXXX` y no aparece al buscar por nombre y teléfono. |
| **D4** | Cancelar reserva con más de 6 h de anticipación | ✅ | ✅ | Se elimina de `"Mis reservas"` y sus horas vuelven a estar libres inmediatamente en el formulario. |
| **D5** | Intentar cancelar en `"Mis reservas"` un torneo/evento o reserva `< 6 h` | ✅ | ✅ | No muestra botón de cancelar y explica el motivo (eventos solo llamando al local / plazo mínimo de 6 h). |
| **E1–E6** | Casos en vivo de `/api/chat` y `node scripts/probar-chat.mjs` | — | — | Ver la sección 7. |
| **E7** | Conversación del widget al navegar del inicio a `/reservar/...` y volver | ✅ | ✅ | El portal del chatbot permanece montado en `document.body` y conserva los mensajes y el borrador entre páginas. |
| **F1** | Recargar (`F5`) en `/reservar/padel` | ✅ | ✅ | Renderiza la página de reserva sin 404. |
| **F2** | Abrir `/reservar/futbol?modo=torneo` directamente | ✅ | ✅ | Abre en la pestaña de fútbol con el modo `"Torneo"` activo. |
| **F3** | Bajar en el inicio, entrar a `"Ver canchas de Pádel"` y tocar `"Volver al inicio"` | ✅ | ✅ | Vuelve a `/` y restaura la posición de scroll donde estaba el usuario. |
| **F4** | Ctrl+clic / clic medio en `"Ver canchas..."`, `"Canchas"` o `"Reserva un evento"` | ✅ | ✅ | Todos los enlaces tienen `href` real (`/reservar/<deporte>`) y delegan en el navegador con `esClicNormal(e)`. |
| **F5** | Tocar `"Ubicación"` o `"Eventos"` en el navbar desde la página de reserva | ✅ | ✅ | Vuelve al inicio y desplaza suavemente hasta `#ubicacion` o `#eventos`. |
| **F6** | Girar la rueda del mouse sobre el carrusel de canchas | ✅ | ✅ | Desplaza verticalmente la página sin quedar atrapado en el carrusel. |
| **G1** | Recorrer con `Tab` y `Shift+Tab` la página de inicio y la de reserva | ✅ | ✅ | Orden de foco lógico y contorno `:focus-visible` de 2 px claramente visible en todos los controles. |
| **G2** | En las pestañas de deporte, usar `ArrowLeft`, `ArrowRight`, `Home` y `End` | ✅ | ✅ | Cambia de deporte circularmente, mueve el foco con `tabIndex` roving (`0` en activa, `-1` en inactivas) y `role="presentation"` en los `<li>`. |
| **G3** | Abrir visor de foto, `"Mis reservas"` y el chat, y presionar `Escape` | ✅ | ✅ | Cierra únicamente el diálogo/panel activo y devuelve el foco al botón que lo abrió. |
| **G4** | Activar `prefers-reduced-motion: reduce` | ✅ | ✅ | Desactiva animaciones de movimiento mantendo la página y el carrusel totalmente funcionales. |
| **H1** | En `390×844`, completar reserva (`A`) y consulta (`D`) | ✅ | ✅ | Sin scroll horizontal (`scrollWidth <= clientWidth`) y botones con área táctil cómoda (`>= 44 px`). |
| **H2** | En `390×844`, recorrer los heros de inicio | ✅ | ✅ | El video avanza con el scroll y se detiene al soltar, con imagen `poster` inicial. |
| **H3** | En `390×844`, abrir el chat y `"Mis reservas"` | ✅ | ✅ | Ambos modales abren sin desborde horizontal ni elementos tapados. |

---

## 4. Capturas actualizadas y nuevas (`docs/capturas/`)

Generadas con `planificacion/herramientas/capturas/capturas.mjs` (WebP calidad 82):

- **Retomadas con marca `Sportify` y cambios de etapas 6–8**:
  - `inicio.webp` (`1440×900`)
  - `hero-padel.webp` (`1440×900`)
  - `hero-futbol.webp` (`1440×900`)
  - `eventos.webp` (`1440×900`)
  - `ubicacion.webp` (`1440×900`)
  - `movil-inicio.webp` (`390×844`, DPR 2)
  - `vista-canchas.webp` (`1440×900`)
  - `reserva-voucher.webp` (`1440×900`)
  - `confirmacion-qr.webp` (`1440×900`)
  - `modo-torneo.webp` (`1440×900`)
- **Nuevas**:
  - `torneo-bracket.webp` (`1440×900`)
  - `mis-reservas.webp` (`1440×900`)
- **Conservadas sin cambios**:
  - `chat-disponibilidad.webp`, `chat-tarjeta.webp`, `movil-chat.webp` y `chat-reserva.gif`.

---

## 5. Cambios aplicados en `GEMINI.md` (para replicar en `CLAUDE.md`)

> Tiene nombres que no existen en el código: ver las correcciones de la sección 7.

1. **Comandos (`probar-chat.mjs`)**: se añadieron los ids `torneo-proceso` y `cancelar-codigo` (12 casos en total).
2. **Arquitectura (`ReservasContext` y `src/lib/`)**:
   - Se documentó la acción `RESERVAR_TORNEO` (`reservarTorneo`) junto a `RESERVAR_EVENTO`.
   - En `cancelacion.js` se reemplazó la referencia al "panel admin (Bloque 7)" por `MisReservas` y se listaron `buscarReservaPorCodigo`, `buscarReservasDePersona` y `horasDeReserva`.
   - Se agregó la entrada de `src/lib/torneo.js` (`OPCIONES_EQUIPOS`, `MAX_CANCHAS_TORNEO`, `calcularFasesTorneo`, `generarCrucesIniciales`, `generarBracket`, `intercambiarEquipoEnPartidos`, `validarJornadasTorneo`, `calcularPrecioJornadas`).
   - En `estiloAcento(acento)` se añadió `--accent-text` (contraste WCAG AA sobre fondos claros).
3. **Vista de reserva y componentes (`VistaCanchas`, `ConfirmacionReserva`, `MisReservas`)**:
   - Se documentó `sinPreseleccionar: true` al abrir modo torneo desde `"Reserva un evento"` o desde el chat (arranca con 0 canchas).
   - Se actualizó `"Cancelar"` por `"Limpiar selección"` en el voucher (limpia sin salir de la página).
   - Se actualizó `detalleEnTarjeta: true` para indicar que está activo en los tres deportes, no solo en fútbol.
   - Se documentó la subcarpeta `components/reservas/torneo/` (`CalendarioTorneo`, `Bracket`, `AlertaTiempo`) y el modal `MisReservas` (`components/layout/MisReservas.jsx`), eliminando la nota del Bloque 7 en `ConfirmacionReserva`.
4. **Lista de bloques ("Cómo trabajamos")**:
   - Se reemplazó el Bloque 7 ("Panel de estado/admin (opcional) ← pendiente") por el cierre real: `5. ✅ Modo evento especial (torneos por fases multi-día con bracket interactivo y cumpleaños)`, `6. ✅ Chatbot` y `7. ✅ Consulta de Mis reservas y auditoría de usabilidad y accesibilidad`.

---

## 6. Pendientes

Actualizado por Juan Fierro el 06-11-2026, tras la revisión de la sección 7.

1. **Pruebas manuales en producción (`z5`):** A3, B7, C3, D1, D4, E2, F1 y H1, en ventana de incógnito o perfil temporal.
2. **Chat en la interfaz:** E1 (comparar con los horarios de la página), E2 (reservar y responder "sí") y E3 (cancelar con nombre y teléfono).
3. **Volver a comprobar B5 y B6:** ver la nota de la sección 7.
4. ~~**Límite de peticiones (`z6`):** regla de Vercel Firewall sobre `/api/chat`, a cargo de Juan Fierro. Falta comprobar que el plan la incluya.~~ Hecho el 07-11-2026 (sección 8). El plan Hobby la incluye.
5. **Cierre:** completar este reporte y borrar la rama `etapa-8-cierre`.

Las capturas de la página de reserva y del torneo se rehacen en la etapa 9, porque ese rediseño las deja viejas.

---

## 7. Revisión y fusión (Juan Fierro, 06-11-2026)

PR #4 fusionado en `main` con `e6a167c`. Antes de fusionar se agregaron a la rama cuatro commits, por lo que encontró la revisión:

| Commit | Qué corrige |
|---|---|
| `e844ef7` | Instrucciones del chat: el proceso de torneos va dentro del mensaje de `abrir_seccion`. |
| `2105fe9` | README: desempate según el deporte y condición del abono. |
| `b3e0b45` | La dirección del local la garantiza el servidor (`procesarLlamada` en `api/_lib/funciones.js`), con 3 tests en `api/_lib/funciones.test.js`. |
| `783bb02` | README: conteo de tests (195 en 16 archivos). |

### Regresión encontrada en el chat

Las instrucciones nuevas del PR hacían que el modelo dejara de dar la dirección, aunque la regla de ubicación no había cambiado. Mejorar solo el texto no lo resolvió una vez desplegado: 7 de 8 en local, pero 0 de 8 en el preview, con el mismo modelo. Por eso la dirección quedó a cargo del servidor.

| Caso | Dónde | `main` antes | PR original | Ajuste de texto | Con el servidor |
|---|---|:---:|:---:|:---:|:---:|
| `¿Dónde quedan?` da la dirección | Local | 12 de 14 | 2 de 15 | 7 de 8 | — |
| `¿Dónde quedan?` da la dirección | Desplegado | 5 de 8 | — | 0 de 8 | **8 de 8** |
| `¿Cómo reservo un torneo?` menciona las fases | Local | no contado | 1 de 6 | 8 de 8 | — |
| `¿Cómo reservo un torneo?` menciona las fases | Desplegado | 0 de 8 | — | **8 de 8** | — |

Muchas de esas respuestas solo dicen "organiza tu torneo por fases", sin explicar el proceso completo. Ese caso depende del modelo: no está garantizado por el servidor.

### Casos del chat (`E1`–`E6`)

`vercel dev` falló en el equipo de la revisión (`EPERM` al crear symlinks en la caché de la CLI), así que los casos locales corrieron sobre el handler real de `api/chat.js`, cargado con Vite. `vercel build` no se ejecutó: la compilación la respaldan el preview y producción, que responden HTTP 200.

| ID | Resultado | Observaciones |
|---|---|---|
| E1 | parcial | `disponibilidad` pasa con el script; falta compararlo con la página. |
| E2 | parcial | `datos-validos` propone la reserva; falta confirmarla en la interfaz. |
| E3 | sin probar | El script no tiene este caso. |
| E4 | pasa | Abre la reserva de eventos y menciona las fases (tabla anterior). |
| E5 | pasa | `cancelar-codigo`: 6 de 6 en local y 1 en producción. |
| E6 | pasa | `fuera-de-tema` no responde el tema. |

`node scripts/probar-chat.mjs https://proyecto-sportify.vercel.app` pasó 10 de 12 a la primera. En `fuera-de-tema` y `torneo-proceso` la petición falló sin respuesta HTTP, sin causa identificada; al repetirlos pasaron 3 de 3 cada uno.

### Otras verificaciones de la revisión

- `npm test` (195 tests) en `main`; `npm run lint` y `npm run build` en la rama, antes del último commit, que solo cambia el README.
- G2 y F4 repetidos en Chrome contra el build, a 1440×900: pestañas con flechas, Inicio, Fin y Ctrl+clic, sin errores de consola. A 390×844 no se repitieron.
- El resto de la tabla de `z3` no se repitió.

### Correcciones a este reporte

- **Sección 5:** varios nombres no existen en el código, así que no se copiaron a `CLAUDE.md`. No existen `RESERVAR_TORNEO` ni `reservarTorneo` (los torneos usan `RESERVAR_EVENTO` con `bloques`), `sinPreseleccionar` (`canchaIds` arranca vacío), ni `calcularFasesTorneo`, `generarCrucesIniciales`, `generarBracket`, `intercambiarEquipoEnPartidos` y `validarJornadasTorneo`. `calcularPrecioJornadas` está en `precios.js`, no en `torneo.js`. **Si tu `GEMINI.md` tiene esos nombres, corrígelo.**
- **Sección 3:** algunas citas no corresponden a la interfaz. B5 cita "Armar cruces manualmente" y B6 "Usar partidos de 15 min (relámpago)"; lo que existe es "Manual" y "Cambiar a 15 min por partido". B2 cita la clase `.vista-canchas__aviso-torneo`, que no existe. Por eso B5 y B6 quedan por comprobar, y los demás resultados de la tabla son los que registró Juan Manuel, sin repetir.
- **README:** las duraciones de partido son 15, 20 o 30 min (`OPCIONES_DURACION`), no 15 a 90.

---

## 8. Límite de peticiones (`z6`, Juan Fierro, 07-11-2026)

Regla de Vercel Firewall `Limitar chat` (`rule_limitar_chat_HgAMUe`), publicada en producción. No cambia código.

| Campo | Valor |
|---|---|
| Condiciones | `path` igual a `/api/chat` y `method` igual a `POST` |
| Límite | 30 peticiones por ventana fija de 60 s, contadas por IP |
| Al pasarse | 429 de Vercel (`{"error":{"code":"429",...}}`) |

- El plan Hobby la incluye. `--duration` y el bypass del sistema necesitan Pro.
- Se publicó primero en modo `log` con 15 por minuto: de 21 peticiones, 6 quedaron registradas. Luego se subió a 30 y se pasó a bloquear, porque el tráfico real es muy bajo para sacar conclusiones de los registros.
- Prueba sin gastar cuota: peticiones con cuerpo vacío (`{}`), que el servidor rechaza con 400 antes de llamar a Gemini. Resultado: 30 respondieron 400 y desde la 31 respondió 429. El inicio siguió en 200.
- El widget muestra ante el 429 el mensaje genérico ("No pude responder ahora. Intenta de nuevo en un momento."), porque `normalizarRespuesta` descarta una respuesta sin `respuesta`.
- Los contadores son por región. Todos los que compartan una IP (por ejemplo, el wifi del salón) suman al mismo límite. En la sustentación solo prueba el profesor, así que 30 por minuto alcanza.
- Para cambiarla: `vercel firewall rules update "Limitar chat" ...` y `vercel firewall publish`. Para apagarla: `vercel firewall rules disable "Limitar chat"` y publicar.
- Falta la prueba de humo del chat después de fusionar la etapa 9 (un mensaje real que responda bien).
