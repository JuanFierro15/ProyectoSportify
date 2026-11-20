
# Tarea v3: recorridos en la app real (punta de la cadena #57 a #60)

[MODO EJECUTOR] Esta tarea es de **pruebas en el navegador**: no modificas
ningún archivo del proyecto. Solo levantas el sitio, lo recorres y escribes un
informe con capturas.

## Dónde trabajas

- **Directorio:** `C:/Users/MIGUEL ANGEL/.claude/jobs/73d64523/tmp/rev`
  (worktree descartable con `node_modules`). Comprueba que está en
  `origin/fix/issue-54` y limpio (`git status`); si no, `git checkout --detach
  origin/fix/issue-54` y `git checkout -- .`. No hagas commits, push, `stash`
  ni ramas.
- Levanta el sitio así, **una sola vez**: `npm run build` y después
  `npm run preview` en segundo plano (puerto 4173). No ejecutes `npm run dev`
  ni `vercel dev`. Al terminar, **cierra el `preview`** y el navegador, y
  comprueba que no quede nada escuchando en 4173.
- El sitio en `preview` no tiene `/api/chat`: **no pruebes el chatbot** más
  allá de abrir y cerrar el widget.
- **Navegador:** el MCP de Playwright **sin la extensión de Chrome** (navegador
  aislado, sin cookies ni sesión del usuario). Dos pestañas = dos páginas del
  **mismo** contexto de navegador, para que compartan `localStorage` y se
  disparen los eventos `storage` reales.
- **Archivos que escribes**, todos en
  `C:/Users/MIGUEL ANGEL/Documents/UNIVERSIDAD/VI SEMESTRE/Lenguajes para la Web/ProyectoSportify/.claude/worktrees/plan-pestanas-fases-torneo/planificacion/etapas/20-revision-prs-57-60/revision/v3/`:
  `informe.md` y capturas `R<n>-<descripcion>-<ancho>.png` con el nombre
  exacto que se indica abajo. Cada captura debe ser de la página real en ese
  momento: nunca generes ni edites imágenes.

## Recorridos

Hazlos a `1440×900`, salvo los que dicen `390×844`. En cada uno, anota lo que
viste, lo esperado y si coincide. Revisa la consola del navegador en cada
recorrido y copia todo error o aviso.

1. **R1 inicio** (`1440×900` y `390×844`): carga `/`, baja por los heros, la
   sección de eventos y la de ubicación; usa los enlaces del navbar "Eventos
   especiales" y "Ubicación". Capturas `R1-inicio-1440.png`,
   `R1-inicio-390.png`.
2. **R2 reserva normal**: entra a pádel por "Ver canchas" (o
   `/reservar/padel`), elige un día dentro de 3 días, reserva **1 hora**, luego
   otra de **3 horas seguidas** (comprueba que se muestra el descuento) y
   prueba un nombre inválido (`A1`) y un teléfono inválido (`123`) antes de
   corregirlos: deben aparecer los avisos. Guarda los códigos de reserva.
   Capturas `R2-descuento-1440.png`, `R2-errores-1440.png`,
   `R2-confirmacion-1440.png`.
3. **R3 torneo y cumpleaños**: crea un torneo por fases completo (4 equipos)
   en `1440×900` y otro en `390×844` con el asistente móvil, hasta la
   confirmación; luego un cumpleaños. Capturas `R3-llaves-1440.png`,
   `R3-asistente-390.png`, `R3-cumpleanos-1440.png`.
4. **R4 Mis reservas**: busca las reservas de R2 por código y por nombre y
   teléfono; cancela la de 1 hora y vuelve a la página de reserva: esa hora
   debe verse **disponible** otra vez. Intenta cancelar el torneo: debe decir
   que los eventos no se cancelan ahí. Capturas `R4-mis-reservas-1440.png`,
   `R4-hora-libre-1440.png`.
5. **R5 dos pestañas, misma hora.** Pestaña A y pestaña B en la misma página de
   reserva (misma cancha y día). En A reserva una hora libre `H`. Sin recargar
   B, intenta reservar `H` en B: B debe rechazarla ("Ese horario ya está
   reservado. Elige otro.") y mostrar `H` ocupada. Captura
   `R5-rechazo-B-1440.png`.
6. **R6 pestaña que no puede guardar (conflicto).** Recarga las dos pestañas.
   En A, desde la consola de esa página, haz que guardar falle **solo en A**:
   `Storage.prototype.setItem = function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }`.
   En A reserva una hora libre `H2` (A da un código). En B (que no la ve)
   reserva la misma `H2` (B la guarda). Vuelve a A y haz cualquier acción que
   la sincronice (por ejemplo, intenta reservar otra hora o espera el evento).
   Esperado: en A aparece un aviso en la parte superior que dice que la reserva
   no pudo completarse porque el horario ya fue ocupado, con el código de A;
   en "Mis reservas" de A ya no está la reserva de A; `H2` se ve ocupada en las
   dos. El aviso se cierra con su botón (comprueba con teclado: `Tab` hasta el
   botón y `Enter`). Revisa que el aviso no tape el navbar ni quede debajo del
   chat. Capturas `R6-aviso-1440.png`, `R6-aviso-390.png`.
7. **R7 cancelación que no se pudo guardar.** Recarga las dos pestañas (A
   vuelve a guardar bien). En A reserva una hora `H3`; luego aplica en A el
   mismo `setItem` que falla y cancela `H3` desde "Mis reservas" de A. En B
   reserva otra hora distinta. Vuelve a A: la reserva cancelada **no** debe
   reaparecer en "Mis reservas" y `H3` debe verse libre en A. Captura
   `R7-no-reaparece-1440.png`.
8. **R8 borrar los datos desde otra pestaña.** Recarga las dos (guardado
   normal). En A haz una reserva. En B ejecuta en consola
   `localStorage.clear()`. En A: la reserva guardada desaparece y la hora se ve
   libre (es el reinicio). Repite con A sin poder guardar (el `setItem` que
   falla) y una reserva nueva en A antes del `clear()` en B: esa reserva de A
   debe **seguir** en A. Captura `R8-clear-1440.png`.

## Informe (`informe.md`)

En español y UTF-8: una tabla `recorrido | esperado | visto | coincide`, la
lista de errores de consola por recorrido, la lista de capturas con lo que
muestra cada una y cualquier problema visual (texto cortado, elementos
encimados, contraste, foco invisible, textos con voseo o que mencionen
detalles técnicos como "localStorage" o "pestaña").

No inventes resultados ni capturas: si algo no se pudo hacer, escríbelo y di
por qué.

## Criterios de aceptación

- Los 8 recorridos hechos, cada uno con su resultado.
- Todas las capturas nombradas existen y son de la página real.
- `preview` cerrado y nada escuchando en 4173 al terminar.
- Ningún archivo del proyecto modificado.
