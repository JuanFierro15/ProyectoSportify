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
# Retoma de v3 (intento 2)

El primer intento lo cortó el sistema por falta de memoria antes de escribir
nada (no hay `revision/v3/`). Empiezas de cero, con estas reglas extra para
gastar poca RAM (la PC tiene 8 GB y quedan ~1,1 GB libres):

- Un solo navegador, en modo headless, y **como mucho dos páginas abiertas a
  la vez** (solo R5 y R6 necesitan dos). Cierra cada página al terminar su
  recorrido.
- No abras otro navegador ni otro MCP de navegador en paralelo.
- `npm run build` una vez y `npm run preview` en segundo plano; nada más
  corriendo.
- **Escribe `informe.md` a medida que terminas cada recorrido** (agrega la
  sección del recorrido al terminarlo), para no perder lo hecho si te vuelven a
  cortar.
- Si un recorrido no se puede completar, anótalo con el motivo y sigue con el
  siguiente.
- Al terminar: cierra el navegador y el `preview` y comprueba que nada escucha
  en 4173.

La tarea completa sigue a continuación.

# Tarea v3: recorridos en la app real (integración de las PR #74 a #81)

[MODO EJECUTOR] Esta tarea es de **pruebas en el navegador**: no modificas
ningún archivo del proyecto. Solo levantas el sitio, lo recorres y escribes un
informe con capturas.

## Dónde trabajas

- **Directorio:** el directorio actual (worktree descartable con
  `node_modules`), en un HEAD separado que ya es la integración de todas las PR.
  Comprueba con `git status --porcelain` que está limpio; si no,
  `git checkout -- .`. No hagas commits, push, `stash`, checkouts ni ramas.
- Levanta el sitio **una sola vez**: `npm run build` y después
  `npm run preview` en segundo plano (puerto 4173). No ejecutes `npm run dev`
  ni `vercel dev`. Al terminar, **cierra el `preview`** y el navegador, y
  comprueba que no quede nada escuchando en 4173.
- El sitio en `preview` no tiene `/api/chat`: **no pruebes el chatbot** más
  allá de abrir y cerrar el widget.
- **Navegador:** el MCP `chrome-devtools` con un contexto aislado (o el de
  Playwright sin la extensión de Chrome): navegador sin cookies ni sesión del
  usuario. Dos pestañas = dos páginas del **mismo** contexto, para que
  compartan `localStorage` y se disparen los eventos `storage` reales.
- **Archivos que escribes**, todos en
  `<raíz del repositorio>\planificacion\etapas\22-revision-prs-74-81\revision\v3\`:
  `informe.md` y capturas `R<n>-<descripcion>-<ancho>.png` con el nombre que
  se indica. Cada captura debe ser de la página real en ese momento: nunca
  generes ni edites imágenes. Si una captura no se pudo tomar, dilo en el
  informe; no la inventes.

## Recorridos

En cada uno anota lo que viste, lo esperado y si coincide (sí / no /
parcial). Revisa la consola en cada recorrido y copia todo error o aviso.

1. **R1 primer hero (#71)**, a `1440×900` y `390×844`: carga `/` con
   `scrollY = 0` y, sin tocar nada, mide con `getComputedStyle` la `opacity` y
   `visibility` del `.deporte-hero__bloque` de cada uno de los tres heros
   (esperado: el primero visible con opacity 1; los otros dos ocultos). Baja
   con la rueda hasta el segundo hero y vuelve arriba al primero: su texto
   debe verse de nuevo. Repite la carga con `prefers-reduced-motion: reduce`
   emulado: los tres bloques visibles y sin errores. Capturas
   `R1-hero-inicial-1440.png`, `R1-hero-inicial-390.png`,
   `R1-hero-vuelta-1440.png`.
2. **R2 selector de día (#70)**, en `/reservar/padel` modo Cancha y en el
   asistente del torneo (paso "Fechas por fase", con una fase posterior para
   que aparezca un día "bloqueado"), a `360×780`, `390×844`, `400×844` y
   `1440×900`. En cada ancho, mide para cada pastilla el ancho del texto de
   estado (`.selector-dia__libres`: `scrollWidth`) frente al ancho útil de la
   pastilla, y anota si algún texto ("bloqueado", "11 libres", "completo") se
   corta o **se monta sobre la pastilla vecina** (compara los rectángulos con
   `getBoundingClientRect`). Capturas `R2-selector-<ancho>.png` y
   `R2-asistente-bloqueado-<ancho>.png` (360 y 390).
3. **R3 torneo el mismo día (#69)**, a `1440×900`: crea un torneo de 4 equipos
   con semifinal y final **el mismo día** (dentro de 3 días) hasta la
   confirmación: la fecha debe salir **una sola vez** (sin "X a X"). Luego otro
   con las fases en días distintos: debe salir el rango "X a Y". Busca los dos
   en "Mis reservas". Capturas `R3-mismo-dia-1440.png`,
   `R3-dias-distintos-1440.png`.
4. **R4 reserva normal**, a `1440×900`: reserva 1 hora y otra de 3 horas
   seguidas en pádel (comprueba el descuento); prueba un nombre inválido
   (`A1`) y un teléfono inválido (`123`) antes de corregirlos. Guarda los
   códigos. Captura `R4-confirmacion-1440.png`.
5. **R5 confirmación descartada (#61 y #65)**, a `1440×900` y luego a
   `390×844`: pestañas A y B en `/reservar/padel`, misma cancha y día (dentro
   de 3 días). En A, en la consola, haz fallar el guardado **solo en A**:
   `Storage.prototype.setItem = function () { throw new Error('cuota'); }`.
   Reserva en A una hora libre `H` (sale la confirmación con código y QR). En
   B (que guarda normal), reserva la **misma** `H`: en B queda confirmada. Al
   llegar el evento `storage` a A, comprueba en A:
   - aparece **un solo** aviso de conflicto con `role="alert"` (cuenta los
     elementos `[role="alert"]` y `[aria-live]` dentro de `.avisos-conflicto`);
   - la confirmación cambia a "Tu reserva no pudo completarse", sin código
     grande ni QR, y el foco está en ese título (`document.activeElement`);
   - cerrar el aviso no trae de vuelta el código ni el QR;
   - "Elegir otro horario" vuelve al formulario con nombre y teléfono
     conservados y `H` deshabilitada.
   Repite con un **cumpleaños** en A que incluya `H`. Capturas
   `R5-aviso-1440.png`, `R5-descartada-1440.png`, `R5-elegir-otro-1440.png`,
   `R5-descartada-390.png`.
6. **R6 cancelar entre pestañas**, a `1440×900` (recarga ambas pestañas para
   quitar el parche de `setItem`): en B, cancela desde "Mis reservas" la
   reserva de 1 hora de R4; en A, sin recargar, esa hora debe verse libre.
   Intenta cancelar el torneo de R3: debe decir que los eventos no se cancelan
   ahí. Captura `R6-hora-libre-1440.png`.
7. **R7 torneo en el asistente móvil**, a `390×844`: un torneo completo de 4
   equipos con el asistente hasta la confirmación (pasa por el selector de
   día). Captura `R7-asistente-390.png`.
8. **R8 consola**: resume todos los errores y avisos de consola de R1 a R7
   (sin contar los del parche de `setItem` de R5).

## Informe (`informe.md`)

En español, UTF-8: una sección por recorrido con lo visto, lo esperado, el
resultado, las mediciones (números exactos) y las capturas; al final, una
lista de **hallazgos** (lo que no coincide), con pasos para reproducirlos.

## Criterios de aceptación

- Los 8 recorridos hechos, con sus mediciones y capturas reales.
- Cada "no" o "parcial" con pasos de reproducción.
- `preview` y navegador cerrados, nada escuchando en 4173, y el worktree
  limpio.
