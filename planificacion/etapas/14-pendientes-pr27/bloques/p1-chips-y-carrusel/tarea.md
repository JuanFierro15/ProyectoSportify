
---

# Bloque p1-chips-y-carrusel (etapa 14)

Lee también `planificacion/etapas/14-pendientes-pr27/PLAN.md` (P1 y P6) y
`planificacion/etapas/14-pendientes-pr27/revision/390/verificacion.md`.

## Rutas permitidas
- `src/components/chatbot/Chatbot.css`
- `src/components/canchas/VistaCanchas.css`
- `planificacion/etapas/14-pendientes-pr27/revision/` (capturas, mediciones, scripts de prueba)

Prohibido todo lo demás: ningún `.jsx`/`.js` de `src/` ni `api/`, ni
`DepthCarousel.css`, `AGENTS.md`, `docs/`. No hagas commits.

## P1: chips de sugerencias del chat a 44 px de alto real
`.chatbot__chip` (`Chatbot.css:246-256`) mide 26 px. Agrégale
`min-height: 44px`, `display: inline-flex`, `align-items: center` y
`justify-content: center`. No uses un `::after` invisible: entre filas hay
0.4rem y pisaría la fila vecina. No cambies colores ni tamaño de letra.

## P6: pastilla de puntos del carrusel (medir antes de mover)
En `/reservar/padel`, `/reservar/voley` y `/reservar/futbol`, mide a 390×844 y
1440×900 la distancia vertical entre la pastilla
`.vista-canchas__cuerpo .depth-carousel__dots` (hoy `bottom: 2px`,
`VistaCanchas.css:371-376`), el botón de la tarjeta activa ("Cancha elegida" o
"Elegir cancha") y el borde inferior de la tarjeta. Solo si la pastilla tapa la
tarjeta o queda a menos de 8 px del botón, ajusta en `VistaCanchas.css` (por
ejemplo `bottom` negativo o más espacio bajo la tarjeta) para que quede debajo
de la tarjeta sin tocarla, sin desborde horizontal y sin chocar con las
flechas. Anota las medidas antes y después en `revision/p1-mediciones.md`.

## Verificación (obligatoria)
1. `npm run build`, luego `npm run preview` (puerto 4173). Prueba con Chrome
   headless por CDP; parte de `revision/390/prueba390.mjs` (cópialo a
   `revision/p1-prueba.mjs` y adáptalo, URL base `http://localhost:4173`).
2. Chat a 390 y 1440: abre el chat; antes de tocar chips, intercepta
   `window.fetch` en la página para que `/api/chat` devuelva
   `{"respuesta":"ok","sugerencias":["A","B","C"],"accion":null}` sin salir a
   la red (no gastes cuota de Gemini). Mide el alto de cada chip (>= 44), que
   no tapen el input ni el botón enviar, y haz clic en el **segundo** y en el
   **último** chip: el mensaje enviado debe ser su texto.
3. Carrusel en los tres deportes: medidas de P6, clic en el segundo punto, el
   último y el último otra vez; sin desborde (`scrollWidth === innerWidth`).
4. Con `Emulation.setEmulatedMedia` y `prefers-reduced-motion: reduce`, repite
   una vista y confirma que nada se rompe.
5. Capturas en `revision/p1-*.png` (chat 390, carrusel 390 y 1440).
6. **Cierra el `preview` y todo Chrome headless al terminar** (verifica que no
   quede nada escuchando en el puerto 4173).
7. `npm run lint` con 0 warnings.

Responde con los archivos cambiados, las medidas antes y después, y si P6
requirió cambio.
