[MODO EJECUTOR]

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
# Tarea v2: sondas adversariales de las correcciones de #80 (H2, H6 y n2)

[MODO EJECUTOR] Esta tarea es de **pruebas**: escribes pruebas de sondeo en
una carpeta temporal y las corres contra dos versiones del código. **No
corriges el código de producción**, aunque una sonda falle: el fallo es el
resultado que buscamos.

## Qué cambió (para que sepas qué atacar)

La PR #80 (`origin/refactor/sincronizacion-64`) pasó de `d57e955` a `cd3486a`:

- **H2:** `aplicarHorasDeReservas(ocupados, reservas)` repone en `ocupados` las
  horas de las reservas guardadas. Antes solo corría en el cambio de día; ahora
  corre en `leerGuardado` (carga inicial) y en `sincronizarConLeido` sobre
  `base` (evento `storage`, `leerEstadoFresco` antes de guardar y cambio de
  día). Archivo: `src/context/ReservasContext.jsx`.
- **H6:** `quitarReservasDeEstado` (`src/lib/cancelacion.js`) descarta
  entradas `null`, no objeto, arreglo o sin `id` al quitar.
- **n2:** en `src/components/reservas/useReserva.js`, el efecto que quita las
  horas de fase que chocan no corre mientras hay confirmación en pantalla
  (`confirmado`). Así, si la reserva de torneo se descarta por choque, "Elegir
  otro horario" quita solo las horas que chocaron y conserva las demás.

## Dónde trabajas

- **Directorio de trabajo:** el directorio actual (worktree de git descartable
  con `node_modules` instalado), en el HEAD separado de la integración que dejó
  la tarea v1 (todas las PR fusionadas). Comprueba con
  `git status --porcelain` que está limpio; si no, `git checkout -- .`.
- **Archivos que creas en el worktree (solo esos):**
  `src/verificacion/sondas-e20.test.jsx`, `src/verificacion/sondas-e22.test.jsx`
  y `src/verificacion/sondas-e24.test.jsx`.
- Para cambiar de versión, en ese worktree y solo ahí:
  `git checkout d57e955 -- src/context/ReservasContext.jsx src/lib/cancelacion.js src/components/reservas/useReserva.js`
  y para volver `git checkout HEAD -- <los tres archivos>`. Nada de commits,
  push, `stash`, `reset` ni ramas.
- **Archivos que escribes fuera del worktree**, en la carpeta
  `../../../planificacion/etapas/24-revision-correcciones-74-84/revision/`
  (ruta relativa al worktree): `v2-sondas.md` (informe, escríbelo a medida
  que avanzas) y una copia de `sondas-e24.test.jsx` con el nombre
  `v2-sondas-e24.test.jsx.txt`.
- No ejecutes `npm run dev`, `npm run preview` ni `vercel dev`. Un comando
  pesado a la vez (8 GB de RAM).

## Parte A: sondas anteriores

Copia, sin cambiar lo que comprueban (solo rutas de import si hace falta):

- `planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.test.jsx.txt`
  → `src/verificacion/sondas-e20.test.jsx` (14 sondas);
- `planificacion/etapas/22-revision-prs-74-81/revision/v2-sondas-e22.test.jsx.txt`
  → `src/verificacion/sondas-e22.test.jsx` (10 sondas).

Ambos archivos están en este mismo worktree.

## Parte B: sondas nuevas (`sondas-e24.test.jsx`)

Antes de escribirlas, lee las pruebas que agregó #80 para copiar su forma de
armar los casos: `git diff d57e955 cd3486a -- src/context/ReservasContext.test.jsx src/lib/cancelacion.test.js src/components/canchas/VistaCanchas.test.jsx src/components/reservas/torneo/AsistenteTorneo.test.jsx`.
Ahí y en las sondas de la parte A está cómo simular otra pestaña
(`localStorage` + `new StorageEvent('storage', { key: STORAGE_KEY, newValue })`),
cómo hacer fallar `setItem`, cómo simular el cambio de día y cómo llegar a la
pantalla "Tu reserva no pudo completarse" en cancha y en torneo. Usa la
interfaz pública (`ReservasProvider`, `useReservas`, los componentes y las
funciones exportadas), fechas `dias[3]` o posteriores y canchas y horas reales
de `src/data/canchas.json`. Cada caso lleva su id en el nombre y comprueba
**todos** los valores listados.

1. **P1 reserva guardada sin su hora, por cada camino (H2).** Los datos
   guardados traen `Rb` (`padel-1`, `dias[3]`, `16:00`) en `reservas` pero sin
   `16:00` en `ocupados`. Un caso por camino:
   - P1a carga inicial: `localStorage` preparado antes de montar;
   - P1b evento `storage`;
   - P1c `leerEstadoFresco`: A ya montada, se escribe la clave **sin** evento
     `storage` y A reserva otra hora (lo que obliga a leer antes de guardar);
   - P1d cambio de día.
   En cada uno: `16:00` de `padel-1` en `dias[3]` aparece ocupada y un intento
   de reservarla falla (no queda una segunda reserva en esa celda, ni en
   memoria ni en `localStorage`).
2. **P2 idempotencia.** Datos guardados con `ocupados` ya completos: tras la
   carga y dos eventos `storage` con el mismo JSON, `ocupados` es igual (deep
   equal) al guardado y ninguna celda tiene horas repetidas.
3. **P3 una cancelada no revive.** Primero cancela una reserva de verdad en la
   app y copia lo que queda en `localStorage` (así ves cómo se guarda una
   cancelada: si se borra de `reservas` o queda con un estado). Con ese JSON:
   - P3a carga inicial: la hora de la cancelada sigue libre;
   - P3b evento `storage` con ese JSON: igual;
   - P3c A cancela `R` con `setItem` fallando y luego llega un `storage` cuyo
     JSON **todavía tiene `R` activa**, con o sin su hora en `ocupados`: `R`
     no vuelve y su hora queda libre en A.
4. **P4 evento con varias canchas y días (H2).** Datos guardados con un torneo
   de 2 canchas y 3 bloques en días distintos, **sin** ninguna de sus horas en
   `ocupados`. Tras la carga y tras un `storage`: todas las horas de las 2
   canchas en los 3 bloques ocupadas (comprueba el segundo y el último bloque,
   no solo el primero).
5. **P5 entradas basura en `reservas` (H6).**
   - Pura: `quitarReservasDeEstado` con `reservas` = `[null, 5, [], {}, {id: 'A'}, {id: 'B'}, {id: 'B'}]`
     quitando `B`: no lanza; anota exactamente qué devuelve en `reservas` y en
     `eliminadas` (¿se eliminan las dos `B`?).
   - Proveedor: `localStorage` con esas entradas y cancelar una reserva válida:
     no lanza, la hora queda libre y lo que se guarda no tiene `null`.
6. **P6 torneo descartado (n2).** A arma un torneo de 3 fases (por ejemplo
   Cuartos, Semifinal y Final) con horas en cada una; su guardado falla y otra
   pestaña ocupa **una** hora de una fase, y la confirmación se descarta. Luego
   "Elegir otro horario":
   - P6a choque en la fase intermedia; P6b choque en la **última** fase: solo
     esa hora sale de su fase, el resto de horas de todas las fases se
     conserva, y la hora que chocó queda deshabilitada;
   - P6c la hora conservada de otra fase la ocupa una tercera pestaña
     **mientras** la pantalla de descarte está visible, antes de pulsar
     "Elegir otro horario": después de pulsarlo esa hora no queda
     seleccionada como libre (sale con su aviso o queda deshabilitada);
   - P6d dos descartes seguidos (descartar, elegir otro horario, volver a
     confirmar, volver a descartar): el segundo se comporta igual que el
     primero.
7. **P7 torneo confirmado con éxito.** Sin fallos de `setItem`, A confirma un
   torneo; con la confirmación visible, sale de ella por el camino que tenga
   la interfaz ("Listo", nueva reserva o `reiniciar`) y vuelve a modo torneo:
   no aparece ningún aviso de choque, no quedan horas de fase seleccionadas de
   la reserva anterior y las horas reservadas aparecen ocupadas.
8. **P8 cancha y cumpleaños descartados** (regresión de #78): "Elegir otro
   horario" conserva cancha, fecha y contacto, y quita solo la hora que chocó.

## Corridas

Corre `npx vitest run --maxWorkers=1 src/verificacion/` (siempre con un solo
worker: con más, el equipo se queda sin recursos y la corrida se corta con
`0xC0000142`) con dos versiones de los tres
archivos de producción:

1. **Integración:** `git checkout HEAD -- <los tres archivos>`.
2. **Antes de las correcciones:** `git checkout d57e955 -- <los tres archivos>`.

## Informe (`v2-sondas.md`)

En español, UTF-8:

1. Tabla `sonda | integración | antes (d57e955)` con pasa/falla y la primera
   línea del error de cada fallo. Las 14 + 10 anteriores y las nuevas.
2. Para cada fallo en la integración: qué esperaba la sonda, qué pasó y por qué
   crees que la sonda está bien escrita (revisa antes que no sea un error de la
   prueba; si lo era, corrígela, vuelve a correr y dilo).
3. Lo que viste en P3 sobre cómo se guarda una cancelada (pega el JSON
   relevante, sin datos reales) y lo que devolvió P5 pura.
4. Observaciones (avisos de `act(...)`, errores en consola, pruebas lentas).

Al terminar, borra `src/verificacion/` y deja el worktree limpio
(`git status --porcelain` vacío) en el mismo HEAD.

## Criterios de aceptación

- Las 24 sondas anteriores y las nuevas (P1a a P8) corridas en las dos
  versiones, con resultado.
- Cada fallo en la integración explicado y comprobado que no es error de la
  sonda.
- Copia de las sondas nuevas en `revision/`.
- El worktree queda limpio, en el mismo HEAD y sin `src/verificacion/`.
