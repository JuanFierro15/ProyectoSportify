# Etapa 21: issues #61 a #71

Responsable: Juan Fierro. Inicio: 20-11-2026. Rama de la etapa: `chore/etapa-21-issues-61-71`.


## Contexto

Hay 11 issues abiertas (#61 a #71). Todas salieron de la revisión de las PR #57 a #60 (etapa 20, `planificacion/etapas/20-revision-prs-57-60/REPORTE.md`). No hay PR abiertas. Decisiones de Juan (20-11-2026):

- **#68:** se confirman D1 y D2 como están en `main`. La #68 se cierra con un comentario y la #61 se hace sobre D2.
- **#71:** se arregla. El primer hero arranca con el texto visible.

La sustentación es hoy (20-11) y cada push a `main` despliega a producción. Los PR quedan abiertos y la fusión la decide Juan. Recomiendo fusionar después de sustentar.

## Mapa de dependencias

| Issue | Qué toca | Depende de | Implementa |
|---|---|---|---|
| #66 pruebas de riesgo | `ReservasContext.test.jsx`, `AvisoConflictoReserva.test.jsx` | — | Hydrogen `high` |
| #62 choque solo en `ocupados` | `conciliarReservasSinGuardar`, `renovarSiCambioElDia` | #66 | Neon `high` |
| #63 `ultimoRaw` ilegible | `idsDeRawStorage`, `obtenerIds*`, `renovarSiCambioElDia` | #62 (misma función) | Neon `high` |
| #64 refactor | los 3 caminos de sincronización, `registrarConflictos`, `cancelacion.js` | #62, #63, #66 y #61 | Neon `high` |
| #65 aviso a11y y tokens | `AvisoConflictoReserva.jsx`, `.avisos-conflicto*` y `:root` de `App.css` | — | Hydrogen `high` |
| #61 confirmación contradictoria | `registrarConflictos` (el aviso lleva `codigo`), `useReserva.js`, `VistaCanchas.jsx` | #68 ✔, #65 | Neon `high` |
| #69 fecha repetida | `fechaTexto` en `useReserva.js:1269`, `Torneo.test.jsx` | — | Hydrogen `high` |
| #70 "bloqueado" cortado | `SelectorDia.jsx/.css`, `AsistenteTorneo.css` | — | Hydrogen `high` |
| #71 hero sin texto | `DeporteHero.jsx`, `PaginaInicio.jsx`, `DeporteHero.test.jsx` | — | Hydrogen `high` |
| #67 doc ODD desfasada | `odd/tasks/issues-53-54-55-56.md` | — | Hydrogen `high` |
| #68 decisión | comentario y cierre | — | Opus |

Por qué este orden:

- **El núcleo va en serie.** #66, #62, #63 y #64 cambian la misma lógica de `src/context/ReservasContext.jsx`, así que no van en worktrees. Primero van las pruebas (#66): fijan lo que hoy funciona. Después los dos arreglos, cada uno con su prueba que falla antes. El refactor va al final, para que toda esa red lo cubra. Todos son de alto riesgo (datos guardados y orden entre pestañas), por eso van con Neon.
- **#62 usa `celdasDeReserva`, no `horasUsadasEnCelda`**, porque #64 le quita el `export` a esa función.
- **#61 necesita que el aviso lleve el `codigo`.** `reservar()` devuelve `{ ok, codigo }` y el id del aviso es `reserva.id`, así que hay que agregarlo en `registrarConflictos`, la misma función que limpia #64. Por eso #64 espera a #61. La #61 maneja estado compartido entre el contexto, `useReserva` y `VistaCanchas`: va con Neon.
- **Los independientes** (#65, #69, #70, #71, #67) no comparten archivos con el núcleo. #69 y #61 tocan funciones distintas de `useReserva.js`, así que pueden ir en worktrees separados.

## Olas de ejecución

Cada bloque se corre con la skill `ciclo-verificado`: agy implementa (modelo de la tabla) y `gemini-4-argon-high` verifica, cada ciclo en su propio worktree `<repo>-worktrees/<nombre>`, con `node_modules` como junction. Antes de cada ola se mide `FreePhysicalMemory` y se lanzan tantos ciclos como quepan (500 MB por agente).

**Ola 0 (Opus)**
1. Rama `chore/etapa-21-issues-61-71` desde `main` actualizado. Ahí van `planificacion/etapas/21-issues-61-71/PLAN.md` y, por bloque, `instruccion.md`, `criterios.md` y `ciclo.json` (criterios abajo).
2. Comentar y cerrar la #68: D1 y D2 confirmadas por Juan el 20-11-2026. Antes, comprobar que `docs/agentes/reservas.md` ya las describe.
3. Crear las ramas y los worktrees de la ola 1.

**Ola 1 (en paralelo, 6 ciclos)**
- B1 #66 → rama `fix/sincronizacion-pestanas-62-66` (worktree `nucleo`)
- B2 #65 → rama `fix/aviso-conflicto-61-65` (worktree `aviso`)
- B3 #69 → `fix/issue-69` · B4 #70 → `fix/issue-70` · B5 #71 → `fix/issue-71` · B6 #67 → `docs/issue-67`

**Ola 2**
- B7 #62 y después B8 #63, en el worktree `nucleo`, sobre B1
- en paralelo, B9 #61 en el worktree `aviso`, sobre B2

**Ola 3**
- Fusionar `fix/aviso-conflicto-61-65` dentro de `nucleo` (`--no-ff`) y correr B10 #64 encima. Así el refactor ya incluye el `codigo` del aviso. El PR del núcleo queda encadenado al del aviso: se fusiona después de él.

Commits convencionales en español, uno por issue, con `(#N)` en el mensaje. Cada PR cierra sus issues (`Closes #N`). Si el diff del núcleo pasa de unas 400 líneas, se parte con `chained-pr`: (a) #66, #62 y #63; (b) #64.

## Criterios de aceptación por bloque (resumen; el detalle va en `criterios.md`)

- **B1 #66:** los casos 1 a 5 de la issue, más las sondas S2, S5, S6 y S14 de `planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.test.jsx.txt`, con valores exactos (`codigo`, `disponibilidad`, `avisosConflicto`). Si se invierte el orden de `quitarReservasDeEstado` y `conciliarReservasSinGuardar` en `conciliarLecturaExterna`, el caso 1 falla (el verificador lo prueba con una mutación temporal). En el caso 5 queda la que no choca y hay un solo aviso. No se toca código de producción: si un caso falla contra `main`, escala. El caso que rompe la #63 no entra aquí, va en B8.
- **B7 #62:** la sonda S13 (variante sin la fecha en `ocupados`) pasa: `R` se descarta con aviso y `Rb` queda sola en `16:00`. Si la pendiente se acepta, sus horas quedan en `ocupados`. `renovarSiCambioElDia` arma su base con `fusionarConSemilla`, igual que el listener `storage` y `leerEstadoFresco`. Se prueban un evento con `bloques` que choca en su segundo bloque y en el último, y el caso sin choque, que sigue igual.
- **B8 #63:** la prueba con los 4 pasos de la issue falla antes y pasa después (`R1` no vuelve). `ultimoRawStorageRef` no se reemplaza con un texto que `parsearDatosGuardados` rechace. Si lo último guardado es ilegible o `null`, solo cuentan como pendientes los ids de `idsSinGuardarRef`.
- **B9 #61:** el aviso trae `codigo`. Si `avisosConflicto` incluye `confirmado.codigo`, la confirmación cambia a "no se pudo completar", sin QR, con un botón para elegir otro horario. Un aviso con otro código no cambia la confirmación. Cerrar el aviso no hace volver el QR. Después de elegir otro horario, la segunda reserva se confirma normal. También aplica a un torneo y a un cumpleaños descartados. La prueba de interfaz despacha `storage` con la reserva que choca y `setItem` fallando. Revisar si el comprobante del chat tiene la misma contradicción: si la tiene, se abre una issue nueva y no se arregla aquí.
- **B2 #65:** una sola región viva: se quita `aria-live` del contenedor y queda `role="alert"` en cada aviso. Los colores salen de tokens nuevos en `:root` (`--aviso-fondo`, `--aviso-texto` y un borde con `color-mix` de `--color-marca`). El contraste no baja (se mide antes y después, mínimo 4.5:1). La prueba fija que el contenedor no tiene `aria-live` y que hay N `role="alert"` con N avisos.
- **B10 #64:** una sola `sincronizarConLeido` la usan los tres caminos y la rama de clave borrada. `aplicarCancelacion` delega en `quitarReservasDeEstado`. Se quitan `conservarReservasSinGuardar` (`C10` pasa a `conciliarReservasSinGuardar`), el `export` de `horasUsadasEnCelda` y el id de respaldo. `idsDeRawStorage` parsea una vez por evento. Sin cambios de comportamiento: la suite y las sondas pasan sin editar ninguna otra prueba.
- **B3 #69:** con las dos fases el mismo día aparece una sola fecha ("Viernes 20 de noviembre · 2 jornadas"), en el resumen y en el texto del QR. Con días distintos el rango sigue igual. Con 3 fases, primera y última en días distintos y la del medio repetida, también sigue el rango.
- **B4 #70:** a 390 y 360 px, la pastilla bloqueada muestra el texto completo sin cambiar el ancho. Se revisa en el asistente del torneo y en `FormularioReserva`, porque `SelectorDia` es compartido. La barra ya tiene `rgba(22,22,22,.95)` con `blur(12px)`: primero se comprueba a 390 px. Si no se transparenta, no se cambia y se anota en la issue.
- **B5 #71:** con la prop `textoVisibleAlInicio` (solo en el primer hero de `PaginaInicio`), el texto se ve con `scrollY = 0` a 1440 y a 390 px. Sale con el scroll y vuelve visible al subir otra vez arriba. Los demás heros y `prefers-reduced-motion` no cambian, y el control de reproducción y avance (`controladorSnapHero`) sigue funcionando. Sigue usando `gsap.matchMedia` con `revert`.
- **B6 #67:** rama y commits correctos por tarea, y cada hash citado existe (`git cat-file -t`). El `## Log` registra la verificación y el cierre, con enlace al reporte de la etapa 20, y lleva la nota sobre el mensaje de `05c219f`.

Si un cambio toca algo descrito en `docs/agentes/`, ese archivo va en el mismo PR (`reservas.md` para B7, B8, B9 y B10, `pagina-reserva.md` para B5 y B9, y `torneo.md` para B4).

## Verificación final (Opus, antes de los PR)

1. Fusionar todas las ramas en una rama de integración local, sin push, y correr ahí `npm test`, `npm run lint` (0 warnings) y `npm run build`.
2. App real con un solo servidor (`npm run build` + `npm run preview`) a 1440, 390 y 360 px: hero inicial (#71), torneo con las fases el mismo día (#69), pastilla bloqueada (#70), y el flujo de dos pestañas con `setItem` fallando (#61, #65). Cerrar el servidor con `taskkill /T` y comprobarlo con `netstat`. Las revisiones visuales de los ciclos usan jsdom; la revisión con el navegador va aquí, para no levantar varios servidores a la vez.
3. Revisión dirigida de Opus: los reportes de cada ciclo, el empalme de `registrarConflictos` entre #61 y #64, y el núcleo a fondo.
4. Pendiente manual de Juan: probar con NVDA o Narrador que el aviso se lee una sola vez (#65).
5. Abrir los 6 PR. Cuando Juan pida fusionar: revisión de Argon por PR. Orden: #67, #69, #70 y #71 en cualquier orden; después el aviso; al final el núcleo.
6. Reporte en `planificacion/etapas/21-issues-61-71/REPORTE.md`, y una issue por cada caso que quede sin arreglar.

## Bloques

Criterios completos en `bloques/<id>/criterios.md`; instrucción en `instruccion.md` (base común + tarea + criterios).

| Bloque | Issue | Worktree y rama | Implementa | Ola |
|---|---|---|---|---|
| b1-pruebas-riesgo | #66 | `nucleo` · `fix/sincronizacion-pestanas-62-66` | Hydrogen high | 1 |
| b2-aviso-a11y | #65 | `aviso` · `fix/aviso-conflicto-61-65` | Hydrogen high | 1 |
| b3-fecha-torneo | #69 | `issue-69` · `fix/issue-69` | Hydrogen high | 1 |
| b4-pastilla-bloqueado | #70 | `issue-70` · `fix/issue-70` | Hydrogen high | 1 |
| b5-hero-texto-inicial | #71 | `issue-71` · `fix/issue-71` | Hydrogen high | 1 |
| b6-doc-odd | #67 | `issue-67` · `docs/issue-67` | Hydrogen high | 1 |
| b7-choque-celdas | #62 | `nucleo` | Neon high | 2 |
| b8-ultimo-raw-ilegible | #63 | `nucleo` | Neon high | 2 |
| b9-confirmacion-descartada | #61 | `aviso` | Neon high | 2 |
| b10-refactor-sincronizacion | #64 | `nucleo` (con `aviso` fusionada) | Neon high | 3 |

Verifica todos `gemini-4-argon-high`. Los worktrees van en `../ProyectoSportify-worktrees/<nombre>` con `node_modules` como junction.
