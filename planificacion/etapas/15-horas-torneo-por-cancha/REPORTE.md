# Reporte de la etapa 15: horas del torneo por cancha y aviso de horas de más

Fecha: 15-11-2026. Rama: `feat/horas-torneo-por-cancha` (desde `main`, `1ad7242`).
Plan aprobado por Juan el 15-11-2026.

## Commits

0. `docs: plan de la etapa 15 (horas del torneo por cancha)`
1. `feat: horas por cancha y salteadas en las fases del torneo`
2. `feat: validación de reservas de torneo con horas por cancha`
3. `feat: elegir horas por cancha y avisar horas sin partido en el torneo`
4. `docs: reglas de horas del torneo en la guía y el asistente`
5. `docs: plan, verificación y reporte de la etapa 15`

## Bloques e intentos

| Bloque | Intentos | Resultado |
| --- | --- | --- |
| `l1-logica-torneo` | 1 | Contrato `horasPorCancha`, tramos y turnos, orden con cualquier cancha, programación por turnos reales, horas sin partido, limpieza por hora, QR por cancha |
| `c1-validacion-reserva` | 1 (agy dio `ERROR` tras entregar todo) | Agrupación por `ronda`, `ERROR_EVENTO_FECHA_FASE`, sin horas seguidas en torneos, precio por (fase, cancha) |
| `u1-interfaz-torneo` | 1 (agy dio `ERROR` tras entregar todo) | Filas por cancha, aviso, `DialogoHorasSinPartido`, `formatoJornadas.js`, "Mis reservas" y "Tus torneos" por fase y cancha |
| `v1-verificacion` | 1 | **APROBADO**, sin bloqueantes; 3 detalles (`revision/v1-informe.md`) |
| `f1-detalles` | 1 | Los 3 detalles de v1 y el nombre de la cancha en el QR |

HEAD no cambió durante los bloques (`deccb13`).

## Ajustes del coordinador

- Plan: estado aprobado, aclaración de que solo se cobra lo marcado en cada
  cancha y `codigoReserva.js` en las rutas de l1.
- `api/_lib/instrucciones.js` (una línea) y su snapshot: horas por cancha,
  salteadas, y descuento desde 2 horas de una misma cancha en el torneo. Se
  aplicó después de u1 para no romper el snapshot mientras agy corría pruebas.
- `docs/agentes/torneo.md`, `docs/agentes/reservas.md` y `AGENTS.md`.
- `Torneo.test.jsx`: `timeout: 15000` en el `describe` de integración. La
  prueba 5 tarda 2,3 s sola y falló 1 de 4 corridas del suite completo por el
  límite de 5 s; con el cambio pasó 3 de 3.

## Verificación

- `npm test`: 34 archivos, 337 pruebas en verde (antes 314). `npm run lint`:
  0 warnings. `npm run build`: OK.
- Mutaciones (todas revertidas): sin el corte por tramos, sin la regla de
  orden, `>=` por `>` en el orden, sin ordenar partidos por hora, agrupando
  por índice de bloque, exigiendo otra vez horas seguidas, sin el chequeo de
  celda repetida, sin el diálogo en `confirmar`, con `esLibreFase` exigiendo
  todas las canchas, con el precio agrupado solo por cancha y sin
  `confirmandoRef`: en cada una falla al menos una prueba.
- Headless sobre `npm run preview`, pádel y fútbol a 390×844 y 1440×900
  (u1 y v1): cuartos con Cancha 1 a las 16:00 y 18:00 y Cancha 2 a las 19:00;
  una hora ocupada en una cancha no bloquea la otra; la semifinal del mismo
  día queda bloqueada antes de las 20:00; final con 5 horas con aviso y
  diálogo (foco inicial, Tab y Shift+Tab atrapados, Escape devuelve el foco,
  "Revisar horas" no reserva, "Reservar igual" reserva una vez); "Mis
  reservas" lista cada fase por cancha; teclado alterna `aria-pressed`; sin
  desborde con 3 canchas a 390 px; sin errores de consola; sin abrir el chat.
  `preview` y Chrome headless cerrados.

## Pendientes

- Rediseño de la animación GSAP del torneo: etapa siguiente (decisión del
  plan).
- No se probó en producción: se verifica al fusionar el PR.

## Riesgo

Alto: cambia reglas de negocio y el formato de los bloques guardados. Las
reservas viejas (un bloque por fase con varias canchas) siguen siendo válidas
y se muestran igual, cubierto por pruebas de contexto, "Mis reservas" y "Tus
torneos". No toca seguridad, despliegue ni dependencias.
