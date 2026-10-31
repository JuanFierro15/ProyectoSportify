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
│       ├── REPORTE.md      reporte final
│       ├── revision/       capturas, antes/después, prototipos (si los hubo)
│       ├── bloques/        una carpeta por bloque delegado a agy
│       └── logs/           salida de agy (no se versiona)
└── herramientas/           scripts de apoyo (capturas del README en capturas/)
```

## Etapas

| Carpeta | Qué fue | Responsable | Plan | Prompt | Reporte | Bloques |
| --- | --- | --- | --- | --- | --- | --- |
| `1-chatbot` | Bloque 6: datos del negocio, `/api/chat` con Gemini, widget, y reservar y cancelar desde el chat (12/13-10) | Juan Fierro | sí (con notas de cierre por parte) | no | no | (instrucciones no conservadas) |
| `2-carrusel-y-pagina-de-reserva` | Fotos protagonistas en el carrusel, detalle sobre la foto en fútbol y la reserva como página propia (23-10) | Juan Fierro | no | no | sí | c1, k1, p1 |
| `3-gemini-md` | `GEMINI.md` para el equipo y planificación compartida (30-10) | Juan Fierro | sí | no | sí | g1 |
| `4-organizar-planificacion` | Esta estructura: etapas históricas, herramientas y el índice (30-10) | Juan Fierro | sí | no | sí | (sin agy) |
| `5-torneo-multidia` | Torneos multi-día por fases (jornadas), canchas efectivas por fase y validación cronológica (30-10) | Miguel Medina | sí | no | sí | t1, t2, t3 |

Antes del flujo por etapas (sin plan ni reporte, solo commits):

- Bloques 1 a 5 (estructura, heros, catálogo, reservas y eventos):
  `ad9c201..2dc5a61` (05/07-09) y los ajustes de septiembre y octubre hasta
  `776f560`.
- Migración de Create React App a Vite: `2af2ec3..c7193d2` (14-10).
- Torneos con bracket (Miguel Medina, PR #1): `0b57856..f119ff4` (30-10).
  Pendiente: documentarlo en las guías del proyecto.

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
7. Si una regla general cambia, actualiza `comun/base.md` y avisa al equipo
   (cada uno actualiza su `GEMINI.md` local).

## Herramientas

- `herramientas/capturas/capturas.mjs`: capturas de la página de reserva para
  el README (Chrome headless por CDP, sin dependencias). Desde la raíz:
  `npm run build`, `npm run preview` y luego
  `node planificacion/herramientas/capturas/capturas.mjs`. Escribe en
  `docs/capturas/`; el perfil de Chrome y las capturas de verificación van a la
  carpeta temporal del sistema (`sportify-capturas`). Al terminar, cierra el
  `preview`.
