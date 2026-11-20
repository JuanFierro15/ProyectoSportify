# Informe v2 — Sondas adversariales sobre la cadena de PR #57 a #60

- **Punta evaluada:** `origin/fix/issue-54` (`cffe519`, con #50, #51, #53, #54, #55 y #56)
- **Base comparada:** `origin/main` (`src/context/ReservasContext.jsx` y `src/lib/cancelacion.js`)
- **Archivo de sondas:** [v2-sondas.test.jsx.txt](./v2-sondas.test.jsx.txt)
- **Comando ejecutado:** `npx vitest run src/verificacion --reporter=verbose`

## 1. Resumen de resultados

| Caso | Punta (`origin/fix/issue-54`) | `origin/main` | Nota |
|---|---|---|---|
| S1 | Pasa | Falla | En `main`, la cancelación de `R1` sin guardar reaparece al llegar `storage` (3 reservas en lugar de 2). |
| S2 | Pasa | Falla | En `main`, la cancelación de `R1` sin guardar reaparece junto con `R2` y `Rb` (3 reservas en lugar de 2). |
| S3 | Pasa | Falla | En `main`, `reservas` llega bien a `['SPF-S3B001']`, pero falla en la aserción de `avisosConflicto` porque esa propiedad no existe (`undefined`) en `main`. |
| S4 | Pasa | Falla | En `main`, al chocar `R` pendiente con `Rb`, conserva ambas en `16:00` (`['SPF-S4B001', 'SPF-V2NCL3']`). |
| S5 | Pasa | Falla | En `main`, `aplicarCancelacion` quita `'14:00'` de `ocupados` aunque otra reserva activa (`Y`) siga usando esa misma hora. |
| S6 | Pasa | Falla | En `main`, al borrar la clave con `removeItem`, se pierde la reserva pendiente sin guardar (`[]` en vez de `['SPF-ZR9H6L']`). |
| S7 | Pasa | Falla | En `main`, la lógica previa de recuperación/merge conserva `R1`, `R2`, `R3` y `Rb`, pero falla al comprobar `avisosConflicto` porque no existe en `main`. |
| S8 | Pasa | Falla | En `main`, la reserva hecha en `startTransition` se pierde si llega `storage` en el mismo `act` (1 reserva en lugar de 2). |
| S9 | Pasa | Falla | En `main`, tras `focus` en el cambio de día, reaparece `G` cuya cancelación no se había guardado (3 reservas en lugar de 2). |
| S10 | Pasa | Pasa | Tanto la punta como `main` ignoran JSON inválido e infieren `tipo` (`individual` / `evento`) en registros sin `tipo`. |
| S11 | Pasa | Falla | En `main`, `reservas` sobrevive en ese flujo pero falla en la aserción de `avisosConflicto` porque es `undefined` en `main`. |
| S12 | Pasa | Pasa | Caso feliz completo (1 h, 3 h, cumpleaños, cancelar 1 h y `storage` con `Rb`) sin afirmaciones sobre `avisosConflicto`; pasa igual en ambos. |
| S13 | **Falla** | Falla | Subcaso 1 pasa en punta; la **variante sin clave de fecha en `ocupados['padel-1']`** falla en punta dejando dos reservas en `16:00` y sin registrar el conflicto. En `main` falla ya en el subcaso 1 por duplicar en `16:00`. |
| S14 | Pasa | Pasa | Tanto JSON corrupto + cambio de día + `storage` válido sin `R1`, como clave borrada + `setItem` fallando + `storage` válido con `Rb`, pasan en ambos. |

## 2. Fallos en la punta (`origin/fix/issue-54`)

### S13: choque en el cambio de día (variante sin la clave de esa fecha en `ocupados['padel-1']`)

- **Valor esperado:**
  - `tab2.result.current.reservas.map((r) => r.codigo)` igual a `['SPF-S13B02']` (una sola reserva en la celda `padel-1`, `dia3b`, `16:00`, con `R2` descartada).
  - `16:00` ocupada (`disponible: false`) y 1 aviso en `avisosConflicto` con el código de `R2`.
- **Valor obtenido (salida real de Vitest):**

```text
 FAIL  src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S13: choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados)
AssertionError: expected [ 'SPF-S13B02', 'SPF-V38KYV' ] to deeply equal [ 'SPF-S13B02' ]

- Expected
+ Received

  [
    "SPF-S13B02",
+   "SPF-V38KYV",
  ]

 ❯ src/verificacion/sondas.test.jsx:1036:63
    1034|     });
    1035|
    1036|     expect(tab2.result.current.reservas.map((r) => r.codigo)).toEqual(…
       |                                                               ^
    1037|     expect(horaDisponible(tab2.result, 'padel-1', dia3b, '16:00')).toB…
    1038|     assertUnAvisoConCodigo(tab2.result, resR2.codigo);
```

- **Por qué la sonda está bien escrita:**
  - Usa únicamente la interfaz pública (`ReservasProvider`, `useReservas`, `STORAGE_KEY`), simula el fallo de `setItem` con `vi.spyOn(Storage.prototype, 'setItem')` y el reloj con `vi.useFakeTimers({ toFake: ['Date'] })`, exactamente como los tests de `#50`, `#53` y `#55` en `src/context/ReservasContext.test.jsx`.
  - La escritura de la otra pestaña se construye clonando el JSON guardado inicial (`base2`), eliminando la clave `otro2.ocupados['padel-1'][dia3b]` y añadiendo `rb2` (`padel-1`, `dia3b`, `['16:00']`) en `otro2.reservas`, sin despachar evento `storage`, y luego avanzando a `D+1` y despachando `window.dispatchEvent(new Event('focus'))`, tal como pide el escenario de S13.
  - La causa real del fallo en la punta está en `src/context/ReservasContext.jsx`: `renovarSiCambioElDia` pasa `ocupados: desdeStorage.ocupadosCrudos` sin fusionar y `conciliarReservasSinGuardar` solo comprueba choques mirando `ocupados[canchaId][fecha]` (no las celdas de `guardado.reservas`). Al faltar `ocupados['padel-1'][dia3b]`, `ocupadasDia` es `undefined`, `choca` evalúa a `false` y la reserva pendiente `R2` (`SPF-V38KYV`) queda aceptada junto a `Rb2` (`SPF-S13B02`) en la misma hora.

## 3. Salidas completas de Vitest

### Corrida en la punta (`origin/fix/issue-54`)

```text
 RUN  v5.0.4 <carpeta temporal del job>/rev

 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S1: alta y cancelación sin guardar, luego storage con Rb 27ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S2: orden inverso (cancelar R1 y luego reservar R2 en 14:00) sin guardar, luego storage con R1 y Rb 10ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S3: cancelar una reserva pendiente que nunca se guardó, luego storage con Rb 5ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S4: choque de pendiente R con Rb en la misma celda, aviso descartable y sin duplicar al repetir storage 6ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S5: horas compartidas con aplicarCancelacion y quitarReservasDeEstado (incluyendo última hora del día y evento con bloques) 2ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S6: borrar la clave con y sin pendientes (removeItem, clear, y pendiente que sobrevive y se guarda una sola vez) 8ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S7: setItem falla con R1 y R2, se restaura con R3 y luego storage suma Rb sin duplicados 4ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S8: startTransition + storage en el mismo act (dos veces seguidas) y variante cancelando en startTransition 6ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S9: cambio de día con reserva pendiente R, cancelación pendiente de G y escritura externa con G y Rb 5ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S10: datos raros — JSON inválido no rompe ni cambia reservas, y formato viejo sin tipo se infiere 4ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S11: pestaña que arranca sin clave y sin setItem desde antes de montar 4ms
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S12: caso feliz sin errores (1h, 3h, cumpleaños, cancelar 1h y storage con Rb; sin afirmar avisosConflicto) 7ms
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S13: choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados) 15ms
   → expected [ 'SPF-S13B02', 'SPF-V38KYV' ] to deeply equal [ 'SPF-S13B02' ]
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S14: JSON corrupto + cambio de día + estado válido sin R1, y variante con clave borrada + setItem fallando 7ms

 Test Files  1 failed (1)
      Tests  1 failed | 13 passed (14)
```

### Corrida en `origin/main`

```text
 RUN  v5.0.4 <carpeta temporal del job>/rev

 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S1: alta y cancelación sin guardar, luego storage con Rb 33ms
   → expected [ { tipo: 'individual', …(15) }, …(2) ] to have a length of 2 but got 3
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S2: orden inverso (cancelar R1 y luego reservar R2 en 14:00) sin guardar, luego storage con R1 y Rb 7ms
   → expected [ { tipo: 'individual', …(15) }, …(2) ] to have a length of 2 but got 3
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S3: cancelar una reserva pendiente que nunca se guardó, luego storage con Rb 5ms
   → avisosConflicto debe existir y ser un arreglo: expected false to be true // Object.is equality
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S4: choque de pendiente R con Rb en la misma celda, aviso descartable y sin duplicar al repetir storage 5ms
   → expected [ 'SPF-S4B001', 'SPF-V2NCL3' ] to deeply equal [ 'SPF-S4B001' ]
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S5: horas compartidas con aplicarCancelacion y quitarReservasDeEstado (incluyendo última hora del día y evento con bloques) 1ms
   → expected [ '12:00' ] to include '14:00'
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S6: borrar la clave con y sin pendientes (removeItem, clear, y pendiente que sobrevive y se guarda una sola vez) 8ms
   → expected [] to deeply equal [ 'SPF-ZR9H6L' ]
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S7: setItem falla con R1 y R2, se restaura con R3 y luego storage suma Rb sin duplicados 4ms
   → avisosConflicto debe existir y ser un arreglo: expected false to be true // Object.is equality
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S8: startTransition + storage en el mismo act (dos veces seguidas) y variante cancelando en startTransition 4ms
   → expected [ { tipo: 'individual', …(9) } ] to have a length of 2 but got 1
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S9: cambio de día con reserva pendiente R, cancelación pendiente de G y escritura externa con G y Rb 5ms
   → expected [ { tipo: 'individual', …(15) }, …(2) ] to have a length of 2 but got 3
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S10: datos raros — JSON inválido no rompe ni cambia reservas, y formato viejo sin tipo se infiere 4ms
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S11: pestaña que arranca sin clave y sin setItem desde antes de montar 3ms
   → avisosConflicto debe existir y ser un arreglo: expected false to be true // Object.is equality
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S12: caso feliz sin errores (1h, 3h, cumpleaños, cancelar 1h y storage con Rb; sin afirmar avisosConflicto) 8ms
 × src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S13: choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados) 4ms
   → expected [ 'SPF-S13B01', 'SPF-DQ3ZN4' ] to deeply equal [ 'SPF-S13B01' ]
 ✓ src/verificacion/sondas.test.jsx > Sondas adversariales v2 (#57-#60) > S14: JSON corrupto + cambio de día + estado válido sin R1, y variante con clave borrada + setItem fallando 5ms

 Test Files  1 failed (1)
      Tests  11 failed | 3 passed (14)
```

## 4. Avisos en consola durante las pruebas

No se imprimieron avisos de `act(...)`, advertencias de React ni errores inesperados en la consola en ninguna de las dos corridas (punta y `main`).
