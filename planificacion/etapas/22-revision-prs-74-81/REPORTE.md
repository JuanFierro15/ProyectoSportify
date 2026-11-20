# Reporte de la etapa 22: revisión de las PR #74 a #81 (issues #61 a #71)

Responsable: Miguel Medina. Fecha: 20-11-2026. Plan: [PLAN.md](PLAN.md)
(aprobado el 20-11). Rama: `chore/revision-prs-74-81`.

## Veredicto

**Ninguna PR tiene un bug que bloquee la fusión.** Las siete PR de código
corrigen lo que piden sus issues, con todas las pruebas, lint y build en verde,
y el refactor #80 no cambia ningún comportamiento observable. Lo único que
obliga a cambiar el plan de Juan es el **orden de fusión**: #78 y #79 chocan
entre sí.

| PR | Issues | Veredicto |
| --- | --- | --- |
| #74 | #67 | Fusionar (detalle H5). |
| #75 | #69 | Fusionar. |
| #76 | #70 | Fusionar con detalles: mejora 360 y 390 px, pero a 400 px o más "bloqueado" se sigue cortando (H1). |
| #77 | #71 | Fusionar. |
| #78 | #61 y #65 | **No fusionar por separado**: entra dentro de #80 (ver "Orden de fusión"). El código está bien. |
| #79 | #66, #62 y #63 | Fusionar (detalle H2, compartido con #80). |
| #80 | #64 | Fusionar con detalles (H2 y H6). |
| #81 | etapa 21 | Fusionar al final (detalle H4). |

## Orden de fusión (probado)

En un worktree desde `origin/main` (`39d64c7`), con `git merge --no-ff` y suite,
lint y build después de cada paso de código:

| Paso | PR | Conflicto | Pruebas | Lint | Build |
| ---: | --- | --- | --- | --- | --- |
| 1 | #74 | no | (solo docs) | — | — |
| 2 | #75 | no | 515/515 | 0 | ok |
| 3 | #76 | no | 518/518 | 0 | ok |
| 4 | #77 | no | 520/520 | 0 | ok |
| 5 | #79 | no | 540/540 | 0 | ok |
| 6 | #80 | no | 546/546 | 0 | ok |
| 7 | #81 | no | (solo docs) | — | — |

- #78 queda incluida al final (`git merge-base --is-ancestor` da 0): #80 la
  trae con la fusión `498785b`, donde Juan ya resolvió los dos conflictos.
  GitHub marcará #78 como fusionada cuando entre #80.
- El orden de la tabla de Juan (#78 y #79 "en cualquier orden") **falla**:
  `git merge-tree` entre las dos ramas da conflicto en
  `docs/agentes/reservas.md` y
  `src/components/shared/AvisoConflictoReserva.test.jsx`. La segunda que se
  fusionara quedaría en conflicto en GitHub.
- Al fusionar #79, GitHub reapunta #80 a `main` solo si se borra la rama de
  #79; si no, hay que cambiar la base de #80 a mano antes de fusionarla.
- Con commit de fusión (como viene haciendo `main`), no "squash": un squash de
  #79 dejaría a #80 con commits que ya no están en `main`.

## Hallazgos

| ID | PR | Gravedad | Hallazgo | Dónde | Cómo se vio |
| --- | --- | --- | --- | --- | --- |
| H1 | #76 | Conviene arreglar | El arreglo solo aplica con `max-width: 399px`. A **400 px**, "bloqueado" necesita 43 px y la pastilla deja 39 útiles: se ve "bloquead". Solo se midió hasta 400 px, pero como la regla nueva no aplica desde ahí, es probable que también se corte en los anchos de celular más comunes (412, 414 y 430 px); falta medirlo. A 360 px entra justo (37 px de texto en 35 útiles, sin montarse sobre la vecina). Además, las 3 pruebas nuevas de `SelectorDia.test.jsx` pasan igual sin el arreglo: jsdom no mide CSS. | `src/components/shared/SelectorDia.css` (media query nueva) | v3 R2 (`R2-asistente-bloqueado-360.png` y `R2-asistente-bloqueado-400-intento1.png`) y RED de v1 |
| H2 | #79, #80 | Conviene arreglar (no se llega desde la interfaz) | `aplicarHorasDeReservas` (repone en `ocupados` las horas de las reservas guardadas) solo se aplica en `renovarSiCambioElDia`. El listener `storage` y `leerEstadoFresco` arman la base solo con `fusionarConSemilla`. Si lo guardado trae una reserva `Rb` sin su hora en `ocupados`, la pendiente que choca se descarta bien, pero la hora queda **libre** con `Rb` activa: se podría reservar dos veces. Igual que en la #62, solo pasa con datos guardados incompletos (versión anterior o editados a mano). El refactor dice unificar los caminos, pero esta reparación quedó en uno solo. | `src/context/ReservasContext.jsx`, `alCambiarStorage` y `leerEstadoFresco` (base de `sincronizarConLeido`) | Sonda N1 de v2 (falla en #79 y en la integración); causa leída en el código |
| H3 | todas | Detalle (ya existía) | `npm test` deja modificado `api/_lib/__snapshots__/instrucciones.test.js.snap` en todas las ramas, `main` incluida (fin de línea con `autocrlf`). Ensucia el árbol en cada corrida y ya hizo escalar dos ciclos de la etapa 21. | snapshot | v1, todas las corridas |
| H4 | #81 | Detalle | El reporte de la etapa 21 da como orden de fusión "#78 y #79 en cualquier orden", que no funciona (ver arriba). | `planificacion/etapas/21-issues-61-71/REPORTE.md`, "Pendientes" | `git merge-tree` |
| H5 | #74 | Detalle | El `L2` del log sigue diciendo "Rama `fix/issues-53-54-55-56` creada", la rama inexistente que la #67 pedía quitar (el encabezado ya se corrigió). Los 12 commits que cita la tabla existen y corresponden. | `odd/tasks/issues-53-54-55-56.md`, `L2` | lectura |
| H6 | #80 | Detalle | `aplicarCancelacion` ahora delega en `quitarReservasDeEstado`, que conserva entradas `null` de `reservas` (antes se filtraban). Solo afecta a datos corruptos; con datos normales es equivalente porque los eventos no se pueden cancelar. | `src/lib/cancelacion.js` | `judgment-day` (J3) |

No se encontró código muerto ni duplicado nuevo: nada fuera de
`cancelacion.js` usa `horasUsadasEnCelda`, `conservarReservasSinGuardar` ya no
aparece en código ni en docs, y las 74 pruebas de `ReservasContext.test.jsx`
no repiten nombres.

## Verificación

### Línea base (`v1`, `agy` con `gemini-4-hydrogen-high`)

| Ref | Archivos | Casos | Lint | Build |
| --- | --- | --- | --- | --- |
| `origin/main` (`39d64c7`) | 39 | 511/511 | 0 | ok |
| #75 (`5fe9c7d`) | 39 | 515/515 | 0 | ok |
| #76 (`28f5040`) | 40 | 514/514 | 0 | ok |
| #77 (`c663e51`) | 39 | 513/513 | 0 | ok |
| #78 (`89c4514`) | 39 | 517/517 | 0 | ok |
| #79 (`40c992f`) | 39 | 531/531 | 0 | ok |
| #80 (`d57e955`) | 39 | 537/537 | 0 | ok |
| Integración (`8c8b74f`) | 40 | 546/546 | 0 | ok |

#74 y #81 solo tocan documentos (`odd/` y `planificacion/`). Ninguna rama
cambia dependencias. Sin avisos de `act(...)`, ni `skip`/`only`. Detalle:
`revision/v1-pruebas.md`.

### RED

- **Fallan sin el arreglo, como deben:** las 4 de #75, 1 de 2 de #77, 5 de 6
  de #78 y 10 de 19 de #79.
- **Pasan sin el arreglo, y está bien:** la de reducción de movimiento de
  #77, la de control de #78 ("otro código"), las 9 de la #66 (la issue pedía
  justamente fijar casos de riesgo que ya funcionaban) y 3 de #62/#63, que
  quedan como regresión.
- **#76:** las 3 pasan sin el arreglo (H1).
- **#80 (refactor):** las 96 pruebas de los 3 archivos de sincronización
  pasan igual antes (`498785b`) y después (`d57e955`).

### Sondas adversariales (`v2`, 24 casos)

| Versión | Pasan | Fallan |
| --- | --- | --- |
| `main` | 18 | S13, N1, N2, N3, N4, N5 |
| #79 | 21 | N1 (H2); N2 y N3 solo porque `codigo` en los avisos llega con #78 |
| Integración | 23 | N1 (H2) |

- Las 14 sondas de la etapa 20 pasan todas en la integración (S13, que fallaba
  en `main`, es la #62 corregida).
- #79 y la integración dan lo mismo salvo lo que trae #78: el refactor no
  cambió nada.
- Copia de las sondas nuevas en `revision/v2-sondas-e22.test.jsx.txt`.
  Detalle: `revision/v2-sondas.md`.

### Mapa de impacto (explorador `haiku`)

- `api/` no importa `cancelacion.js` ni `ReservasContext.jsx`: el servidor del
  chat no se ve afectado. El plan suponía lo contrario; la sonda N9 cubrió la
  cancelación desde el chat con `useReservas().cancelar`.
- `SelectorDia` se usa en los modos cancha y cumpleaños (`FormularioReserva`)
  y en el calendario del torneo (escritorio y asistente móvil): H1 afecta a
  los tres a 400 px o más, aunque solo el estado "bloqueado" del torneo es lo
  bastante largo para cortarse.
- `textoRangoFechas` solo se usa en `useReserva.js`. Era el único lugar que
  armaba el rango de fechas del torneo (confirmación y QR), así que #75 lo
  cubre todo. "Mis reservas" no muestra rango: pone la fecha de cada jornada
  con `fechaCompleta`.

### App real (`v3`, `npm run preview` local de la integración)

| Recorrido | Resultado |
| --- | --- |
| R1 primer hero (#71), 1440 y 390 px, con y sin reducción de movimiento | Sí: el primero con `opacity: 1` al cargar, los otros ocultos, vuelve a verse al subir |
| R2 selector de día (#70), 360/390/400/1440 px | Parcial: H1 |
| R3 torneo el mismo día y en días distintos (#69) | Sí: "Sábado 21 de noviembre · 2 jornadas" y "Sábado 21 de noviembre a Domingo 22 de noviembre" |
| R4 reserva de 1 y 3 horas, validaciones | Sí: descuento de $15.000, mensajes de nombre y teléfono |
| R5 confirmación descartada entre dos pestañas (#61, #65), cancha y cumpleaños, 1440 y 390 px | Sí: un solo `role="alert"` sin `aria-live`, foco en el título, sin QR, "Elegir otro horario" conserva nombre y teléfono y deja la hora deshabilitada |
| R6 cancelar en una pestaña y ver la hora libre en la otra | Sí, sin recargar |
| R7 torneo completo en el asistente móvil (390 px) | Sí |
| R8 consola | 0 errores y 0 avisos de la aplicación |

El coordinador revisó las capturas clave una por una (R1 a 390, R2 a 360 y
400, R5 descartada): son reales y coinciden con las mediciones. Están en
`revision/v3/`.

### Segunda opinión (`judgment-day`)

Dos jueces ciegos sobre `git diff 39d64c7 d57e955` de `ReservasContext.jsx` y
`cancelacion.js`: **APPROVED**, sin defectos graves. El único aviso que
coincidió en los dos (pruebas y docs con el nombre borrado) era un falso
positivo: ellos no veían esos archivos, y #80 sí los actualiza. Detalle:
`revision/judgment-day.md`.

## Revisión del código (coordinador)

- **#75:** `textoRangoFechas` es pura y está probada con mismo día, días
  distintos y cambio de mes. El orden de los bloques lo garantiza el bloqueo
  cronológico de fases.
- **#77:** el `gsap.set` va dentro del `mm.add`, así que `mm.revert()` lo
  limpia. La línea de tiempo sigue durando 1 (la salida termina en 1), y la
  prop tiene valor por defecto y está en las dependencias del efecto.
- **#78:**
  - un evento es un solo registro con todos sus `bloques`, así que el choque
    lo descarta entero; no puede quedar medio torneo guardado con la pantalla
    diciendo que no se completó;
  - la marca `descartada` es permanente;
  - `esLibre` mira todas las canchas del evento;
  - los tokens `--aviso-*` están en `App.css`;
  - el texto visible usa tuteo y no menciona detalles técnicos.
- **#79/#80:**
  - los cuatro caminos (storage, clave borrada, `leerEstadoFresco` y cambio de
    día) pasan por `sincronizarConLeido`;
  - `despachar` registra las altas y las cancelaciones al despachar, y una
    cancelación de algo nunca guardado solo lo saca del registro de altas;
  - con lo último guardado ilegible, `idsDeRawStorage` da `null` y solo cuentan
    los ids registrados (#63);
  - las pruebas que cambia #80 solo renombran C10.
- **Commits:** en español, con prefijo y sin menciones a IA ni coautorías.

## Desvíos del plan

- **Previews de Vercel:** están protegidos con Vercel Authentication (302,
  igual que en la etapa 20). La app real se probó con `npm run preview` local
  de la integración.
- **Chatbot:** no se probó en vivo, porque `preview` no tiene `/api/chat`. Las
  PR no tocan `api/` y la cancelación del chat quedó cubierta por la sonda N9.
- **Un solo worktree de pruebas** (`.claude/worktrees/e22-rev`) en lugar de
  uno por PR. Ninguna rama cambia dependencias.
- **v3 se relanzó una vez:** el sistema cortó el primer intento por falta de
  memoria. El segundo se lanzó con 1,1 GB libres, con reglas para gastar poca
  RAM y escribiendo el informe a medida que avanzaba. La instrucción del primer
  intento quedó en `bloques/v3-app-real/instruccion-intento1.md`.
- **El push de la rama** lo rechazó la herramienta por permisos: los commits
  de esta etapa están solo en local.

## Pendientes

- **Fusionar** en el orden probado: #74 a #77, después #79, #80 y #81. #78
  entra con #80.
- **Abrir dos issues nuevas**, si el equipo está de acuerdo: H1 (pastillas a
  400 px o más) y H2 (`aplicarHorasDeReservas` solo en el cambio de día).
  H3 a H6 son detalles.
- **Pruebas manuales que quedan:**
  - lector de pantalla (NVDA o Narrador) sobre el aviso de #65;
  - reserva descartada **dentro del asistente móvil del torneo** (#61), para
    ver a qué paso vuelve "Elegir otro horario": R5 cubrió cancha y cumpleaños,
    no un torneo a 390 px;
  - el chat en producción después de fusionar.
- **Sigue abierta la #73** (comprobante del chat con la misma contradicción
  que la #61).
