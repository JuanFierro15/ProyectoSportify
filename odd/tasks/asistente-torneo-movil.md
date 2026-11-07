# Asistente por pasos del modo torneo en móvil

Objetivo: en pantallas menores a `large` (< 64em), el modo torneo de la página de reserva muestra un paso a la vez en lugar de toda la configuración apilada.
Rama base: `feat/asistente-torneo-movil` · Entrega: dos PR a `main` en paralelo (frente A: Juan; frente B: Miguel, issue en GitHub) · Pruebas: `npm test` (Vitest + Testing Library) y `npm run lint`.

## Specs

- **S1 — Pedido.** "Me gusta la opción grande que muestre un paso a la vez en móvil". Problema original: "en la vista del móvil en la ventana de reservas al escoger el modo torneo se hace muy larga, ejemplo toca scrollear mucho para llegar a las brackets y hay mucha información, en la parte web se ve bien".
- **S2 — Alcance.** Solo modo torneo y solo bajo `large`: `(max-width: 63.9375em)`, el mismo corte de `EventoCTA.css` y `Ubicacion.css`. En escritorio (>= 64em) la página se ve y se comporta exactamente como hoy. Los modos Cancha y Cumpleaños no cambian en ningún tamaño.
- **S3 — Pasos (decisión de diseño).** Seis pasos, en este orden e ids:
  1. `canchas` "Canchas": pestañas por deporte, filtro, carrusel y `CanchasElegidas`.
  2. `formato` "Formato": número de equipos, duración por partido con su nota y desempate.
  3. `fechas` "Fechas por fase": `CalendarioTorneo`, capacidad y tiempo estimado, y `AlertaTiempo` cuando aplica.
  4. `llaves` "Llaves": emparejamiento (aleatorio/manual, volver a sortear, `AsignacionManual`) y el `Bracket` de `SeccionLlaves`.
  5. `datos` "Tus datos": nombre y teléfono.
  6. `resumen` "Resumen": `VoucherReserva` con el botón de confirmar y, si hay, "Torneos reservados".
  El título de la página y `SelectorModo` se ven en todos los pasos; las pestañas de deporte y el filtro solo en `canchas`.
- **S4 — Completitud.** Cada paso está completo con las mismas reglas que hoy usa `IndicadorPasos` (canchas, formato, fechas, llaves, datos). `resumen` está completo cuando `reserva.puedeConfirmar` es verdadero. La regla queda en una función pura con tests.
- **S5 — Navegación.** Barra inferior fija con "Anterior" y "Siguiente" y el texto "Paso N de 6". "Siguiente" se deshabilita mientras el paso actual esté incompleto y se muestra el motivo en texto. En el último paso, el botón principal es el de confirmar del voucher. El indicador de pasos permite saltar a cualquier paso completo o al primero incompleto. Al cambiar de paso, la vista sube al inicio del asistente y el foco va al título del paso.
- **S6 — Estado.** Cambiar de paso, de pestaña de deporte o pasar de móvil a escritorio (rotar, redimensionar) no pierde nada de lo elegido: todo sigue en `useReserva`. Al montar la página, el asistente arranca en `canchas`.
- **S7 — Contrato entre frentes.** `FormularioReserva` acepta la prop opcional `seccion`, con los valores `'formato' | 'fechas' | 'llaves' | 'datos' | 'guardados'`. Sin `seccion`, renderiza todo exactamente como hoy (escritorio y los otros modos). Con `seccion`, solo renderiza ese bloque del modo torneo (`guardados` = "Torneos reservados"). Lo implementa el frente B; el frente A solo lo consume. Mientras el frente B no esté, el asistente funciona igual (el formulario aún ignora la prop).
- **S8 — Contenido legible en 390 px.** El contenido de cada paso cabe a 390 px de ancho sin scroll horizontal de la página. El bracket puede desplazarse horizontalmente dentro de su propio contenedor, con las rondas legibles.
- **S9 — Calidad.** Accesibilidad: el paso actual con `aria-current="step"`, botones con texto claro y tuteo, nada de copy técnico. Tests por cada regla nueva; `npm test` y `npm run lint` sin errores ni warnings. README y capturas actualizados al cerrar (`modo-torneo` en móvil).

Supuesto: cada paso no crea una entrada en el historial del navegador; el botón "atrás" del navegador sigue saliendo de la página como hoy.

## Tasks

| ID | Specs | Frente | Ruta | Estado | Commit |
|---|---|---|---|---|---|
| A1 | S3, S4 | A (Juan) | agy | hecho | f752905 |
| A2 | S5, S6 | A (Juan) | agy | hecho | c1a812c |
| A3 | S2, S3, S5, S7 | A (Juan) | agy | hecho | 972854b |
| B1 | S7 | B (Miguel) | issue #6 | pendiente | |
| B2 | S8 | B (Miguel) | issue #6 | pendiente | |
| C1 | S9 | A tras unir A y B | inline | pendiente | |

- **A1.** `src/lib/pasosTorneo.js` (JS puro): `PASOS_TORNEO` (ids y etiquetas de S3), `estadoPasosTorneo(reserva)` → `[{ id, etiqueta, completo, motivo }]` y `pasosAlcanzables(estados)` (regla de salto de S5), con `src/lib/pasosTorneo.test.js`. `IndicadorPasos` pasa a usarla: en escritorio sigue mostrando los mismos 5 pasos de hoy.
- **A2.** `src/components/reservas/torneo/useAsistenteTorneo.js`: `esMovil` con `matchMedia('(max-width: 63.9375em)')` (escucha cambios), paso actual, `siguiente`, `anterior`, `irA(id)` respetando `pasosAlcanzables`; foco y scroll al cambiar de paso. Tests con `renderHook`.
- **A3.** `src/components/reservas/torneo/AsistenteTorneo.jsx` + `.css` (encabezado del paso, indicador clicable, contenido y barra inferior fija con safe-area) e integración en `VistaCanchas.jsx`/`.css`: con modo torneo y `esMovil`, renderiza solo el paso actual según S3; si no, el layout de hoy. Tests en `AsistenteTorneo.test.jsx`.
- **B1.** Prop `seccion` de S7 en `FormularioReserva.jsx`; se recomienda extraer cada bloque del modo torneo a su componente en `src/components/reservas/torneo/` (`PasoFormato.jsx`, etc.). Tests en `src/components/reservas/FormularioReserva.test.jsx`: sin `seccion` se ve todo, y con cada valor solo su bloque.
- **B2.** CSS móvil del contenido de los pasos: `FormularioReserva.css`, `torneo/CalendarioTorneo.css`, `torneo/Bracket.css`, `torneo/SeccionLlaves.css` (y el CSS de los componentes nuevos de B1). Escritorio sin cambios.
- **C1.** Prueba de costura con las dos ramas unidas (suite completa, lint, build, revisión a 390×844 y 1440×900), README, capturas y `AGENTS.md`.

Superficies separadas: el frente A no toca `FormularioReserva.*`, `CalendarioTorneo.*`, `Bracket.*` ni `SeccionLlaves.*`; el frente B no toca `VistaCanchas.*`, `IndicadorPasos.*`, `AsistenteTorneo.*`, `useAsistenteTorneo.js` ni `src/lib/pasosTorneo.*`. `Torneo.test.jsx` no lo modifica ninguno de los dos hasta C1.

## Log

- **L1 (2026-11-07, Juan):** "Me gusta la opción grande que muestre un paso a la vez en móvil, no te preocupes por el tiempo de sustentación para poder realizar este nuevo feature dividelo para que miguel y nosotros podamos hacerlo al mismo tiempo, entonces arma lo necesario que tenemos que implementar y le dejas lo pendiente a miguel a traves de github"
- **L2:** Mapa actual en móvil (`VistaCanchas.jsx:500-655`): indicador, carrusel, canchas elegidas, formulario completo del torneo, voucher y, de último, `SeccionLlaves`. `IndicadorPasos` ya calcula la completitud de 5 pasos, pero no navega. Pronóstico: unas 800 líneas en total (A unas 550, B unas 300); dos PR, uno por frente.
- **L3 (2026-11-07):** Las instrucciones del proyecto pasan a `AGENTS.md` versionado y `CLAUDE.md` queda como `@AGENTS.md` (`f3915c4` en `main`, integrado en la rama con `ef66f4f`). Miguel ya no necesita una copia local.
- **L4 (2026-11-07):** Frente A entregado por agy (A1 a A3). En la revisión se corrigieron dos fallas: el botón flotante del chat tapaba "Siguiente" (ahora la barra publica `--alto-barra-inferior` en `<html>` y `Chatbot.css` sube el botón y el panel esa distancia; sin asistente vale 0) y "Limpiar selección" en el Resumen dejaba el asistente en un paso inalcanzable (ahora vuelve al primer paso incompleto). RED observado en ambos tests antes del arreglo. `Chatbot.css` se agregó a la superficie del frente A. Verificación: `npm test` 19 archivos y 220 tests pasan; `npm run lint` sin errores ni warnings; `npm run build` correcto. Pendiente: revisión visual a 390×844 y 1440×900, que queda para C1. Mientras no esté B1, cada paso muestra el formulario completo.
