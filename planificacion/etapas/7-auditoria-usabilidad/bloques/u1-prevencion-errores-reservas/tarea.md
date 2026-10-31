
# Tarea: prevención proactiva de errores en selección de canchas, cruces y horarios (`u1-prevencion-errores-reservas`)

## Objetivo

Resolver los hallazgos `P0-03`, `P0-04`, `P1-04`, `P1-06`, `P1-07` y `P2-05` de la auditoría de usabilidad en el flujo de reservas y torneos:
1. Prevenir que en modo Torneo se agreguen más de `MAX_CANCHAS_TORNEO` (3) canchas deshabilitando el botón de agregar en tarjetas no seleccionadas cuando el cupo ya está lleno (`P0-03`).
2. Realizar un intercambio automático (*swap*) en `cambiarCruceManual` cuando el usuario selecciona un equipo que ya estaba asignado en otra posición del bracket manual, evitando caer en el estado de error de equipos duplicados (`P0-04`).
3. Añadir `aria-label` descriptivo en `SelectorDia` y deshabilitar días con `0 libres` cuando ya hay canchas seleccionadas (`P1-04`).
4. Mostrar el resumen en vivo de la franja horaria seleccionada (ej. `14:00 a 16:00 · 2 h`) en `FormularioReserva` y `CalendarioTorneo`, junto con una pista breve para explicar cómo seleccionar rangos de varias horas (`P1-06`).
5. Añadir acción rápida de 1 clic en `AlertaTiempo` (ej. botón para bajar la duración por partido a 15 min cuando `duracionPartido > 15`) (`P1-07`).
6. Limitar el input `invitados` en modo Cumpleaños (`min="1" max="100"`, `placeholder="Ej. 20"`) (`P2-05`).

## Rutas

- Modificar:
  - `src/components/reservas/useReserva.js`
  - `src/components/reservas/torneo/AsignacionManual.jsx`
  - `src/components/reservas/torneo/AlertaTiempo.jsx`
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`
  - `src/components/reservas/FormularioReserva.jsx`
  - `src/components/reservas/TarjetaCanchaCarrusel.jsx`
  - `src/components/shared/SelectorDia.jsx`
- Leer (sin modificar):
  - `src/lib/torneo.js`
  - `src/lib/horarios.js`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/components/reservas/useReserva.js`

- En `cambiarCruceManual(indice, valor)`:
  - Convierte `const num = valor === '' ? null : Number(valor);`.
  - Si `num != null`, busca si ya existe otra posición `idxPrevio !== indice` en `prev` donde `Number(prev[idxPrevio]) === num`.
  - Si existe `idxPrevio !== -1` y `prev[indice] != null`, intercambia automáticamente: `copia[idxPrevio] = prev[indice]` y `copia[indice] = num`.
- Expón una propiedad booleana derivada `topeCanchasAlcanzado = modo === 'torneo' && canchaIds.length >= MAX_CANCHAS_TORNEO` en el objeto retornado por `useReserva`.

### 2. `src/components/reservas/TarjetaCanchaCarrusel.jsx`

- Recibe la prop opcional `bloqueadaPorTope = false`.
- Si `!seleccionada && bloqueadaPorTope`, deshabilita el botón `.cancha-carrusel__cta` (`disabled={true}`) y muestra el texto `'Máx. 3 canchas'`.

### 3. `src/components/reservas/torneo/AsignacionManual.jsx`

- Actualiza el texto de ayuda para indicar que elegir un equipo ya asignado intercambia su posición automáticamente con el cruce actual.

### 4. `src/components/shared/SelectorDia.jsx`

- Agrega un `aria-label` claro a cada botón de día (ej. `${etiquetaDia(iso, dias)} ${d.getDate()} de ${MES_CORTO[d.getMonth()]}${bloqueado ? ', bloqueado' : libres != null ? (lleno ? ', completo' : `, ${libres} libres`) : ''}`).

### 5. `src/components/reservas/torneo/CalendarioTorneo.jsx`, `src/components/reservas/torneo/AlertaTiempo.jsx` y `src/components/reservas/FormularioReserva.jsx`

- En `FormularioReserva.jsx`:
  - Junto a `"2. Elige el horario (franjas de 1 hora consecutivas)"`, si `horasSel.length > 0`, muestra el rango activo: `${horasSel[0]} a ${finDeFranja(horasSel[horasSel.length - 1])} (${horasSel.length} h)`.
  - En el input de `Invitados` (modo `cumpleanos`), añade `max="100"` y `placeholder="Ej. 20"`.
  - Pasa `duracionPartido` y `onCambiarDuracion={setDuracionTorneo}` a `CalendarioTorneo` y `AlertaTiempo`.
- En `CalendarioTorneo.jsx`:
  - Añade una nota breve de ayuda indicando: `"Para elegir 2 o más horas seguidas, toca la hora de inicio y luego la hora final."`.
- En `AlertaTiempo.jsx`:
  - Si recibe `onCambiarDuracion` y `Number(duracionPartido) > 15`, muestra un botón compacto `"Cambiar a 15 min por partido"` que invoque `onCambiarDuracion(15)`.

## Verificación al terminar

- Ejecuta `npx vitest run` y verifica que todas las suites pasen.
- Ejecuta `npm run lint` y verifica 0 errores.
