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

---

# Tarea del bloque b10: una sola secuencia de sincronización y sin código muerto (issue #64)

## Objetivo

Después de las PR #57 a #60 quedó lógica repetida y código sin uso en la
sincronización de reservas. Es un **refactor sin cambios de comportamiento**:
toda la suite debe seguir pasando sin editar las aserciones. Lee
`gh issue view 64` y `docs/agentes/reservas.md`.

Este bloque corre después de los arreglos #62 (choque contra las celdas de las
reservas guardadas y base completa en el cambio de día), #63 (lo último
guardado ilegible) y #61 (el aviso trae `codigo`), que ya están en esta rama.
El refactor debe conservar esos comportamientos: sus pruebas son la red.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/lib/cancelacion.js`, `src/context/ReservasContext.test.jsx` (solo para
  pasar `C10` de `conservarReservasSinGuardar` a `conciliarReservasSinGuardar`
  y quitar ese import), `src/lib/cancelacion.test.js` (solo si importa algo
  que se quita) y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Cambios

**Duplicación**

1. La secuencia "pendientes de alta + pendientes de cancelación +
   `conciliarLecturaExterna` + reasignar `idsSinGuardarRef` e
   `idsCanceladosSinGuardarRef` + `registrarConflictos`" está copiada en
   `renovarSiCambioElDia`, el listener `storage` y `leerEstadoFresco`. Extrae
   una sola función dentro del provider (por ejemplo
   `sincronizarConLeido({ raw, datos, base, actual })`) que haga la secuencia
   completa y actualice `ultimoRawStorageRef` en un solo orden, y úsala en los
   tres caminos y en la rama de clave borrada (#60), que hoy reimplementa a
   mano el filtro de `conciliarLecturaExterna`. Cada camino conserva lo que le
   es propio (la base con o sin semilla, `syncDesdeStorageRef`, el
   `despachar` que hace, y en la clave borrada vaciar las cancelaciones
   pendientes).
2. `aplicarCancelacion` (`src/lib/cancelacion.js`) delega en
   `quitarReservasDeEstado` para quitar la reserva y liberar sus horas,
   después de `verificarCancelable`.
3. `quitarIdsPresentes`, `filtrarIdsEnMemoria` y `filtrarCanceladosPresentes`
   son casi la misma función: deja una sola forma (que no mute sus
   argumentos, o que mute de forma explícita y documentada) y úsala donde
   estaban las tres.
4. `idsDeRawStorage` no vuelve a parsear el JSON que ya se parseó en el mismo
   evento: pásale los datos ya parseados.

**Código muerto**

5. Quita `conservarReservasSinGuardar` y pasa `C10` a
   `conciliarReservasSinGuardar(...).guardado` (mismas aserciones).
6. Quita el `export` de `horasUsadasEnCelda` (sigue como función interna de
   `cancelacion.js`).
7. Quita el id de respaldo `` `conflicto-${Date.now()}-${idx}` `` de
   `registrarConflictos`: los conflictos siempre traen `id`. Conserva el
   `codigo` que agregó #61.

Actualiza `docs/agentes/reservas.md` (quita el alias
`conservarReservasSinGuardar` y nombra la función nueva).

## Comandos

- `npm test` (toda la suite)
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b10/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: Sin cambios de comportamiento: `npm test` completo pasa y el diff de los archivos de prueba solo cambia `C10` (de `conservarReservasSinGuardar` a `conciliarReservasSinGuardar(...).guardado`, con las mismas aserciones) y los imports que se quitan. Ninguna otra aserción cambió.
  Cómo comprobarlo: `git diff -- '*.test.*'`.
- C2: La secuencia de sincronización (pendientes de alta y de cancelación, `conciliarLecturaExterna`, reasignar los dos registros, `registrarConflictos` y actualizar `ultimoRawStorageRef`) está en una sola función, y la usan `renovarSiCambioElDia`, el listener `storage`, `leerEstadoFresco` y la rama de clave borrada. Ya no hay copias de esa secuencia.
- C3: La rama de clave borrada no reimplementa el filtro de `conciliarLecturaExterna`; sigue vaciando las cancelaciones pendientes y conservando las altas pendientes sobre la semilla (D1).
- C4: `aplicarCancelacion` llama a `quitarReservasDeEstado` después de `verificarCancelable` y ya no repite el filtro de horas (`!horas.includes(h) || usadas.has(h)`).
- C5: Queda una sola función para filtrar registros de ids (en lugar de `quitarIdsPresentes`, `filtrarIdsEnMemoria` y `filtrarCanceladosPresentes`), y su comentario dice si muta o no.
- C6: En un mismo evento `storage` o cambio de día, el JSON leído se parsea una sola vez (`idsDeRawStorage` recibe datos ya parseados o el parseo se reutiliza).
  Cómo comprobarlo: leer el código; opcional, espiar `JSON.parse` en una prueba propia.
- C7: `conservarReservasSinGuardar` no existe; `horasUsadasEnCelda` no se exporta; `registrarConflictos` no tiene el id de respaldo y sus avisos siguen trayendo `id`, `mensaje` y `codigo`.
- C8: Siguen pasando, sin cambios, las pruebas de #62 (sonda S13 y choque contra celdas guardadas), #63 (lo último guardado ilegible), #61 (confirmación descartada) y #66 (casos de riesgo).
- C9: `docs/agentes/reservas.md` ya no nombra `conservarReservasSinGuardar` y describe la función única de sincronización.
- C10: `npm test` completo y `npm run lint` terminan con código 0 (lint sin avisos).
