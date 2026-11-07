# Etapa 9 — Reporte: rediseño de la página de reserva y de las llaves

**Responsable:** Miguel Medina. **Revisa y fusiona:** Juan Fierro.
**Rama:** `etapa-9-rediseno-reserva`, desde `main` en `e00922e`. **Fechas:** 06 y 07-11-2026.
**Estado:** implementada y verificada; falta que Juan Fierro apruebe las capturas para hacer push y abrir el PR (antes del 18-11).

La página de reserva (modos Cancha, Torneo y Cumpleaños) y la confirmación pasaron al tema oscuro del inicio. El comprobante ahora tiene forma de tiquete y las llaves del torneo son simétricas, con la final al centro. No cambió cómo se reserva, ni precios, ni validaciones, ni datos: no se tocaron `src/lib/`, `src/data/`, `src/context/`, `api/` ni `useReserva.js`.

## 1. Bloques y commits

| Bloque | Qué hizo | Commit | Verificación |
| --- | --- | --- | --- |
| PLAN | Plan aprobado por Miguel Medina, con las tres decisiones de su sección 5 | `e212d47` | — |
| `a0` | Capturas "antes" contra producción (`revision/antes/`, 20) y script `revision/capturas-etapa9.mjs` | `41538fd` | — |
| `r1` | Tokens `--reserva-*`, navbar oscuro en la reserva, encabezado con foto y velo, foco del `h1`, selector de modo con íconos, pestañas con subrayado del acento, carrusel oscuro, overrides de Foundation | `4ed9980` | `v1`: 3 defectos (navbar tapaba "Volver al inicio" en celular, encabezado de torneo sin aire, `--acento` sin uso) → corregidos → `v1b`: pasa |
| `r2` | Tarjetas de sección, Día, Horario por franjas con leyenda, Tus datos, `CanchasElegidas`, `AlertaTiempo` y `AsignacionManual` oscuros | `fa9c96b` | `v2`: 7 defectos (especificidad de `fieldset` y `.button.hollow`, horas "reservadas" sin canchas en eventos, `aria-label` en `CalendarioTorneo`, `SelectorDia` a 390 px y contraste de días bloqueados, foco anulado en campos, clase usada por el script de capturas) → corregidos → `v2b`: pasa |
| `r3` | Comprobante tiquete y confirmación oscura con el QR sobre blanco | `deaecc3` | `v3`: 2 defectos (confirmación de torneo recortada a 390 px, precio tachado a 4,41:1) → corregidos → `v3b`: pasa |
| `r4` | `SeccionLlaves` a ancho completo, llaves simétricas y por rondas en celular, "Partido N", `IndicadorPasos`, pruebas | `f063059` | `v4`: 5 defectos (comprobante `sticky` sobre las llaves, trofeo sobre "Final" con 4 equipos, faltaban conectores en celular, conectores separados en la versión compacta, recuadro con scroll no accesible con teclado) → corregidos → `v4b`: pasa |
| `r5` | Capturas "después" (`revision/despues/`, 20), casos de la etapa 8, teclado, movimiento reducido, contraste y 5 capturas de `docs/capturas/` | `276e3d5` | Ver `revision/verificacion-final.md` |
| `r6` | README al día con el rediseño (primer intento cortado por falta de memoria; el segundo lo terminó) | `a660ad7` | Revisión de menciones y Markdown; 197 pruebas |

Cada bloque lo implementó un agente con un modelo para escribir código y lo verificó otro, distinto, en el navegador. Las instrucciones de cada uno están en `bloques/`.

## 2. Respuestas de la sección E

1. **Llaves a ancho completo sin duplicar estado.** `useReserva` se crea una sola vez en `VistaCanchas` y `FormularioReserva` lo recibe por props. Las llaves pasaron a `torneo/SeccionLlaves.jsx`, que `VistaCanchas` monta en modo torneo con la misma `reserva`. Formulario y comprobante van en su propia rejilla (`.vista-canchas__fila-reserva`), con las llaves debajo a ancho completo; así el comprobante `sticky` no baja sobre las llaves. En celular esa rejilla va con `display: contents` y el orden queda formulario, llaves, comprobante.
2. **Pruebas que dependían de lo que cambió.** Solo `Torneo.test.jsx` (detalle en la sección 5). Se conservaron los textos, clases y roles que usan las demás (`App.test.jsx` y las consultas del comprobante y la confirmación).
3. **Indicador de pasos.** Se deriva de lo que ya devuelve `useReserva`, sin tocarlo. Como se decidió en el PLAN, "Formato" queda completo desde el inicio: los valores por defecto (8 equipos, 20 min) ya son válidos.
4. **Foundation sobre el tema oscuro.** Se sobrescribieron dentro de `.vista-canchas` los elementos sin clase (`fieldset`, `legend`, `label`, `select`, `input`, `button`, `details`, `summary`) y las clases `tabs`, `switch`, `button hollow/small/success/clear`, `callout` y `form-error`. Dos de esas reglas generales le ganaban a las específicas del formulario: se corrigió en `r2`.
5. **Navbar oscuro solo en la reserva.** `Navbar.jsx` agrega `site-header--reserva` cuando `deporteAbierto` no es nulo; en el inicio es nulo, así que no cambia. Medido en el inicio a 390 y 1440 px: sigue transparente sobre el video.
6. **Numeración de los partidos.** `programarTorneo` arma el arreglo por ronda y en orden de juego: "Partido N" es el índice más uno. El texto "Ganador R1-P1" viene de `src/lib/torneo.js`, que no se toca: el `Bracket` lo traduce a "Ganador del partido N" con un mapa id → número.

## 3. Verificación final

Detalle completo en `revision/verificacion-final.md`.

- `npm test`: **197 pruebas en 16 archivos**, todas en verde (antes 195). `npm run lint`: 0 errores y 0 advertencias. `npm run build`: OK.
- **Casos de la etapa 8:** A1 a A5, B1 a B7 y C1 a C4 **pasan** a 1440×900, y A1, B3 y C3 también a 390×844. Cada texto se comprobó contra la interfaz real; por ejemplo, el tope de horas dice "Puedes reservar hasta 3 horas seguidas." y el de invitados "Máximo 100 invitados.".
- **Teclado:** 34 paradas de Tab en modo cancha, 76 en torneo y 38 en cumpleaños, todas con foco visible. Pestañas con flechas, Inicio y Fin (circulares). El `h1` recibe el foco al cargar sin mostrar el contorno.
- **`prefers-reduced-motion: reduce`:** no queda ninguna animación activa en los tres modos ni en la confirmación (sin entrada GSAP ni Ken Burns).
- **Capturas:** antes y después en `revision/antes/` y `revision/despues/` (20 cada una: cancha en fútbol con 2 horas, torneo con 4, 8 y 16 equipos, cumpleaños con invitados y la confirmación de cada modo, a 1440×900 y 390×844). En `docs/capturas/` cambiaron `vista-canchas`, `reserva-voucher`, `confirmacion-qr`, `modo-torneo` y `torneo-bracket` (de 44 a 70 KB).

## 4. Contraste

Medido en el navegador con los tres acentos (fútbol `#5bd67d`, pádel `#3fa9f5`, vóley playa `#f6a94b`). La tabla completa, con 34 combinaciones, está en `revision/verificacion-final.md`, sección 5. Resumen de los colores de texto nuevos:

| Texto | Fondo | Razón (fútbol / pádel / vóley) |
| --- | --- | --- |
| Principal `#f2f2f2` | página `#0d0d0d` / sección `#161616` / comprobante `#1a1a1a` / control `#1f1f1f` | 17,36 / 16,16 / 15,55 / 14,72 (igual en los tres) |
| Secundario `#c4c4c4` | `#0d0d0d` / `#161616` | 11,14 / 10,38 |
| Tenue `#a8a8a8` (incluido el de 12 px de las llaves) | `#0d0d0d` / `#161616` / `#1a1a1a` / `#1f1f1f` | 8,17 / 7,61 / 7,32 / 6,93 |
| Sobre el acento `#0d0d0d` (hora elegida, "Confirmar reserva") | acento | 10,51 / 7,59 / 9,90 |
| Acento como texto (día elegido) | `#1f1f1f` | 8,92 / 6,44 / 8,39 |
| Acento como texto (pastilla, descuento, pack de agua) | `#1a1a1a` | 9,41 / 6,80 / 8,86 |
| Hora reservada `#808080` | `#161616` | 4,58 (igual en los tres) |
| Días bloqueados `#8c8c8c` | `#1f1f1f` | 4,90 |
| "Ganador del partido N" `#a8a8a8` en la final | acento al 12 % | 5,76 / 6,00 / 5,78 |
| Alerta ámbar `#fbbf24` | `#2c2415` | 9,18 |

Ningún texto baja de 4,5:1. El PROMPT pedía `#7a7a7a` para las horas reservadas, pero daba 4,22:1; el PLAN aprobado lo cambió por `#808080`. Por la misma razón, el precio tachado del comprobante usa `#a8a8a8`.

## 5. Pruebas que cambiaron (`src/components/reservas/Torneo.test.jsx`)

- **Prueba 1:** `getByText('R1-P1')`, `R1-P2` y `R2-P1` pasaron a "Partido 1", "Partido 2" y "Partido 3" (torneo de 4 equipos: la final es el partido 3).
- **Prueba 4:** los combobox `Llave R1-P1 equipo local / visitante` pasaron a `Partido 1, equipo local / visitante`.
- **Prueba 5:** `R1-P1` a `R3-P1` dentro de "Torneos reservados" pasaron a "Partido 1" a "Partido 7".
- **Arnés de pruebas:** los dos que montaban `FormularioReserva` solo ahora montan también `SeccionLlaves` e `IndicadorPasos` con la misma `reserva`.
- **Nuevas:** prueba 11 ("Ganador del partido N" en las rondas siguientes y la final con "Trofeo y premiación al terminar.") y prueba 12 (el indicador de pasos marca el paso actual con `aria-current="step"` y avanza al elegir canchas).
- La verificación de `r4` revisó que las pruebas cambiadas siguen comprobando lo mismo y que no se debilitó ninguna.

## 6. Pendiente y observaciones

1. **Que Juan Fierro apruebe las capturas** (`revision/despues/` y las 5 de `docs/capturas/`). Después: push de la rama y PR a `main` antes del 18-11.
2. **Conectores de las llaves (corregido en `r7`):** Miguel Medina reportó una línea torcida que no apuntaba a ningún partido. La causa: en `Bracket.jsx`, el segundo trazo de cada par de partidos usaba la forma abreviada `{ x1: xStart, y1, ... }`, que toma el `y` del partido de arriba en lugar del de abajo. La línea bajaba en diagonal y el partido de abajo quedaba sin conector (en los dos lados de la vista simétrica y en la compacta). Se corrigió y se comprobó en el navegador con Playwright, con 4, 8 y 16 equipos, en escritorio, celular y la confirmación: todos los tramos son horizontales o verticales y llegan al centro del partido siguiente (desvío menor de 1 px). Se rehicieron las capturas "después" y `docs/capturas/torneo-bracket.webp`.
3. **"Formato" del indicador de pasos** aparece completo desde el inicio, como se decidió en el PLAN.
4. Las pruebas manuales `z5` y `z6` de la etapa 8 (de Juan Fierro) siguen pendientes y no son parte de esta etapa.
