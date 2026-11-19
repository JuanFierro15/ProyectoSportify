# Bloque r2-correcciones-revision (etapa 17: correcciones de la revisión del PR #48)

Lee `AGENTS.md`, `docs/agentes/reservas.md` y `planificacion/etapas/17-sincronizacion-pestanas/PLAN.md` antes de empezar.

## Rutas permitidas

- `src/context/ReservasContext.jsx`
- `src/context/ReservasContext.test.jsx`
- `docs/agentes/reservas.md`

No toques ningún otro archivo. No hagas `git commit`, `git push`, `git checkout`, `git stash` ni cambies de rama. Si `npm test` cambia `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por finales de línea, no lo edites (el coordinador lo restaura). La carpeta `src/__verificacion__/` es del verificador: no la crees ni la toques.

## Contexto

El revisor del PR #48 encontró una regresión: doble reserva entre pestañas. En el listener `storage` de `ReservasProvider` (`src/context/ReservasContext.jsx`, cerca de la línea 844), `ultimoRawStorageRef.current` recibe lo que hay **en ese momento** en `localStorage` (`leerRawStorage()`), no el `e.newValue` que se acaba de parsear. Si otra pestaña escribe dos veces seguidas (`v1` y luego `v2`) y aquí solo se procesó el evento de `v1`, el estado queda con `v1` y la ref con `v2`. Entonces `leerEstadoFresco` cree que no hubo cambios, `reservar` acepta una hora que `v2` ya tenía ocupada y el efecto espejo borra de `localStorage` la reserva de la otra pestaña. En `main` esto no pasa.

## Cambios

### 1. Arreglo del bloqueante (listener `storage`)

```js
ultimoRawStorageRef.current = raw !== undefined ? raw : leerRawStorage();
```

Cuando `raw` es `undefined` (`e.newValue` no es string), `parsearDatosGuardados(undefined)` lee el `localStorage` actual, así que `leerRawStorage()` es el valor correcto en esa rama. No toques la inicialización de la ref (cerca de la línea 740).

### 2. Pruebas de regresión en `ReservasContext.test.jsx`

Agrega, dentro del `describe` de `#40, #41, #42`, la prueba del revisor. Endurece la aserción del rechazo para que compare el resultado completo:

```jsx
it('rechaza reservar una hora que otra pestaña ya guardó en una segunda escritura', () => {
  const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
  const { result } = renderHook(() => useReservas(), { wrapper });
  const dia = result.current.dias[3];

  const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  const conHoras = (horas, nombres) => {
    const d = JSON.parse(JSON.stringify(base));
    d.ocupados['padel-1'][dia] = [...(d.ocupados['padel-1'][dia] || []), ...horas];
    d.reservas = nombres.map((n, i) => ({
      id: `padel-1__${dia}__${horas[i]}__${i}`,
      tipo: 'individual', canchaId: 'padel-1', fecha: dia, horas: [horas[i]], nombre: n,
    }));
    return JSON.stringify(d);
  };
  const v1 = conHoras(['10:00'], ['Otra Uno']);
  const v2 = conHoras(['10:00', '11:00'], ['Otra Uno', 'Otra Dos']);

  // La otra pestaña escribe v1 y enseguida v2; aquí solo se procesó el evento de v1.
  window.localStorage.setItem(STORAGE_KEY, v2);
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: v1 }));
  });

  let res;
  act(() => {
    res = result.current.reservar({ canchaId: 'padel-1', fecha: dia, horas: ['11:00'], nombre: 'Esta Pestana' });
  });

  const guardado = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  expect(res).toEqual({ ok: false, error: 'Ese horario ya está reservado. Elige otro.' });
  expect(guardado.reservas.map((r) => r.nombre)).toEqual(
    expect.arrayContaining(['Otra Uno', 'Otra Dos'])
  );
});
```

En la semilla, el día 3 de `padel-1` ya ocupa las 12:00 y 13:00, y tiene libres las 10:00, 11:00 y 14:00: usa 14:00 como hora libre de C2. Agrega también las pruebas de los criterios C2 (hora libre en las dos versiones), C3 (evento con `newValue: null` y la clave presente) y C10 (`getItem` lanzando durante un evento de borrado). Antes de aplicar el arreglo 1, corre la prueba de arriba y confirma que falla; después, que pasa. Anota los dos resultados en tu resumen.

### 3. `RENOVAR_VENTANA` sin leer `localStorage` en el `reducer`

Hoy, si el payload no trae `datosStorage`, el `reducer` llama a `parsearDatosGuardados()` y lee `localStorage` (impuro). El provider siempre le pasa `datosStorage`; solo las pruebas usan el otro camino. Cambia el `reducer` para que, sin `datosStorage` en el payload, use `null` (solo memoria). Ajusta el subcaso 3 de la prueba `#41 Caso B` (cerca de la línea 1739 de la prueba) para que pase `{ datosStorage: { ocupadosCrudos, reservas } }` con los mismos datos que hoy escribe en `localStorage`, y conserva sus aserciones. La prueba `S5` (cerca de la línea 1049) solo comprueba que avanzan los días: debe seguir pasando sin cambios. Agrega la prueba de C5.

### 4. Reutilizar `combinarOcupadosPorCancha`

En la rama `else` de `RENOVAR_VENTANA` (`{ ...enMemoria, ...enStorage }` por cancha), usa `combinarOcupadosPorCancha(state.ocupados, ocupadosDeStorage)` y toma de ahí cada cancha (`|| {}` si falta). El resultado debe ser idéntico al de hoy.

### 5. Comentarios donde la revisión vio código muerto

- `disponibilidad` (`calcularDisponibilidad(estadoRef.current ?? state, ...)`, deps `[state]`): **no lo cambies**. El `?? state` nunca se evalúa, pero es lo que mantiene `state` como dependencia válida para `exhaustive-deps`, y `disponibilidad` tiene que cambiar de identidad en cada estado nuevo porque `useReserva.js`, `VistaCanchas.jsx` y `useAccionesReserva.js` la usan en `useMemo`/`useCallback`. Agrega un comentario corto que lo explique.
- Rama de borrado del listener (`window.localStorage.getItem(STORAGE_KEY) === null`, cerca de la línea 861): **no lo cambies a `leerRawStorage()`**. Ese helper devuelve `null` también cuando `getItem` lanza, y eso dejaría la pestaña con `reservas: []`. Agrega un comentario corto que lo explique.

### 6. `docs/agentes/reservas.md`

Actualiza la línea 9 (y lo que dependa de ella) según el criterio C11: inferencia de `tipo` en `parsearDatosGuardados`; el listener guarda en `ultimoRawStorageRef` el texto que parseó; `RENOVAR_VENTANA` recibe `datosStorage` del provider y el `reducer` no lee `localStorage`; y en la limitación conocida, la pérdida de reservas que solo estaban en memoria cuando otra pestaña sí guarda. Mantén el estilo del archivo: párrafo técnico en español, con tildes y tuteo.

## Prueba

```
npm test
npx eslint src/context --max-warnings=0
```
