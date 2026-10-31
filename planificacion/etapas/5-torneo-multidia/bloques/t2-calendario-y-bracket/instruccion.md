# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `GEMINI.md` (raíz; cada integrante lo
  tiene en local): léela antes de empezar y respétala. La parte del plan que
  te toca va copiada en tu tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

# Tarea: componente `CalendarioTorneo` y fechas por fase en `Bracket` (`t2-calendario-y-bracket`)

## Objetivo

Crear el componente `src/components/reservas/torneo/CalendarioTorneo.jsx` para
que el usuario programe qué día y en qué franja horaria se juega cada fase del
torneo (**Octavos de final**, **Cuartos de final**, **Semifinal**, **Final**),
y actualizar `src/components/reservas/torneo/Bracket.jsx` y `Bracket.css` para
mostrar la fecha de cada fase en el encabezado de cada columna del bracket y
dar estilo a las tarjetas de programación por fase.

## Rutas

- Crear:
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`
- Modificar:
  - `src/components/reservas/torneo/Bracket.jsx`
  - `src/components/reservas/torneo/Bracket.css`
- Leer (sin modificar):
  - `src/components/shared/SelectorDia.jsx`
  - `src/components/reservas/torneo/AlertaTiempo.jsx`
  - `src/lib/fechas.js`
  - `src/lib/canchas.js`
  - `src/lib/precios.js`
- Prohibido modificar cualquier otro archivo fuera de las listas "Crear" y "Modificar".

## Diseño detallado

### 1. `src/components/reservas/torneo/CalendarioTorneo.jsx`

Componente que permite elegir el día y la franja horaria de cada fase del
torneo:

- Props esperadas:
  - `fases = []` (resultado de `fasesDelTorneo`)
  - `jornadas = {}` (`{ [ronda]: { fecha, horas } }`)
  - `validacionesJornadas = []` (resultado de `validarJornadas`)
  - `sugerenciasPorFase = {}` (`{ [ronda]: string[] }`)
  - `dias = []` (ventana de 7 días ISO)
  - `horasBase = []` (franjas horarias del catálogo)
  - `canchas = []` (catálogo de canchas para mostrar los nombres de las canchas efectivas)
  - `canchaIds = []` (IDs de canchas seleccionadas por el usuario)
  - `onCambiarFechaFase` (`(ronda, iso) => void`)
  - `onElegirHoraFase` (`(ronda, hora) => void`)
  - `esLibreFase` (`(ronda, hora) => boolean`)
  - `contarLibresFase` (`(ronda) => ((iso) => number) | undefined`)

- Comportamiento y estructura visual:
  - Contenedor `<div className="calendario-torneo" role="region" aria-label="Programación por fases del torneo">`.
  - Si `canchaIds.length === 0`, muestra un aviso claro (`<p className="formulario-reserva__nota">Elige primero las canchas del torneo para habilitar los horarios de cada fase.</p>`).
  - Por cada `fase` en `fases`:
    - Obtiene `jornada = jornadas[fase.ronda] || { fecha: dias[0], horas: [] }`.
    - Obtiene `val = validacionesJornadas.find((v) => v.ronda === fase.ronda)`.
    - Resuelve los nombres de las canchas efectivas de esa fase (`fase.canchaIds`) usando `tituloCancha` de `src/lib/canchas.js`.
    - Renderiza `<section key={fase.ronda} className="calendario-torneo__fase" data-ronda={fase.ronda} aria-label={"Fase " + fase.ronda + ": " + fase.nombreRonda}>`:
      - **Cabecera (`.calendario-torneo__cabecera`):**
        - Título: `<h4 className="calendario-torneo__titulo">Fase {fase.ronda}: {fase.nombreRonda}</h4>`
        - Badges / metadatos (`.calendario-torneo__badges`):
          - `${fase.partidos} ${fase.partidos === 1 ? 'partido' : 'partidos'}`
          - `${fase.canchasEfectivas} ${fase.canchasEfectivas === 1 ? 'cancha efectiva' : 'canchas efectivas'}` (y si hay nombres resueltos, mostrar cuáles se usan, ej. `(${nombresEfectivas.join(', ')})`)
          - `Requiere ~${fase.minutosRequeridos} min (mín. ${fase.horasMinimas} h)`
      - **Selector de día de la fase:**
        - Etiqueta `<span className="calendario-torneo__etiqueta">Día de {fase.nombreRonda}</span>`
        - `<SelectorDia dias={dias} valor={jornada.fecha} onChange={(iso) => onCambiarFechaFase(fase.ronda, iso)} contarLibres={contarLibresFase ? contarLibresFase(fase.ronda) : undefined} />`
      - **Selector de horario de la fase:**
        - Etiqueta `<span className="calendario-torneo__etiqueta">Horario de {fase.nombreRonda}</span>`
        - Grilla `.formulario-reserva__horas` con un botón por cada `hora` en `horasBase`:
          - `libre = esLibreFase ? esLibreFase(fase.ronda, hora) : false`
          - `sel = Array.isArray(jornada.horas) && jornada.horas.includes(hora)`
          - Mismas clases que el selector de horas (`button small formulario-reserva__hora` + `--ocupado` / `--sel` / `hollow`).
          - `aria-label={`${fase.nombreRonda} ${hora}`}` o contenido `${hora}` (para que sea accesible y fácil de distinguir por fase, puedes mantener el texto visible `${hora}` como en el resto de la app y `data-hora={hora}`).
      - **Estado / Alertas de la fase:**
        - Si `jornada.horas.length > 0` y `val && !val.ordenValido`, muestra `<div className="callout alert calendario-torneo__alerta-orden" role="alert">{val.error}</div>`.
        - Si `jornada.horas.length > 0` y `val && val.ordenValido && !val.alcanza`, muestra `<AlertaTiempo equipos={fase.partidos * 2} canchasCount={fase.canchasEfectivas} minutosRequeridos={fase.minutosRequeridos} disponibles={val.disponibles} deficit={val.deficit} sugerencias={sugerenciasPorFase[fase.ronda] || []} />`.

### 2. `src/components/reservas/torneo/Bracket.jsx`

- Importa `fechaCorta` de `../../../lib/fechas` y `Calendar` de `lucide-react`.
- En `gruposRondas`, guarda también `fecha: lista[0]?.fecha || null`.
- En el encabezado de cada columna (`.bracket-torneo__ronda-titulo`), si `grupo.fecha` existe, muestra debajo o junto al nombre de la ronda una etiqueta `.bracket-torneo__ronda-fecha` con el ícono `<Calendar size={12} aria-hidden="true" />` y `fechaCorta(grupo.fecha)` (manteniendo el `<h4>` con el texto `grupo.nombreRonda` limpio o en su propio contenedor para que `getByRole('heading', { name: /^Semifinal$/i })` siga funcionando sin romperse).

### 3. `src/components/reservas/torneo/Bracket.css`

- Añade los estilos para `.calendario-torneo`, `.calendario-torneo__fase`,
  `.calendario-torneo__cabecera`, `.calendario-torneo__titulo`,
  `.calendario-torneo__badges`, `.calendario-torneo__badge`,
  `.calendario-torneo__etiqueta`, `.calendario-torneo__alerta-orden` y
  `.bracket-torneo__ronda-fecha`, respetando los tokens `--accent` y
  `--accent-soft` del deporte activo y el diseño limpio del resto de
  componentes de torneo.

## Verificación al terminar

- Ejecuta `npm run lint` y verifica que no haya errores ni warnings en
  `CalendarioTorneo.jsx`, `Bracket.jsx` ni en el resto del proyecto.
- **Bitácora del bloque:** Al terminar, agrega una sección `### Bloque t2-calendario-y-bracket` al final de `planificacion/etapas/5-torneo-multidia/REPORTE.md` (está permitido editar este archivo además de los de tu bloque) detallando qué componentes y estilos creaste o modificaste y el resultado del linter.
