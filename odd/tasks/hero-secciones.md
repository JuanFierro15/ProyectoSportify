# Issue #36: los heros como secciones, sin pausa antes de reproducir

Objetivo: que el inicio navegue por secciones (un hero completo a la vez) y que el video arranque sin quedarse congelado. Rama: `feat/hero-secciones` desde `origin/main` (84e4758). Entrega: un PR independiente de #35. Tests: Vitest (`npm test`) + `npm run lint` + `npm run build`.

## Specs

Las citas entre comillas son de la issue #36 o de Miguel (Log). La issue pedía que el scroll fuerte recorriera todos los heros hasta `#eventos`; Miguel lo cambió el 16-11-2026 por navegación por secciones (L2 y L3), así que S3 reemplaza ese punto de la issue.

- **S1** Pausa: "Con un scroll fuerte (rueda rápida o un deslizamiento largo en el celular), el video del hero se queda quieto en un cuadro, como "pensando", antes de empezar a reproducirse solo." Se pide: "Quitar la pausa: el paso del scroll a la reproducción automática debe ser continuo, sin un cuadro congelado." (plan) Primero se mide (fin de la inercia, `scrollEnd`, `play()`, `waiting`/`playing`; caché vacía y "Fast 4G") y la solución se decide con esa evidencia.
- **S2** Secciones cerradas: "la idea es que eso no suceda y que si usted está arriba, y si está en el giro del medio, pues está en el giro del medio, y si está en el último giro no puede estar también viendo el giro del segundo giro." ("giro" = hero.) (plan) Cuando el scroll se detiene entre dos heros (por rueda, barra, teclado o toque), la página se acomoda al hero más cercano, de modo que nunca se ven dos heros a la vez.
- **S3** Avance de a una sección: "el usuario baja, el video se reproduce y luego ¡pum!, salta al otro" y "la idea es que cuando pase al siguiente giro, el video se pause. Entonces ya tenga el usuario que otra vez volverlo a hacer, porque es como ir navegando entre secciones". (plan) Gesto hacia abajo → el video del hero actual se reproduce solo → al terminar, transición y salto al punto de reposo (`REPOSO_HERO`) del siguiente hero, con su video en pausa (o a `#eventos` si era el último). No se encadena.
- **S4** Transición (corrección de Miguel, L7): "quiero que se note más como el movimiento, ya que al oscurecer parace como si simplemente se cerrara y se pone otra, quiero que se note que cambio". (plan) Sin cortina oscura: deslizamiento animado del scroll de ~0,8 s con `power2.inOut` entre los dos puntos, de modo que se vea la sección siguiente subir (o la anterior bajar). Durante la animación se ven dos secciones moviéndose; al terminar queda siempre un solo hero. Con `prefers-reduced-motion: reduce`, salto directo.
- **S5** Hacia arriba (corrección de Miguel, L7): "al subir a otra section arranca desde el inicio del video lo que hace que tengas que bajar todo el video para regresar al hero de abajo". (plan, aprobado en L8) Cada hero tiene dos puntos fijos: **inicio** (reposo `REPOSO_HERO`, con el texto) y **final** (último cuadro del video, `st.end`). Subir desde el inicio de un hero desliza (S4) al **final** del hero anterior. Bajar desde el final de un hero desliza directo al **inicio** del siguiente (o a `#eventos`) sin reproducir de nuevo. Subir desde el final de un hero rebobina el video de forma animada hasta su inicio (se ve retroceder) y queda en el reposo con el texto; otro gesto hacia arriba lleva al final del hero anterior. Bajar desde el inicio sigue igual (S3).
- **S6** Control del usuario: "que si el usuario quiere detener el scroll, pues lo puede hacer obviamente subiendo y ya, o sea, detiene el scroll automático." y de la issue: "Cualquier intervención del usuario (rueda, toque, tecla, clic, enlace o barra) debe seguir cancelando el avance, como hoy." Tras cancelar, el acomodo de S2 sigue aplicando (nunca quedan dos heros a la vez).
- **S7** Pruebas y docs (issue): "Pruebas nuevas en `controladorSnapHero.test.js` [...] con los límites exactos" para el avance de a una sección, el acomodo entre heros, la subida al hero anterior, la cancelación y la llegada a `#eventos`; y la viñeta de `DeporteHero` en `docs/agentes/pagina-reserva.md` "describe el comportamiento actual y se tiene que actualizar".

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|---|---|---|---|---|
| T1 | S1 (medición) | agy hydrogen-high (navegador, solo lectura) | hecho | (sin código) |
| T2 | S2-S7 + arreglo de S1 | agy hydrogen-medium (código) | hecho | f8ca141 + e0b025f |
| T4 | S4-S5 (corrección L7-L8) + S2 con dos puntos por hero | agy hydrogen-medium (código) | en curso | |
| T3 | S1-S6 | agy hydrogen-high (verificación en Chromium) | hecho (falta la revisión de Miguel en localhost) | |

Riesgo: medio (controlador de scroll compartido por los tres heros; orden de eventos asíncronos).

## Log

- **L1** (16-11-2026) Issue #36 de Juan: pausa antes de reproducir con scroll fuerte y "El scroll fuerte solo avanza un hero".
- **L2** (16-11-2026, Miguel): "Quiero que cuando el usuario haga scroll, pues el video se comienza a reproducir, ¿no? El usuario hace scroll suave y luego de un punto el video se comienza a reproducir solo y al usuario no es necesario que haga scroll. Entonces, la idea es que cuando haya la transición, cada giro, cada sección de la página, que es un giro diferente, es decir, un video distinto, haya como una transición cuando llega un punto que baje como si fuera un lugar distinto. [...] Para que no se pueda quedar en un punto intermedio entre los dos giros. Porque actualmente si el usuario sube un poquito, puede quedar entre el primer giro y el segundo giro como viendo los dos videos al mismo tiempo. [...] que si el usuario quiere detener el scroll, pues lo puede hacer obviamente subiendo y ya, o sea, detiene el scroll automático."
- **L3** (16-11-2026, Miguel): "la idea es que cuando pase al siguiente giro, el video se pause. Entonces ya tenga el usuario que otra vez volverlo a hacer, porque es como ir navegando entre secciones". Aprobó la transición con fundido y el comportamiento hacia arriba.
- **L4** (16-11-2026) Medición T1 (agy hydrogen-high, Chromium, 3 corridas por escenario):
  - Con el video en caché, el congelamiento lo domina la espera de `scrollEnd`: 365-450 ms después del último scroll en escritorio y ~225 ms en táctil (`DEMORA_FIN_TOQUE_MS`). A eso se suma un re-seek en `reproducir()` cuando `seguirVideo` todavía no alcanzó el objetivo (`readyState` 4→1, `waiting` de 15-20 ms).
  - Con caché vacía y Fast 4G hay 0,7-0,9 s más de descarga (videos de ~10 Mbps): eso es un límite de la red.
  - Un gesto fuerte de 1440 px pasa el pin de 600 px y cae dentro del hero siguiente.
  - Decisión: el controlador toma el gesto en cuanto empieza dentro de la zona de los heros (`wheel`/`touchmove`/teclas con `preventDefault`) en lugar de esperar a que el scroll se detenga. Reproduce desde el cuadro actual sin re-seek. La barra de scroll no se puede interceptar: para ella queda el acomodo al detenerse (S2). Matiz para revisar en localhost: bajar durante la reproducción no la cancela (es la misma intención); subir, clic, enlace o barra sí la cancelan.
- **L5** (16-11-2026) T2: RED de 29 tests; 417/417, lint y build OK. Revisión gentle-ai del commit: Miguel eligió "Omitir esta vez".
- **L6** (16-11-2026) Verificación T3 (Chromium; se relanzó una vez por falta de RAM). Pasaron el arranque inmediato, el gesto fuerte de una sola acción, la subida al hero anterior, la entrada desde `#eventos`, las cancelaciones y el resto de la página. Tres bloqueantes:
  1. La rueda o el toque sobre el chat abierto se interceptaban y arrancaban el hero.
  2. Una parada entre heros por barra o autoscroll no se acomodaba, porque `alDetenerse` exigía `entradaDesdeFinAuto`.
  3. Durante el fundido había un cuadro con dos heros visibles.
  Una tanda de correcciones: no interceptar sobre `.chatbot`, un `dialog` abierto o contenedores desplazables (`puedeDesplazarAncestro`); acomodar ante cualquier parada dentro de la zona (se quitó `entradaDesdeFinAuto`); `ScrollTrigger.update()` tras el salto y aclarado 0,05 s después. RED de 6 tests; 423/423.
  Nueva verificación limitada: los 3 PASS (0 cuadros con dos heros en 480 muestreados), el arranque en 37 ms y sin regresiones; 0 errores en consola.
- **L7** (16-11-2026, Miguel, tras probar en localhost): "no me gusta la transición que usaste, quiero que se note más como el movimiento, ya que al oscurecer parace como si simplemente se cerrara y se pone otra, quiero que se note que cambio, además siento que la navegabilidad se ve afectada con el nuevo comportamiento del scroll al subir ya que se reinicia el punto del video y no comienza desde el final sino que al subir a otra section arranca desde el inicio del video lo que hace que tengas que bajar todo el video para regresar al hero de abajo". Se reabre T2 para S4 y S5.
- **L8** (16-11-2026, Miguel): aprobó el deslizamiento de ~0,8 s, los dos puntos por hero (inicio y final), y "Me gusta la opción que recomiendas" para subir desde el final: rebobinado animado hasta el inicio.
