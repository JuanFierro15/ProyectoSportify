# Prueba de producción a 390×844 tras el PR #27 (14-11-2026)

Sitio: `https://proyecto-sportify.vercel.app` (despliegue de `2cf1cc4`).
Herramienta: Chrome headless por CDP (`prueba390.mjs`, en esta carpeta), viewport
`390×844`, `deviceScaleFactor: 2`, `mobile: true`. Chrome con ventana visible no baja de
~500 px, por eso se usó headless. No se enviaron mensajes al chat (cuota de Gemini).

| Caso | Resultado |
| --- | --- |
| Desborde horizontal en `/`, `/reservar/padel` y `/reservar/voley?modo=torneo` | Ninguno (`scrollWidth` = 390 en las tres) |
| `<main>` único con `id="contenido-principal"` | 1 en inicio y 1 en reserva |
| Skip link con Tab real | Primer foco; visible en `top: 16px`; texto `#141414` sobre `#f6a94b` (`01-skip-link-tab.png`) |
| Skip link con Enter, y clic repetido | Foco al `<main>`, sin hash en la URL |
| Skip link en `/reservar/padel` | `history.state` conserva `{"vistaCanchas":true}` |
| Inicio → reserva → skip link → "Volver al inicio" | Vuelve a `/` y restaura el scroll (y = 1500) |
| Footer/Navbar: Eventos → Ubicación → Eventos | Cada sección queda a 80 px del tope (bajo el navbar), sin hash |
| Clic en "Inicio" dos veces estando arriba | Se queda en y = 0, sin hash |
| Chat abierto | Ocupa 390 px; enviar 44×44; Escape cierra y devuelve el foco al botón (`03-chat-abierto.png`) |
| Chips de sugerencias del chat | **26 px de alto** (pendiente P1) |
| Puntos del carrusel | 3 puntos de 44×44, entre las flechas, sin chocar con ellas |
| Puntos: segundo, último, último otra vez, primero | Activo correcto en cada clic |
| Pastilla de puntos sobre la tarjeta | Tapa ~20 px del borde inferior de la tarjeta y queda pegada al botón "Cancha elegida" (`04-reserva-carrusel.png`, pendiente P6) |
| Errores de consola o excepciones | Ninguno |
| Navbar del inicio | El ícono de "Mis reservas" queda solo en una tercera fila. **Ya era así** antes del PR (`docs/capturas/movil-inicio.webp`); no es regresión |

Sin probar aquí: chips `×` de `CanchasElegidas` (hay que elegir canchas en torneo) y el
comprobante del chat (requiere reservar por el chat y gastar cuota). Los dos quedaron
cubiertos por medición en el PR #27 y por `Chatbot.test.jsx`.
