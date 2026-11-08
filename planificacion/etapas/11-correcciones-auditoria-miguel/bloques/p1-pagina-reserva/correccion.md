
# Corrección del bloque p1 (S12 y S14)

Los cambios del bloque p1 ya están en el árbol de trabajo, sin commit: **no los descartes** ni uses `git checkout`/`git restore`.

Archivos que puedes tocar:

```
src/components/shared/SelectorDia.css
src/components/canchas/VistaCanchas.css
src/components/canchas/VistaCanchas.jsx
```

Hallazgos verificados en el navegador, a corregir los tres:

1. **S12, `.selector-dia`**: es un grid de 7 columnas con `minmax(0, 1fr)` que nunca desborda (a 390 px, `scrollWidth` 341 = `clientWidth` 341), así que el `overflow-x: auto`, el `scroll-snap-type` y el `scroll-snap-align` que se agregaron en `SelectorDia.css` no hacen nada, y el `overflow-x: auto` además fuerza `overflow-y: auto` y puede recortar los anillos de foco. Quita esas tres líneas: `SelectorDia.css` debe quedar igual que en `git show HEAD:src/components/shared/SelectorDia.css`. El snap de `Bracket.css` se queda.
2. **S14, botones `hollow`**: la regla nueva de movimiento reducido para `.vista-canchas .button.hollow:not(.formulario-reserva__hora):not(.formulario-reserva__pill):not(.alerta-tiempo__accion)` (~856, dentro del `@media (prefers-reduced-motion: reduce)`) tiene la misma especificidad que la regla base (~957) y queda antes, así que con movimiento reducido sigue `transition: all 0.15s`. Mueve esa regla (en su propio bloque `@media (prefers-reduced-motion: reduce)`) justo después de la regla base, para que gane. No cambies la regla base.
3. **Indentación** en `VistaCanchas.jsx`: el cuerpo de `renderBloqueCanchas` (~382-525) quedó sin reindentar tras el nuevo `<div role="tabpanel">`. Reindéntalo dos espacios más, sin cambiar nada más (comprueba con `git diff -w` que solo cambió el espacio en blanco respecto de lo que había).

Luego corre de a uno `npx vitest run src/components/reactbits/ src/components/canchas/`, `npm test`, `npm run lint` y `npm run build`, y responde con `<comando>: <resultado observado>` de cada uno.

Todo el texto en español. No hagas commits ni push, ni cambies ramas.
