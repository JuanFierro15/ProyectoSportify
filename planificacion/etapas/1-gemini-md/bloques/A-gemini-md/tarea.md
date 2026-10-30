
# Tarea: crear `GEMINI.md` para los compañeros del equipo

## Objetivo

Crear el archivo `GEMINI.md` en la raíz del repositorio. Lo van a usar los
compañeros de Juan (Juan Manuel Villalba Rincón y Miguel Ángel Medina), que
trabajan el proyecto con Antigravity (agy / Gemini) en sus propios clones.
Tiene que darles **todo el contexto y la lógica del proyecto** para que su
agente trabaje igual de bien que el de Juan: es el equivalente a la guía local de Juan,
pero escrito para un agente de Gemini y para otra persona del equipo.

## Rutas

- Crear: `GEMINI.md` (raíz). Ya está en `.gitignore`: no lo saques de ahí.
- Leer (sin modificar): la guía local de Juan, `README.md`, `package.json`,
  `.env.example`, `vercel.json` y lo que necesites de `src/`, `api/` y
  `scripts/` para comprobar que lo que escribes es cierto.
- Prohibido modificar cualquier otro archivo.

## Contenido

Fuente principal: la guía local de Juan (602 líneas, está al día). Conserva **todo** su
contenido técnico, con el mismo nivel de detalle y las mismas secciones:
contexto y restricciones, comandos, arquitectura (estado, ventana de 7 días,
tipos de reserva, cancelación, `src/lib/`, datos del negocio, colores por
deporte, IDs de anclaje, dos páginas sin router, tokens, heros,
`VistaCanchas`, componentes de reserva, `EventoCTA`, `Ubicacion`), chatbot
(arquitectura, servidor, respaldo de modelo, contrato, widget, reservar y
cancelar, pruebas, cuotas), despliegue, documentación y capturas, bloques,
configuración del repositorio, estilo de código y estándar de calidad UI. No
resumas de más: si un detalle costó tiempo descubrirlo (trampas de Vercel,
CommonJS, `includeFiles`, `thinkingLevel: MINIMAL`, cuotas, `overflow: clip`,
etc.), tiene que quedar.

Adaptaciones obligatorias:

1. Título: `# GEMINI.md — Proyecto Reservas de Canchas (Sportify)` y una
   intro: guía para el agente (Antigravity / Gemini) de quien trabaje en este
   repositorio. Este archivo no se versiona: cada integrante lo tiene en su
   copia local; si una regla cambia, Juan envía la versión nueva.
2. Quita toda mención a la herramienta de Juan. Cambia
   "scratchpad de la sesión" por "una carpeta temporal fuera del repositorio".
   Las referencias a la guía local dentro del texto pasan a `GEMINI.md`.
3. Nueva sección al inicio, **"Equipo y forma de trabajo"**:
   - Integrantes: Juan Fierro (GitHub `JuanFierro15`, dueño del repo y del
     proyecto de Vercel), Juan Manuel Villalba Rincón (`jmvr24`) y Miguel
     Ángel Medina (`MiguelMD06`).
   - Antes de tocar código: entender la tarea, leer los archivos implicados y
     proponer un plan; implementar solo cuando la persona lo apruebe.
   - Al terminar: `npm test` y `npm run lint` (0 warnings) y, si cambió algo
     visual, revisarlo en el navegador.
   - El agente **no hace commits ni push** salvo que la persona lo pida
     explícitamente.
   - **Cada push a `main` despliega a producción**: trabajar en una rama
     propia (por ejemplo `feat/panel-admin`) y abrir un pull request hacia
     `main`; coordinar con Juan antes de integrar. Un push a otra rama crea un
     despliegue Preview.
   - "Pedido de Juan" en el texto significa decisiones de diseño ya tomadas
     por el equipo: no revertirlas sin hablarlo.
4. Comandos para levantar el chatbot en local: además de la línea de Bash,
   agrega la versión de PowerShell (el equipo usa Windows):
   ```powershell
   Get-Content .env.local | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Item "env:$($k.Trim())" $v.Trim().Trim('"') }; vercel dev
   ```
   Y explica la preparación: `npm i -g vercel`, `vercel login`, `vercel link`
   (necesita que Juan los invite al proyecto de Vercel `kgb10/proyecto-sportify`;
   si no, cada uno puede usar su propia `GEMINI_API_KEY` de Google AI Studio),
   copiar `.env.example` a `.env.local` y poner la key. Sin `vercel dev`, el
   chat no responde en local (`npm run dev` no ejecuta `/api`); la
   alternativa es probar en producción.
5. Despliegue: los comandos de `vercel env update` / `redeploy` / `vercel logs`
   requieren acceso al proyecto de Vercel; aclara que eso lo hace Juan o
   quien tenga acceso.
6. Sección de seguridad visible: nunca imprimir ni pegar la API key en código,
   logs, chats, commits ni issues; `.env` y `.env.local` nunca se versionan;
   las variables `VITE_*` terminan en el bundle del cliente.
7. Reglas de commits iguales: en español con prefijo (`feat:`, `fix:`,
   `chore:`, `docs:`, `test:`), un tema por commit, **sin mencionar IA,
   ni herramientas de desarrollo, y sin líneas
   de coautoría** (aclara que el chatbot sí usa Gemini y eso se puede nombrar
   cuando el commit trata del chatbot).
8. Bloque 7 (panel admin, pendiente): deja claro qué debe reutilizar
   (acción `CANCELAR`, `src/lib/cancelacion.js`, verificar el código del QR
   contra las reservas guardadas) para que quien lo tome sepa por dónde
   empezar.
9. No incluyas rutas personales de Juan (`C:\Users\<usuario>\...`), ni nada de
   `planificacion/`, ni de cuotas de agy, ni el flujo de delegación de Juan.

Formato: Markdown limpio, español con tildes correctas, mismo estilo de
viñetas que la guía local, líneas de unos 80 caracteres.

## Verificación al terminar

- `GEMINI.md` existe en la raíz y `git status` **no** lo muestra (está
  ignorado). Ningún otro archivo cambió.
- Busca en `GEMINI.md` el nombre de la herramienta de Juan,
  `scratchpad` y el usuario de Windows de Juan: no debe quedar ninguna.
- Comprueba que los comandos de `package.json` que nombras existen.
- Responde con el número de líneas del archivo y la lista de secciones.
