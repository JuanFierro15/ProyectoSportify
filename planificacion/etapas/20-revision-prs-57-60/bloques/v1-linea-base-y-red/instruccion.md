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

# Tarea v1: línea base y RED de las PR #57 a #60

[MODO EJECUTOR] Esta tarea es de **pruebas y medición**: no corriges código ni
escribes pruebas nuevas. Solo ejecutas comandos y escribes un informe.

## Contexto

Hay cuatro PR encadenadas que se van a fusionar en este orden:

| PR | Rama (remota) | Base |
| --- | --- | --- |
| #57 | `origin/fix/issue-56` | `origin/main` |
| #58 | `origin/fix/issue-53` | `origin/fix/issue-56` |
| #59 | `origin/fix/issue-55` | `origin/fix/issue-53` |
| #60 | `origin/fix/issue-54` | `origin/fix/issue-55` |

## Dónde trabajas

- **Directorio de trabajo:** `C:/Users/MIGUEL ANGEL/.claude/jobs/73d64523/tmp/rev`
  (un worktree de git descartable, ahora en `origin/main` con HEAD separado).
  Todos los comandos se corren ahí.
- En ese worktree, y **solo ahí**, tienes permiso para `git checkout --detach
  <ref>` y `git checkout <ref> -- <archivo>` para cambiar de eslabón. Nada de
  commits, push, `git stash`, `git reset --hard` sobre otras carpetas ni crear
  ramas. Antes de pasar a otro eslabón, deja el árbol limpio con
  `git checkout -- .` (solo dentro de ese worktree).
- **El único archivo que escribes** es el informe:
  `C:/Users/MIGUEL ANGEL/Documents/UNIVERSIDAD/VI SEMESTRE/Lenguajes para la Web/ProyectoSportify/.claude/worktrees/plan-pestanas-fases-torneo/planificacion/etapas/20-revision-prs-57-60/revision/v1-pruebas.md`
- No ejecutes `npm run dev`, `npm run preview` ni `vercel dev`. Un comando
  pesado a la vez (la PC tiene 8 GB).

## Pasos

1. `npm ci` una sola vez (ningún eslabón cambia `package.json`).
2. **Línea base.** Para cada ref, en este orden: `origin/main`,
   `origin/fix/issue-56`, `origin/fix/issue-53`, `origin/fix/issue-55`,
   `origin/fix/issue-54`:
   - `git checkout --detach <ref>`;
   - `npm test` → anota archivos de prueba, casos totales, pasados y fallidos
     (con el nombre exacto de cada caso fallido);
   - `npm run lint` → errores y avisos (deben ser 0);
   - `npm run build` → si termina bien, y cualquier aviso **distinto** de
     "Invalid media query" (esperado) y del aviso de tamaño de chunk (ya
     existía).
3. **Pruebas nuevas de cada PR.** Para cada PR, lista los casos (`it(` /
   `test(`) que la PR agrega o modifica: `git diff <base> <rama> -- '*.test.js'
   '*.test.jsx'`. Anota el nombre exacto de cada caso y su archivo.
4. **RED.** Para cada PR:
   - `git checkout --detach <rama de la PR>`;
   - devuelve **solo el código de producción** a su base:
     `git checkout <base> -- src/context/ReservasContext.jsx src/lib/cancelacion.js`
     (si un archivo no cambió en esa PR, el comando no hace nada; en la #59 no
     toques `AvisoConflictoReserva.jsx` ni `App.jsx`);
   - corre solo los archivos de prueba que la PR cambió:
     `npx vitest run <archivos>`;
   - anota, por cada caso nuevo del paso 3, si **falla** (RED, bien) o
     **pasa** (no prueba el arreglo). Para cada uno que falla, copia la primera
     línea del error;
   - `git checkout -- .` para limpiar.
5. Deja el worktree en `origin/fix/issue-54` limpio (`git status` vacío).

## Informe (`v1-pruebas.md`)

Escríbelo en español, en UTF-8, con estas secciones:

1. **Línea base**: una tabla `ref | archivos | casos | pasan | fallan | lint |
   build` y, debajo, los nombres de los casos fallidos y los avisos nuevos.
2. **Pruebas nuevas por PR**: lista `archivo › nombre del caso`.
3. **RED por PR**: tabla `caso | resultado contra la base (falla/pasa) |
   primera línea del error`.
4. **Observaciones**: cualquier cosa rara (pruebas que tardan mucho, mensajes
   de `act(...)`, errores en la consola de las pruebas, casos que se saltan con
   `skip` u `only`).

No inventes resultados: si un comando no se pudo correr, escríbelo así y pega
el error.

## Criterios de aceptación

- Los 5 refs con test, lint y build corridos, con números.
- Cada caso nuevo de cada PR con su resultado de RED.
- El worktree termina limpio en `origin/fix/issue-54`.
- No se modificó ningún archivo fuera del informe.
