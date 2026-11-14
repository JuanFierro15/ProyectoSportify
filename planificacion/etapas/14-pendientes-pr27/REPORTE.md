# Reporte de la etapa 14: pendientes del PR #27

Fecha: 14-11-2026. Rama: `fix/pendientes-pr27` (desde `main`, `2cf1cc4`).
Plan aprobado por Juan el 14-11-2026.

## Commits

1. `fix: área táctil de 44 px en las sugerencias del chat`
2. `fix: los puntos del carrusel no tapan el botón de la tarjeta`
3. `test: limpieza de GSAP en el torneo y pausa del video del hero`
4. `test: caso mixto de errores en /api/chat y enlaces de Navbar y Footer`
5. `docs: pruebas de GSAP y del hero en AGENTS.md`
6. `docs: plan, verificación y reporte de la etapa 14`

## Bloques e intentos

| Bloque | Intentos | Resultado |
| --- | --- | --- |
| `p1-chips-y-carrusel` | 2 lanzamientos; el primero no arrancó (faltaba la carpeta `logs/` y falló la redirección) | P1 y P6 hechos; mediciones en `revision/p1-mediciones.md` |
| `t1-pruebas` | 2 (+1 que no arrancó por lo mismo) | El intento 1 se detuvo con razón: el plan pedía 502 para 429, 429, timeout, pero el contrato es 504 si alguno agota el tiempo (`respuestaFinal`, `docs/agentes/chatbot.md`). Se corrigió el plan y la retoma lo cerró |

HEAD no cambió durante los bloques (`1939ed2`).

## Ajustes del coordinador

- Corrección del caso P4.2 en `PLAN.md` y `tarea.md` (504, no 502).
- `AGENTS.md`: lista de pruebas de interfaz y nota de que el `matchMedia` de
  `setupTests.js` responde `false` (una prueba de GSAP lo reemplaza y restaura).
- `revision/390/verificacion.md`: `/reservar/voley` redirige al inicio (el slug
  es `voley-playa`); la medición de la etapa en esa ruta repitió el inicio. El
  bloque p1 midió `/reservar/voley-playa` y `/reservar/padel?modo=torneo`.

## Verificación

- `npm test`: 33 archivos, 314 pruebas en verde (antes 299). `npm run lint`:
  0 warnings. `npm run build`: OK.
- Mutaciones (código restaurado después):
  - sin `mm.revert()` en Bracket fallan 2 de 4;
  - sin `mm.revert()` en CalendarioTorneo fallan 2 de 12;
  - sin `video?.pause()` fallan 2 de 2;
  - con `respuestaFinal` dando 429 ante cualquier 429 fallan los 2 casos nuevos.
- Headless sobre `npm run preview` a 390×844 y 1440×900:
  - Chips: 26.3 → 44 px. No tapan el input. Con `fetch` interceptado, el segundo
    y el último chip envían su texto.
  - Pastilla en pádel, vóley playa, fútbol y torneo:
    - a 390 px pasa de tapar la tarjeta 22 px y el botón 4 px a quedar 20 px
      bajo la tarjeta y 38 px bajo el botón;
    - a 1440 px pasa de tapar 28 y 10 px a quedar a +14 y +32 px.

    Sin desborde y con 20 px hasta el bloque siguiente. Los puntos responden
    bien al segundo, al último y al último otra vez.
  - Con reduced-motion: sin transiciones y sin errores de consola.
- `preview` y Chrome headless cerrados.

## Pendientes

- Navbar móvil con "Mis reservas" en una tercera fila: fuera de alcance (decisión del plan).
- P7: el `PLAN.md` de la etapa 13 se deja como está (recomendación aprobada).

## Riesgo

Solo CSS y pruebas: no toca datos persistidos, seguridad, contratos ni
despliegue. El cambio de `margin-bottom` del carrusel agrega unos 44 px bajo la
tarjeta en la página de reserva.
