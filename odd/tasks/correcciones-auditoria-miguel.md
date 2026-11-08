# Correcciones de la auditoría asignadas a Miguel (#13, #14, #15)

Objetivo: cerrar las issues #13, #14 y #15 de la auditoría del 07-11-2026. Ramas: una por issue desde el commit del plan (ver `planificacion/etapas/11-correcciones-auditoria-miguel/PLAN.md`). Entrega: un PR por issue. Tests: Vitest (`npm test`) + `npm run lint` (+ `npm run build` en #15).

## Specs

Las citas entre comillas son textuales de las issues. Las decisiones marcadas "(plan)" son las del PLAN aprobado.

### #13 Chat

- **S1** "cancelar" o "cancela" confirman una tarjeta de **cancelación**. "Con una tarjeta de **reserva**, decide si significan "no" y fíjalo con un test." (plan) En reserva significan "no"; en la lista de opciones de cancelación no son ni sí ni no. Hay que cambiar el test `chat.test.js:227`.
- **S2** "Marca esos mensajes como error para que no entren al historial." Toda respuesta con `!res.ok` (400, 405, 429, 500, 502, 504) se guarda con `error: true`. "El estado `error` del hook (`useChatbot.js:41`) es código muerto: `Chatbot.jsx` no lo usa. Úsalo para esto o quítalo." (plan) Se quita.
- **S3** "Valida que sea una fecha real (400 con el texto fijo de petición inválida)." Ejemplo de la issue: `2026-13-45`. (plan) Además, armar contexto e instrucciones va dentro del `try`: cualquier excepción responde el JSON `{ respuesta, sugerencias, accion }`.
- **S4** "Deja una sola función en `src/lib/` (JS puro, la importa `api/`)" para `precioTexto`/`precioChat` y para `fechaEnFrase`. (plan) El servidor deja de exigir `contexto.canchas` y el widget deja de mandarlo. El texto de las instrucciones no cambia.
- **S5** (plan, opcionales) `useAccionesReserva` no falla si el mensaje guardado no trae `horas`; `manejarBusqueda` usa las `reservas` actuales después del `await`.

### #14 Accesibilidad

- **S6** "Devolver el foco solo en la transición abierto → cerrado." y quitar la rama muerta `dlg.close()` / `removeAttribute('open')`.
- **S7** "Reinicia el estado al cerrar o recalcula los resultados desde `reservas`." (plan) Se reinicia al cerrar. Verificación: "al reabrir no aparece la búsqueda anterior".
- **S8** Pestañas de Mis reservas con el patrón ARIA completo: "Usa el mismo patrón que las pestañas de deporte de `VistaCanchas.jsx:225-231`" (`aria-controls`, `role="tabpanel"`, flechas, Inicio/Fin y tabIndex móvil).
- **S9** Navbar oculto: "Muéstralo cuando reciba foco (`:focus-within` o un `focusin`)." y "`irACanchas` está duplicado casi igual en `Navbar.jsx:93-108` y `Footer.jsx:29-44`: deja uno solo." (plan) Hook `useIrACanchas`.
- **S10** Movimiento reducido en los heros: (plan) con `prefers-reduced-motion: reduce` no hay pin ni scrub; el hero se ve quieto con su contenido visible. README (sección de accesibilidad) lo dice.

### #15 Página de reserva

- **S11** "con el filtro activo y cambiando de día, siempre hay una tarjeta activa con su botón." (plan) `key` con la lista filtrada + índice acotado en `DepthCarousel` al cambiar `count`.
- **S12** `scroll-snap-type: x proximity` en `.selector-dia` "(y a las rondas del bracket si sigue teniendo sentido; esa parte está en `Bracket.css`...)". "Las tiras horizontales "encajan" al soltar el scroll en celular." (L3) El bracket también se hace.
- **S13** "Completa el patrón (panel con `aria-labelledby`) o usa una navegación sin roles de pestaña." (plan) Se completa el patrón.
- **S14** Reemplazar el reset universal de `VistaCanchas.css:840-848` por reglas puntuales con el mismo efecto visible.

## Tasks

| ID | Specs | Ruta | Estado | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1-S5 | agy flash (`c1-chat`) + verificación independiente | hecha (S1-S5 verificadas) | `ac40d88`, `ed2737b`, `c2856ac` |
| T2 | S6-S10 | agy flash (`a1-accesibilidad`) + verificación independiente | hecha (S6-S10 verificadas) | `3ff4902`, `6c9337d`, `a904d8e` |
| T3 | S11-S14 | agy flash (`p1-pagina-reserva`) + verificación independiente | pendiente | |

Ruta: delegación a agy por preferencia del usuario (el orquestador no escribe código), no por tamaño.

## Log

- **L1** (07-11-2026, Miguel): "[…] en este proyecto en el github tenemos unas issues asignadas para corregir, quiero que revises de que trata, elabores un plan con ayuda de gentle-ai y ejecutes la tarea usando la metodología de trabajo que ya hemos usado, como Argon tiene pocos tokens puedes usar subagentes tuyos para reemplazarlo"
- **L2** Exploración sobre `77af94d`: líneas de las issues confirmadas; #15.1 confirmado en `DepthCarousel.jsx:398,447,467`; #14.5 verificado (pin y scrub siguen con movimiento reducido). Plan escrito; espera aprobación de Miguel.
- **L3** (07-11-2026, Miguel): "Lo del bracket no importa que el codigo lo haya hecho juan, si se nos asigno a nosotros corregirlo, lo corregimos y ya". S12 incluye el bracket.
- **L4** (07-11-2026) Plan aprobado por Miguel ("apruebo, arranca con el #13"); commit del plan `db1ff02`. T1 hecha: 245 tests y lint en verde, snapshot de instrucciones igual al de la base, 8 tests en RED contra la base. Docs del contrato al día en `AGENTS.md` y `README.md`. Siguiente: T2 (#14).
- **L5** (07-11-2026) T2 hecha en `fix/accesibilidad-mis-reservas-navbar` (T1 está en el PR #18). Primer intento de agy detenido por memoria; Miguel autorizó relanzar ("Si, ya cerre todos los otros procesos de aplicaciones"). Verificación en Chrome headless de S6-S10; una corrección de S8 (`aria-controls` de la pestaña inactiva apuntaba a un panel inexistente). Siguiente: T3 (#15).
