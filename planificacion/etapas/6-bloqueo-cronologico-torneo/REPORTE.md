# Reporte — Etapa 6 (Bloqueo cronológico preventivo en torneos)

Fecha: 31-10-2026.

## Qué se hizo

Reemplazo de la validación reactiva de orden cronológico entre fases de torneo
por un bloqueo preventivo en la interfaz (`SelectorDia`, `CalendarioTorneo`,
`useReserva`), marcando como `disabled` y `"bloqueado"` los días anteriores a
cualquier fase previa (y el mismo día si la fase previa agota el horario
disponible), avanzando en cascada las fechas de fases posteriores cuando se
adelanta una fase anterior y deshabilitando las horas anteriores o iguales al
término de una fase previa en el mismo día.

Además, registro de la Etapa 7 (`7-auditoria-usabilidad`) con el plan e
instrucciones completas derivadas de la auditoría integral `impeccable` para la
rama `usability-improve`.

## Bloques ejecutados

### Bloque b1-bloqueo-cronologico-fases

- **Responsable:** Miguel Medina / agy.
- **Modelo:** `3.8 Flash+` (1 intento, sin ajustes adicionales del coordinador).
- **Archivos modificados:**
  - `src/components/shared/SelectorDia.jsx`: Se incorporó la prop opcional `esDiaBloqueado`, configurando el botón como `disabled`, agregando la clase `selector-dia__opcion--bloqueado`, protegiendo el manejador `onClick` y mostrando la etiqueta explícita `"bloqueado"` en `.selector-dia__libres`.
  - `src/components/shared/SelectorDia.css`: Se definieron los estilos visuales para `.selector-dia__opcion--bloqueado` y `.selector-dia__opcion:disabled` con opacidad reducida, borde punteado (`dashed`), fondo `#f1f5f9` y cursor `not-allowed`.
  - `src/components/reservas/useReserva.js`: Se implementó la función pura `normalizarJornadasCascada` para avanzar fechas posteriores y limpiar franjas horarias que queden en conflicto; se ajustó `esLibreFase` para deshabilitar horas menores o iguales a la finalización de fases previas en el mismo día; se añadió `esDiaBloqueadoFase` para calcular fechas mínimas y detectar días con horario insuficiente; se aplicó la cascada en `cambiarFechaFase` y `elegirHoraFase`; y se expuso `esDiaBloqueadoFase` en la API del hook.
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`: Se recibió `esDiaBloqueadoFase` y se propagó a cada `<SelectorDia />` por fase (`esDiaBloqueado={esDiaBloqueadoFase ? esDiaBloqueadoFase(fase.ronda) : undefined}`).
  - `src/components/reservas/FormularioReserva.jsx`: Se conectó `esDiaBloqueadoFase` obtenido de `useReserva` pasándolo como prop a `<CalendarioTorneo />`.
  - `src/components/reservas/Torneo.test.jsx`: Se actualizó el test de integración 3 (`Validación de orden cronológico entre fases`) comprobando los atributos `disabled` y el texto `"bloqueado"` en días previos, el avance automático en cascada de fechas en fases posteriores y el bloqueo de horas previas en el mismo día.

## Verificación

- **Pruebas automáticas (`npx vitest run`):** 13 archivos de prueba ejecutados y 172 pruebas pasadas con 100% de éxito (incluyendo las 43 pruebas de `torneo.test.js` y las 5 de `Torneo.test.jsx`).
- **Linter (`npm run lint`):** 0 errores y 0 advertencias (`eslint .` completado limpiamente).
- **Antipatrones de UI (`impeccable detect`):** `[]` (0 antipatrones sobre los componentes modificados).
- **Compilación de producción (`npm run build`):** Compilación Vite satisfactoria y limpia.

## Commits

1. `fc9f6ed`: `feat: bloquea días y horarios cronológicamente inválidos entre fases del torneo`
2. `1d5ecdb`: `test: verifica bloqueo preventivo de fechas y horas en programación de torneos`

