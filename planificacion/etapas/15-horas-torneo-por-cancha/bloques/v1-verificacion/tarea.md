
---

# [MODO EJECUTOR] Bloque v1-verificacion (etapa 15)

Eres el **verificador** de la etapa 15. No escribiste este código: tu trabajo
es encontrar lo que esté mal. Lee
`planificacion/etapas/15-horas-torneo-por-cancha/PLAN.md` completo,
`docs/agentes/torneo.md`, `docs/agentes/reservas.md` y las tareas de los
bloques en `planificacion/etapas/15-horas-torneo-por-cancha/bloques/`
(`l1-logica-torneo`, `c1-validacion-reserva`, `u1-interfaz-torneo`).

## Rutas permitidas
Solo `planificacion/etapas/15-horas-torneo-por-cancha/revision/` (scripts,
capturas y tu informe). **No cambies ningún archivo de `src/`, `api/`,
`docs/` ni `AGENTS.md`**: si encuentras un defecto, repórtalo con
archivo:línea, cómo reproducirlo y qué esperabas. Puedes hacer mutaciones
temporales para comprobar pruebas, pero restaura todo y confirma con
`git status` que solo cambió `revision/`. No hagas commits.

## Qué revisar
1. **Diff** (`git diff` contra `HEAD`): que cada decisión del plan esté
   implementada (horas por cancha, una fecha por fase, orden con la primera y
   la última hora de cualquier cancha, capacidad por tramos, programación en
   turnos reales, horas sin partido con aviso y diálogo, limpieza por hora,
   precio por fase y cancha, reservas viejas compatibles, cumpleaños e
   individual sin cambios).
2. **Casos que pueden fallar** (escribe un script de Node con Vitest o
   pruebas temporales en `revision/` si hace falta; no dejes pruebas en
   `src/`):
   - límites exactos: 60/30 = 2 turnos, una hora suelta con turno 35 = 1
     turno, dos horas seguidas con turno 35 = 3 turnos;
   - semifinal que empieza exactamente al cierre de cuartos en la **segunda**
     cancha (válida) y una hora antes (inválida); fases en días invertidos;
   - el **segundo** y el **último** partido de cada fase en la cancha y hora
     correctas; ningún partido cruza un hueco; una fase con más partidos que
     turnos deja los sobrantes sin hora y bloquea la reserva;
   - repetir la reserva (no duplica), una celda que otra reserva ocupa
     entretanto (se quita solo esa hora), quitar una cancha del torneo con
     horas marcadas, cambiar el número de equipos con horas marcadas;
   - reservas viejas guardadas (un bloque por fase con varias canchas):
     se muestran en "Mis reservas", en el comprobante y en "Tus torneos".
   - precio: 2 horas salteadas en una cancha con descuento; 1 hora sin él;
     la Pádel 2 sin horas no se cobra.
3. **Pruebas**: cada prueba nueva ejercita lo que dice su título; los
   rechazos se acotan al mensaje exacto; nada de `toThrow()` a secas ni
   `try/catch` sin aserción; límites con su valor exacto. Haz al menos tres
   mutaciones propias (por ejemplo: `>=` por `>` en el orden, quitar el
   `Math.floor` de los tramos, que `confirmar` reserve sin abrir el diálogo)
   y anota qué pruebas fallan.
4. **App real (headless)**: `npm run build` y `npm run preview` (4173),
   Chrome headless por CDP (parte de `revision/u1-prueba.mjs` si existe). En
   `/reservar/padel?modo=torneo` y `/reservar/futbol?modo=torneo`, a 390×844
   y 1440×900: cuartos por cancha con horas salteadas, error de orden, final
   con 5 horas (aviso, diálogo con foco atrapado, Escape devuelve el foco,
   "Revisar horas", "Reservar igual"), "Mis reservas", teclado (Tab llega a
   las horas, Enter/Espacio las alterna), sin desborde con 3 canchas a 390 px
   y sin errores de consola. No abras el chat. Capturas en
   `revision/v1-*.png`.
5. `npm test`, `npm run lint` (0 warnings) y `npm run build`. Si `npm test`
   deja modificado `api/_lib/__snapshots__/instrucciones.test.js.snap` solo
   por fin de línea, restáuralo con `git checkout -- <archivo>`.
6. **Cierra el `preview` y todo Chrome headless al terminar** y comprueba
   que nada quede escuchando en el puerto 4173.

## Informe
Escribe `revision/v1-informe.md` y responde con lo mismo: veredicto
`APROBADO` o `CAMBIOS NECESARIOS`, hallazgos con archivo:línea separados en
**bloqueantes** y **detalles**, resultado de cada mutación, números de
pruebas y lo visto en headless.
