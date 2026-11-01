# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `GEMINI.md` (raíz; cada integrante lo
  tiene en local): léela antes de empezar y respétala. La parte del plan que
  te toca va copiada en tu tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.
# Tarea: prevención proactiva de errores en reservas y torneos (`u1-prevencion-errores-reservas`)

> Versión corregida (31-10) contra el código real de `main` tras el PR #2. Reemplaza el borrador
> (`instruccion-borrador.md`), que usaba nombres que no existen (`seleccionada`,
> `.cancha-carrusel__cta`, `setDuracionTorneo`).

## Objetivo

Hallazgos `P0-03`, `P0-04`, `P1-04`, `P1-06`, `P1-07` y `P2-05` de la auditoría (`../../PLAN.md`):
evitar que el usuario llegue a un estado de error en vez de avisarle después.

## Rutas

- Modificar (y nada más):
  - `src/components/reservas/useReserva.js`
  - `src/components/reservas/TarjetaCanchaCarrusel.jsx` y `TarjetaCanchaCarrusel.css`
  - `src/components/canchas/VistaCanchas.jsx`
  - `src/components/reservas/CanchasElegidas.jsx`
  - `src/components/reservas/torneo/AsignacionManual.jsx`
  - `src/components/reservas/torneo/AlertaTiempo.jsx`
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`
  - `src/components/reservas/FormularioReserva.jsx`
  - `src/components/shared/SelectorDia.jsx`
  - `src/components/reservas/Torneo.test.jsx`
- Leer sin modificar: `src/lib/torneo.js` (`MAX_CANCHAS_TORNEO`, `OPCIONES_DURACION`),
  `src/lib/precios.js` (`finDeFranja`), `src/data/deportes.js` (`deportePorSlug`),
  `src/data/canchas.json` (hay 3 canchas por deporte), `src/lib/canchas.js` (`canchasDelDeporte`).

## Diseño

### 1. Canchas en modo Torneo (P0-03): `useReserva.js`

Hoy `alternarCancha` (cerca de la línea 734) y `alternarDeporte` (cerca de la 741) dejan agregar
canchas de otro deporte o pasar de `MAX_CANCHAS_TORNEO`, y el error sale después (`torneo.js:256`).

- Nueva función estable `motivoNoAgregable(id)` (con `useCallback`), expuesta en el objeto que
  retorna el hook:
  - Retorna `null` si `modo !== 'torneo'` o si `id` ya está en `canchaIds`.
  - Si hay canchas elegidas y la cancha `id` es de un deporte distinto al de la primera elegida:
    retorna `Solo canchas de ${deportePorSlug(deporteElegido)?.nombre}` (por ejemplo
    "Solo canchas de Fútbol").
  - Si no, y `canchaIds.length >= MAX_CANCHAS_TORNEO`: retorna `Máx. ${MAX_CANCHAS_TORNEO} canchas`.
  - Si no, `null`.
- Exponer también `topeCanchasAlcanzado = modo === 'torneo' && canchaIds.length >= MAX_CANCHAS_TORNEO`.
- `alternarCancha(id)`: quitar siempre se permite; agregar solo si la regla anterior da `null`
  (evalúala con el `prev` del setter para no depender de un estado viejo).
- `alternarDeporte(slug)`: en torneo, si ya hay canchas elegidas de otro deporte, no hace nada; si
  agrega, nunca deja más de `MAX_CANCHAS_TORNEO` en total. En cancha y cumpleaños, igual que hoy.
- Nueva función `deporteBloqueado(slug)` expuesta en el hook: `true` solo en torneo cuando ya hay
  canchas elegidas de otro deporte. La usa `CanchasElegidas` para "Elegir todas de X".

### 2. Tarjeta del carrusel: `TarjetaCanchaCarrusel.jsx` y `.css`

- Prop nueva `motivoBloqueo = null`. La prop existente para lo elegido es `marcada` y el botón es
  `.tarjeta-cancha__boton`.
- Si `modo === 'evento' && !marcada && motivoBloqueo`: el botón queda `disabled` y su texto es
  `motivoBloqueo`. Mantener `onPointerDown` con `stopPropagation`.
- CSS: `.tarjeta-cancha__boton:disabled` con opacidad cercana a 0,6, `cursor: not-allowed` y sin el
  efecto de `:hover`/`:active` (usar `:not(:disabled)` en esas reglas o anularlas).

### 3. `VistaCanchas.jsx` (los tres puntos que llaman a `alternarCancha`)

- Carrusel (`renderOverlay`, cerca de la línea 517): pasar
  `motivoBloqueo={reserva.motivoNoAgregable(c.id)}`.
- Grid estático (cerca de la 453, se usa si un deporte tiene menos de 3 canchas): en evento, si
  `reserva.motivoNoAgregable(c.id)` no es `null`, el botón queda `disabled` y muestra el motivo
  como texto pequeño dentro de la card.
- Visor (cerca de las líneas 565-580): en evento, si la cancha activa tiene motivo, `textoAccion`
  es el motivo y `onAccion` no llama a `alternarCancha` (solo cierra el visor). No modifiques
  `VisorCancha` más allá de este archivo.
- `CanchasElegidas`: pasar `bloqueadoTodas={reserva.deporteBloqueado(deporteAbierto)}`.

### 4. `CanchasElegidas.jsx`

- Prop `bloqueadoTodas = false`: si es `true`, el botón `.canchas-elegidas__todas` queda
  `disabled` y su texto es "Solo un deporte por torneo".

### 5. Intercambio en la asignación manual (P0-04)

- `useReserva.js`, `cambiarCruceManual(indice, valor)` (cerca de la línea 411):

  ```js
  const num = valor === '' || valor == null ? null : Number(valor);
  setOrdenEquipos((prev) => {
    const copia = [...prev];
    if (num != null) {
      const idxPrevio = prev.findIndex((v, i) => i !== indice && Number(v) === num);
      if (idxPrevio !== -1) copia[idxPrevio] = prev[indice] ?? null; // intercambia o mueve
    }
    copia[indice] = num;
    return copia;
  });
  ```

  Así nunca quedan equipos repetidos; si la posición actual estaba vacía, la otra queda vacía.
- `AsignacionManual.jsx`: nota de ayuda arriba del grid
  (`<p className="formulario-reserva__nota">`): "Si eliges un equipo que ya está en otra llave,
  los dos cambian de lugar." y cambiar el sufijo `' (en uso)'` por `' (en otra llave)'`.

### 6. `SelectorDia` (P1-04)

- `useReserva.js`, `contarLibresFase` (cerca de la línea 353): si
  `!fase || fase.canchaIds.length === 0`, retornar `undefined` (no `() => 0`), igual que
  `contarLibresDia`. Si no, los días salen "completo" antes de elegir canchas.
- `SelectorDia.jsx`:
  - `aria-label` en cada botón con: etiqueta del día (`etiquetaDia(iso, dias)`), número, "de" y
    mes (`MES_CORTO`), y al final ", bloqueado" si está bloqueado, ", sin horarios libres" si está
    lleno, o ", N libres" si hay conteo.
  - `disabled={bloqueado || (lleno && !sel)}` y el `onClick` respeta lo mismo. Actualizar el
    comentario de cabecera.

### 7. Resumen de franja y ayuda (P1-06)

- `FormularioReserva.jsx`, fieldset `#reserva-horario` (cerca de la línea 60; solo existe en cancha
  y cumpleaños): dentro de la `<legend>`, después de "Horario", si `reserva.horasSel.length > 0`, un
  `<span className="formulario-reserva__rango" aria-live="polite">` con
  ` · {primera hora} a {finDeFranja(última hora)} ({n} h)`, por ejemplo " · 14:00 a 16:00 (2 h)".
  `finDeFranja` ya está importado.
- `CalendarioTorneo.jsx`, campo "Horario de {fase.nombreRonda}" (cerca de la línea 136): el mismo
  resumen con `horasFase` cuando tenga horas, y debajo de la etiqueta la nota
  `<p className="formulario-reserva__nota">Para elegir 2 o más horas seguidas, toca la hora de inicio y luego la hora final.</p>`
  solo en la primera fase (para no repetirla).

### 8. Acción rápida en `AlertaTiempo` (P1-07)

- `AlertaTiempo.jsx`: props nuevas `duracionPartido` y `onCambiarDuracion`. Si
  `onCambiarDuracion && Number(duracionPartido) > OPCIONES_DURACION[0]`, al final del callout un
  `<button type="button" className="button small hollow alerta-tiempo__accion">` con el texto
  `Cambiar a ${OPCIONES_DURACION[0]} min por partido` que llama
  `onCambiarDuracion(OPCIONES_DURACION[0])`. Importar `OPCIONES_DURACION` de `src/lib/torneo.js`;
  no escribir el 15 a mano.
- `CalendarioTorneo.jsx`: props nuevas `duracionPartido` y `onCambiarDuracion`, reenviadas a su
  `AlertaTiempo`.
- `FormularioReserva.jsx`: pasar `duracionPartido={reserva.duracionPartido}` y
  `onCambiarDuracion={reserva.setDuracionPartido}` (el setter real se llama así) a
  `<CalendarioTorneo>` (cerca de la línea 260) y al `<AlertaTiempo>` de cerca de la línea 314.

### 9. Invitados (P2-05)

- `useReserva.js`: `export const MAX_INVITADOS = 100;` y en `motivoBloqueo` (cerca de la línea 658),
  después del chequeo de `< 1`: si `Number(invitados) > MAX_INVITADOS` →
  `Máximo ${MAX_INVITADOS} invitados.`.
- `FormularioReserva.jsx`, `#reserva-invitados`: `max={MAX_INVITADOS}` (importado de
  `./useReserva`) y `placeholder="Ej. 20"`.

### 10. Tests: `Torneo.test.jsx`

Reutiliza el componente auxiliar `FlujoTorneoPrueba` y el estilo de los tests existentes.

- Reescribir el test 4: con emparejamiento manual, poner en R1-P1 local el equipo que está en el
  visitante → los dos se intercambian (comprobar el `value` de los dos `select`) y no aparece
  "Hay equipos repetidos en los cruces."; luego dejar una posición en `''` → aparece el error de
  cruces incompletos que ya da el código (búscalo en `useReserva.js`/`torneo.js`) y "Confirmar
  reserva" está deshabilitado.
- Nuevo: en torneo con canchas de fútbol, `motivoNoAgregable` de una cancha de pádel es
  "Solo canchas de Fútbol" y `alternarCancha` de esa cancha no la agrega (con `renderHook` de
  `@testing-library/react` envolviendo en `ReservasProvider`, o por la UI).
- Nuevo: sin canchas elegidas, ningún día del calendario de torneo queda deshabilitado por estar
  lleno (`contarLibresFase` retorna `undefined`).
- Nuevo: `AlertaTiempo` con `duracionPartido={20}` y `onCambiarDuracion` muestra el botón y al
  hacer clic lo llama con 15; con `duracionPartido={15}` no lo muestra.
- Nuevo: en cumpleaños, 150 invitados bloquea con "Máximo 100 invitados." (por `renderHook` o UI).

## Verificación al terminar

- `npm test` (todas las suites en verde) y `npm run lint` (0 errores, 0 warnings).
- No ejecutes `npm run dev` ni `npm run preview`.
- Responde con la lista de archivos cambiados y un resumen por punto (1 a 10).
