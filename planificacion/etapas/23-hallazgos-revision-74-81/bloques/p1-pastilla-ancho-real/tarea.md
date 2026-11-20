# Tarea p1: que "bloqueado" quepa en la pastilla del selector de día en cualquier ancho (#70, hallazgo H1)

## Objetivo

En el selector de día (`SelectorDia`), el texto de estado de cada pastilla
("bloqueado", "13 libres", "completo") tiene que verse completo, sin cortarse y
sin salirse de su pastilla, en cualquier ancho de pantalla de 320 px en
adelante.

## Qué hay hoy (rama `fix/issue-70`, PR #76)

`src/components/shared/SelectorDia.css`:

- `.selector-dia` es una grilla de 7 columnas `minmax(0, 1fr)` con `gap: 4px`
  (`0.5rem` desde `40em`).
- `.selector-dia__opcion` tiene `padding: 0.45rem 2px` y borde de 1 px
  (2 px la elegida).
- `.selector-dia__libres` usa `font-size: clamp(9px, 2.2vw, 12px)`,
  `overflow: hidden` y `white-space: nowrap`.
- El arreglo anterior de la #70 agregó `@media screen and (max-width: 399px)`
  con `padding` lateral de 1 px y, en `.selector-dia__libres`, `font-size: 9px`,
  `letter-spacing: -0.7px` y `overflow: visible`.

El problema: la pastilla mide un séptimo del ancho disponible y la letra crece
con `vw`, así que en cuanto la regla deja de aplicar el texto vuelve a no
caber. Medido en el navegador real (`medir-pastillas.mjs`, línea base en
`planificacion/etapas/23-hallazgos-revision-74-81/revision/antes-76.txt` del
checkout principal):

| Ancho | Ancho útil (borde interno) | "bloqueado" | Resultado |
| --- | --- | --- | --- |
| 320 px | 33,3 px | 36,7 px (9 px, -0,7 px) | se sale 4,5 px de la pastilla |
| 360 px | 39 px | 36,7 px | entra con 1,1 px por lado |
| 400 px | 44,7 px | 43 px (9 px, normal, overflow oculto) | se corta: "bloquead" |
| 412 px | 46,4 px | 43,3 px | se corta |
| 414 px | 46,7 px | 43,5 px | se corta |
| 430 px | 49 px | 45,2 px | entra con 0,2 px de sobra |
| 480 px en adelante | | | entra |

## Qué hacer

Cambiar solo `src/components/shared/SelectorDia.css` para que el estado quepa
**según el ancho real de la pastilla**, no según una lista de anchos de
pantalla. Tú eliges la técnica. Algunas opciones, que puedes combinar:

- unidades de contenedor (`container-type: inline-size` en un elemento cuyo
  ancho lo fija la grilla, y `font-size` en `cqi` con `clamp`);
- reemplazar el corte de 399 px por reglas que cubran todo el rango donde no
  cabe, más una para los anchos más angostos (menos `gap` o `padding`);
- `letter-spacing` negativo con `overflow: visible`, como ya hace la regla
  actual (con tracking negativo y `overflow: hidden` se recortaba la tinta de
  la última letra).

Límites:

- No cambies los textos ("bloqueado", "N libres", "completo"): no toques
  `SelectorDia.jsx`.
- La letra del estado nunca baja de 8 px.
- Desde 600 px el estado se queda como hoy: `font-size: 12px` y
  `letter-spacing` normal.
- La pastilla sigue con `min-height: 44px`; no cambies colores ni bordes.
- Actualiza el comentario del CSS para que explique la regla nueva, sin
  mencionar anchos o valores que ya no apliquen.

## Cómo medir (obligatorio antes de terminar)

El script levanta su propio `vite preview` en el puerto 4174 sobre el build y
lo cierra al terminar. No levantes otro servidor ni dejes uno abierto:

```
npm run build
node "planificacion/etapas/23-hallazgos-revision-74-81/revision/medir-pastillas.mjs" --preview .
node "planificacion/etapas/23-hallazgos-revision-74-81/revision/medir-pastillas.mjs" --preview . --anchos 330,345,405,420,445,460,500,560
```

Por cada ancho imprime una línea por escena (torneo: Semifinal con 2 días
"bloqueado"; cancha: "N libres"), con el ancho útil, el ancho del texto, los
márgenes, la letra y si pasa. Falla si el texto se recorta, si queda a menos de
1 px del borde interno de la pastilla, si la letra baja de 8 px, si la página
se desborda horizontalmente o si la escena de torneo no muestra días
bloqueados. Termina con código 0 solo si todo pasa.

No edites el script: está fuera de tu repositorio y es el criterio de
aceptación.

## Rutas

- Permitida: `src/components/shared/SelectorDia.css`.
- Prohibidas: todo lo demás (incluidos `SelectorDia.jsx`, sus pruebas,
  `AGENTS.md` y `docs/`).

## Pruebas

`src/components/shared/SelectorDia.test.jsx` corre en jsdom y no mide estilos:
no la cambies. El arreglo se verifica con el script de medición.

Comando final: `npm test -- src/components/shared && npm run lint && npm run build`
y las dos mediciones de arriba.

## Criterios de aceptación

- C1: Con un build nuevo, `medir-pastillas.mjs --preview .` termina con código 0
  y "RESULTADO: todas las pastillas caben" en los 21 anchos por defecto (320 a
  1440 px), en las escenas torneo y cancha.
- C2: También termina con código 0 con
  `--anchos 330,345,405,420,445,460,500,560`.
- C3: En todos los anchos medidos, la letra del estado es de 8 px o más y el
  texto queda a 1 px o más del borde interno de su pastilla.
- C4: Desde 600 px, el estado sigue con `font-size: 12px` y `letter-spacing`
  normal en las dos escenas.
- C5: Ningún ancho medido desborda la página horizontalmente
  (`desbordePagina=0`).
- C6: Solo cambia `src/components/shared/SelectorDia.css`; los textos de estado
  no cambian.
- C7: El comentario del CSS explica la regla nueva y no menciona anchos o
  valores que ya no apliquen.
- C8: `npm test -- src/components/shared`, `npm run lint` (0 avisos) y
  `npm run build` pasan.
