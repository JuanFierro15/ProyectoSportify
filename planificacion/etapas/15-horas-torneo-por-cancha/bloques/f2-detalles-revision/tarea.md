
---

# [MODO EJECUTOR] Bloque f2-detalles-revision (etapa 15)

Detalles de la revisión del PR #29. No cambies nada más.

## Rutas permitidas
- `src/components/reservas/torneo/AlertaTiempo.jsx` y `CalendarioTorneo.jsx` (solo las props que se pasan a `AlertaTiempo`)
- `src/components/reservas/torneo/PasoGuardados.jsx`
- `src/components/reservas/useReserva.js`
- `src/components/reservas/torneo/DialogoHorasSinPartido.test.jsx`, `src/components/reservas/Torneo.test.jsx`, `src/components/reservas/torneo/PasoGuardados.test.jsx`, `src/components/reservas/torneo/CalendarioTorneo.test.jsx`

Prohibido `src/lib/`, `src/context/`, `api/`, `docs/`, `README.md`. No toques `api/_lib/__snapshots__/`. No hagas commits.

## Arreglos
1. **`AlertaTiempo` mezcla unidades.** `validarJornadas` da `disponibles` y
   `deficit` en minutos de cancha sumados, pero el título usa
   `fase.minutosRequeridos` (reloj, en paralelo); sale "Reservaste 120 min:
   faltan 40 min" cuando 80 alcanzaría en reloj. Cambia el detalle para que
   use `partidosSinUbicar` (pásalo desde `CalendarioTorneo` con `val.partidosSinUbicar`):
   `Con las horas marcadas faltan turnos para ${k} ${k === 1 ? 'partido' : 'partidos'} (cada turno incluye desempate y transición).`
   y muestra el aviso cuando `partidosSinUbicar > 0` (si no llega la prop,
   usa `deficit > 0` como hoy). Deja el título como está. Ajusta y agrega
   pruebas con el texto exacto (caso 1 partido y caso 2 partidos).
2. **`PasoGuardados.jsx:2,42-49`** importa `src/data/canchas.json` para los
   nombres: usa la prop `canchas` que ya recibe (con respaldo al id si no
   está) y quita el import.
3. **Canchas sin horas en el comprobante** (`useReserva.js:~1188` y
   `~1259`): en torneo, `canchaIds`/`canchasNecesarias` del payload y
   `nombresCanchas` del QR y la confirmación deben ser solo las canchas que
   tienen horas en algún bloque (en el orden del torneo). Prueba: torneo con
   3 canchas elegidas y horas solo en 2 → la confirmación y el QR nombran 2.
4. **`faseARevisar` se re-aplica** (`CalendarioTorneo.jsx:45,59`): al volver
   al paso Fechas en móvil, la pestaña revisada se activa y enfoca otra vez.
   Aplícalo solo cuando cambie la marca (`marcaFaseARevisar`) respecto de la
   última aplicada (guárdala en un `useRef` del calendario inicializado con la
   marca actual al montar). Prueba: montar con una marca ya aplicada no mueve
   el foco.
5. **Pruebas:** quita la línea `keyDown Escape` suelta en
   `DialogoHorasSinPartido.test.jsx:63` (prueba de Tab y Shift+Tab), y en
   `Torneo.test.jsx` (prueba 19, ~1979-1980) quita el "segundo clic" sobre
   un botón que ya salió del DOM (la prueba 21 cubre el doble disparo).

## Verificación
`npm test` en verde, `npm run lint` con 0 warnings, `npm run build` OK.
Responde con los archivos cambiados y el número de pruebas.
