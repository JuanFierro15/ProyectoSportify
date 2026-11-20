# Reporte de la etapa 20: revisión de las PR #57 a #60 (issues #53 a #56)

Rama `chore/revision-prs-57-60`, creada desde `origin/main` en `d2a64c8`
(19-11-2026). Plan aprobado por Miguel Medina el mismo día, con dos decisiones:
los hallazgos quedan solo en este reporte (sin comentarios en GitHub) y la
revisión incluye `judgment-day`. No se modificó el código de ninguna PR.

## Veredicto

**Ningún hallazgo bloquea la fusión.** Las cuatro PR arreglan lo que dicen, sin
regresiones medibles, y se pueden fusionar en orden. Antes de fusionar #59 y
#60, el equipo debe confirmar dos decisiones de producto que tomó el autor.

| PR | Issue | Veredicto | Qué falta antes de fusionar |
| --- | --- | --- | --- |
| #57 | #56 | **Fusionar** | Nada. |
| #58 | #53 | **Fusionar** | Nada. Riesgo teórico JD1 anotado abajo. |
| #59 | #55 | **Fusionar con detalles** | Confirmar en equipo la decisión D2 y decidir si se corrige H1 ahora o en una issue. |
| #60 | #54 | **Fusionar con detalles** | Confirmar en equipo la decisión D1. |

**Cómo fusionar:** en orden #57 → #58 → #59 → #60 y **con commit de fusión**
(como viene haciendo `main`), nunca con "squash": la cadena está apilada (cada
rama sale exactamente de la punta de la anterior, comprobado con `merge-base`)
y un squash en #57 dejaría a #58 con commits que ya no están en `main`. Cada
fusión despliega a producción, y cada eslabón está verde por sí solo (ver
"Línea base").

## Decisiones de producto por confirmar

El archivo `odd/tasks/issues-53-54-55-56.md` de la #60 muestra que estas
decisiones las tomó el autor en su sesión ("Haz la opción A para ambos"); las
issues pedían decidirlas primero.

- **D1 (#54, PR #60): borrar los datos desde otra pestaña.** Ahora, si otra
  pestaña borra la clave, las reservas **ya guardadas** desaparecen (reinicio),
  pero las que la pestaña **no pudo guardar** sobreviven y vuelven a escribir la
  clave. Es coherente con la issue, pero es asimétrico: alguien que borra los
  datos a propósito los ve reaparecer en parte. Comprobado en la app (R8).
- **D2 (#55, PR #59): choque entre una reserva sin guardar y una guardada.**
  Gana la guardada; la sin guardar se descarta y se muestra un aviso arriba. El
  usuario ya había recibido su código, así que pierde una reserva "confirmada".

## Hallazgos

Gravedad: **conviene arreglar** (no bloquea, pero vale una issue) o
**detalle**.

| Id | PR | Gravedad | Hallazgo | Dónde | Cómo se reproduce |
| --- | --- | --- | --- | --- | --- |
| H1 | #59 | Conviene arreglar | Cuando el choque se detecta en la pestaña que acaba de reservar, la pantalla sigue mostrando "Reserva confirmada" con el código y el QR mientras el aviso de arriba dice que esa reserva no pudo completarse. Mensajes contradictorios. | `AvisoConflictoReserva.jsx` + confirmación de `VistaCanchas` | R6 en la app, captura `revision/v3/R6-aviso-1440.png` |
| H2 | #59 | Conviene arreglar | El choque solo se busca en `ocupados` de lo leído: si falta la clave de la fecha, la pendiente se acepta y quedan **dos reservas en la misma hora**. En la app no hay camino para llegar ahí (`fusionarConSemilla` llena todas las fechas de la ventana, y la única que puede faltar es el día que ya pasó), así que es un hueco defensivo. Arreglo barato: comprobar también las celdas de `guardado.reservas` con `celdasDeReserva`. | `ReservasContext.jsx:290-300` | Sonda S13, variante sin la fecha (falla en la punta) |
| H3 | #57, #58 | Detalle (riesgo teórico) | Si `ultimoRawStorageRef` queda en `null` o con un JSON ilegible **y** la pestaña no puede guardar, toda reserva en memoria pasa por pendiente y una que otra pestaña canceló puede reaparecer. Hacen falta tres fallas juntas (la app nunca escribe un JSON ilegible) y, en cuanto `setItem` funciona, el espejo lo corrige. | `ReservasContext.jsx:391-407`, `:1141-1198` | JD1 de `judgment-day`; la sonda S14 pasa en los dos lados |
| H4 | #58, #59, #60 | Detalle | Duplicación: la secuencia "pendientes de alta + de cancelación + `conciliarLecturaExterna` + reasignar registros + `registrarConflictos`" está copiada en `renovarSiCambioElDia`, el listener `storage` y `leerEstadoFresco`, y la rama de clave borrada (#60) reimplementa el filtro de `conciliarLecturaExterna`. `aplicarCancelacion` repite la lógica de liberar horas de `quitarReservasDeEstado`. `idsDeRawStorage` parsea el JSON entero dos veces por evento. | `ReservasContext.jsx:1144-1198`, `:1225-1268`, `:1276-1303`, `:1320-1354`; `cancelacion.js:145-170` y `:264-272` | Lectura (coordinador, explorador y los dos jueces) |
| H5 | #59 | Detalle | Código muerto: `conservarReservasSinGuardar` quedó como envoltorio que solo usan las pruebas (`C10` fija el envoltorio y no `conciliarReservasSinGuardar`); `horasUsadasEnCelda` se exporta sin uso externo; el id de respaldo `conflicto-${Date.now()}-${idx}` de `registrarConflictos` es inalcanzable. | `ReservasContext.jsx:349-359`, `:1056`; `cancelacion.js:98` | Lectura |
| H6 | #59 | Detalle | Accesibilidad: `aria-live="assertive"` en el contenedor y `role="alert"` en cada aviso (algunos lectores anuncian dos veces). El CSS del aviso tiene colores fijos (`#fde68a`, `rgba(246,169,75,…)` repite `--color-marca`) en lugar de tokens. | `AvisoConflictoReserva.jsx`, `App.css` | Lectura |
| H7 | #59, #60 | Detalle | Las pruebas no fijan: choque de un evento con `bloques` contra una individual, cancelar y volver a reservar la misma celda con una cancelación pendiente, cancelación pendiente al borrar la clave, y `ultimoRaw` nulo o ilegible. Las sondas S2, S5 y S14 cubren parte y pasan, pero no quedan en la suite. | `ReservasContext.test.jsx` | JD2 de `judgment-day` |
| H8 | #59, #60 | Detalle | Higiene: el mensaje del commit `05c219f` arrastra el resto de un conflicto (`# Conflicts: src/lib/cancelacion.test.js`), y `odd/tasks/issues-53-54-55-56.md` nombra una rama `fix/issues-53-54-55-56` y hashes (`75edf1c`…`f79130e`) que no existen en las ramas publicadas. | commit `05c219f`, `odd/tasks/` | `git log` |

Sin hallazgos en: reglas de `AGENTS.md` (`localStorage` solo en el contexto,
token `--z-aviso-conflicto` declarado en `App.css`, `AGENTS.md` y
`pagina-reserva.md`, tuteo, sin detalles técnicos visibles), mensajes de
commit sin menciones a IA, `docs/agentes/reservas.md` al día (la limitación de
clave borrada se quitó en la #60), y el contrato de `useReservas` (solo agrega
`avisosConflicto` y `descartarAvisoConflicto`, dentro del `useMemo`).

## Verificación

### Línea base (`v1`, `agy` con `gemini-4-hydrogen-high`)

| Ref | Archivos | Casos | Lint | Build |
| --- | --- | --- | --- | --- |
| `origin/main` (`d2a64c8`) | 38 | 500/500 | 0 | correcto |
| #57 `fix/issue-56` (`e5212c3`) | 38 | 502/502 | 0 | correcto |
| #58 `fix/issue-53` (`95a5771`) | 38 | 507/507 | 0 | correcto |
| #59 `fix/issue-55` (`cfcdf49`) | 39 | 511/511 | 0 | correcto |
| #60 `fix/issue-54` (`cffe519`) | 39 | 511/511 | 0 | correcto |

En el build solo aparecen los dos avisos que ya existían ("Invalid media query"
de Foundation y el tamaño de chunk). Detalle: `revision/v1-pruebas.md`.

### RED

Las **12 pruebas nuevas o cambiadas** fallan contra el código de su base y
pasan con el arreglo (2 de #57, 5 de #58, 4 de #59 y `C9` de #60), así que
todas prueban el arreglo y no solo lo acompañan.

### Mapa de impacto (explorador `haiku`)

- Nada en `api/` importa `cancelacion.js` ni `ReservasContext.jsx`: el servidor
  del chat no se ve afectado. (El plan suponía lo contrario; se corrigió.)
- `reservar`, `reservarEvento` y `cancelar` pasan todos por el
  `leerEstadoFresco` cambiado: formulario de reserva, torneo, cumpleaños, "Mis
  reservas" y el chat (desde el navegador) quedan dentro del impacto, y se
  probaron en `v2` y `v3`.

### Sondas adversariales (`v2`, 14 casos, punta contra `main`)

- **Punta: 13 de 14 pasan.** `main`: 3 de 14 (falla en 11, que son
  justamente los bugs que arregla la cadena).
- S12 (caso feliz completo: 1 h, 3 h, cumpleaños, cancelar, sincronizar) y S10
  (JSON inválido, formato viejo) pasan igual en los dos lados: sin regresiones.
- El único fallo en la punta es la variante de S13 → H2.
- Sondas en `revision/v2-sondas.test.jsx.txt`; detalle en `revision/v2-sondas.md`.

### `judgment-day` (F7)

Dos jueces ciegos sobre `d2a64c8..cffe519`. **Sin hallazgos CRITICAL**; los
WARNING y sugerencias quedaron como H2 a H7. La primera corrida volvió vacía
porque los jueces no tienen git (no fue un resultado limpio); se repitió con
el objetivo materializado en archivos. Registro en `revision/judgment-day.md`.
`JUDGMENT: APPROVED ✅`.

### App real (`v3`, `npm run build` + `npm run preview` de la punta)

Los 8 recorridos dieron lo esperado, sin errores en la consola:

- inicio a `1440×900` y `390×844`;
- reserva de 1 y 3 horas con descuento y validación;
- torneo en escritorio y con el asistente móvil, y cumpleaños;
- "Mis reservas" (buscar, cancelar, hora liberada, eventos no cancelables);
- dos pestañas con la misma hora;
- conflicto con aviso (cierre con teclado, sin tapar el navbar ni el chat);
- cancelación sin guardar que no reaparece;
- borrado de datos con y sin pendientes.

El coordinador revisó las capturas de R5 a R8 una por una: son reales. Están en
`revision/v3/`.

- R5 dio "parcial" solo porque el evento `storage` real bloquea la hora en B
  **antes** del clic ("Ese horario ya no está libre en las canchas elegidas.
  Elige otro."), que es mejor que el rechazo al pulsar.
- `agy` usó el MCP `chrome-devtools` con un contexto aislado, porque el MCP de
  Playwright de este equipo está configurado con `--extension`.

## Desvíos del plan

- **Un solo worktree de pruebas** (en la carpeta temporal del job) en lugar de
  cuatro: ningún eslabón cambia dependencias, y así se ahorró disco y RAM.
- **Sin previews de Vercel:** están protegidos con Vercel Authentication (302).
  Se probó con `npm run preview` local de la punta.
- **Chatbot sin prueba en vivo:** `preview` no tiene `/api/chat` y levantar
  `vercel dev` requería la key. Se omitió porque las PR no tocan `api/` y el
  chat usa las mismas `reservar` y `cancelar` que se probaron. Queda como
  pendiente manual.
- **Sin ciclo verificado:** los tres bloques fueron de medición, no escribieron
  en el repositorio.

## Fuera de alcance (ya existían, no los tocan estas PR)

`agy` vio en `v3`:

1. el texto del primer hero arranca invisible en `scrollY = 0`;
2. "bloqueado" se corta en la pastilla "Hoy" del asistente a `390 px`;
3. un torneo de un solo día dice "Viernes 20 de noviembre a Viernes 20 de
   noviembre";
4. la barra inferior del asistente deja ver un poco lo que tiene detrás.

Ninguna PR toca esos archivos. Se pueden abrir como issues aparte.

## Cierre (20-11-2026)

- **Fusión:** Miguel Medina pidió fusionar después de la revisión. Las PR se
  fusionaron en orden con commit de fusión, cambiando antes la base de cada una
  a `main` (el repositorio no borra la rama al fusionar, así que GitHub no
  cambia la base sola): #57 `a0b03dd`, #58 `e9634ee`, #59 `979ff7d` y #60
  `22efa01`. Antes de cada fusión se comprobó que la PR mostrara solo sus 2
  commits y los archivos revisados.
- **Comprobación:** `git diff cffe519 origin/main` sale vacío (`main` tiene
  exactamente lo revisado); las issues #53 a #56 se cerraron solas; el
  despliegue de Vercel de `22efa01` terminó bien; producción responde 200 en
  `/` y `/reservar/padel` y su bundle trae el texto del aviso nuevo.
- **Issues de trabajo futuro**, a partir de los hallazgos y los problemas que
  ya existían:

  | Issue | Origen |
  | --- | --- |
  | #61 | H1 |
  | #62 | H2 |
  | #63 | H3 |
  | #64 | H4 y H5 |
  | #65 | H6 |
  | #66 | H7 |
  | #67 | H8 |
  | #68 | D1 y D2 |
  | #69 | Torneo de un solo día |
  | #70 | Asistente móvil |
  | #71 | Primer hero sin texto |

- **Ramas borradas** del remoto, ya fusionadas en `main`: `fix/issue-53`,
  `fix/issue-54`, `fix/issue-55`, `fix/issue-56`, `fix/issues-40-41-42`,
  `fix/issues-50-51` y `feat/videos-hero-responsivos`.
- La revisión nativa de Gentle AI sobre los documentos de esta etapa se omitió
  por decisión de Miguel (`declined_this_candidate`).

## Pendientes

- Confirmar D1 y D2 con el equipo (#68).
- Corregir H1 y H2 (#61 y #62).
- Prueba manual del chat en producción: reservar y cancelar una reserva.

**Riesgo:** ítem 1 (estado de reservas que se persiste) e ítem 4
(concurrencia entre pestañas) de las PR revisadas; esta etapa no cambió código.
