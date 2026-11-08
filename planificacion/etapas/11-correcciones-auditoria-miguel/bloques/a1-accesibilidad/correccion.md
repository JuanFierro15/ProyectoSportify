
# Corrección del bloque a1 (S8): `aria-controls` de la pestaña inactiva

Los cambios del bloque a1 ya están en el árbol de trabajo, sin commit: **no los descartes** ni uses `git checkout`/`git restore`.

Archivos que puedes tocar:

```
src/components/layout/MisReservas.jsx
src/components/layout/MisReservas.test.jsx
```

Problema verificado en el navegador: en `src/components/layout/MisReservas.jsx` (~333) cada pestaña tiene `aria-controls={p.panelId}`, pero solo se renderiza el panel de la pestaña activa (ternario ~347-386). La pestaña inactiva apunta a un `id` que no existe en el DOM.

Qué hacer:

1. Test en RED en `MisReservas.test.jsx`, dentro del test de S8 o en uno nuevo: para **cada** pestaña con `aria-controls`, `document.getElementById(valor)` existe y tiene `role="tabpanel"`. Comprueba que falla con el código actual.
2. Arreglo mínimo: `aria-controls` solo en la pestaña activa (`aria-controls={esActiva ? p.panelId : undefined}`). No cambies nada más del componente.
3. Corre `npx vitest run src/components/layout/`, `npm test` y `npm run lint`, de a uno, y responde con `<comando>: <resultado observado>` de cada uno y si el test falló en RED.

Todo el texto en español. No hagas commits ni push, ni cambies ramas.
