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

# Tarea: bloqueo cronológico preventivo de días y horas entre fases (`b1-bloqueo-cronologico-fases`)

## Objetivo

Impedir de forma preventiva que el usuario elija un día o una hora anterior a una fase previa cuando programa las jornadas de un torneo multi-día (*Octavos de final*, *Cuartos de final*, *Semifinal*, *Final*). En lugar de permitir el clic y mostrar un `callout alert` a posteriori, los días anteriores (y el mismo día si la fase previa agota el horario disponible) deben aparecer marcados como `"bloqueado"` y `disabled` en `SelectorDia`, las fases siguientes deben avanzar en cascada cuando una fase anterior adelanta su fecha/horario, y las horas previas en el mismo día deben quedar deshabilitadas en `esLibreFase`.

## Rutas

- Modificar:
  - `src/components/shared/SelectorDia.jsx`
  - `src/components/shared/SelectorDia.css`
  - `src/components/reservas/useReserva.js`
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`
  - `src/components/reservas/FormularioReserva.jsx`
  - `src/components/reservas/Torneo.test.jsx`
- Leer (sin modificar):
  - `src/lib/torneo.js`
  - `src/lib/horarios.js`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/components/shared/SelectorDia.jsx` y `src/components/shared/SelectorDia.css`

- En `SelectorDia.jsx`:
  - Añade la prop opcional `esDiaBloqueado` (`(iso: string) => boolean`).
  - Por cada `iso` en `dias`, calcula `const bloqueado = esDiaBloqueado ? Boolean(esDiaBloqueado(iso)) : false;`.
  - Pasa `disabled={bloqueado}` al `<button>`, añade la clase `' selector-dia__opcion--bloqueado'` cuando `bloqueado` sea `true`, y protege `onClick={() => !bloqueado && onChange(iso)}`.
  - En el indicador inferior `.selector-dia__libres`, muéstralo cuando `(bloqueado || libres != null)` con el texto:
    `{bloqueado ? 'bloqueado' : lleno ? 'completo' : `${libres} libres`}`.
- En `SelectorDia.css`:
  - Añade los estilos para `.selector-dia__opcion--bloqueado` y `.selector-dia__opcion:disabled`:
    ```css
    .selector-dia__opcion--bloqueado,
    .selector-dia__opcion:disabled {
      opacity: 0.42;
      cursor: not-allowed;
      background: #f1f5f9;
      border-color: #cbd5e1;
      border-style: dashed;
      color: #64748b;
      transform: none;
      box-shadow: none;
    }

    .selector-dia__opcion--bloqueado:hover,
    .selector-dia__opcion:disabled:hover {
      border-color: #cbd5e1;
      transform: none;
      box-shadow: none;
    }
    ```

### 2. `src/components/reservas/useReserva.js`

- Crea una función auxiliar pura `normalizarJornadasCascada(jornadasActuales, fases, dias, horasBase)`:
  - Recorre las rondas `1..fases.length` en orden llevando `fechaMin = dias[0]` y `horaFinEnFechaMin = null`.
  - Para cada fase `r`:
    - Si `jornadas[r].fecha < fechaMin`, avanza `jornadas[r].fecha = fechaMin` y limpia `jornadas[r].horas = []`.
    - Si `jornadas[r].fecha === fechaMin` y `horaFinEnFechaMin != null`:
      - Comprueba cuántas horas en `horasBase` cumplen `h >= horaFinEnFechaMin`.
      - Si la cantidad de horas restantes en ese día es menor que `fase.horasMinimas`, el mismo día ya no alcanza para la fase `r`: si existe un día siguiente en `dias` (`idxDia + 1 < dias.length`), avanza `jornadas[r].fecha = dias[idxDia + 1]` y limpia `jornadas[r].horas = []`, actualizando `fechaMin = jornadas[r].fecha` y `horaFinEnFechaMin = null`.
      - Si sí caben horas en el mismo día pero `jornadas[r].horas.length > 0` y `jornadas[r].horas[0] < horaFinEnFechaMin`, limpia `jornadas[r].horas = []`.
    - Actualiza `fechaMin = jornadas[r].fecha`.
    - Si `jornadas[r].horas.length > 0`, actualiza `horaFinEnFechaMin = finDeFranja(jornadas[r].horas[jornadas[r].horas.length - 1])`; de lo contrario, si `jornadas[r].fecha > fechaPrev`, `horaFinEnFechaMin = null`.
- En `esLibreFase(ronda, hora)`:
  - Además de validar la disponibilidad en canchas y el solapamiento exacto con otras rondas, verifica que para toda ronda previa `otraRonda < numRonda` que tenga `jOtra.fecha === fechaFase` y `jOtra.horas.length > 0`, se cumpla `hora >= finDeFranja(jOtra.horas[jOtra.horas.length - 1])`. Si `hora < horaFinPrevia`, devuelve `false`.
- Añade `esDiaBloqueadoFase(ronda)`:
  - Para `numRonda <= 1`, devuelve `() => false`.
  - Para `numRonda > 1`, calcula la fecha máxima `fechaMin` entre las rondas previas `1 <= r < numRonda` y verifica si en `fechaMin` alguna ronda previa tiene horas que dejan menos de `faseActual.horasMinimas` horas posteriores en `horasBase`.
  - Devuelve `(iso) => iso < fechaMin || (iso === fechaMin && mismoDiaAgotado)`.
- En `cambiarFechaFase(ronda, iso)` y `elegirHoraFase(ronda, hora)`:
  - Aplica `normalizarJornadasCascada` al actualizar `jornadas` para que las rondas posteriores nunca queden en días u horas inválidas.
- Expón `esDiaBloqueadoFase` en el retorno de `useReserva`.

### 3. `src/components/reservas/torneo/CalendarioTorneo.jsx` y `src/components/reservas/FormularioReserva.jsx`

- En `CalendarioTorneo.jsx`: recibe la prop `esDiaBloqueadoFase` y pásala a `<SelectorDia esDiaBloqueado={esDiaBloqueadoFase ? esDiaBloqueadoFase(fase.ronda) : undefined} />`.
- En `FormularioReserva.jsx`: pasa `esDiaBloqueadoFase={esDiaBloqueadoFase}` a `<CalendarioTorneo />`.

### 4. `src/components/reservas/Torneo.test.jsx`

- Actualiza el test 3 (`3. Validación de orden cronológico entre fases (AC-010, AC-011, FR-011)`) para verificar el nuevo comportamiento preventivo:
  - Cuando *Cuartos de final* elige el tercer día (`dias[2]`), los botones de los días anteriores (`dias[0]` y `dias[1]`) en *Semifinal* y *Final* quedan `disabled` y contienen el texto `"bloqueado"`, y la fecha seleccionada de *Semifinal* y *Final* avanza en cascada a `dias[2]`.
  - Cuando *Cuartos de final* selecciona `14:00` en `dias[2]`, en *Semifinal* (mismo día `dias[2]`) los botones de hora `<= 14:00` (ej. `Semifinal 14:00`) están `disabled`, mientras que `Semifinal 15:00` está habilitado y permite programar la fase sin errores.

## Verificación al terminar

- Ejecuta `npx vitest run src/lib/torneo.test.js src/components/reservas/Torneo.test.jsx` y luego `npx vitest run` completo; verifica que todas las suites pasen.
- Ejecuta `npm run lint` y verifica 0 errores y 0 warnings.
- Ejecuta `npm run build` y verifica que compile sin errores.
