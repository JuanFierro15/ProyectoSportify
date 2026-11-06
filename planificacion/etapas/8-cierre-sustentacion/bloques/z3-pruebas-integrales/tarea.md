# Tarea: Bloque `z3` — Pruebas integrales de inicio a fin

## Objetivo

Ejecutar en navegador real (escritorio `1440×900` y celular `390×844`) las pruebas integrales del proyecto para todos los flujos locales (`A` a `D`, `E7`, `F`, `G`, `H`), dejando documentados como pendientes por `JuanFierro15` los casos que dependen de Vercel o de la API de `/api/chat` (`E1`–`E6` y `probar-chat.mjs`).

## Alcance

1. **A. Reserva individual de cancha (`A1`–`A5`)**: cálculo de descuento y pack de agua gratis, bloqueo de 4.ª hora, confirmación con QR/copiar código/condiciones, persistencia tras recargar y bloqueo de hora ya ocupada.
2. **B. Torneo por fases (`B1`–`B7`)**: entrada desde CTA con 0 canchas, límite de 3 canchas del mismo deporte, 4/8/16 equipos, fechas crecientes o mismo día tras fin de fase previa, intercambio automático en cruce manual, alerta de tiempo insuficiente con botón de 15 min y confirmación de torneo.
3. **C. Cumpleaños / Eventos (`C1`–`C4`)**: tope de 100 invitados, combinación de deportes, invitados en voucher y confirmación, y rechazo de rango con hora ocupada intermedia.
4. **D. Mis reservas y cancelación (`D1`–`D5`)**: búsqueda por código (con minúsculas), búsqueda por nombre + teléfono, reserva sin teléfono solo por código, cancelación > 6 h libera horas y bloqueo de cancelación < 6 h o de eventos.
5. **E. Chatbot (`E7` local)**: conservación de conversación del widget al navegar entre páginas. (`E1`–`E6` y `probar-chat.mjs` pendientes por `JuanFierro15`).
6. **F. Navegación y URLs (`F1`–`F6`)**: recarga en `/reservar/padel`, enlace directo `/reservar/futbol?modo=torneo`, restaurar scroll con "Volver al inicio", enlaces reales para Ctrl+clic, navegación a `#ubicacion` y `#eventos` desde reserva, y rueda del mouse sobre carrusel.
7. **G. Accesibilidad y movimiento reducido (`G1`–`G4`)**: foco visible por teclado, flechas/Home/End en pestañas de deporte, cierre con `Escape` devolviendo foco, y `prefers-reduced-motion: reduce`.
8. **H. Celular `390×844` (`H1`–`H3`)**: sin scroll horizontal en flujos principales, video hero siguiendo el scroll y modales a pantalla completa.
