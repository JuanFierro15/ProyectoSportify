# Documentación (`README.md`) y capturas

Detalle de `README.md`, las capturas en `docs/capturas/` y el procedimiento para regenerarlas con `capturas.mjs`. Lee este archivo antes de editar el README o volver a tomar capturas del sitio.

- `README.md` es la documentación formal del repositorio (en GitHub): descripción, funcionalidades con capturas, reglas del negocio, arquitectura (diagramas Mermaid), stack, estructura, instalación, pruebas, despliegue, accesibilidad, bloques y créditos. Si cambia la interfaz o una regla de un bloque, actualizar el README y sus capturas en el mismo trabajo. Sin menciones a Claude ni a las herramientas del flujo de desarrollo.
- Capturas en `docs/capturas/` (WebP de 35-90 KB y `chat-reserva.gif`, unos 330 KB; todo cerca de 1,1 MB). `docs/` no entra al build (lista blanca de `.vercelignore`).
- Cómo se tomaron (por si hay que repetirlas): un script Node 24 sin dependencias (`planificacion/herramientas/capturas/capturas.mjs`; correr desde la raíz con `npm run build` + `npm run preview` arriba, perfil y verificación en la carpeta temporal del sistema) que abre `chrome.exe --headless=new --remote-debugging-port=9333` con un `--user-data-dir` temporal, lo maneja por CDP con el `WebSocket` nativo y captura con `Page.captureScreenshot` (`format: 'webp'`, calidad 82) contra `http://localhost:4173` (`npm run preview`). Escritorio 1440×900; celular 390×844 con DPR 2. Las de la página de reserva (`vista-canchas`, `reserva-voucher`, `modo-torneo`, `movil-torneo`) navegan a `/reservar/...` y desplazan con `window.scrollBy` (la página no usa `/api`). Al terminar, matar el árbol del proceso de `preview` (detener la shell deja vivo Vite en 4173).
  Detalles que importan:
  - Los heros se capturan con 400 px de scroll dentro de su sección (con 0 no aparece el texto); la sección está dentro de un `.pin-spacer`.
  - Elegir **mañana** en el `SelectorDia`: de noche, hoy no tiene franjas y las tarjetas dicen "Sin horarios libres ese día".
  - Pasar por `about:blank` entre escenas para que cada una arranque con `load` y estado limpio.
  - En modo torneo no entra ninguna cancha agregada y "Agregar al evento" solo existe en la tarjeta activa del carrusel (avanzar con `.depth-carousel__arrow--next`).
  - Los inputs controlados de React se llenan con `Input.insertText` tras enfocar el campo.
  - El GIF: `Page.startScreencast` (PNG) con los timestamps de cada frame → lista de `concat` de ffmpeg con duraciones → recorte al panel del chat, `setpts=PTS/1.2`, 12 fps, `palettegen=max_colors=256:stats_mode=full` y `paletteuse`. El screencast no manda frames si la pantalla no cambia: alargar a mano la duración del último frame.
  - Datos ficticios: "Ana Gómez", 300 123 4567. Nunca datos reales.
- Créditos de medios (los pidió Juan así): fotos de las canchas creadas con Gemini (Nano Banana) y videos de los heros con Gemini (Omni).
