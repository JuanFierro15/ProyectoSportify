# Correcciones de la auditoría: reservas y torneos (issues #10, #11 y #12)

Objetivo: resolver los hallazgos de la auditoría del 07-11-2026 (sobre `77af94d`) asignados a Juan.
Rama: `fix/auditoria-reservas` · Entrega: un PR a `main` que cierra #10, #11 y #12, con un commit por issue · Pruebas: `npm test`, `npm run lint` y `npm run build`.

El texto completo de cada issue está en GitHub (`gh issue view <n>`); es parte de la especificación. Las líneas citadas son las de `77af94d`.

## Specs

### Issue #10: horas de fase ocupadas que no se pueden quitar (riesgo: regla todo-o-nada y datos guardados)

- **S1 — Limpiar horas de fase.** "Esperado: cuando cambian canchas, equipos o disponibilidad, las horas de cada fase que ya no están libres se quitan (con el mismo aviso que el modo cancha), y nunca queda una hora elegida sin poder quitarse." Causas citadas: el efecto de `useReserva.js:713-724` "solo mira `horasSel`, que en torneo siempre está vacío. Nunca revisa `jornadas`"; en `CalendarioTorneo.jsx` "`disabled={!libre}` también se aplica a una hora **ya elegida**". Además, "tras ese error, en torneo no se limpia nada (`useReserva.js:945-951`, `if (modo !== 'torneo') setHorasSel([])`)".
- **S2 — Cambiar el día con horas en la fase 1 (verificar primero).** "`cambiarFecha`: reescribe la fecha de la ronda 1 aunque ya tenga horas, y las conserva sin revalidar." Camino: "configura el torneo, pasa a Cumpleaños, cambia el día y vuelve a Torneo." Si se reproduce, las horas de la fase 1 se revalidan contra el día nuevo.
- **S3 — Segunda validación en el reducer.** "`reservarEvento` y `RESERVAR_EVENTO` solo revisan choques de celdas. No validan el orden cronológico entre fases (`validarJornadas`...) ni que las horas de un cumpleaños sean consecutivas. Agrega esas dos validaciones a la doble validación, igual que `bloqueLibre` hace con la reserva individual."
- **S4 — Pruebas de #10.** "Un test que reproduzca el punto 1 (falla antes del arreglo y pasa después)." "Tests del reducer para el orden de fases y las horas no consecutivas (hoy no hay tests directos del reducer)."

### Issue #11: datos mal mostrados o guardados en torneos y cumpleaños

- **S5 — Torneos reservados.** `PasoGuardados.jsx` "leen `t.horario` y `t.fechaTexto`, que el reducer **nunca guarda**". Debe mostrar la fecha con `fechaCompleta`, la hora de fin con `finDeFranja` ("un bloque 14:00-16:00 sale como '14:00 a 15:00'") y todas las fases, no "Solo... las horas de la primera fase".
- **S6 — Tercera cancha que no se usa (verificar primero).** "En un torneo de 4 equipos con 3 canchas, la fase 1 solo usa 2... Aun así, la tercera queda en `canchaIds` del evento, en la confirmación y en el texto del QR, aunque no se reserva ni se cobra." Camino por decidir con Juan: "avisar y limitar las canchas según los partidos de la fase con más partidos, o no guardar la cancha que no se usa". **Decisión de Juan (L3): avisar y limitar.** No se pueden elegir más canchas que los partidos de la fase con más partidos (4 equipos → máx. 2), y un aviso explica por qué. Si al bajar el número de equipos sobran canchas, se avisa y se quitan las que sobran.
- **S7 — Invitados enteros.** "`Number('2.5')` pasa las validaciones... Exige un entero (`Number.isInteger`) y agrega `step=\"1\"` en el input de `torneo/PasoDatos.jsx`."
- **S8 — Limpiar conserva el modo.** "`reiniciar` vuelve a `modoInicial`, no al modo actual... Debe limpiar sin cambiar el modo en el que estás."
- **S9 — Ventana de 7 días tras la medianoche.** "`dias` se calcula una sola vez al montar... Renueva la ventana cuando cambie el día, por ejemplo al recuperar el foco o la visibilidad de la pestaña."
- **S10 — Pruebas de #11.** "Test de `PasoGuardados` con un torneo de 2 fases: fecha legible y hora de fin correcta." "Test de invitados decimales y de 'Limpiar selección' conservando el modo." "Test de la ventana con relojes falsos (`vi.setSystemTime`) cruzando la medianoche."

### Issue #12: código muerto y CSS duplicado

- **S11 — Limpieza.** Cada casilla de la issue #12 (contexto de reservas, hook de reserva, CSS y lógica duplicada). "Haz esta issue después de las dos de bugs de reservas y torneos: toca los mismos archivos."
- **S12 — Carpeta `.engram/`.** "Decide si se queda; si no, quítala del repo y agrégala a `.gitignore`." **Decisión de Juan (L4): se queda**, y se documenta en `AGENTS.md` para qué está.
- **S13 — Verificación de #12.** "`npm test`, `npm run lint` y `npm run build` en verde." "Revisión visual del modo torneo en escritorio y a 390 px: el calendario se ve igual que antes."

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|---|---|---|---|---|
| T1 | S1-S4 (#10) | agy `gemini-4-argon-high` (regla todo-o-nada y validación de reservas guardadas); revisión de Opus | hecho: RED test 13 → GREEN; corrección de revisión (fase con choque se limpia entera, sin huecos; efecto solo en modo torneo); npm test 235/235, lint 0 | `b1f5ced` |
| T2a | S5, S7-S10 (#11 sin el punto 2) | agy `gemini-4-argon-high` en el worktree `ProyectoSportify-worktrees/issue-11` (rama `fix/auditoria-reservas-11`, borrada tras fusionar en `2c20cde`), en paralelo con T1; se fusiona al terminar | hecho en la rama del worktree; corrección de revisión (S9: el día elegido y las fases salen de la ventana al renovarla; calcularDisponibilidad igual que horaLibre); 234/234, lint 0; fusionado sin conflictos; tras la fusión npm test 242/242, lint 0, build ok | `203b6c7` (rama `fix/auditoria-reservas-11`) |
| T2b | S6 (#11 punto 2) | agy `gemini-4-argon-high`, después de T1 (misma lógica de cambio de canchas que S1) | hecho: maxCanchasTorneo (pura, con tests) usado en hook, sugerencias, validación y subtítulo; 238/238, lint 0 | `40f8dc1` |
| T3a | S11, parte sin archivos compartidos (comentarios de `src/lib`, CSS duplicado, `pasosTorneo`, `REGEX_CODIGO`, `AlertaTiempo` de `PasoCapacidad`) | agy `gemini-3.8-flash-high`, en paralelo con T1 (superficies disjuntas) | hecho: `vitest src/lib` 186/186, eslint 0, build ok; CSS revisado propiedad por propiedad (CalendarioTorneo.css se importa después y ya pisaba todo, salvo hover y movimiento reducido, que se movieron) | `51ebf10` |
| T3b | S11 resto (`ReservasContext`, `useReserva`), S12, S13 | agy `gemini-3.8-flash-high`, después de T2 | hecho: sin residuos (búsqueda en src y api); el campo error se quitó también de aplicarCancelacion (revisión de Opus); estilos computados del calendario idénticos antes/después en 1440 y 390 px; 242/242, lint 0, build ok | `20e30ea` |
| T4 | S1-S3, S5, S6 (revisión de Miguel al PR #23) | agy `gemini-4-argon-high` (misma lógica del hook) | hecho: los 9 puntos con RED → GREEN; 247/247, lint 0, build ok | ver commit de la revisión |

## Log

- **L1 (07-11-2026, Juan):** "Miguel terminé de auditar las etapas que quedaron pendientes y nos dejó la issue para resolver los errores que salieron de la auditación, entonces apoyate en los agentes de gentle-ai para resolver esta issue y recuerda que tenemos argon diponible que no lo hemos usado". Después: "sí, arranca con la #10, #11 y #12".
- **L2:** Orden #10 → #11 → #12 (tocan los mismos archivos, así que van en serie y no en paralelo). Línea base `77af94d`.
- **L3 (07-11-2026, Juan):** sobre S6: "la 1, avisar y limitar".
- **L4 (07-11-2026, Juan):** sobre S12: "sí, déjala y documéntala en AGENTS.md". La carpeta entró a propósito (`af55665`, `97435ec`).
- **L5 (07-11-2026, Juan):** pidió paralelizar con worktrees; se lanzó la #11 sin S6 en un worktree ("sí, lánzala en el worktree"). S6 y T3b siguen en serie porque tocan la misma lógica que S1 y `confirmar`. `node_modules` del worktree es un junction al checkout principal.
- **L6:** revisión de Opus de T1: limpiar solo la hora ocupada dejaba huecos en la franja de la fase (capacidad mal contada y fallo de bloqueLibre al confirmar) y el efecto corría en cumpleaños; una tanda de corrección lo resolvió.
- **L7:** revisión de Opus de T2a: tras renovar la ventana, la fecha elegida seguía siendo ayer y calcularDisponibilidad la mostraba libre; corregido. Revisión de T3b: el reducer filtraba un campo error que ponía aplicarCancelacion; se quitó en el origen. Revisión visual (S13): estilos computados de todo el calendario idénticos entre 77af94d y la rama, en 1440 y 390 px (se revirtió la transición nueva de la sombra).
- **L8:** cerrado. README y AGENTS.md actualizados con el tope de canchas, la ventana que se renueva y la doble validación de eventos. Siguiente paso: PR a main que cierra #10, #11 y #12 (decisión de Juan).
- **L9 (07-11-2026, Juan):** "Miguel ya nos dejó comentarios sobre nuestros issues, revisemos". Revisión de Miguel al PR #23: 4 bugs (aviso de cambiarFecha que nunca sale, confirmado por Opus; quitas sin aviso; limpieza duplicada; elegirHoraFase desde ref), mensajes duplicados y 2 tests faltantes. Decisiones: si confirmar falla sin choque no se borra nada; fuera de torneo, cambiar el día no borra horas de la fase 1 (el efecto de torneo revalida al volver).
- **L10 (07-11-2026, Juan):** sobre las decisiones de T4: "sí, de acuerdo con las dos decisiones".
