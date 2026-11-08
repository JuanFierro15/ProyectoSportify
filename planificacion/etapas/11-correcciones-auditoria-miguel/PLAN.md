# Etapa 11: correcciones de la auditoría (issues #13, #14 y #15)

Responsable: Miguel Medina. Base: `main` en `77af94d`. Especificación:
`odd/tasks/correcciones-auditoria-miguel.md` (S1 a S14).

## Entrega

Un PR por issue, como pide el flujo del equipo. Las tres ramas salen del commit
de este plan (que va primero en la rama del #13), así que al fusionar el #13 los
otros dos PR solo muestran su propio trabajo.

| Issue | Rama | Bloque | PR |
| --- | --- | --- | --- |
| #13 chat | `fix/chat-cancelar-errores` | `c1-chat` | `Closes #13` |
| #14 accesibilidad | `fix/accesibilidad-mis-reservas-navbar` | `a1-accesibilidad` | `Closes #14` |
| #15 página de reserva | `fix/pagina-reserva-carrusel` | `p1-pagina-reserva` | `Closes #15` |

Cada bloque deja su resultado en `bloques/<bloque>/reporte.md` (no un
`REPORTE.md` común, para que los tres PR no choquen). La fila de
`planificacion/README.md` va en este commit del plan.

## Hallazgos de la exploración (sobre `77af94d`)

- Las líneas citadas en las tres issues son correctas, con dos matices:
  - #13.2: el problema no es solo `res.ok`. Los cuerpos de error del servidor
    (400, 429, 502, 504) traen un `respuesta` válido y pasan
    `normalizarRespuesta`, así que se muestran y se guardan como mensajes
    normales. Solo se marcan con `error` el JSON ilegible y la excepción de red.
  - #13.3: además de `fechaHoy`, `prepararContexto` y `construirInstrucciones`
    corren fuera del `try` de `api/chat.js:167`.
- #14.1 confirmado: el efecto de `MisReservas.jsx:122-126` corre al montar
  (`abierto` arranca en `false`) y la rama `dlg.close()` nunca se ejecuta.
- #14.5 verificado: con movimiento reducido, `DeporteHero` sigue con el pin y la
  timeline con scrub; solo se apaga el seguimiento del video. El README dice que
  el modo reducido es "estricto".
- #15.1 confirmado: si el filtro achica la lista, el índice activo queda fuera
  de rango; ninguna tarjeta es `esActiva` (`DepthCarousel.jsx:398`), así que se
  pierden el botón del visor (447) y la acción de la tarjeta.
- #15.2 confirmado: no hay ningún `scroll-snap` en `src/`.
- No hay tests de `useChatbot`, `peticion.js`, `Navbar`, `DeporteHero`,
  `DepthCarousel` ni `VistaCanchas`.

## Decisiones que propongo (las que las issues dejan abiertas)

1. **#13.1 "cancelar" según la tarjeta**: en una tarjeta de **cancelación**,
   "cancelar"/"cancela" es "sí". En una tarjeta de **reserva** es "no" (cancelar
   lo que se propone). En la lista de opciones de cancelación no es ni sí ni no
   (no dice cuál): se manda como mensaje normal. `detectarSiNo(texto, tipo)`
   recibe el tipo; sin tipo, igual que hoy.
2. **#13.2**: toda respuesta con `!res.ok` se guarda con `error: true` (se ve,
   pero no entra al historial). Se quita el estado `error` del hook (nadie lo
   usa).
3. **#13.3**: `fechaHoy` tiene que ser una fecha real (400 con
   `TEXTOS.invalida`) y, por si acaso, armar el contexto y las instrucciones
   pasa dentro del `try` (500 con el JSON del contrato).
4. **#13.4**: una sola función de precio corto en `src/lib/precios.js` y una
   sola `fechaEnFrase` en `src/lib/fechas.js` (la versión Unicode de
   `funciones.js`). El servidor deja de exigir `contexto.canchas` (lo acepta y
   lo ignora) y el widget deja de mandarlo.
5. **#13 opcionales**: sí se hacen el defecto de `horas` en
   `useAccionesReserva` y leer las `reservas` actuales (ref) en
   `manejarBusqueda`. Escape con el foco fuera del panel queda fuera (sin
   confirmar y choca con el Escape del visor).
6. **#14.2**: al cerrar Mis reservas se reinicia todo su estado.
7. **#14.4**: `irACanchas` pasa a un hook `useIrACanchas` en
   `src/components/layout/` (archivo nuevo) que usan Navbar y Footer.
8. **#14.5**: con movimiento reducido, los heros no se fijan ni hacen scrub: se
   ven quietos, con el contenido visible y el primer cuadro del video. Así el
   README queda cierto (y se agrega la línea de los heros).
9. **#15.1**: las dos cosas: la `key` del carrusel incluye la lista filtrada (se
   remonta centrado en la cancha elegida) y `DepthCarousel` acota el índice
   cuando cambia `count` (red de seguridad).
10. **#15.2**: `scroll-snap-type: x proximity` en `.selector-dia` y en el
    contenedor con scroll horizontal de las rondas del bracket (`Bracket.css`,
    con `scroll-snap-align: start` en cada ronda). Miguel, 07-11: "si se nos
    asignó a nosotros corregirlo, lo corregimos". El #12 (de Juan) también toca
    `Bracket.css`: el cambio se limita a esas dos reglas para que el choque, si
    lo hay, sea trivial.
11. **#15.3**: se completa el patrón de pestañas (panel `role="tabpanel"` con
    `aria-labelledby` y `aria-controls` en cada pestaña); siguen siendo enlaces
    para Ctrl+clic.

## Ejecución

- Código: agy `gemini-3.8-flash-high`, un bloque por issue, en orden #13 → #14 →
  #15, cada uno en su rama y en segundo plano (no dos a la vez: 8 GB de RAM).
  Tests primero en RED, como siempre.
- Pruebas: en lugar de Argon, un subagente de Claude (Sonnet) en segundo plano
  por bloque: `npm test`, `npm run lint`, `npm run build` y la prueba en el
  navegador que pide cada issue (Chrome headless contra `npm run preview`;
  #14 a mano con teclado: Tab con el navbar oculto).
- Yo: reviso cada diff contra su superficie, repito un comando de la
  verificación, hago los commits (`fix:`, `test:`, `refactor:`, `docs:`), push y
  PR. Sin menciones a IA.
- `probar-chat.mjs` no se corre: lo que llega al modelo solo cambia en que los
  mensajes de error ya no entran al historial, y el texto de las instrucciones
  se compara antes/después con un test (debe salir idéntico). Así no se gasta
  cuota de Gemini.

Pronóstico: #13 unas 300 líneas, #14 unas 250, #15 unas 150 (con tests).
Riesgo: ninguno de la lista alta. El contrato de `/api/chat` no cambia para el
widget (solo deja de exigir un campo que se ignoraba).

## Fuera de alcance

Issues #10, #11, #12, #16 y #17 (de otros compañeros), el resto de `Bracket.css`, README
salvo la sección de accesibilidad (#14.5), y Escape con el foco fuera del chat.
