Etapa 9: rediseño visual de la página de reserva y de las llaves del torneo.

Carpeta de la etapa: `planificacion/etapas/9-rediseno-pagina-de-reserva/`. Este mensaje ya está guardado ahí como `PROMPT.md`, junto con dos maquetas: `referencia/cancha.html` y `referencia/torneo.html`. Ábrelas en el navegador desde esa carpeta (toman las fotos de `public/img/canchas/`). Son la referencia visual; si algo de las maquetas choca con este mensaje, mandan los colores, medidas y textos de aquí. Escribe `PLAN.md` y espera la aprobación de Juan Fierro antes de implementar.

**Responsable:** Miguel Medina. Revisa y fusiona: Juan Fierro. Antes de empezar lee `CLAUDE.md` (raíz; no se versiona, pídele a Juan Fierro la copia actual), `planificacion/README.md` y el `REPORTE.md` de la etapa 8.

## Contexto

El profesor nos pidió más diseño en la ventana de reservas. Hoy la página de inicio es oscura (videos, `#0d0d0d`, acento por deporte) y la de reserva es blanca, con los estilos por defecto de Foundation: al entrar a reservar parece otro sitio. Las llaves del torneo son tarjetas sueltas en columnas, sin líneas entre rondas, dentro de un recuadro con scroll interno que corta partidos y deja la final recortada a la derecha.

El objetivo es que la página de reserva y la confirmación hablen el mismo idioma visual del inicio. Es una etapa de estilo y estructura de la interfaz: no cambia cómo se reserva, ni precios, ni validaciones, ni datos.

## Cuándo y dónde

- El bloque `z2` de la etapa 8 (Juan Manuel) ya está en `main` (PR #4, `e6a167c`): toca `VistaCanchas.jsx` y su CSS, `VoucherReserva`, `ConfirmacionReserva` y `CanchasElegidas`. Las referencias a líneas del PLAN deben ser las de ese código.
- Rama `etapa-9-rediseno-reserva`, creada desde `main` actualizado. PR a `main`; Juan Fierro revisa y fusiona.
- Las pruebas `z3` y las capturas `z4` de la etapa 8 ya se hicieron sobre el diseño anterior. Por eso esta etapa repite en el navegador los casos A1 a A5, B1 a B7 y C1 a C4 del plan de la etapa 8, y rehace las capturas de `docs/capturas/` que el rediseño deja viejas (`vista-canchas`, `reserva-voucher`, `confirmacion-qr`, `modo-torneo` y `torneo-bracket`), ajustando el README si hace falta.
- Después del miércoles 18-11 `main` está congelado: nada de esta etapa entra después de esa fecha. Abre el PR con tiempo para revisarlo antes.
- La fila de la etapa ya está en el índice de `planificacion/README.md`: mantenla al día.

## A. Decisiones tomadas

1. Toda la página de reserva (modos Cancha, Torneo y Cumpleaños) y la confirmación con el QR pasan al fondo oscuro del inicio.
2. El color de acento sigue saliendo de `colorAcento` en `src/data/deportes.js`. El ámbar de la marca (`--color-marca`) solo va en el logo.
3. Sin tipografías nuevas ni dependencias nuevas. Los íconos salen de `lucide-react`, que ya está instalado.
4. El elemento llamativo de la página es el comprobante con forma de tiquete. Todo lo demás queda sobrio.
5. Llaves en escritorio: simétricas, empiezan en los dos extremos y la final queda en el centro.
6. Llaves en celular (por debajo de 900 px de ancho): por rondas, de izquierda a derecha, como hoy, con las mismas tarjetas nuevas y scroll horizontal dentro del recuadro.
7. Con 16 equipos (7 columnas) las tarjetas no se encogen: el recuadro de las llaves tiene scroll horizontal en ese caso.
8. Fuera del alcance: la página de inicio, el chat, "Mis reservas", el footer, la lógica de `DepthCarousel` y `src/components/reservas/useReserva.js`.

## B. Tokens

Declara estos valores como variables en `src/App.css` (junto a `--eventos-fondo`, que ya vale `#0d0d0d`) y úsalos desde ahí. Propón los nombres en el PLAN.

| Uso | Valor |
| --- | --- |
| Fondo de la página | `#0d0d0d` |
| Tarjetas de sección (Día, Horario, Tus datos, Llaves) | `#161616`, borde `1px #2a2a2a`, radio 16 px |
| Comprobante y superficies elevadas | `#1a1a1a`, borde `1px #333333`, radio 18 px |
| Controles (días, horas, campos) | `#1f1f1f` o `#0f0f0f` en campos de texto; borde `#4a4a4a` o `#444444` |
| Texto principal | `#f2f2f2` |
| Texto secundario | `#b3b3b3` a `#c4c4c4` |
| Texto tenue (fechas, metadatos) | `#a8a8a8` |
| Texto sobre un botón o pastilla de acento | `#0d0d0d` |

- `--accent-text` hoy oscurece el acento para fondos claros (`estiloAcento` en `src/lib/canchas.js`) y el chat también lo usa. No cambies esa función: sobrescribe `--accent-text` solo dentro de `.vista-canchas` para que en fondo oscuro sea el acento tal cual o uno más claro.
- Contraste mínimo 4,5:1 en todo texto, también en el de 12 px. Incluye en el REPORTE la tabla de contraste de cada color de texto nuevo contra su fondo, con los tres acentos.
- Objetivos táctiles de 44 px como mínimo. Foco visible en todo control, con `:focus-visible`.

## C. Pantalla por pantalla

### C1. Navbar

En la página de reserva el navbar usa una variante oscura: fondo `#0d0d0d`, borde inferior `#262626`, enlaces blancos y "Mis reservas" con borde. Hoy entra en el modo `site-header--scrolled` (blanco con enlaces azules). El inicio no cambia.

### C2. Encabezado

- Franja de 320 px de alto con la foto grande de la cancha activa (`imagenGrandeCancha`) y un velo que termina en `#0d0d0d`, para que no haya línea de corte con el resto de la página. En el modo Torneo, 260 px.
- Dentro de la franja: "Volver al inicio", el título del modo en 52 px y negrilla, y debajo el selector de modo.
- Subtítulo en el modo Cancha: "Elige la cancha, el día y hasta 3 horas seguidas." Propón en el PLAN los de Torneo y Cumpleaños.
- El `h1` recibe foco al cargar y hoy muestra un recuadro verde. Quita ese contorno cuando el foco es programático (`:focus:not(:focus-visible)`), sin quitarlo con teclado.

### C3. Selector de modo

Control segmentado: contenedor con fondo `rgba(20, 20, 20, 0.85)`, borde `#333333` y radio 12 px. Botones de 44 px de alto con ícono y texto. El activo tiene fondo `#f2f2f2` y texto `#0d0d0d`. Íconos: `Trophy` para Torneo y `Cake` para Cumpleaños; propón el de Cancha.

### C4. Pestañas de deporte

- Pestañas con subrayado de 3 px del `colorAcento` de cada deporte en la activa. Las inactivas en `#a8a8a8`, sin subrayado. La línea de base de toda la fila en `#262626`.
- El filtro "Solo con horarios libres ese día" va a la derecha, en la misma fila.
- Conserva todo lo que deja `z2`: roles, `tabIndex`, flechas, Inicio, Fin y el `href` para abrir en otra pestaña.

### C5. Carrusel

Sin cambios de lógica ni de la tarjeta. Solo las flechas y los puntos pasan al tema oscuro (fondo `#1c1c1c`, borde `#444444`, ícono blanco).

### C6. Día (`SelectorDia`)

Dentro de una tarjeta de sección. Siete casillas iguales en una fila. La elegida lleva borde de 2 px del acento y el nombre del día en color de acento. El mismo estilo aplica en `CalendarioTorneo`, que usa este componente.

### C7. Horario

- Las horas se agrupan en tres franjas con su etiqueta a la izquierda: Mañana (antes de las 12), Tarde (12 a 17) y Noche (18 en adelante). Las horas salen del horario del negocio que ya usa la página; no las escribas a mano.
- Botones de 84 × 44 px:
  - Libre: fondo `#1f1f1f`, borde `#4a4a4a`.
  - Elegida: fondo del acento, texto `#0d0d0d` en negrilla.
  - Reservada: borde punteado `#3a3a3a`, texto `#7a7a7a` tachado, deshabilitada y con `aria-label` "HH:00, reservada".
- Debajo, una leyenda: Libre, Elegida y Reservada, con su muestra.
- El aviso del beneficio ("Desde 2 horas seguidas…") se queda, con fondo oscuro tintado por el acento. Sus valores salen de `src/lib/precios.js`, como hoy.

### C8. Tus datos

Nombre y teléfono pasan a una tarjeta de sección como Día y Horario, con campos de 46 px de alto, fondo `#0f0f0f` y borde `#444444`. Las validaciones y los mensajes de hoy no cambian.

### C9. Comprobante (tiquete)

- Fondo `#1a1a1a`, borde `#333333`, radio 18 px. Sigue fijo (`sticky`) como hoy.
- Arriba: título, pastilla del tipo de reserva con borde y texto del acento, y los datos (cancha, fecha, horario; en torneo, formato y fecha de cada fase; en cumpleaños, la línea de invitados que agrega `z2`).
- Perforación: una línea punteada de 2 px `#3a3a3a` con dos semicírculos de 24 px del color del fondo de la página en los bordes, como un tiquete que se desprende.
- Abajo: el desglose (horas, descuento y pack de agua en color de acento), el total en 32 px y negrilla, "Confirmar reserva" con fondo de acento y "Limpiar selección" con borde.
- Las cifras del desglose no se parten en dos líneas (`white-space: nowrap`) y tienen al menos 12 px de separación del texto.

### C10. Modo Torneo

- En escritorio, la sección de llaves ocupa todo el ancho del contenedor, fuera de la columna del formulario: las llaves simétricas miden unos 1.100 px y no caben al lado del comprobante. Propón en el PLAN cómo moverla sin duplicar estado.
- Indicador de pasos (Canchas, Formato, Fechas por fase, Llaves, Tus datos), con los pasos completos marcados y el actual resaltado con el acento. Entra solo si el estado de cada paso se puede derivar de lo que ya expone `useReserva` sin tocar ese archivo. Si no, dilo en el PLAN y se deja por fuera.
- `AlertaTiempo` y `AsignacionManual` pasan a la versión oscura. La alerta conserva su tono ámbar: fondo ámbar muy tenue sobre `#161616`, borde ámbar y texto claro que pase 4,5:1.

### C11. Llaves

Escritorio (desde 900 px):

- La mitad de los partidos de cada ronda, salvo la final, va a la izquierda y la otra mitad a la derecha, en espejo. Con 8 equipos: Cuartos, Semifinal, Final, Semifinal, Cuartos. Con 4: Semifinal, Final, Semifinal. Con 16 se agregan los octavos en los extremos.
- Columnas de 190 px con 38 px entre ellas. Encima de cada columna, el nombre de la ronda y su fecha y horario; las del lado derecho van alineadas a la derecha.
- Tarjeta de partido: dos filas de 38 px (una por equipo), fondo `#1f1f1f`, borde `#333333`, radio 10 px. En el lado derecho, los nombres van alineados a la derecha. Encima de cada tarjeta, en 12 px y `#a8a8a8`: "Partido N, HH:MM" y la cancha cuando ya está definida. Si todavía no hay hora, "Por programar". Desaparecen las líneas repetidas "Hora por definir" y "Cancha por elegir".
- Rondas siguientes: "Ganador del partido N" en `#a8a8a8`, sin negrilla.
- Conectores de 2 px en `#3a3a3a` entre cada par de partidos y el siguiente. Los dos que llegan a la final van en el color de acento.
- Final en el centro: 96 px de alto, borde de 2 px del acento, fondo del acento al 12 % sobre `#0d0d0d`, el ícono `Trophy` encima y debajo "Trofeo y premiación al terminar."
- Al reservar no hay resultados: no muestres marcadores.

Celular (por debajo de 900 px): las rondas de izquierda a derecha, como hoy, con las tarjetas y los conectores nuevos y scroll horizontal dentro del recuadro.

Nombres: los códigos `R1-P1` pasan a "Partido 1", numerados en el orden de juego, también en `AsignacionManual` y en sus `aria-label`. `Torneo.test.jsx` busca `R1-P1` (líneas 185, 295, 298 y 446): actualiza esas pruebas y anótalo en el REPORTE.

La versión compacta de la confirmación sigue las mismas reglas.

### C12. Confirmación

- Fondo oscuro, código `SPF-XXXXXX` grande y los botones de copiar y descargar en el estilo nuevo.
- El QR se queda sobre fondo blanco, con margen blanco alrededor, para que los lectores lo sigan leyendo.

## D. Restricciones

- No se tocan `src/lib/`, `src/data/`, `api/`, `src/context/`, `useReserva.js`, la página de inicio ni el chat. Si un cambio visual exige tocar alguno, dilo en el PLAN.
- Conserva las clases, roles y textos que usan las pruebas, salvo los de las llaves de C11. Si otra prueba falla por un texto que cambió, el texto lo decide el PLAN y la prueba se actualiza con él.
- Revisa qué estilos de Foundation (`tabs`, `switch`, `button`, `card`, `callout`) pisan el tema oscuro y sobrescríbelos dentro de `.vista-canchas`, sin tocar `foundation-sites`.
- Animaciones: solo las que ya existen, dentro de `gsap.context()` y respetando `prefers-reduced-motion`.
- Textos con tuteo y sin detalles de implementación.
- Los agentes en paralelo no corren `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el equipo tiene poca RAM.
- Commits como diga el plan (uno por bloque), en español, sin menciones a herramientas ni a IA y sin líneas de coautoría (`Co-Authored-By`), ni en los commits ni en la descripción del PR.

## E. Para verificar antes del plan

1. Cómo sacar la sección de llaves a ancho completo en el modo Torneo sin duplicar estado.
2. Qué pruebas dependen de textos, clases o estructura que cambian en esta etapa.
3. Si el indicador de pasos se puede derivar del estado actual sin tocar `useReserva.js`.
4. Qué reglas de Foundation pisan el tema oscuro en la página de reserva.
5. Cómo forzar la variante oscura del navbar en la página de reserva sin cambiar la del inicio.
6. Cómo se numeran hoy los partidos en `src/lib/torneo.js`, para que "Partido N" siga el orden de juego.

## F. Verificación

- `npm test`, `npm run lint` y `npm run build` en verde.
- Capturas antes y después en `revision/`, a 1440 × 900 y 390 × 844, con `planificacion/herramientas/capturas/capturas.mjs` o una copia en `revision/`:
  - Cancha en fútbol, eligiendo mañana como día, con 2 horas elegidas.
  - Torneo con 4, 8 y 16 equipos (escritorio y celular).
  - Cumpleaños con invitados.
  - La confirmación de cada modo, con el QR.
- Navegación con teclado por toda la página: orden, foco visible y pestañas con flechas.
- Prueba con `prefers-reduced-motion: reduce`.
- Los casos A1 a A5, B1 a B7 y C1 a C4 de la etapa 8, registrados como `pasa` o `falla`. Comprueba cada texto citado contra la interfaz real: el reporte de la etapa 8 tiene citas que no existen.

## G. Entrega

Con la aprobación de las capturas por parte de Juan Fierro: commits, push de la rama y PR a `main`. El REPORTE incluye las respuestas de la sección E, las capturas, la tabla de contraste, las pruebas que cambiaron y lo que quede pendiente.
