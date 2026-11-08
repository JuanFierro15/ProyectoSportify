# Planificación de Sportify

Planes, instrucciones de agy, reportes y herramientas del proyecto. Cada etapa
tiene su carpeta con todo lo suyo junto, numerada en orden cronológico.

**En este proyecto la carpeta se versiona** (excepción acordada: el
repositorio es compartido y así todo el equipo ve y actualiza lo que se va
haciendo). Solo los `logs/` quedan fuera de git. En proyectos individuales,
`planificacion/` va siempre en `.gitignore`.

```
planificacion/
├── README.md               este índice
├── comun/
│   └── base.md             proyecto, convenciones y reglas (va al inicio de toda instrucción de agy)
├── etapas/
│   └── <n>-<nombre>/
│       ├── PLAN.md         plan aprobado de la etapa
│       ├── PROMPT.md       prompt con el que se arrancó la ejecución (si lo hubo)
│       ├── PROGRESO.md     avance para retomar entre sesiones (etapa 9)
│       ├── REPORTE.md      reporte final
│       ├── referencia/     maquetas HTML de referencia (etapa 9)
│       ├── revision/       capturas, antes/después, mediciones y verificaciones (si los hubo)
│       ├── bloques/        una carpeta por bloque delegado a agy
│       └── logs/           salida de agy (no se versiona)
└── herramientas/           scripts de apoyo (capturas del README en capturas/)

odd/
└── tasks/                  especificaciones y seguimiento de tareas ODD (p. ej. asistente-torneo-movil.md)
```

## Etapas

| Carpeta | Qué fue | Responsable | Plan | Prompt | Reporte | Bloques |
| --- | --- | --- | --- | --- | --- | --- |
| `1-chatbot` | Bloque 6: datos del negocio, `/api/chat` con Gemini, widget, y reservar y cancelar desde el chat (12/13-10) | Juan Fierro | sí (con notas de cierre por parte) | no | no | (instrucciones no conservadas) |
| `2-carrusel-y-pagina-de-reserva` | Fotos protagonistas en el carrusel, detalle sobre la foto en fútbol y la reserva como página propia (23-10) | Juan Fierro | no | no | sí | c1, k1, p1 |
| `3-gemini-md` | `GEMINI.md` para el equipo y planificación compartida (30-10) | Juan Fierro | sí | no | sí | g1 |
| `4-organizar-planificacion` | Esta estructura: etapas históricas, herramientas y el índice (30-10) | Juan Fierro | sí | no | sí | (sin agy) |
| `5-torneo-multidia` | Torneos multi-día por fases (jornadas), canchas efectivas por fase y validación cronológica (30-10) | Miguel Medina | sí | no | sí | t1, t2, t3 |
| `6-bloqueo-cronologico-torneo` | Bloqueo cronológico preventivo de días y horas entre fases del torneo (31-10) | Miguel Medina | sí | no | sí | b1 |
| `7-auditoria-usabilidad` | Auditoría integral de usabilidad (`impeccable`) y mejoras de prevención de errores, A11y y móvil (rama `usability-improve`, integrada en `main` en `0e7a6f8`) | Miguel Medina (auditoría) y Juan Fierro (ejecución, 31-10) | sí | no | sí | u1, u2, u3, u4 |
| `8-cierre-sustentacion` | Cierre antes de la sustentación del 20-11: chat y negocio al día con torneos, invitados en cumpleaños, pestañas con flechas, pruebas integrales, README y capturas; Bloque 7 descartado (fusionada en `e6a167c`; pruebas manuales de `z5` y `z6` hechas el 07-11) | Juan Manuel Villalba (coordina Juan Fierro) | sí | no | sí | z1 a z6 |
| `9-rediseno-pagina-de-reserva` | Rediseño visual de la página de reserva y la confirmación en el tema oscuro del inicio, llaves simétricas con la final al centro, indicador de pasos y README y capturas al día (rama `etapa-9-rediseno-reserva`, 06/07-11; fusionada en `main` en `307d883`) | Miguel Medina (revisa y fusiona Juan Fierro) | sí | sí | sí | a0, r1 a r7 (con verificaciones v1 a v4 y v7) |
| `10-asistente-torneo-secciones` | Frente B del asistente de torneo en móvil (issue #6): prop `seccion` en `FormularioReserva` con los bloques en `torneo/Paso*.jsx`, y el bracket con scroll propio a 390 y 960 px (rama `feat/asistente-torneo-movil-secciones`, 07-11; integrada en `main` en `77af94d` junto con el frente A) | Miguel Medina | sí | no | sí | f1, f2 (con verificaciones v1 a v3) |

Antes del flujo por etapas (sin plan ni reporte, solo commits):

- Bloques 1 a 5 (estructura, heros, catálogo, reservas y eventos):
  `ad9c201..2dc5a61` (05/07-09) y los ajustes de septiembre y octubre hasta
  `776f560`.
- Migración de Create React App a Vite: `2af2ec3..c7193d2` (14-10).
- Torneos con bracket (Miguel Medina, PR #1): `0b57856..f119ff4` (30-10).

## Qué hay dentro de cada bloque

| Archivo | Qué es |
| --- | --- |
| `tarea.md` | La parte propia del bloque: objetivo, rutas, diseño y verificación. |
| `retoma.md` | Solo si un intento anterior se cortó: qué alcanzó a dejar y qué falta. |
| `instruccion.md` | La instrucción completa que recibió agy en el intento que quedó. |
| `instruccion-intento1.md` | La instrucción del primer intento, cuando hubo que relanzar. |

`instruccion.md` se arma pegando las partes en este orden:

- Bloque normal: `comun/base.md` + `tarea.md`.
- Relanzamiento: `comun/base.md` + `retoma.md` + `tarea.md`.

Los bloques de la etapa 2 son anteriores a `comun/base.md`: su
`instruccion.md` es el texto completo que se lanzó (en `c1` la retoma va al
inicio).

## Índice de bloques

| Etapa | Carpeta | Contenido | Commits | Log en `logs/` de la etapa |
| --- | --- | --- | --- | --- |
| Carrusel y página | `c1-fotos-protagonistas` | Fotos protagonistas, `autoScale` y `TarjetaCanchaCarrusel` (dos intentos: el primero sin cuota) | `d8cd353` | `c1.log` (`-intento1`) |
| Carrusel y página | `k1-capturas` | Script de capturas por CDP y capturas del carrusel | `68542dc` | `k1.log` |
| Carrusel y página | `p1-pagina-de-reserva` | Detalle en fútbol y reserva como página propia (`ERROR` tras entregar) | `f33b29a`, `1a3dc54` | `p1.log` |
| GEMINI.md | `g1-gemini-md` | `GEMINI.md` a partir de la guía local (`ERROR` tras entregar; ajustes del coordinador) | (no se versiona) | `g1.log` |
| Torneo multi-día | `t1-dominio-jornadas` | Dominio (`torneo.js`, `precios.js`, `codigoReserva.js`), `ReservasContext` multi-bloque y `useReserva` con jornadas por fase | `5c5c5e0` | `t1.log` |
| Torneo multi-día | `t2-calendario-y-bracket` | Componente `CalendarioTorneo.jsx` y fechas por fase en `Bracket.jsx` / `Bracket.css` | `a97d9f4` | `t2.log` |
| Torneo multi-día | `t3-integracion-vistas-y-tests` | Integración en `FormularioReserva`, `VoucherReserva`, `ConfirmacionReserva`, `VistaCanchas` y pruebas en `Torneo.test.jsx` | `7d85c28` | `t3.log` |
| Bloqueo cronológico torneo | `b1-bloqueo-cronologico-fases` | Bloqueo preventivo de días y horas anteriores entre fases en `SelectorDia`, `useReserva`, `CalendarioTorneo` y `Torneo.test.jsx` | `fc9f6ed`, `1d5ecdb` | `b1.log` |
| Auditoría de usabilidad | `u1-prevencion-errores-reservas` | Prevención de tope de canchas, swap automático en cruces manuales, resumen horario en vivo y acciones rápidas en `AlertaTiempo` | `a75629f` | `u1.log` (`ERROR` tras entregar; tarea corregida por Juan, borrador en `instruccion-borrador.md`) |
| Auditoría de usabilidad | `u2-contacto-mis-reservas-y-voucher` | Consulta/cancelación por código (`Mis reservas`), botón copiar código, políticas en confirmación y limpiar selección en voucher | `748ae74` | `u2.log` (`ERROR` tras entregar; dos ajustes del coordinador) |
| Auditoría de usabilidad | `u3-accesibilidad-contraste-y-tokens` | Contraste WCAG AA (`--accent-text`), `:focus-visible`, `prefers-reduced-motion`, `scroll-snap` y eliminación de `side-tab` | `6e536f5` | `u3.log` (primer intento sin red: `u3-intento1.*`; `ERROR` tras entregar) |
| Auditoría de usabilidad | `u4-carrusel-touch-targets-y-perf` | Desbloqueo de scroll vertical en `DepthCarousel`, touch targets `>=44px`, detalles en Vóley/Pádel y `poster` en videos | `e7c19aa` | `u4.log` (`ERROR` tras entregar) |
| Cierre sustentación | `z1-chat-y-negocio` | Instrucciones del chat al día con torneos por fases y "Mis reservas", `negocio.json` y casos `torneo-proceso` y `cancelar-codigo` en `probar-chat.mjs` | `6d4a417`, `ec39b18` | `z1.log` |
| Cierre sustentación | `z2-invitados-vacio-y-pestanas` | Invitados en voucher y confirmación de cumpleaños, aviso de estado vacío y navegación con flechas en pestañas de deporte | `8e1a203`, `d5c9757`, `ab3f6d2` | `z2.log` |
| Cierre sustentación | `z3-pruebas-integrales` | Pruebas integrales de inicio a fin en `1440×900` y `390×844` registradas en `REPORTE.md` (`E1`–`E6` en su sección 7) | (en `REPORTE.md`) | (en sesión) |
| Cierre sustentación | `z4-documentacion-y-capturas` | Actualización de `README.md`, 12 capturas en `docs/capturas/`, script `capturas.mjs`, `planificacion/` y `GEMINI.md` | `9418642` | (en sesión) |
| Rediseño reserva | `a0-capturas-antes` | Capturas "antes" contra producción (`revision/antes/`, 20) y script `revision/capturas-etapa9.mjs` | `41538fd` | `a0.log` |
| Rediseño reserva | `r1-tema-y-encabezado` | Tokens `--reserva-*`, navbar oscuro en la reserva, encabezado con foto y velo, foco del `h1`, selector de modo con íconos, pestañas con subrayado del acento, carrusel oscuro y overrides de Foundation (dos intentos) | `4ed9980` | `r1.log` (`-intento1`) |
| Rediseño reserva | `v1-verificacion-r1` | Verificación de `r1` en navegador (3 defectos detectados, corregidos y recomprobados en `instruccion-recomprobacion.md`) | `4ed9980` | `v1.log` |
| Rediseño reserva | `r2-dia-horario-y-datos` | Tarjetas de sección, Día, Horario por franjas con leyenda, Tus datos, `CanchasElegidas`, `AlertaTiempo` y `AsignacionManual` en tema oscuro (dos intentos) | `fa9c96b` | `r2.log` (`-intento1`) |
| Rediseño reserva | `v2-verificacion-r2` | Verificación de `r2` en navegador (7 defectos detectados, corregidos y recomprobados en `instruccion-recomprobacion.md`) | `fa9c96b` | `v2.log` |
| Rediseño reserva | `r3-tiquete-y-confirmacion` | Comprobante con forma de tiquete y confirmación en tema oscuro con QR sobre fondo blanco (dos intentos) | `deaecc3` | `r3.log` (`-intento1`) |
| Rediseño reserva | `v3-verificacion-r3` | Verificación de `r3` en navegador (2 defectos detectados, corregidos y recomprobados en `instruccion-recomprobacion.md`) | `deaecc3` | `v3.log` |
| Rediseño reserva | `r4-llaves` | `SeccionLlaves` a ancho completo, llaves simétricas y por rondas en celular, "Partido N", `IndicadorPasos` y pruebas en `Torneo.test.jsx` (dos intentos) | `f063059` | `r4.log` (`-intento1`) |
| Rediseño reserva | `v4-verificacion-r4` | Verificación de `r4` en navegador (5 defectos detectados, corregidos y recomprobados en `instruccion-recomprobacion.md`) | `f063059` | `v4.log` |
| Rediseño reserva | `r5-verificacion` | Capturas "después" (`revision/despues/`, 20), casos A1–A5, B1–B7 y C1–C4, teclado, movimiento reducido, contraste (`revision/verificacion-final.md`) y 5 capturas de `docs/capturas/` | `276e3d5` | `r5.log` |
| Rediseño reserva | `r6-readme` | Actualización de `README.md` y reporte de la etapa 9 (dos intentos: el primero cortado por memoria) | `a660ad7` | `r6.log` (`-intento1`) |
| Rediseño reserva | `r7-conectores` | Corrección de los conectores SVG entre partidos de las llaves en `Bracket.jsx` | `4083de8` | `r7.log` |
| Rediseño reserva | `v7-verificacion-conectores` | Verificación con Playwright de los conectores de las llaves con 4, 8 y 16 equipos (escritorio, celular y confirmación) y actualización de capturas | `4083de8` | `v7.log` |
| Asistente torneo secciones | `f1-secciones-formulario` | Prop `seccion` en `FormularioReserva`, seis bloques extraídos a `torneo/Paso*.jsx` y 7 pruebas en `FormularioReserva.test.jsx` | `71fb582` | `f1.log` |
| Asistente torneo secciones | `v1-medicion-390` | Medición a `390×844` de los seis pasos antes de B2 y base de capturas a `1440×900` (`revision/v1/medicion.md`) | (en `revision/v1/medicion.md`) | `v1.log` |
| Asistente torneo secciones | `f2-css-movil` | Contención del ancho del bracket y del formulario bajo `(max-width: 63.9375em)` | `2eafffa`, `442a92b` | `f2.log` |
| Asistente torneo secciones | `v2-verificacion-final` | Verificación final de S2, S7 y S8 a `390×844`, `960×800` y `1440×900` (`revision/v2/verificacion.md`) | `b055327` | `v2.log` |
| Asistente torneo secciones | `v3-recheck-960` | Recomprobación acotada de S8 en `960×800` y `390×844` tras incluir `.bracket-torneo__canvas-scroll` (`revision/v2/verificacion.md`) | `b055327` | `v3.log` |

## Cómo trabajar en equipo

1. Antes de empezar: `git pull`, leer este índice y el `REPORTE.md` de la
   última etapa.
2. Etapa nueva: `etapas/<siguiente número>-<nombre>/` con su `PLAN.md` y la
   fila en la tabla con tu nombre. Haz commit de esa fila pronto para que
   nadie tome el mismo número. Al terminar, `REPORTE.md` en la misma carpeta.
3. Bloque nuevo: `etapas/<etapa>/bloques/<id>-<nombre-corto>/tarea.md`, con un
   id corto en orden (`c2`, `t1`, `a1`...).
4. Arma la instrucción y lánzala desde Git Bash, en la raíz del proyecto:

```bash
P=planificacion/etapas/5-etapa
D=$P/bloques/x1-nombre
mkdir -p "$P/logs"
cat planificacion/comun/base.md "$D/tarea.md" > "$D/instruccion.md"
agy -p "Lee el archivo $D/instruccion.md (UTF-8) y ejecuta al pie de la letra la instruccion completa que contiene. Ese archivo es tu unica tarea." --model "gemini-3.8-flash-high" --dangerously-skip-permissions --output-format json > "$P/logs/x1.log" 2> "$P/logs/x1.err.log"
```

El prompt corto apunta al archivo: pasar el contenido con `$(cat ...)` o
`$(Get-Content ... -Raw)` parte el argumento en las comillas de la
instrucción y daña las tildes en PowerShell 5.1. Nunca Flash Lite.

5. agy a veces termina en `ERROR` después de entregar el trabajo: revisa
   `git status` y el diff antes de relanzar. Si hay que relanzar, renombra
   `instruccion.md` a `instruccion-intento1.md`, escribe `retoma.md` y vuelve
   a armar con `base.md` + `retoma.md` + `tarea.md`.
6. Agrega la fila del bloque al índice de este archivo.
7. Si una regla general cambia, actualiza `AGENTS.md` (guía compartida del
   proyecto en la raíz, versionada desde el 07-11) y `comun/base.md`.

## Herramientas

- `herramientas/capturas/capturas.mjs`: capturas de la página de reserva para
  el README (Chrome headless por CDP, sin dependencias). Desde la raíz:
  `npm run build`, `npm run preview` y luego
  `node planificacion/herramientas/capturas/capturas.mjs`. Escribe en
  `docs/capturas/`; el perfil de Chrome y las capturas de verificación van a la
  carpeta temporal del sistema (`sportify-capturas`). Al terminar, cierra el
  `preview`.
