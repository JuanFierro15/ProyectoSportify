# Planificación — Sportify

Flujo de trabajo del equipo, por etapas numeradas. **En este proyecto la
carpeta sí se versiona** (excepción acordada: el repositorio es compartido y
así todos ven y actualizan lo que se va haciendo). Solo los `logs/` quedan
fuera de git. En proyectos individuales, `planificacion/` va siempre en
`.gitignore`.

## Estructura

```
planificacion/
├── README.md        este índice: etapas y bloques
├── comun/
│   └── base.md      contexto y reglas: va al inicio de toda instrucción de agy
└── etapas/
    └── <n>-<nombre-corto>/
        ├── PLAN.md      qué se pidió, decisiones, bloques, verificación, commits
        ├── REPORTE.md   resultado final: commits, ajustes, verificación, pendientes
        ├── revision/    capturas, antes/después, prototipos (opcional)
        ├── bloques/
        │   └── <id>-<nombre>/
        │       ├── tarea.md        parte propia del bloque
        │       └── instruccion.md  base.md + tarea.md
        └── logs/        salida de agy (no se versiona)
```

## Cómo trabajar en equipo

1. Antes de empezar: `git pull`, leer este índice y el `REPORTE.md` de la
   última etapa.
2. Nueva etapa: usar el siguiente número libre de la tabla, crear
   `etapas/<n>-<nombre>/PLAN.md` y agregar la fila con tu nombre y estado
   "en curso". Haz commit de esa fila pronto para que nadie tome el mismo
   número.
3. Al terminar: escribir `REPORTE.md` y marcar la etapa como "cerrada".
4. Si una regla general cambia, actualizar `comun/base.md` y avisar al equipo
   (cada uno actualiza su `GEMINI.md` local).

Lanzar agy con una instrucción guardada en archivo:

    agy -p "Lee el archivo <carpeta>/instruccion.md (UTF-8) y ejecuta al pie de la letra la instruccion completa que contiene. Ese archivo es tu unica tarea." --model "gemini-3.8-flash-high" --dangerously-skip-permissions --output-format json *> planificacion/etapas/<etapa>/logs/<id>.log

## Etapas

| # | Etapa | Responsable | Estado |
|---|-------|-------------|--------|
| 1 | GEMINI.md para el equipo | Juan Fierro | cerrada |

## Bloques

| Etapa | Bloque | Descripción | Estado |
|-------|--------|-------------|--------|
| 1 | A | Crear `GEMINI.md` | hecho |
