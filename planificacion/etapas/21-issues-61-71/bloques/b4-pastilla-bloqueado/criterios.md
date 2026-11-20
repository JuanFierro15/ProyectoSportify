# Criterios de aceptación del bloque b4 (issue #70)

- C1: El CSS hace que el texto de estado (`.selector-dia__libres`) quepa en pastillas de unos 41 px de ancho (360 px) sin bajar de 9 px: reduce el espacio que ocupa (por ejemplo `letter-spacing` negativo y menos padding horizontal) solo por debajo de unos 400 px de ancho de ventana.
  Cómo comprobarlo: leer el CSS y estimar el ancho de "bloqueado" a 9 px con ese `letter-spacing` (anotar el cálculo). La medición real a 360 y 390 px la hace el coordinador en el navegador. No levantes servidores.
- C2: La grilla no cambia: `.selector-dia` sigue con `repeat(7, minmax(0, 1fr))`, y desde `40em` las reglas de `.selector-dia__opcion` y `.selector-dia__libres` dan el mismo resultado que antes.
- C3: El texto visible sigue siendo exactamente "bloqueado", "completo" y "N libres", y el `aria-label` de un día bloqueado termina en ", bloqueado".
- C4: `SelectorDia.test.jsx` prueba: día bloqueado (texto, `disabled` y `aria-label`), día lleno no seleccionado ("completo" y `disabled`), día con 13 libres ("13 libres", habilitado), y clic: `onChange` recibe la fecha ISO en un día habilitado (el segundo y el último de la tira) y no se llama en uno bloqueado.
- C5: Un día lleno **seleccionado** sigue habilitado (regla actual `lleno && !sel`), y la prueba lo cubre.
- C6: `AGENTS.md` nombra `SelectorDia.test.jsx` en la lista de pruebas, y no cambia nada más de ese archivo.
- C7: No se cambiaron ni `AsistenteTorneo.css` ni la barra inferior.
- C8: `npm test -- src/components/shared src/components/reservas` y `npm run lint` terminan con código 0 (lint sin avisos).
