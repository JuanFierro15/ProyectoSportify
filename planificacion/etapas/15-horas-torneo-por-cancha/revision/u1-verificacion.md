# Verificación headless — `u1-interfaz-torneo`

Fecha: 2026-11-15  
URL probada: `http://localhost:4173/reservar/padel?modo=torneo` (build de producción servido con `npx vite preview --port 4173 --strictPort`)  
Script: [`u1-prueba.mjs`](u1-prueba.mjs)  
Salida cruda: [`u1-resultado.json`](u1-resultado.json)

## Cobertura ejecutada (sin abrir el chat)

- Viewports probados: `390x844` (móvil con `AsistenteTorneo`) y `1440x900` (escritorio).
- Errores de consola / excepciones de runtime: `0` (`erroresConsola: []`, `excepciones: []`).

### 1. Móvil (`390x844`, 3 canchas de pádel seleccionadas)
- **Desborde horizontal**:
  - Paso canchas (3 chips elegidos): `scrollWidth = 390`, `innerWidth = 390` (`sinDesborde: true`, 0 elementos por fuera).
  - Calendario por fases con 3 filas de canchas (`padel-1`, `padel-2`, `padel-3`): `scrollWidth = 390`, `innerWidth = 390`.
  - Paso resumen y confirmación: `scrollWidth = 390`, `innerWidth = 390`.
  - Modal "Mis reservas": `scrollWidth = 390`, `innerWidth = 390`.
- **Cuartos por cancha (día índice 3 / miércoles 18 nov)**:
  - Bloqueo independiente: a las `14:00`, `Cancha 2` (`padel-2`) está deshabilitada por semilla mientras `Cancha 1` (`padel-1`) sigue habilitada.
  - Selección salteada por cancha: `padel-1` (`16:00`, `18:00`) y `padel-2` (`19:00`) con `aria-pressed="true"` y resumen `· Cancha 1: 16:00, 18:00 · Cancha 2: 19:00 (3 horas)`.
- **Semifinal cronológica**:
  - En el mismo día que Cuartos (`día índice 3`), las horas previas al fin de Cuartos (`18:00`, `19:00`) aparecen deshabilitadas y `20:00` habilitada (`padel-2` termina a las `20:00`).
  - Al programar Semifinal el jueves `19` (`14:00`) y volver a elegir miércoles `18`, la cascada limpia la hora inválida (`Sin horario`). Se reprograma en jueves `19` a las `14:00`.
- **Final con 5 horas (viernes 20 nov, `08:00` a `12:00` en `padel-1`)**:
  - Callout `role="status"` visible: `La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.` con el detalle por hora (`Cancha 1 · 09:00` a `Cancha 1 · 12:00`).
  - Pestaña `Final` muestra el icono de aviso y `Revisa el horario` (`tabTieneAviso: true`).
- **Diálogo `"Hay horas sin partido"`**:
  - Al pulsar `Confirmar reserva`, abre el diálogo con foco inicial en `Revisar horas` y sin guardar reserva (`reservasCount: 0`).
  - `Escape` cierra el diálogo y devuelve el foco a `Confirmar reserva` sin reservar.
  - Al volver a pulsar `Confirmar reserva` y elegir `Revisar horas`, regresa al paso `fechas` enfocando `panel-fase-1` (Cuartos también tenía 1 hora extra además de Final, por lo que `revisarHorasDeMas` priorizó la primera ronda con horas de más) sin guardar reserva.
  - Al pulsar `Confirmar reserva` y `Reservar igual`, confirma con código `SPF-E7GCTG`.
- **Mis reservas**:
  - Búsqueda por `SPF-E7GCTG` lista las 3 fases con fecha completa y desglose por cancha:
    - `Cuartos de final: Miércoles 18 de noviembre · Pádel 1: 16:00, 18:00 · Pádel 2: 19:00 a 20:00`
    - `Semifinal: Jueves 19 de noviembre · Pádel 1: 14:00 a 15:00`
    - `Final: Viernes 20 de noviembre · Pádel 1: 08:00 a 13:00`

### 2. Escritorio (`1440x900`, 3 canchas de pádel seleccionadas)
- **Desborde horizontal**: `scrollWidth = 1440`, `innerWidth = 1440` en vista inicial, calendario de 3 canchas, confirmación y `"Mis reservas"`.
- **Calendario, voucher y diálogo**:
  - Reprodujo los mismos resultados de Cuartos por cancha, bloqueo e invalidación en cascada de Semifinal, callout e icono de aviso en Final.
  - El voucher mostró las 3 fases con detalle por cancha, descuentos desde 2 h por cancha (`−$ 5.000 por hora` en Cuartos Cancha 1 y Final Cancha 1) y total `$ 550.000`.
  - Flujo completo del diálogo (`Escape` devuelve foco a `Confirmar reserva`, `Revisar horas` enfoca `panel-fase-1` sin reservar, `Reservar igual` genera `SPF-UFB5GR`) y listado completo en `"Mis reservas"`.

## Capturas inspeccionadas
- `u1-390-cuartos-3canchas.png`, `u1-390-final-aviso.png`, `u1-390-dialogo.png`, `u1-390-confirmacion.png`, `u1-390-mis-reservas.png`: sin solapes ni cortes de botones de hora; las filas de cancha se apilan con sus horas envueltas en 3 columnas y etiqueta legible en 390 px; el diálogo apila botones con buen contraste.
- `u1-1440-calendario-aviso.png`, `u1-1440-dialogo.png`, `u1-1440-confirmacion.png`, `u1-1440-mis-reservas.png`: calendario con las 3 filas de cancha y voucher lateral alineados sin desborde; diálogo centrado sobre fondo atenuado; `"Mis reservas"` muestra la lista completa por fase y cancha.
