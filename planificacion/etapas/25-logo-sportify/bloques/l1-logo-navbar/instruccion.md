[MODO EJECUTOR]

## Retoma (intento 2)

El primer intento escaló por un falso positivo: `npm test` reescribe
`api/_lib/__snapshots__/instrucciones.test.js.snap` con el mismo contenido y
`git status` lo marca como modificado. Ahora el ciclo lo ignora; no lo toques.

Tu trabajo del primer intento **ya está en el árbol** (`LogoSportify.jsx`,
`Navbar.jsx`, `Navbar.css`, `Navbar.test.jsx`, `index.html`,
`public/manifest.json` y `docs/agentes/pagina-reserva.md`). No lo rehagas desde
cero: revísalo contra la tarea y los criterios, corre las pruebas y el script
de medición, y corrige o completa solo lo que falte. Si todo cumple, no cambies
nada y dilo en el resumen.

---

# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `AGENTS.md` (raíz, versionado): léela
  antes de empezar y respétala. La parte del plan que te toca va copiada en tu
  tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

---

# Tarea l1: el logo de Sportify en el navbar y como ícono de la página

## Objetivo

Reemplazar la marca del navbar (trofeo de lucide + texto "Sportify") por el
logo nuevo en SVG (la "S" naranja y verde + la palabra "SPORTIFY"), que se vea
bien en los tres estados del navbar, y declarar el favicon SVG en `index.html`.

## Qué hay hoy (rama `feat/logo-sportify`, desde `main`)

- Ya están hechos y versionados (commit `8de4c0f`), **no los edites**:
  - `src/data/logoSportify.js`: exporta `COLORES_LOGO` (`naranja: '#f16c13'`,
    `verde: '#2f995c'`) y `LOGO_SPORTIFY` con `viewBox: '0 0 8623 2129'` y tres
    trazos (`naranja`, `verde`, `palabra`) en ese mismo `viewBox`. Todos van
    con `fill-rule="evenodd"`. Es un archivo generado.
  - `public/favicon.svg` (la "S" sobre un cuadrado oscuro), `public/favicon.ico`
    (16, 32, 48 y 64 px), `public/logo192.png` y `public/logo512.png`.
- `src/components/layout/Navbar.jsx` (líneas 122-133): el enlace
  `a.site-header__brand` lleva `span.site-header__brand-icon` con
  `<Trophy size={22} />` y `span.site-header__brand-text` con "Sportify".
- `src/components/layout/Navbar.css`: el color de la marca cambia por estado
  con reglas de `.site-header__brand-text` y `.site-header__brand-icon`:
  - transparente (sobre el video, `site-header--transparent`): texto `#ffffff`
    con `text-shadow`, ícono con `filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7))`;
  - claro (`site-header--scrolled`): texto `#0f172a`;
  - reserva (`.site-header.site-header--reserva`): texto `#f2f2f2`. Ojo: el
    header de reserva lleva **también** `site-header--scrolled`, así que sus
    reglas tienen que ganar por especificidad (como hoy, con
    `.site-header.site-header--reserva`).
  - Bajo 640 px (`@media (max-width: 640px)`) el texto baja a 1.1rem y, en
    reserva, a 1.05rem con `padding: 0.15rem 0` en el enlace.
- `index.html` solo declara `<link rel="icon" href="/favicon.ico" />`.
- `public/manifest.json` declara para `favicon.ico` los tamaños
  `64x64 32x32 24x24 16x16` (el archivo nuevo trae 64, 48, 32 y 16).

## Qué hacer

1. Crear `src/components/shared/LogoSportify.jsx`: un componente funcional que
   dibuja un solo `<svg>` con `className` `logo-sportify` (más el `className`
   que reciba por prop), `viewBox={LOGO_SPORTIFY.viewBox}`,
   `aria-hidden="true"`, `focusable="false"` y tres `<path>` con
   `fillRule="evenodd"`: naranja con `COLORES_LOGO.naranja`, verde con
   `COLORES_LOGO.verde` y la palabra con `fill="currentColor"`. Sin JSX en
   archivos `.js`: el componente va en `.jsx`.
2. En `Navbar.jsx`, dentro de `a.site-header__brand`, cambiar el ícono y el
   texto por `<LogoSportify className="site-header__logo" />` y un
   `<span className="show-for-sr">Sportify</span>` (clase de Foundation), para
   que el nombre accesible del enlace siga siendo "Sportify". Quitar `Trophy`
   del import de lucide (sigue `Ticket`). No cambies el `href`, el `onClick` ni
   nada más del navbar.
3. En `Navbar.css`:
   - Tamaño: `.site-header__logo { display: block; height: 2.25rem; width: auto; }`
     (36 px; el ancho sale de la proporción del `viewBox`). Bajo 640 px,
     32 px y `padding: 0.15rem 0` en el enlace; en la variante reserva bajo
     640 px, 28 px. Son puntos de partida: el criterio es que el navbar no
     crezca más de 4 px frente a hoy y que el logo quede entre 28 y 44 px. Si
     el navbar crece, baja el `padding` vertical del enlace antes que el logo.
   - Color de la palabra con `color` en `.site-header__logo` por estado:
     `#ffffff` + el mismo `drop-shadow` del ícono en transparente, `#0f172a` en
     claro y `#f2f2f2` en reserva (con `.site-header.site-header--reserva`
     para ganarle al claro). Son los mismos colores de hoy: no agregues otros.
   - Borrar las reglas de `.site-header__brand-icon` y `.site-header__brand-text`
     que queden sin uso (comprueba con `grep` que nada más las use), y las
     propiedades de texto del enlace que ya no apliquen solo si no afectan a
     otra cosa.
4. En `index.html`, en lugar del link actual:
   ```html
   <link rel="icon" href="/favicon.ico" sizes="32x32" />
   <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
   ```
   Deja igual el `apple-touch-icon` y el `manifest`.
5. En `public/manifest.json`, los tamaños de `favicon.ico` pasan a
   `64x64 48x48 32x32 16x16`. Nada más del manifest cambia.
6. En `src/components/layout/Navbar.test.jsx`, agregar una prueba (dentro del
   `describe` existente o en uno nuevo del mismo archivo) que renderice el
   `Navbar` como las demás y compruebe: el enlace con nombre "Sportify"; dentro,
   `svg.logo-sportify` con `aria-hidden="true"` y tres `path`; el de la palabra
   con `fill="currentColor"`; los otros dos con `#f16c13` y `#2f995c`; y que no
   hay `.lucide-trophy`. No crees archivos de prueba nuevos.
7. En `docs/agentes/pagina-reserva.md`, agregar una viñeta corta sobre el logo
   (componente `LogoSportify` en `shared/`, trazos en `src/data/logoSportify.js`
   generado con `planificacion/herramientas/logo/`, no editar a mano; la
   palabra con `currentColor` y su color por estado del navbar; favicon SVG con
   respaldo `.ico` en `index.html`). Ubícala junto a lo que ya dice del navbar.

## Archivos permitidos

- `src/components/shared/LogoSportify.jsx` (nuevo)
- `src/components/layout/Navbar.jsx`
- `src/components/layout/Navbar.css`
- `src/components/layout/Navbar.test.jsx`
- `index.html`
- `public/manifest.json`
- `docs/agentes/pagina-reserva.md`

## Cómo probar

```bash
npm test && npm run lint && npm run build
node "planificacion/etapas/25-logo-sportify/revision/medir-logo-navbar.mjs" --preview . --base "planificacion/etapas/25-logo-sportify/revision/antes.json"
```

El script levanta `vite preview` en el puerto 4174 sobre `dist/`, mide con
Chrome headless y cierra todo al terminar (no dejes servidores abiertos). Con
`--capturas <carpeta>` guarda el navbar de cada ancho y escena en PNG: úsala en
una carpeta temporal fuera del repositorio para revisar cómo se ve.
`planificacion/etapas/25-logo-sportify/revision/antes.txt` tiene la salida de
la línea base (antes del cambio).

## Criterios de aceptación (los prueba un verificador independiente)

- C1: Con un build nuevo (`npm run build`), `node "planificacion/etapas/25-logo-sportify/revision/medir-logo-navbar.mjs" --preview . --base "planificacion/etapas/25-logo-sportify/revision/antes.json"` termina con código 0 y "RESULTADO: logo y favicon correctos" en los 14 anchos por defecto (320 a 1440 px) y las tres escenas (tope, bajado y reserva).
  Cómo comprobarlo: correr el comando y leer la salida completa, no solo la última línea.
- C2: El mismo script termina con código 0 con `--anchos 340,400,450,700,900,1100,1366` (sin `--base`, porque la línea base no tiene esos anchos). Prueba también otros anchos tuyos entre 320 y 1920 px e informa el resultado.
- C3: En cada ancho y escena, el logo (`svg.logo-sportify` dentro de `a.site-header__brand`) mide entre 28 y 44 px de alto, conserva la proporción 8623/2129 (±0,03), queda dentro del ancho de la ventana y no pisa ningún enlace del menú; la página no desborda en horizontal.
  Cómo comprobarlo: columnas `logo=`, `prop=`, `x=` y `desborde=` de la salida del script.
- C4: El navbar no crece más de 4 px de alto frente a la línea base en ningún ancho ni escena (`antes.json`, medido en `main` antes del cambio).
  Cómo comprobarlo: columna `altoHeader=... (antes ...)` de la salida con `--base`.
- C5: La "S" se pinta con `#f16c13` y `#2f995c` en los tres estados; la palabra "SPORTIFY" toma el color del estado: blanco `#ffffff` sobre el video (tope), `#0f172a` con el navbar claro (bajado) y `#f2f2f2` en la página de reserva. Sobre el video el logo lleva `drop-shadow`.
  Cómo comprobarlo: columna `fills=` de la salida; el script falla si un color no es el esperado o si falta el `drop-shadow` en tope.
- C6: El enlace de la marca tiene nombre accesible exactamente "Sportify", el SVG lleva `aria-hidden="true"` y `focusable="false"`, y el trofeo (`Trophy` de lucide) ya no está en el navbar ni en sus importaciones. Con Tab, el enlace sigue recibiendo foco con contorno visible, y al activarlo hace lo mismo que antes (sube al inicio).
  Cómo comprobarlo: el script (nombre y `aria-hidden`); prueba de Testing Library con `getByRole('link', { name: 'Sportify' })`; revisión del diff de `Navbar.jsx`; foco con teclado en el build (headless o captura).
- C7: `index.html` declara `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` y conserva `/favicon.ico` como respaldo con `sizes="32x32"`; `public/manifest.json` declara para `favicon.ico` los tamaños reales del archivo (`64x64 48x48 32x32 16x16`). `/favicon.svg`, `/favicon.ico`, `/logo192.png` y `/logo512.png` responden 200 con su tipo en el build.
  Cómo comprobarlo: línea `favicon` de la salida del script y lectura del diff.
- C8: `Navbar.test.jsx` tiene al menos una prueba nueva que falla si se quita el logo o se vuelve al trofeo: comprueba el enlace "Sportify", que dentro está `svg.logo-sportify` con `aria-hidden="true"`, tres trazos, el de la palabra con `fill="currentColor"` y los de la "S" con los dos colores, y que no hay `.lucide-trophy`. Cada prueba ejercita lo que dice su título.
  Cómo comprobarlo: leer la prueba; quitar el logo a mano en una copia y ver que la prueba falla (y restaurar).
- C9: No queda CSS muerto del trofeo ni del texto de la marca (`.site-header__brand-icon`, `.site-header__brand-text`) si ya nada los usa; no hay colores ni `z-index` nuevos sueltos fuera de lo que pide la tarea, y los selectores del estado reserva le ganan al estado claro (el header de reserva lleva también `site-header--scrolled`).
  Cómo comprobarlo: `grep` de las clases en `src/` y lectura del diff de `Navbar.css`.
- C10: `src/data/logoSportify.js` y los archivos de `public/` no cambian (son generados); solo cambian los archivos permitidos.
  Cómo comprobarlo: `git status` y `git diff --stat`.
- C11: `docs/agentes/pagina-reserva.md` describe el logo del navbar en una viñeta corta: componente, de dónde salen los trazos (archivo generado, no editar a mano), los colores de la palabra por estado y los íconos de `index.html`.
- C12: `npm test`, `npm run lint` (0 avisos) y `npm run build` pasan.
