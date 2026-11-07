
# Retoma r1 — Corrección de lo que encontró la verificación

El bloque r1 ya está implementado en el árbol de trabajo (`git diff`). La verificación encontró tres cosas. Corrige **solo** esto, sin rehacer nada más:

1. **"Volver al inicio" tapado por el navbar en celular (390 px).** En celular `.site-header` mide unos 132 px de alto (la marca, el menú y "Mis reservas" se apilan), pero `.vista-canchas` deja `padding-top: 4.25rem` (68 px), así que el enlace `.vista-canchas__volver` queda debajo del navbar fijo. Haz que el contenido del encabezado empiece debajo del navbar en todos los anchos (mide el alto real del navbar en cada punto de quiebre del CSS de `Navbar.css` y ajusta el espacio superior de la página de reserva, o compacta la variante `site-header--reserva` en celular para que no ocupe tres líneas, sin cambiar el navbar del inicio). Comprueba 390, 640, 1024 y 1440 px de ancho.
2. **Encabezado del modo Torneo (260 px) sin aire.** El contenido (volver 44 px + `h1` + subtítulo + selector de modo + paddings y gaps) suma unos 269 px. Ajusta paddings, `gap` o el tamaño del `h1` en ese modo para que todo quepa con aire dentro de los 260 px, sin cambiar la altura de la franja.
3. **`--acento` sin uso en las pestañas.** Cada `<li className="tabs-title">` define `style={{ '--acento': d.colorAcento }}`, pero el CSS de la activa usa `var(--accent)`. Haz que el subrayado de cada pestaña use su propio `--acento` (es lo que pide C4: "subrayado de 3 px del `colorAcento` de cada deporte en la activa"), o quita la variable si sobra; elige lo primero.

Archivos que puedes editar: los mismos de `tarea.md` (en la práctica, `VistaCanchas.css`, `VistaCanchas.jsx`, `Navbar.css`). Al terminar corre `npm test` y `npm run lint` y reporta.

---

La tarea original del bloque, para contexto:
