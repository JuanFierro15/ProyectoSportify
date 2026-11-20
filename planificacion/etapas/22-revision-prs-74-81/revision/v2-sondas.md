# Informe v2 — Sondas adversariales sobre la sincronización (PR #79 y #80)

- **Versiones evaluadas (`src/context/ReservasContext.jsx` y `src/lib/cancelacion.js`):**
  - `main`: `origin/main`
  - `#79`: `origin/fix/sincronizacion-pestanas-62-66`
  - `integración`: `HEAD` (`8c8b74f`, integración con `#78`, `#79` y `#80`)
- **Archivos corridos:** `src/verificacion/sondas-e20.test.jsx` (14 sondas de la etapa 20) y `src/verificacion/sondas-e22.test.jsx` (10 sondas nuevas; copia guardada en [v2-sondas-e22.test.jsx.txt](./v2-sondas-e22.test.jsx.txt)).
- **Comando ejecutado:** `npx vitest run src/verificacion/ --reporter=verbose`

## 1. Resultados por sonda

| Sonda | `main` | `#79` | `integración` |
|---|---|---|---|
| S1 | Pasa | Pasa | Pasa |
| S2 | Pasa | Pasa | Pasa |
| S3 | Pasa | Pasa | Pasa |
| S4 | Pasa | Pasa | Pasa |
| S5 | Pasa | Pasa | Pasa |
| S6 | Pasa | Pasa | Pasa |
| S7 | Pasa | Pasa | Pasa |
| S8 | Pasa | Pasa | Pasa |
| S9 | Pasa | Pasa | Pasa |
| S10 | Pasa | Pasa | Pasa |
| S11 | Pasa | Pasa | Pasa |
| S12 | Pasa | Pasa | Pasa |
| S13 | **Falla** (`AssertionError: expected [ 'SPF-S13B02', 'SPF-FTRTYF' ] to deeply equal [ 'SPF-S13B02' ]`) | Pasa | Pasa |
| S14 | Pasa | Pasa | Pasa |
| N1 | **Falla** (`AssertionError: expected [ 'SPF-N1B001', 'SPF-5PFUCS' ] to deeply equal [ 'SPF-N1B001' ]`) | **Falla** (`AssertionError: expected true to be false // Object.is equality`) | **Falla** (`AssertionError: expected true to be false // Object.is equality`) |
| N2 | **Falla** (`AssertionError: avisosConflicto[0].codigo debe coincidir con el código de la reserva: expected undefined to be 'SPF-5BSFM2' // Object.is equality`) | **Falla** (`AssertionError: avisosConflicto[0].codigo debe coincidir con el código de la reserva: expected undefined to be 'SPF-EKFV4Y' // Object.is equality`) | Pasa |
| N3 | **Falla** (`AssertionError: avisosConflicto[0].codigo debe coincidir con el código de la reserva: expected undefined to be 'SPF-PQJRYC' // Object.is equality`) | **Falla** (`AssertionError: avisosConflicto[0].codigo debe coincidir con el código de la reserva: expected undefined to be 'SPF-USPWQA' // Object.is equality`) | Pasa |
| N4 | **Falla** (`AssertionError: expected [ { …(10) }, { …(10) } ] to deeply equal [ { …(10) } ]`) | Pasa | Pasa |
| N5 | **Falla** (`AssertionError: expected [ { tipo: 'individual', …(15) } ] to deeply equal []`) | Pasa | Pasa |
| N6 | Pasa | Pasa | Pasa |
| N7 | Pasa | Pasa | Pasa |
| N8 | Pasa | Pasa | Pasa |
| N9 | Pasa | Pasa | Pasa |
| N10 | Pasa | Pasa | Pasa |

## 2. Fallos en la integración (`HEAD`)

### N1: choque contra una reserva guardada en `reservas` sin esa hora en `ocupados` (#62)

- **Qué esperaba la sonda:**
  1. Que `reservas` quedara únicamente con `Rb` (`['SPF-N1B001']`), descartando `R`.
  2. Que `16:00` en `padel-1` para `dias[3]` figurara como ocupada (`horaDisponible(result, 'padel-1', dia3, '16:00') === false`).
  3. Que hubiera un aviso en `avisosConflicto` con el `codigo` de `R`.
- **Qué pasó:**
  - `reservas` sí quedó con `['SPF-N1B001']` (`R` fue descartada por `conciliarReservasSinGuardar`, que revisa `celdasReservadas` de `guardado.reservas`).
  - Sin embargo, la segunda aserción falló:

```text
FAIL  src/verificacion/sondas-e22.test.jsx > Sondas adversariales v2 (#79 y #80) > N1: choque contra una reserva guardada en reservas sin esa hora en ocupados (#62)
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ src/verificacion/sondas-e22.test.jsx:130:62
    128|
    129|     expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF…
    130|     expect(horaDisponible(result, 'padel-1', dia3, '16:00')).toBe(fals…
       |                                                              ^
    131|     assertUnAvisoConCodigo(result, resR.codigo);
    132|   });
```

- **Por qué la sonda está bien escrita y causa raíz del fallo:**
  - La sonda usa exclusivamente la interfaz pública (`ReservasProvider`, `useReservas`, `STORAGE_KEY`), fuerza el fallo de `setItem`, crea `R` en `padel-1` (`dias[3]`, `16:00`), escribe en `localStorage` un JSON donde `Rb` está en `reservas` en esa misma celda pero sin `'16:00'` en `ocupados['padel-1'][dia3]`, y despacha el `StorageEvent`.
  - La causa real en `src/context/ReservasContext.jsx` es que `renovarSiCambioElDia` sí llama a `aplicarHorasDeReservas(..., desdeStorage.reservas)` sobre la base leída, pero `alCambiarStorage` (líneas 1330-1343) pasa directamente `ocupados: fusionarConSemilla(actual.canchas, actual.dias, datos.ocupadosCrudos, semillaOcup)` sin pasar por `aplicarHorasDeReservas`. Al descartarse `R`, `conciliarReservasSinGuardar` tampoco reescribe `ocupados` con la hora de `Rb`, de modo que `16:00` permanece libre (`disponible: true`) aunque `Rb` figure activa en `reservas`.

## 3. Diferencias entre `#79` y la integración (`#80`)

- **N1:** Falla exactamente igual en `#79` y en la integración (`expected true to be false` al consultar `horaDisponible` para `'16:00'`), porque en ambas versiones `alCambiarStorage` omite `aplicarHorasDeReservas`.
- **N2 y N3:** Fallan en `#79` únicamente porque `assertUnAvisoConCodigo` comprueba `avisosConflicto[0].codigo === codigo`, propiedad introducida en `#78` (no presente en `#79`, donde cada aviso solo tiene `{ id, mensaje }`). En la integración (`HEAD`) ambas sondas pasan.
- **S1–S14 y N4–N10:** Se comportan de forma idéntica en `#79` y en la integración (todas pasan). El refactor de `#80` no introdujo regresiones respecto a `#79`.

## 4. Observaciones

- **Avisos de `act(...)` y errores en consola:** No hubo avisos de `act(...)`, advertencias de React ni errores inesperados en consola en ninguna de las tres corridas (`main`, `#79`, `integración`).
- **Tiempos de ejecución:** Todas las corridas completaron en ~3.85–3.95 s en total para los 24 casos (entre 2 ms y 40 ms por sonda; sin pruebas lentas).
- **Resumen numérico por versión:**
  - `main`: 18 pasan, 6 fallan (`S13`, `N1`, `N2`, `N3`, `N4`, `N5`).
  - `#79`: 21 pasan, 3 fallan (`N1` por el bug en `alCambiarStorage`; `N2` y `N3` por ausencia de `avisosConflicto[i].codigo` de `#78`).
  - `integración`: 23 pasan, 1 falla (`N1`).
