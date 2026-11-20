# Criterios de aceptación del bloque b6 (issue #67)

- C1: El archivo ya no nombra la rama `fix/issues-53-54-55-56` como la rama del trabajo, y nombra las cuatro ramas reales (`fix/issue-56`, `fix/issue-53`, `fix/issue-55` y `fix/issue-54`) con sus PR (#57 a #60).
- C2: Ningún hash de commit citado en el archivo es de los viejos (`75edf1c`, `56c1bef`, `c9b4874`, `873bc6e`, `f79130e`), y cada hash citado existe en el repositorio.
  Cómo comprobarlo: `git cat-file -t <hash>` para cada hash del archivo (todos deben dar `commit`).
- C3: Cada tarea de la tabla cita los commits correctos: el mensaje de cada commit (`git log -1 --format=%s <hash>`) corresponde a la issue de esa tarea (T1 #56, T2 #53, T3 #55, T4 #54, T5 docs de #54).
- C4: El `## Log` tiene `L3` (verificación de la etapa 20 con el enlace relativo al reporte, y el enlace funciona desde `odd/tasks/`), `L4` (fusión con los cuatro merges), `L5` (D1 y D2 confirmadas, #68 cerrada) y `L6` (nota del commit `05c219f`).
- C5: Las secciones de specs (`S1` a `S6`) y las entradas `L1` y `L2` no cambiaron.
  Cómo comprobarlo: `git diff` del archivo.
- C6: El texto nuevo está en español con tildes, sin voseo y sin mencionar IA, modelos ni asistentes.
- C7: Solo cambió `odd/tasks/issues-53-54-55-56.md` (`git status`).
