# AGENTS.md — Proyecto Reservas de Canchas (Sportify)

Guía para los asistentes de código (Claude Code, agy) al trabajar en este
repositorio. `CLAUDE.md` solo importa este archivo (`@AGENTS.md`): las
instrucciones se editan aquí.

## Contexto del proyecto

Proyecto final de Lenguajes para la Web. Página de un local deportivo donde
se reservan canchas de voley playa, pádel y fútbol, con manejo de torneos,
cumpleaños y eventos especiales.

Restricciones fijas (no negociables):
- Frontend en **React** con **Vite** (lo exige el profesor; hasta el 14-10-2026
  fue Create React App: la migración está en `2af2ec3..c7193d2`).
- Maquetación con **Foundation** (foundation-sites), no Bootstrap ni Tailwind.
- **Sin base de datos**: disponibilidad y reservas con estado de React +
  localStorage, más un JSON semilla. Nada de SQL, Mongo, Firebase ni backend
  persistente.
- Debe incluir un **chatbot**: asistente con Gemini detrás de una función de
  servidor de Vercel (`/api/chat`), acotado al negocio (ver `docs/agentes/chatbot.md`).
- Animaciones con **GSAP** (incluido ScrollTrigger) sobre la estructura de
  Foundation.

## Comandos

```bash
npm install                    # instalar dependencias
npm run dev                    # Vite en http://localhost:5173 (no ejecuta /api; `npm start` es alias)
set -a; . <(tr -d '\r' < .env.local); set +a; vercel dev   # sitio + /api en http://localhost:3000 (ver nota)
npm run build                  # build de producción en /dist
npm run preview                # sirve /dist en http://localhost:4173
npm test                       # Vitest, una sola corrida (`npm run test:watch` para modo watch)
npm run lint                   # ESLint sobre src, api y scripts (0 warnings esperados)
node scripts/probar-chat.mjs [url] [ids...]  # casos de prueba de /api/chat
```

- Configs: `vite.config.mjs` (plugin de React, polling del watcher con
  `CHOKIDAR_USEPOLLING=true` en `.env`, `css.lightningcss.errorRecovery` y la
  config de Vitest) y `eslint.config.mjs` (ESLint 10 plano). Van en `.mjs`
  porque el paquete no es `"type": "module"` (ver "Servidor" en `docs/agentes/chatbot.md`).
- El build avisa "Invalid media query" por un hack de IE de
  `foundation.min.css`; es esperado: `errorRecovery` descarta esa regla.
- Lint: ya no corre dentro de dev ni build. `no-unused-vars` ignora `React`,
  los argumentos y los errores de `catch`, como hacía CRA. React Hooks solo con
  `rules-of-hooks` y `exhaustive-deps` (el preset v7 trae reglas del React
  Compiler: no activarlo sin revisar el código). `eslint-plugin-react` no
  acepta ESLint 10.
- Ids de `probar-chat.mjs`: `disponibilidad`, `reservalo`, `reservalo-varias`,
  `datos-validos`, `nombre-invalido`, `telefono-invalido`, `hora-ocupada`,
  `ubicacion`, `parqueadero`, `fuera-de-tema`, `torneo-proceso`,
  `cancelar-codigo`.
- Tests: Vitest (jsdom, `globals: true`) + Testing Library. Los de lógica pura
  viven junto a su módulo en `src/lib/*.test.js` (precios, validación, fechas,
  horarios, código de reserva, datos del negocio, chat, cancelación, torneos,
  pasos del torneo en `pasosTorneo.test.js`, rutas, canchas y respaldo de
  modelo). De interfaz: `src/components/reservas/Torneo.test.jsx` (torneo y
  cumpleaños), `src/components/reservas/FormularioReserva.test.jsx` (prop
  `seccion`), los del asistente en `src/components/reservas/torneo/`
  (`AsistenteTorneo.test.jsx` y `useAsistenteTorneo.test.jsx`),
  `src/components/layout/MisReservas.test.jsx` y
  `src/components/chatbot/Chatbot.test.jsx` (widget: portal, Escape,
  comprobante, nueva conversación). `api/_lib/funciones.test.js` cubre las
  funciones del chat, `api/_lib/chat.test.js` cubre el handler de `/api/chat`
  (respaldo de modelos, 400/405/429/500/502/504) y `src/App.test.jsx` es un
  smoke test. `src/setupTests.js` carga
  `@testing-library/jest-dom/vitest` y simula `matchMedia`,
  `IntersectionObserver`, `ResizeObserver`, `HTMLMediaElement` y
  `window.scrollTo`. Relojes falsos con `vi` (`import { vi } from 'vitest'`).
- Vite solo acepta JSX en `.jsx`: un archivo nuevo con JSX va en `.jsx`.
  `src/lib/*.js` y `src/data/deportes.js` se quedan en `.js` sin JSX porque los
  importa `api/`. Las rutas de `public/` se arman con
  `import.meta.env.BASE_URL` (ya termina en `/`).
- El equipo tiene poca RAM: no correr `npm run dev`, `vercel dev` ni
  `npm run preview` a la vez (`vercel dev` levanta su propio servidor de Vite).
- `.env` y `.env.local` NO se versionan (están en `.gitignore`); la plantilla
  es `.env.example` (las reglas de `VITE_*` y la key están en "Reglas que
  no se pueden romper").

## Antes de tocar X, lee

| Documento | Qué partes del código cubre |
|---|---|
| `docs/agentes/reservas.md` | `ReservasContext.jsx`, `canchas.json` y los módulos compartidos de `src/lib/` (`precios.js`, `horarios.js`, `codigoReserva.js`, `validacion.js`, `fechas.js`, `canchas.js`, `cancelacion.js`, `negocio.js`) |
| `docs/agentes/torneo.md` | Torneos por fases, `src/lib/torneo.js`, `src/lib/pasosTorneo.js`, `src/components/reservas/torneo/` y el asistente móvil |
| `docs/agentes/pagina-reserva.md` | `App.jsx`, `PaginaInicio.jsx`, `VistaCanchas`, `VistaCanchasContext`, `DeporteHero`, `EventoCTA`, `Ubicacion`, `MisReservas`, `negocio.json`, `deportes.js`, `rutas.js` y `App.css` |
| `docs/agentes/chatbot.md` | `api/chat.js`, `api/_lib/`, `src/components/chatbot/`, `src/lib/chat.js`, `src/lib/modelosChat.js` y `scripts/probar-chat.mjs` |
| `docs/agentes/despliegue.md` | `vercel.json`, `.vercelignore`, variables de entorno en Vercel y pruebas sobre producción o preview |
| `docs/agentes/capturas.md` | `README.md`, `docs/capturas/` y `planificacion/herramientas/capturas/capturas.mjs` |

## Mapa de arquitectura

- `src/context/ReservasContext.jsx`: única fuente de verdad del estado en el navegador (`Context` + `useReducer`, espejado en `localStorage`); reconcilia con la semilla y valida cada reserva y cancelación antes y dentro del reducer.
- `src/data/canchas.json`: única semilla de `horas` base, `ocupadosSemilla` y catálogo por cancha (`precioHora`, `imagen`, `descripcion`, `caracteristicas`).
- `src/data/negocio.json`: única fuente de los datos del local (contacto, mapa, demanda, pagos y abono, cancelación, servicios y `eventos`).
- `src/data/deportes.js`: única fuente de verdad visual por deporte (`DEPORTES`, `colorAcento`).
- `src/lib/precios.js`: única fuente de las reglas de precio (`MAX_HORAS_SEGUIDAS`, `MIN_HORAS_BENEFICIO`, `DESCUENTO_POR_HORA`, `calcularPrecio`, `calcularPrecioEvento`, `calcularPrecioJornadas`, `finDeFranja`, `formatoPrecio`).
- `src/lib/torneo.js` y `src/lib/pasosTorneo.js`: única fuente de las reglas de torneos por fases (`OPCIONES_EQUIPOS`, `OPCIONES_DURACION`, `maxCanchasTorneo`, `DESEMPATES`, cruces y programación) y del estado de los pasos (`PASOS_TORNEO`, `estadoPasosTorneo`, `pasosAlcanzables`).
- `src/lib/horarios.js`, `src/lib/codigoReserva.js` y `src/lib/fechas.js`: selección de horas (`alternarHoraIndividual`, `seleccionarRango`), códigos y texto QR (`generarCodigo`, `textoQr`), y fechas/horas pasadas (`fechaCompleta`, `esHoraPasada`, `horaAmPm`).
- `src/lib/validacion.js`: única fuente de validación de nombre, teléfono y propuestas de reserva del chat (JS puro compartido entre formulario, widget y `/api/chat`).
- `src/lib/cancelacion.js`: lógica pura de plazo de cancelación, estado tras cancelar y búsqueda de reservas (`MisReservas` y chat).
- `src/lib/canchas.js`, `src/lib/negocio.js` y `src/lib/rutas.js`: agrupación por deporte y `estiloAcento`, formato de teléfono y horario (`textoHorario`), y rutas sin router (`/` y `/reservar/<slug>`).
- `src/lib/chat.js` y `src/lib/modelosChat.js`: contexto, historial, `detectarSiNo` y `MENSAJES_CHAT` del widget, más la lógica pura de respaldo de modelos de `/api/chat`.
- `App.jsx` y `VistaCanchas`: dos páginas sin router (`PaginaInicio` o `VistaCanchas` con `useReserva`) envueltas por `ReservasProvider` y `VistaCanchasProvider`, más `Chatbot` en portal único.
- `src/components/chatbot/` y `api/chat.js`: widget conversacional y Vercel Function sin estado con Gemini (function calling en modo `ANY` y helpers en `api/_lib/`).

## Reglas que no se pueden romper

- Nunca acceder a `localStorage` fuera de `src/context/ReservasContext.jsx`.
- `package.json` **no** lleva `"type": "module"` aunque el proyecto use Vite: los JSON se importan sin atributos y la función dejaría de compilar a CommonJS (las configs ESM van en `.mjs`).
- `vercel.json` agrega `dist/node/index.cjs` de `@google/genai` con `functions["api/chat.js"].includeFiles` (si se agrega otra dependencia con exports dobles, revisar lo mismo con `vercel build`). `.vercelignore` es lista blanca: `/api`, `/vercel.json`, `/index.html` y `/vite.config.mjs` tienen que estar permitidos.
- El handler de `api/chat.js` es `export default { fetch }` (forma estándar de Vercel): no cambiarla.
- Las variables `VITE_*` quedan incrustadas en el bundle del cliente: nunca poner ahí una API key. `GEMINI_API_KEY` y `GEMINI_MODEL` solo las lee `/api/chat`. **Nunca imprimir el valor de la key ni de ningún secreto** (ni en código, logs o reportes): de la key solo se dice si existe, si está vacía y cuántos caracteres tiene.
- El bracket tiene ancho fijo (616-646 px): bajo `large`, `contain: inline-size` en `.bracket-torneo__movil` y `.bracket-torneo__canvas-scroll` evita que ensanche la página y lo deja desplazarse dentro de su caja. No quitarlo.
- **IDs de anclaje** de `PaginaInicio.jsx` (`#hero-placeholder`, `#eventos`, `#ubicacion`): no renombrar sin actualizar a quien los usa.
- No redefinir `formatoPrecio` en otros archivos. No hardcodear colores de deporte fuera de `src/data/deportes.js`; `estiloAcento(acento)` es la única función que arma el estilo en línea. Tokens globales de `z-index` en `src/App.css` (`--z-skip-link` 1200, `--z-chatbot` 1100, `--z-barra-asistente` 900): nada de z-index sueltos.
- Gemini nunca escribe reservas. Regla: el modelo propone, el usuario confirma y el código valida y ejecuta. Nada se escribe sin esa confirmación.
- Todo modelo de la cadena de `/api/chat` debe aceptar `thinkingLevel: MINIMAL`; si no, el chat responde 400 (ver "Respaldo de modelo" en `docs/agentes/chatbot.md`).
- **Cada push a `main` despliega a producción.**
- No quemar la cuota gratuita de Gemini con diagnósticos (ver "Cuotas" en `docs/agentes/chatbot.md`); leer el detalle del 429 (`quotaId`, `quotaValue`) antes de cambiar de modelo.

## Cómo trabajamos

- El proyecto avanza **por bloques independientes**. No mezcles trabajo de un
  bloque futuro dentro del actual ni modifiques bloques cerrados salvo que se
  pida.
- Bloques:
  1. ✅ Estructura base con Foundation
  2. ✅ Hero + animaciones GSAP/ScrollTrigger
  3. ✅ Catálogo de canchas (`VistaCanchas` con `DepthCarousel`)
  4. ✅ Sistema de reservas (1 a 3 horas seguidas, descuento, validación)
  5. ✅ Modo evento especial (torneos por fases multi-día con llaves, cumpleaños)
  6. ✅ Chatbot (ver `docs/agentes/chatbot.md` y la etapa 1 de `planificacion/`)
  7. Panel de estado/admin: descartado el 06-11-2026 (decisión de Juan), no se
     hace. En el README esa fila quedó como "Mis reservas" y la auditoría de
     usabilidad. Lo pendiente está en `planificacion/etapas/8-cierre-sustentacion/`.
- Al terminar un bloque, deja el código funcionando y documentado.

## Configuración de repositorio (obligatorio siempre)

- `AGENTS.md` (estas instrucciones) y `CLAUDE.md` (una sola línea,
  `@AGENTS.md`) se versionan desde el 07-11-2026 (decisión de Juan) para que
  todo el equipo use las mismas reglas. Los cambios se hacen en `AGENTS.md`;
  no duplicar contenido en `CLAUDE.md` ni en `GEMINI.md`.
- Si un cambio modifica algo descrito en `docs/agentes/`, ese archivo se
  actualiza en el mismo PR.
- El `.gitignore` excluye la config local de los asistentes (`.claude/`,
  `GEMINI.md`, `.mcp.json`, `.claude.json`, `.agents/`), además de `.env` y
  los videos fuente. `.vercelignore` es lista blanca, así que estos archivos
  no llegan al despliegue.
- `.engram/` **sí se versiona, a propósito** (decisión de Juan, 07-11-2026):
  son las memorias del proyecto exportadas con `engram sync` para que todo el
  equipo tenga el mismo contexto. No es un descuido ni código muerto: no
  quitarla ni agregarla al `.gitignore`. Tampoco llega al despliegue.
- **Ningún commit debe mencionar IA, Claude ni Anthropic**, ni incluir
  coautoría de ellos.
- Commits en español con prefijo (`feat:`, `fix:`, `chore:`, `docs:`,
  `test:`), un tema por commit.
- El repositorio debe tener **Topics de GitHub** relevantes (`react`,
  `foundation-framework`, `gsap`, `javascript`, `reservas-deportivas`,
  `proyecto-universitario`, `chatbot`, `gemini-api`, `vercel-functions`).
  La descripción y el sitio web del repo apuntan a la demo de producción.

## Estilo de código

- Componentes funcionales con Hooks, un componente por archivo, agrupados por
  dominio en `src/components/` (`layout/`, `hero/`, `canchas/`, `reservas/`,
  `eventos/`, `ubicacion/`, `shared/`, `reactbits/`, `chatbot/`).
- Datos semilla en `src/data/*.json`.
- Props y estados en español, de forma consistente.

## Estándar de calidad UI

Aplica a todos los bloques:

- **Nada de detalles de implementación en el texto visible**: prohibido
  mencionar `localStorage`, "se guarda en tu navegador", JSON, estado de
  React, nombres de componentes, etc.
- **Tuteo** ("Elige", "Reserva", "Vive"); nada de voseo ("Elegí", "Podés").
- **Color de acento por deporte** siempre desde `src/data/deportes.js`.
- **Cards con altura pareja y filas centradas**: `flex` column con el CTA al
  fondo (`margin-top: auto`); filas incompletas con `grid-x align-center`.
- **Disponibilidad explícita**: todo indicador visual (colores, puntos) va con
  texto claro ("6 de 13 horarios disponibles") y leyenda.
- Animaciones GSAP siempre dentro de `gsap.context()` o `gsap.matchMedia(scope)`,
  con `ctx.revert()` / `mm.revert()` en el cleanup.
