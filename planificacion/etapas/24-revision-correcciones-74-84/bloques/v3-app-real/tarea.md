# Tarea v3: app real de la integración (pastillas de #76 y torneo descartado de #80)

[MODO EJECUTOR] Esta tarea es de **pruebas en el navegador**: no corriges
código. Ejecutas scripts, sacas capturas y escribes un informe.

## Dónde trabajas

- **Directorio de trabajo:** el directorio actual (worktree de git descartable
  con `node_modules`), en el HEAD separado de la integración (todas las PR
  fusionadas). Comprueba que `git status --porcelain` está vacío.
- Los scripts auxiliares que escribas van en una carpeta temporal creada con
  `mktemp -d` **fuera** del repositorio; anota su ruta en el informe y no la
  borres (la borra el coordinador).
- **Salidas** (ruta relativa al worktree):
  `../../../planificacion/etapas/24-revision-correcciones-74-84/revision/`:
  `v3-app-real.md` (informe; **escríbelo a medida que avanzas**, después de
  cada parte) y las capturas en `v3/`.
- En el worktree solo puedes usar `git checkout --detach <ref>` y
  `git checkout -- .` (parte A) y `git status`. Nada de commits, push, `stash`,
  `reset` ni ramas. Termina en el mismo HEAD de la integración con el árbol
  limpio (el `dist/` está ignorado).
- **Memoria (la PC tiene 8 GB y suele tener 1 GB libre):** un solo servidor
  `vite preview` y un solo Chrome sin interfaz a la vez; ciérralos al terminar
  cada parte. No ejecutes `npm run dev` ni `vercel dev`. Si el sistema corta un
  proceso por memoria, anótalo y sigue con la parte siguiente.

Los dos scripts de Juan están en
`planificacion/etapas/23-hallazgos-revision-74-81/revision/` (en este
worktree): `medir-pastillas.mjs` y `descartada-asistente.mjs`. Lee su
cabecera: con `--preview <raíz>` levantan y cierran su propio servidor sobre
un `dist/` ya construido. Chrome está en
`C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Parte A: pastillas del selector de día (#76)

1. `npm run build` en la integración. Corre
   `node planificacion/etapas/23-hallazgos-revision-74-81/revision/medir-pastillas.mjs --preview . --salida <tmp>/integracion.json`
   con los anchos por defecto y pega en el informe el resumen (OK/fallos por
   ancho y escena). Código de salida incluido.
2. **Ancho exterior sin cambios.** `git checkout --detach origin/main`,
   `npm run build`, y corre el mismo script con
   `--anchos 360,390,412,768,1440 --salida <tmp>/main.json` (en `main` puede
   fallar: eso es lo esperado, aquí interesan los anchos). Vuelve a la
   integración (`git checkout --detach <HEAD de la integración>`) y
   `npm run build`. Para cada ancho, escena y pastilla compara el ancho útil:
   la integración cambió el relleno lateral de 2 px a 1 px, así que debe dar
   **exactamente 2 px más** que `main`. Tabla
   `ancho | escena | pastilla | útil main | útil integración | diferencia`.
   Cualquier diferencia distinta de 2 px (más o menos de 0,5 px) es hallazgo:
   significa que el ancho exterior de la pastilla cambió.
3. **Escenas que el script no mide.** Copia `medir-pastillas.mjs` a `<tmp>` y
   adáptalo (sin tocar el original) para medir con los mismos criterios:
   - cumpleaños (`/reservar/padel?modo=cumpleanos` o la ruta que use el
     `SelectorModo`; búscala en el código);
   - torneo en otro deporte (fútbol o voley playa) con "bloqueado" visible;
   en 320, 360, 400, 412, 430 y 1440 px. Tabla de resultados.
4. **Capturas** del selector con "bloqueado" visible (torneo, pestaña
   Semifinal como en el script) a 360, 400, 412 y 430 px, y una de cancha a
   1440 px: `v3/A-<escena>-<ancho>.png`. Recorta o encuadra para que el selector
   se lea.
5. **Respaldo sin `cqi`:** en `dist/assets/*.css` busca la regla
   `@supports not (font-size:1cqi)` (con o sin espacios) y pega la regla
   minificada completa.

## Parte B: torneo descartado (#80, n2)

1. Corre
   `node planificacion/etapas/23-hallazgos-revision-74-81/revision/descartada-asistente.mjs --preview . --capturas ../../../planificacion/etapas/24-revision-correcciones-74-84/revision/v3/B-390`
   y pega su salida.
2. Copia el script a `<tmp>` y haz dos variantes (sin tocar el original):
   - B2: lo mismo a **1440 px** (formulario de escritorio, no el asistente);
   - B3: a 390 px, con el choque en la **Semifinal** en lugar de los Cuartos
     (la pestaña B reserva una hora de la Semifinal de A).
   Para cada una registra: número de elementos `role="alert"` visibles y si
   alguno tiene `aria-live`; dónde queda el foco; si hay código de reserva o
   QR; a qué paso o sección vuelve "Elegir otro horario"; qué horas quedan
   seleccionadas en cada fase y cuáles deshabilitadas. Capturas en
   `v3/B2-1440/` y `v3/B3-390/`.
3. **B4, éxito y nueva reserva:** a 390 px, sin hacer fallar el guardado, A
   confirma un torneo. Desde la confirmación, vuelve a reservar otro torneo
   (con "Listo" y volviendo a la página, o con el botón que lo permita).
   Registra si aparece algún aviso de choque, si quedan horas seleccionadas de
   la reserva anterior y si sus horas aparecen ocupadas. Capturas en `v3/B4/`.

## Parte C: regresión rápida (390 px y 1440 px)

- Reserva de cancha de 1 h y de 3 h seguidas (anota el descuento que muestra).
- Dos pestañas: reservar en una, cancelar en "Mis reservas" y ver la hora libre
  en la otra sin recargar.
- Consola: errores y avisos de la aplicación durante B y C (ignora los de
  extensiones o de Chrome).

## Informe (`v3-app-real.md`)

En español, UTF-8: una sección por parte con tablas, la salida pegada de los
scripts y las capturas citadas por nombre. Al final, la ruta de `<tmp>` y una
lista de los procesos que hayas dejado abiertos (debería estar vacía). No
inventes resultados ni capturas: si algo no se pudo hacer, dilo con el error.

## Criterios de aceptación

- Parte A: los pasos 1 a 5 hechos, con la tabla de diferencias de ancho
  completa para los 5 anchos.
- Parte B: B1 a B4 con todos los datos pedidos y sus capturas.
- Parte C hecha.
- Las capturas existen y muestran lo que el informe dice.
- El worktree queda limpio en el HEAD de la integración, sin servidores ni
  Chrome abiertos.
