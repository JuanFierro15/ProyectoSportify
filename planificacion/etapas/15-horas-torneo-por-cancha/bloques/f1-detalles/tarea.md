
---

# [MODO EJECUTOR] Bloque f1-detalles (etapa 15)

Cuatro arreglos pequeños sobre el trabajo de la etapa 15, ya verificado. Lee
`planificacion/etapas/15-horas-torneo-por-cancha/revision/v1-informe.md`
(sección 2, "Detalles"). No cambies nada más.

## Rutas permitidas
- `src/components/reservas/useReserva.js`
- `src/components/reservas/torneo/formatoJornadas.js`
- `src/lib/codigoReserva.js` y `src/lib/codigoReserva.test.js`
- las pruebas de `src/components/reservas/`, `src/components/reservas/torneo/`
  y `src/components/layout/MisReservas.test.jsx` que haya que ajustar

No hagas commits ni cambies de rama.

## Arreglos
1. **Doble confirmación en el mismo tick** (`useReserva.js`,
   `ejecutarConfirmacion`): agrega un `useRef` (`confirmandoRef`) que se pone
   en `true` al empezar y bloquea una segunda llamada antes del re-render; se
   vuelve a `false` si la reserva es rechazada y en `reiniciar`. Prueba: dos
   `click()` seguidos y síncronos en el botón de confirmar (dentro de un solo
   `act`) crean **una** reserva y el código mostrado es el guardado.
2. **Una sola hora por cancha** (`formatoJornadas.js:46`): con una sola hora
   se muestra la hora puntual (`19:00`), no `19:00 a 20:00`, igual que el
   calendario. Usa `ordenadas.length > 1 && sonHorasSeguidas(ordenadas)`.
   Ajusta las aserciones existentes que esperaban `19:00 a 20:00` en ese caso
   (`Torneo.test.jsx`, `PasoGuardados.test.jsx`, `MisReservas.test.jsx`).
3. **Bloque único sin `torneo.jornadas`** (`formatoJornadas.js:193`): en
   `extraerJornadasDeReserva`, reconstruye `horasPorCancha` también cuando la
   ronda tiene un único bloque con una sola cancha; los bloques viejos de
   varias canchas conservan el formato `inicio a fin (N canchas)`. Agrega una
   prueba con una reserva sin `torneo.jornadas` y una fase de un solo bloque
   de una cancha.
4. **Nombre de cancha en el texto del QR** (`codigoReserva.js`, `textoQr`):
   hoy la línea por fase muestra el id (`padel-1: 16:00, 18:00`). Agrega a
   `textoQr` un parámetro opcional `nombresCanchas` (objeto `{ [id]: nombre }`)
   y úsalo en esa línea (si falta un nombre, el id). En `useReserva.js`, al
   armar el QR, pasa ese mapa con `c.nombre` de las canchas del torneo. Prueba
   en `codigoReserva.test.js`: con el mapa sale `Cancha Pádel 1: 16:00, 18:00`
   y sin él, el id.

## Verificación
`npm test` en verde, `npm run lint` con 0 warnings y `npm run build` OK. No toques ni restaures `api/_lib/__snapshots__/instrucciones.test.js.snap` ni `api/_lib/instrucciones.js`: tienen un cambio legítimo.
Mutación: quita el `confirmandoRef` y confirma que la prueba 1 falla; luego
restaúralo. Responde con los archivos cambiados, el número de pruebas y el
resultado de la mutación.
