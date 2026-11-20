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

# Tarea del bloque b6: la doc ODD de las issues #53 a #56 coincide con lo publicado (issue #67)

## Objetivo

`odd/tasks/issues-53-54-55-56.md` no coincide con lo que se publicó (lee
`gh issue view 67`): nombra una rama `fix/issues-53-54-55-56` que no existe,
cita commits de antes de un rebase (`75edf1c`, `56c1bef`, `c9b4874`,
`873bc6e`, `f79130e`) y su `## Log` termina en la línea base (`L2`).

## Archivos

- Puedes editar solo: `odd/tasks/issues-53-54-55-56.md`.
- No hagas commits, ni push, ni cambies de rama. No reescribas la historia de
  git.

## Datos verificados (compruébalos con `git log` antes de escribirlos)

Cada issue salió en su propia rama y PR, en este orden, encadenadas, y se
fusionaron en `main` el 20-11-2026:

| Tarea | Issue | Rama | PR | Commits publicados |
| --- | --- | --- | --- | --- |
| T1 | #56 | `fix/issue-56` | #57 | `ef41bcc` (fix), `e5212c3` (docs) |
| T2 | #53 | `fix/issue-53` | #58 | `f3a973f` (fix), `95a5771` (docs) |
| T3 | #55 | `fix/issue-55` | #59 | `05c219f` (fix), `cfcdf49` (docs) |
| T4 | #54 | `fix/issue-54` | #60 | `69aff95` (fix) |
| T5 | docs + verificación | `fix/issue-54` | #60 | `cffe519` (docs) |

Merges en `main`: `a0b03dd` (#57), `e9634ee` (#58), `979ff7d` (#59) y
`22efa01` (#60). La revisión de las cuatro PR es la etapa 20:
`planificacion/etapas/20-revision-prs-57-60/REPORTE.md` (veredicto: ninguna
bloqueaba; hallazgos en las issues #61 a #71).

## Cambios

1. En el párrafo de objetivo, reemplaza la rama inexistente por lo que pasó de
   verdad: una rama y un PR por issue (`fix/issue-56` → `fix/issue-53` →
   `fix/issue-55` → `fix/issue-54`, PR #57 a #60, encadenadas).
2. En la tabla de tareas, cambia la columna "Commit" por los commits
   publicados de la tabla de arriba (puedes renombrarla "Commits").
3. Agrega al `## Log`, en el mismo estilo de `L1` y `L2`:
   - `L3`: verificación y revisión de las PR (etapa 20, 19/20-11-2026), con
     el enlace relativo al reporte y el veredicto en una frase.
   - `L4`: fusión en `main` el 20-11-2026 (los cuatro merges de arriba) y los
     hallazgos que quedaron en las issues #61 a #71.
   - `L5`: el 20-11-2026 Juan confirmó las decisiones D1 (#54) y D2 (#55)
     tal como están; se cerró la issue #68.
   - `L6`: nota de higiene: el mensaje del commit `05c219f` arrastra el resto
     de un conflicto (`# Conflicts: src/lib/cancelacion.test.js`); no se
     corrige para no reescribir la historia.
4. No cambies las secciones de specs (`S1` a `S6`) ni `L1` y `L2`.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: El archivo ya no nombra la rama `fix/issues-53-54-55-56` como la rama del trabajo, y nombra las cuatro ramas reales (`fix/issue-56`, `fix/issue-53`, `fix/issue-55` y `fix/issue-54`) con sus PR (#57 a #60).
- C2: Ningún hash de commit citado en el archivo es de los viejos (`75edf1c`, `56c1bef`, `c9b4874`, `873bc6e`, `f79130e`), y cada hash citado existe en el repositorio.
  Cómo comprobarlo: `git cat-file -t <hash>` para cada hash del archivo (todos deben dar `commit`).
- C3: Cada tarea de la tabla cita los commits correctos: el mensaje de cada commit (`git log -1 --format=%s <hash>`) corresponde a la issue de esa tarea (T1 #56, T2 #53, T3 #55, T4 #54, T5 docs de #54).
- C4: El `## Log` tiene `L3` (verificación de la etapa 20 con el enlace relativo al reporte, y el enlace funciona desde `odd/tasks/`), `L4` (fusión con los cuatro merges), `L5` (D1 y D2 confirmadas, #68 cerrada) y `L6` (nota del commit `05c219f`).
- C5: Las secciones de specs (`S1` a `S6`) y las entradas `L1` y `L2` no cambiaron.
  Cómo comprobarlo: `git diff` del archivo.
- C6: El texto nuevo está en español con tildes, sin voseo y sin mencionar IA, modelos ni asistentes.
- C7: Solo cambió `odd/tasks/issues-53-54-55-56.md` (`git status`).
