
# Retoma del bloque a1 (segundo intento)

El primer intento de esta tarea se cortó por falta de memoria del equipo antes de terminar y sin dar resumen. Dejó cambios sin commit en el árbol de trabajo:

```
README.md
src/components/hero/DeporteHero.jsx
src/components/layout/Footer.jsx
src/components/layout/MisReservas.css
src/components/layout/MisReservas.jsx
src/components/layout/MisReservas.test.jsx
src/components/layout/Navbar.css
src/components/layout/Navbar.jsx
src/components/layout/Navbar.test.jsx (nuevo)
src/components/layout/useIrACanchas.js (nuevo)
```

Qué hacer:

1. **No descartes esos cambios** ni hagas `git checkout`/`git restore`. Revísalos con `git diff` y `git status` y parte de ahí.
2. Compara lo que hay con la tarea de abajo, spec por spec (S6 a S10), y completa lo que falte o esté mal.
3. RED: el código viejo está en `git show HEAD:<ruta>`. Para comprobar que los tests nuevos fallan contra él, copia a una carpeta temporal fuera del repositorio (`mktemp -d`) solo lo necesario o razona con el diff; no reviertas el árbol de trabajo. Si no puedes comprobarlo, dilo en el resumen.
4. Corre la verificación de la tarea y responde con el resumen que pide.

Corre los comandos de a uno (el equipo tiene 8 GB de RAM): nunca dos `vitest` a la vez.
