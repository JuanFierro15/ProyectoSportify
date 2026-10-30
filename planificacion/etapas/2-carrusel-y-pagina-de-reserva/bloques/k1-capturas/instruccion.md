Escribe un script de Node que tome capturas de pantalla del sitio con Chrome headless por CDP, córrelo contra el build local y deja las capturas en las rutas indicadas.

Contexto:
- Proyecto: raíz del repositorio (React + Vite + Foundation). Sitio de reservas de canchas (vóley playa, pádel, fútbol).
- Carpeta de trabajo para el script y las capturas de prueba (NO va al repo): <carpeta temporal>
- Node 24 (tiene `WebSocket` y `fetch` nativos). Chrome en "C:\Program Files\Google\Chrome\Application\chrome.exe". ffmpeg NO hace falta.
- La vista de reserva se abre navegando a `http://localhost:4173/#canchas-padel` (o `#canchas-voley-playa`, `#canchas-futbol`): es un overlay a pantalla completa `.vista-canchas` (position: fixed, con su PROPIO scroll vertical: para desplazarte usa `document.querySelector('.vista-canchas').scrollTop`, no window.scrollTo).
- Selectores útiles dentro de la vista:
  - Modo: botones de `.selector-modo` con texto "Cancha", "Torneo" y "Cumpleaños" (`aria-pressed`).
  - Carrusel: `.depth-carousel`; flechas `.depth-carousel__arrow--prev` / `.depth-carousel__arrow--next`; tarjeta activa = `.depth-carousel__card` con `aria-hidden="false"`; su foto es un `<button class="depth-carousel__trigger">` que abre el visor en grande (`dialog.vista-canchas__visor`, se cierra con Escape). Tras cada flecha espera ~900 ms (animación GSAP de 700 ms).
  - En modo Torneo, la tarjeta activa tiene un botón `.tarjeta-cancha__boton` ("Agregar al evento"/"Quitar del evento"); la cancha que estaba elegida ya entra agregada.
  - Día: `.selector-dia` con botones (`aria-pressed`); el segundo botón es MAÑANA. Elige siempre mañana (de noche hoy no tiene horarios).
  - Horario: `#reserva-horario`, botones de hora dentro de `.formulario-reserva__horas` con el texto de la hora ("14:00").
  - Contacto: inputs `#reserva-nombre` y `#reserva-telefono` (inputs controlados de React: llénalos enfocando el campo y usando `Input.insertText` de CDP, no asignando `.value`).
  - Voucher: `.voucher-reserva`.

Cómo debe ser el script (un solo archivo `<carpeta temporal>\capturas.mjs`, sin dependencias):
1. Lanza Chrome con `--headless=new --remote-debugging-port=9333 --user-data-dir=<carpeta temporal nueva dentro de <carpeta temporal>> --no-first-run --hide-scrollbars`, espera a `http://127.0.0.1:9333/json/version`, abre una pestaña con `/json/new` (método PUT) y conéctate con el `WebSocket` nativo al `webSocketDebuggerUrl` de la pestaña. Al terminar (también si falla) cierra Chrome (`Browser.close` o matar el proceso) y borra la carpeta temporal del perfil.
2. Helpers: enviar comando CDP con id y esperar respuesta, evaluar JS (`Runtime.evaluate` con `awaitPromise`), esperar a que exista un selector, clic en un elemento (scrollIntoView + `Input.dispatchMouseEvent` en su centro, o `.click()` desde JS si es un <button>), escribir texto (`Input.insertText`).
3. Viewports con `Emulation.setDeviceMetricsOverride`: escritorio 1440x900 DPR 1; celular 390x844 DPR 2 `mobile: true`.
4. Antes de cada escena navega a `about:blank` y luego a la URL con hash (cambiar solo el hash no dispara `load`). Espera `Page.loadEventFired`, luego a `.vista-canchas` y a que la foto de la tarjeta activa haya cargado (`img.complete && img.naturalWidth > 0`), más ~1200 ms para animaciones de entrada.
5. Captura con `Page.captureScreenshot` `{ format: 'webp', quality: 82 }` del viewport y guarda el archivo.

Escenas (datos ficticios siempre: nombre "Ana Gómez", teléfono 3001234567):
A. README (escritorio 1440x900), guardar en `docs\capturas\` del proyecto, SOBRESCRIBIENDO:
   1. `vista-canchas.webp`: `#canchas-padel`, modo Cancha, día mañana, una vez la flecha "siguiente" (queda la Cancha 2 activa), scroll de `.vista-canchas` en 0. Debe verse el título, pestañas, el carrusel y el voucher.
   2. `reserva-voucher.webp`: `#canchas-padel`, modo Cancha, mañana, Cancha 2 (una flecha siguiente), horas 14:00 y 15:00, nombre y teléfono. Desplaza `.vista-canchas` para que el `<fieldset>` "Día" quede a unos 340 px del borde superior (arriba se ve el pie del carrusel; abajo Día, Horario y los campos de contacto; a la derecha el voucher con el total).
   3. `modo-torneo.webp`: `#canchas-padel`, modo Torneo, mañana. La Cancha 1 ya entra agregada; avanza una flecha y pulsa "Agregar al evento" en la Cancha 2. Elige el rango de horas 11:00 y luego 14:00 (selección por rango: inicio y fin; deben quedar 11:00 a 15:00, 4 horas). Desplaza `.vista-canchas` hasta que el carrusel quede arriba con la tarjeta activa entera visible (scrollTop tal que el top de `.vista-canchas__cuerpo` quede a ~60 px del borde superior) y se vea el voucher con dos canchas.
B. Verificación (guardar SOLO en <carpeta temporal>\verificacion\, no en el repo):
   4. `escritorio-voley.webp`: `#canchas-voley-playa`, modo Cancha, mañana, scroll 0.
   5. `escritorio-futbol-torneo.webp`: `#canchas-futbol`, modo Torneo, mañana, scroll como en la escena 3.
   6. `escritorio-visor.webp`: `#canchas-padel`, mañana, clic en la foto de la tarjeta activa (`.depth-carousel__trigger`) y captura con el visor abierto.
   7. `movil-padel.webp`: celular 390x844, `#canchas-padel`, modo Cancha, mañana, desplaza `.vista-canchas` hasta que el top de `.vista-canchas__cuerpo` quede a ~16 px del borde superior.
   8. `movil-voley-torneo.webp`: celular, `#canchas-voley-playa`, modo Torneo, mañana, mismo scroll que la 7.
   9. Además imprime por consola, para la escena 1 y la 7: `document.documentElement.scrollWidth`, `.vista-canchas` scrollWidth vs clientWidth (detecta scroll horizontal) y el `getBoundingClientRect()` de la tarjeta activa (`.depth-carousel__card[aria-hidden="false"]`) y de `.vista-canchas__cuerpo`.

Servidor:
- Desde la raíz del proyecto corre `npm run build` y luego levanta `npm run preview` (http://localhost:4173) en segundo plano solo mientras tomas las capturas. Al terminar, DETÉN el servidor de preview y cualquier Chrome que hayas abierto (mata el árbol de procesos; en Windows `taskkill /PID <pid> /T /F`). No arranques `npm run dev` ni `vercel dev` (poca RAM: un solo servidor a la vez).

Restricciones:
- NO modifiques ningún archivo del código fuente (src/, api/, README.md, etc.). Solo puedes escribir en <carpeta temporal> y sobrescribir esos tres .webp de docs\capturas\.
- NO hagas git add, commit ni push.
- Si algo de la página no se comporta como se describe (selector que no existe, horas ocupadas, etc.), adáptate leyendo el código en src/components/ y cuéntalo en el resumen; no cambies el código de la app.
- Las capturas del README deben pesar entre 30 y 120 KB cada una; reporta el tamaño.

Formato de salida: resumen breve con las rutas de las capturas generadas, su tamaño, lo que imprimió el punto 9 y cualquier problema encontrado.
