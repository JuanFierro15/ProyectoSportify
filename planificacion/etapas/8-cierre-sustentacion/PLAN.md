# Etapa 8 — Cierre antes de la sustentación

> **Estado:** aprobado por Juan Fierro el 06-11-2026. Evaluación hecha ese día sobre `main` en `0e7a6f8`.
> **Responsable:** Juan Manuel Villalba Rincón (`jmvr24`). **Revisa y fusiona:** Juan Fierro.
> **Rama:** `etapa-8-cierre`, creada desde `main` actualizado. PR a `main` (cada push a `main` despliega a producción).
> **Sustentación:** viernes 20-11-2026. **`main` congelado desde:** miércoles 18-11-2026.

## 1. Qué se pidió y qué hay hoy

Juan pidió dejar al día todo lo atrasado y probar el proyecto completo. **El Bloque 7 (panel de
administración) queda descartado:** no se hace, ni el panel ni la verificación del QR contra las
reservas guardadas.

El proyecto funciona: 191 tests en verde, lint sin avisos, build correcto, 0 vulnerabilidades en
dependencias de producción y sin errores 5xx en producción en los últimos 7 días. Lo que falta es
poco: textos que quedaron viejos tras los torneos multi-día, dos restos de la auditoría, la
documentación y una prueba completa en navegador, que no se ha hecho desde la etapa 7.

Antes de empezar:

```bash
git checkout main && git pull && git checkout -b etapa-8-cierre && npm install
```

Lee `planificacion/README.md`, el `REPORTE.md` de la etapa 7 y tu `GEMINI.md` local. Si tu `GEMINI.md`
no existe, pídeselo a Juan Fierro: no se versiona.

## 2. Decisiones

| Decisión | Por qué |
| --- | --- |
| **No preseleccionar cancha al entrar a torneo.** Se mejora el texto del estado vacío. | "Reserva un evento" siempre abre en vóley (`EventoCTA.jsx:116`). Si entrara una cancha de vóley ya elegida, el torneo quedaría bloqueado a ese deporte y quien quiera fútbol tendría que quitarla primero. La página ya avisa ("Aún no has elegido canchas" y "Elige primero las canchas del torneo…"). Esto cierra el pendiente del reporte de la etapa 7. |
| **El chat no busca por código.** Remite a "Mis reservas". | Agregar el código exige cambiar la función del modelo, la acción y `useAccionesReserva`, con riesgo a dos semanas de sustentar. "Mis reservas" ya resuelve el caso. |
| **Sin cambios de arquitectura.** No se tocan videos, dependencias ni `useReserva.js` (salvo lo indicado) y no se agrega CI. | Son mejoras reales, pero ninguna se ve en la sustentación y todas pueden romper algo. |
| **Primero código, después pruebas y al final documentación.** | Las capturas del README deben mostrar la versión final. |

## 3. Bloques

| Bloque | Qué | Ola | Fecha límite |
| --- | --- | --- | --- |
| `z1` | Chat y datos del negocio al día con los torneos | 1 | mar 10-11 |
| `z2` | Invitados, estado vacío y pestañas con teclado | 1 | mar 10-11 |
| `z3` | Pruebas completas (local) | 2 | jue 12-11 |
| `z4` | README, capturas, guías y planificación | 3 | dom 15-11 |
| `z5` | Revisión, fusión y prueba en producción | 4 | mar 17-11 |
| `z6` | Límite de peticiones a `/api/chat` (Juan Fierro) | fuera de la rama | mar 17-11 |

`z1` y `z2` no tocan los mismos archivos: se pueden lanzar a la vez con agy, siguiendo los pasos de
`planificacion/README.md` (crear `bloques/<id>-<nombre>/tarea.md` y copiar ahí el bloque de este plan),
o hacerse a mano.

### `z1` — Chat y datos del negocio

**Rutas:** `api/_lib/instrucciones.js`, `src/data/negocio.json`, `scripts/probar-chat.mjs` y, si un test
lo exige, `src/lib/negocio.test.js`.

1. `api/_lib/instrucciones.js:76`: el proceso describe el torneo viejo. Reemplazar por un texto como
   este, tomando los valores de `MAX_CANCHAS_TORNEO` y `OPCIONES_EQUIPOS` de `src/lib/torneo.js` (ese
   módulo no tiene imports, se puede usar desde `api/`), sin escribirlos a mano:

   > Proceso: se reservan desde la página de reserva del sitio, en el modo Torneo o Cumpleaños, y se
   > reserva todo o nada. Torneo: de 1 a 3 canchas de un solo deporte, 4, 8 o 16 equipos, y un día y
   > horario por cada fase, en orden cronológico dentro de los próximos 7 días. Cumpleaños: una o varias
   > canchas, una franja de horas seguidas y el número de invitados.

   Antes de escribir la frase de precio, léela en `calcularPrecioJornadas` (`src/lib/precios.js:72`) y
   escribe solo lo que el código hace. No importes `MAX_INVITADOS`: vive en `useReserva.js`, que usa
   React y no se puede importar desde `api/`.
2. `api/_lib/instrucciones.js:33`: agregar a la regla de cancelar que, si la persona tiene el código
   `SPF-XXXXXX` o reservó sin teléfono, debe usar **"Mis reservas"** en el menú. Agregar en la línea 34
   que esa misma opción sirve para consultar torneos y cumpleaños, que no se cancelan por ahí ni por el
   chat, sino llamando al local.
3. `src/data/negocio.json`, evento "Torneos": cambiar "Combina varias canchas en la misma franja, con
   trofeos y premiación." por algo como "Organízalo por fases, en una o varias canchas del mismo deporte,
   con trofeos y premiación."
4. `scripts/probar-chat.mjs`: agregar dos casos.
   - `torneo-proceso`: "¿Cómo reservo un torneo?". Pasa si `accion.seccion === 'eventos'` y la respuesta
     no dice "misma franja" ni promete reservarlo por el chat.
   - `cancelar-codigo`: "Quiero cancelar, tengo el código SPF-ABC123 y no di teléfono". Pasa si
     menciona "Mis reservas" y `accion` no es `BUSCAR_CANCELACION`.

**Listo cuando:** `npm test` y `npm run lint` pasan, y `/api/chat` sigue compilando en `vercel build`
(importante porque se agrega un import desde `api/`; debe seguir sin `"type": "module"`).

### `z2` — Invitados, estado vacío y pestañas

**Rutas:** `src/components/reservas/{useReserva.js,VoucherReserva.jsx,ConfirmacionReserva.jsx,CanchasElegidas.jsx}`,
`src/components/canchas/VistaCanchas.jsx` y sus CSS, `src/components/reservas/Torneo.test.jsx`.

1. **Invitados (auditoría P2-05).** Hoy se piden y se guardan, pero no se muestran.
   - Voucher: pasar `invitados={reserva.modo === 'cumpleanos' ? reserva.invitados : null}` en
     `VistaCanchas.jsx:553` y mostrar la línea "Invitados: N" si hay un valor.
   - Confirmación: agregar `invitados` al resumen de `setConfirmado` (`useReserva.js`, cerca de la línea
     974) y mostrarlo en `ConfirmacionReserva.jsx`, solo en cumpleaños.
   - Test: en cumpleaños la cantidad aparece en voucher y confirmación; en cancha y torneo, no.
2. **Estado vacío.** `CanchasElegidas.jsx:34`: cambiar "Aún no has elegido canchas." por "Aún no has
   elegido canchas. Agrégalas desde el carrusel." No preseleccionar ninguna (ver Decisiones).
3. **Pestañas de deporte (auditoría P1-08).** `VistaCanchas.jsx:371-396` tiene `role="tablist"` y
   `role="tab"`, pero sin navegación con flechas.
   - Foco móvil: `tabIndex={0}` en la pestaña activa y `-1` en las demás.
   - `ArrowLeft`, `ArrowRight`, `Home` y `End`: enfocan y activan la pestaña, igual que el clic, de forma
     circular. Reutiliza la lógica del `onClick` en una función, sin duplicarla.
   - `role="presentation"` en cada `<li>`.
   - Conserva el `href`: Ctrl+clic debe seguir abriendo otra pestaña.

**Listo cuando:** `npm test`, `npm run lint` y `npm run build` pasan, y las tres cosas se comprueban en
el navegador.

### `z3` — Pruebas

Contra `npm run build` + `npm run preview` (`http://localhost:4173`). Para el chat, `vercel dev`
(`http://localhost:3000`). **Nunca los dos a la vez:** el equipo tiene poca RAM.

**Datos:** "Ana Gómez", `300 123 4567`, nunca datos reales. Prueba en una ventana de incógnito y elige
**mañana** como día: de noche, hoy no tiene horarios libres.

**Cuota de Gemini:** usa tu propia API key gratuita en tu `.env.local`, para no gastar la del sitio. Si
aparece un 429, lee el detalle (`quotaId`) y no cambies de modelo por tu cuenta. La key nunca se imprime
ni se pega en reportes.

Registra cada caso en `etapas/8-cierre-sustentacion/REPORTE.md` como `pasa` o `falla` + qué pasó.
Pantallas: **1440×900** y **390×844**.

| ID | Área | Caso | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Cancha | 2 horas de pádel | $130.000 − $10.000 = **$120.000**, con pack de agua |
| A2 | Cancha | Tocar una cuarta hora seguida | Avisa, máximo 3 |
| A3 | Cancha | Confirmar | Código `SPF-XXXXXX`, QR, descargar QR y copiar código con "¡Copiado!" |
| A4 | Cancha | Recargar tras reservar | Esa hora sigue ocupada |
| A5 | Cancha | Volver a reservar esa hora | No se puede |
| B1 | Torneo | Entrar con "Reserva un evento" | Sin canchas, con los avisos que dicen qué hacer |
| B2 | Torneo | Agregar una cuarta cancha / otro deporte | Bloqueado ("Máx. 3", "Solo canchas de…") |
| B3 | Torneo | Probar 4, 8 y 16 equipos | Cambian partidos, fases y bracket |
| B4 | Torneo | Fases en días distintos | Bloquea días y horas anteriores a la fase previa |
| B5 | Torneo | Elegir en un cruce un equipo ya usado | Se intercambian, sin error de repetidos |
| B6 | Torneo | Tiempo insuficiente para una fase | Alerta con acción rápida de 15 min |
| B7 | Torneo | Confirmar torneo multi-día | Total correcto, bracket en la confirmación, horas ocupadas en cada día |
| C1 | Cumpleaños | 150 invitados | Bloquea: "Máximo 100 invitados." |
| C2 | Cumpleaños | Canchas de varios deportes | Se permite |
| C3 | Cumpleaños | Confirmar con 20 invitados | "20" en voucher y confirmación |
| C4 | Eventos | Una hora ocupada en el rango | No se aplica, avisa |
| D1 | Mis reservas | Buscar por código (también en minúsculas) | La encuentra |
| D2 | Mis reservas | Buscar por nombre + teléfono | La encuentra |
| D3 | Mis reservas | Reserva sin teléfono | Solo se encuentra por código |
| D4 | Mis reservas | Cancelar una reserva a más de 6 h | Libera las horas |
| D5 | Mis reservas | Cancelar a menos de 6 h o un evento | No deja y explica por qué |
| E1 | Chat | Consultar horarios libres | Coinciden con los de la página |
| E2 | Chat | Reservar y responder "sí" | Crea la reserva, con comprobante y QR |
| E3 | Chat | Cancelar con nombre y teléfono | Tarjeta y cancelación |
| E4 | Chat | Preguntar por torneos | Describe fases y abre la reserva de eventos |
| E5 | Chat | Cancelar con código | Remite a "Mis reservas" |
| E6 | Chat | Tema ajeno | No responde el tema |
| E7 | Chat | Pasar del inicio a reserva y volver | Conserva la conversación |
| F1 | Navegación | Recargar `/reservar/padel` | Carga la misma página |
| F2 | Navegación | Abrir `/reservar/futbol?modo=torneo` directo | Modo torneo en fútbol |
| F3 | Navegación | Reserva → "Volver al inicio" | Regresa a la posición donde estaba |
| F4 | Navegación | Ctrl+clic en "Ver canchas…" | Abre otra pestaña |
| F5 | Navegación | Ubicación y Eventos desde la reserva | Vuelve y baja a la sección |
| F6 | Reserva | Rueda sobre el carrusel | La página baja al formulario |
| G1 | Accesibilidad | Recorrer la reserva solo con teclado | Todo alcanzable, foco visible |
| G2 | Accesibilidad | Flechas, Home y End en las pestañas | Cambian de deporte |
| G3 | Accesibilidad | Escape en chat y visor | Cierra; el chat devuelve el foco al botón |
| G4 | Accesibilidad | `prefers-reduced-motion` en DevTools | Sin animaciones de movimiento; carrusel usable |
| H1 | Celular | Todo el flujo de A y D | Sin scroll horizontal; botones cómodos |
| H2 | Celular | Heros con scroll | El video sigue al scroll |
| H3 | Celular | Chat y Mis reservas | Pantalla completa, nada queda oculto |

**Chat automatizado** (con `vercel dev`, ver `GEMINI.md`):

```bash
node scripts/probar-chat.mjs                                  # todos, una vez
# el modelo no es determinista: repite 6 veces los casos que cambiaron
for i in 1 2 3 4 5 6; do node scripts/probar-chat.mjs http://localhost:3000 torneo-proceso cancelar-codigo; done
```

**Si algo falla:** si rompe un flujo principal o da un dato falso (precio, disponibilidad, reserva
perdida), corrígelo en esta etapa con su test. Si es menor, anótalo en el reporte y no lo corrijas sin
acordarlo con Juan Fierro.

### `z4` — Documentación

**README.md** (sin mencionar Claude ni las herramientas del flujo de trabajo):

| Línea | Cambio |
| --- | --- |
| 13 y 395 | Cambiar "121 tests" y "11 archivos" por las cifras reales de `npm test` |
| 74-75 | El detalle sobre la foto ya está en los tres deportes, no solo en fútbol |
| 100-112 | Separar torneo y cumpleaños. "Distintos deportes" solo aplica a cumpleaños. Torneo: 1 a 3 canchas de un deporte, 4/8/16 equipos, sorteo o cruces manuales, bracket y fases en varios días |
| Tras 98 | Nueva sección **Mis reservas**: buscar por código o nombre + teléfono, ver el QR, cancelar. Copiar código y condiciones en la confirmación |
| 147-149 | Agregar que con código o sin teléfono se usa "Mis reservas" |
| 182-183 | Actualizar la regla de eventos y explicar que una reserva sin teléfono solo se encuentra por código |
| ~312 | Árbol: `layout/` incluye MisReservas y agregar `reservas/torneo/` (bracket, calendario, alertas) |
| 440-454 | Agregar foco visible, áreas táctiles de 44 px, navegación con flechas y posters de los videos |
| 468 | Quitar la fila del Bloque 7 y agregar en su lugar lo hecho: torneos por fases y auditoría de usabilidad |

Revisa también el diagrama de arquitectura (desde la línea 200) por si falta algo de lo anterior.

**Capturas** (`docs/capturas/`, WebP de 35-90 KB; la herramienta es
`planificacion/herramientas/capturas/capturas.mjs`, que hoy solo cubre las tres de reserva):

- Rehacer con la marca nueva y los cambios: `vista-canchas`, `reserva-voucher`, `modo-torneo` (mostrando
  el calendario por fases), `confirmacion-qr`, `inicio`, `hero-padel`, `hero-futbol`, `eventos`,
  `ubicacion` y `movil-inicio`.
- Nuevas: `torneo-bracket.webp` y `mis-reservas.webp`.
- Agrega las escenas nuevas al script. Las capturas de chat y el GIF no se rehacen, salvo que el chat se
  vea distinto.

**`planificacion/`:**

- `README.md`: quitar "Pendiente: documentarlo en las guías del proyecto" (línea 46), cerrar la fila de
  esta etapa y agregar sus bloques al índice.
- La etapa 7 cita commits anteriores a un rebase. Actualizar su `REPORTE.md` y las filas `u1` a `u4` del
  índice:

  | Bloque | Citado | Real en `main` |
  | --- | --- | --- |
  | u1 | `1f4874e` | `a75629f` |
  | u3 | `4e23d3a` | `6e536f5` |
  | u4 | `2bca2a0` | `e7c19aa` |
  | u2 | `a98ef61` | `748ae74` |
  | docs | `2f5cd89` | `54f4c7d` |

- En el reporte de la etapa 7, marcar como resuelto el "Pendiente" (PR hecho, README en esta etapa,
  entrada a torneo decidida aquí).

**Guías del proyecto (`AGENTS.md` y `CLAUDE.md` ya se versionan desde el 07-11; `GEMINI.md` local):** actualiza tu guía con lo de abajo
y copia la misma lista en `REPORTE.md`, para que Juan Fierro y Miguel actualicen las suyas:

- Bloque 7 descartado: quitarlo de la lista de bloques y de las notas sobre el panel y el QR.
- `detalleEnTarjeta` en los tres deportes; ya no "solo en fútbol".
- Componentes y reglas nuevos: `components/reservas/torneo/`, `src/lib/torneo.js`, `MisReservas`,
  "Limpiar selección", `--accent-text`.

### `z5` — Fusión y producción

1. PR de `etapa-8-cierre` a `main` con el resultado de las pruebas (lo fusiona Juan Fierro).
2. Esperar el despliegue: `gh api repos/JuanFierro15/ProyectoSportify/commits/<sha>/status` (`success`).
3. En producción, con ventana de incógnito o perfil temporal: repetir A3, B7, C3, D1, D4, E2, F1 y H1, y
   correr **una sola vez** `node scripts/probar-chat.mjs https://proyecto-sportify.vercel.app`.
4. Cerrar `REPORTE.md` y borrar la rama.

### `z6` — Límite de peticiones (Juan Fierro)

`/api/chat` no limita peticiones, así que cualquiera podría agotar la cuota gratuita justo antes de
sustentar. Se puede resolver con una regla de Vercel Firewall sobre `/api/chat`, sin tocar código. Requiere
acceso al proyecto de Vercel y comprobar que el plan incluya esa regla. Si se aplica, probar que el chat
siga respondiendo y que el mensaje de error se vea bien.

## 4. Verificación final

- `npm test`, `npm run lint` (0 avisos) y `npm run build`.
- Tabla de `z3` completa en `REPORTE.md`, sin fallas abiertas en flujos principales.
- `/api/chat` compila con `vercel build` y responde en producción.
- README sin datos viejos: `grep -n -E "121|11 archivos|solo en fútbol|Bloque 7|7\. Panel" README.md`
  no devuelve nada.

## 5. Commits

En español, un tema por commit, **sin mencionar IA ni herramientas y sin coautorías**:

1. `fix: actualiza en el chat y el negocio la descripción de torneos`
2. `feat: muestra los invitados en el voucher y la confirmación`
3. `fix: aclara cómo elegir canchas al entrar a un evento`
4. `fix: agrega navegación con flechas en las pestañas de deporte`
5. `test: agrega casos de chat para torneos y cancelación por código`
6. `docs: actualiza README y capturas con torneos y Mis reservas`
7. `docs: registra la etapa 8 y corrige los commits de la etapa 7`

## 6. Calendario

| Fecha | Qué | Quién |
| --- | --- | --- |
| sáb 07 a mar 10-11 | `z1` y `z2` | Juan Manuel |
| mié 11 a jue 12-11 | `z3` | Juan Manuel |
| vie 13 a dom 15-11 | `z4` y abrir PR | Juan Manuel |
| lun 16 (festivo) a mar 17-11 | Revisión, fusión, `z5` y `z6` | Juan Fierro y Juan Manuel |
| mié 18-11 | **`main` congelado:** solo arreglos críticos, y acordados | Equipo |
| jue 19-11 | Ensayo con el flujo final y unos pocos mensajes al chat, para llegar con cuota | Equipo |
| vie 20-11 | **Sustentación.** Respaldo si falla el chat: capturas y GIF del README | Equipo |

## 7. Fuera de alcance

Bloque 7, base de datos o backend, re-codificar los videos de los heros (63,6 MB), dividir `useReserva.js`,
actualizar dependencias, CI, y buscar por código desde el chat. Se pueden retomar después de sustentar.

## 8. Aprobado por Juan Fierro (06-11-2026)

- [x] No preseleccionar cancha al entrar a torneo (solo mejorar el aviso).
- [x] El chat remite a "Mis reservas" en vez de buscar por código.
- [x] Se hace `z6`, a cargo de Juan Fierro por el acceso a Vercel. Falta comprobar que el plan de Vercel
  incluya la regla.
- [x] Calendario y congelación de `main` el 18-11.
