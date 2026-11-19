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

# Bloque v1-verificacion (etapa 17 — issues #40, #41 y #42)

Eres el **verificador independiente** de la etapa 17 (solo lectura, `--mode plan`). No escribiste este código: tu trabajo es buscar fallos, casos límite rotos y problemas de calidad en las pruebas.

Lee primero `AGENTS.md`, `docs/agentes/reservas.md`, `planificacion/etapas/17-sincronizacion-pestanas/PLAN.md` y las tareas de los bloques en `planificacion/etapas/17-sincronizacion-pestanas/bloques/r1-contexto-pestanas/tarea.md` y `c1-prueba-chat-choque/tarea.md`.

## Restricciones de solo lectura

- **No modifiques ningún archivo** del repositorio (`src/`, `api/`, `docs/`, `planificacion/`).
- No hagas `git commit`, `git push`, `git checkout` ni cambies de rama.
- Si ejecutas `npm test` (o `vitest`) y eso solo toca `api/_lib/__snapshots__/instrucciones.test.js.snap` por fin de línea, **no** lo edites: anótalo en tu reporte (el coordinador lo restaura).

## Qué revisar

1. **Diff completo** (`git diff`):
   - Revisa `src/context/ReservasContext.jsx`, `src/context/ReservasContext.test.jsx` y `src/components/chatbot/useChatbot.test.jsx`.
   - Comprueba que se resuelven las tres issues sin romper contratos existentes:
     - **#40**: dos llamadas seguidas (`reservar()`, `reservarEvento()`, `cancelar()`) en el mismo render/closure no se pisan entre sí ni pierden datos; si `setItem` falla por cuota mientras `getItem` sigue devolviendo datos viejos, la siguiente reserva no borra de memoria la anterior; las operaciones siguen acumulando bien y `reservar`/`reservarEvento`/`cancelar` mantienen su contrato de retorno (`{ ok: true, codigo }` / `{ ok: false, error }`).
     - **#41**: cuando una pestaña con la ventana de ayer reserva o renueva la ventana (`RENOVAR_VENTANA` por `focus`/`visibilitychange` o en `reducer`), conserva las horas ocupadas de fechas **futuras** posteriores a su ventana (p. ej. el día `+6` reservado por otra pestaña de hoy) y **descarta las fechas pasadas** (`< dias[0]`). Revisa también qué pasa en el caso con y sin evento `storage` previo y en `renovarSiCambioElDia` cuando el foco llega el mismo día vs. otro día.
     - **#42**: cuando otra pestaña tomó una hora en `localStorage` sin evento `storage` y en esta pestaña `reservar` rechaza por choque, `disponibilidad` refleja inmediatamente en el mismo tick esa hora como `disponible: false`, y en `useAccionesReserva.js` + `useChatbot.test.jsx` el mensaje de rechazo del chat no lista la hora tomada como libre y sí lista las demás horas libres.
   - Revisa si hay posibles regresiones con `StorageEvent` simulado, `localStorage` bloqueado, StrictMode, o efectos espejo infinitos entre pestañas.
2. **Calidad de las pruebas (sección 5 de reglas globales)**:
   - Cada prueba nueva en `ReservasContext.test.jsx` y `useChatbot.test.jsx` ejercita exactamente lo que nombra su título.
   - Los rechazos esperados se acotan al mensaje exacto (nada de `toThrow()` o `rejects.toThrow()` genéricos).
   - Nada de `try/catch` sin aserción que falle si no se lanza el error.
   - Los casos límite se prueban con valores exactos (p. ej. fechas límite, horas límite, conteos exactos).
   - Verifica si falta algún caso límite importante (valores límite, segundo y último elemento, repetir la acción, datos corruptos o fallo de almacenamiento).
3. **Verificación de comandos (solo lectura)**:
   - Revisa con `npx vitest run src/context/ReservasContext.test.jsx src/components/chatbot/useChatbot.test.jsx src/components/reservas/Torneo.test.jsx` (o `npm test`) y `npm run lint` (0 warnings).

## Formato de respuesta

Responde únicamente con tu dictamen estructurado:
- Veredicto en la primera línea: `APROBADO` o `CAMBIOS NECESARIOS`
- **Bloqueantes** (con `archivo:línea`, explicación y qué debería hacer/esperar; o "Ninguno")
- **Detalles / mejoras opcionales** (con `archivo:línea`, indicando si son < 20 líneas; o "Ninguno")
- **Revisión de pruebas** (cumplimiento de cada punto de calidad)
- **Comandos ejecutados** con su resultado real exacto.
