# Reporte de la etapa 10: frente B del asistente de torneo (issue #6)

Responsable: Miguel Medina. Rama: `feat/asistente-torneo-movil-secciones`
(desde `feat/asistente-torneo-movil`). Spec: `odd/tasks/asistente-torneo-movil.md`,
tareas B1 (S7) y B2 (S8).

## Qué se hizo

| Bloque | Qué | Commit |
| --- | --- | --- |
| f1 | B1: prop `seccion` en `FormularioReserva` y seis bloques extraídos a `torneo/Paso*.jsx` (`PasoFormato`, `PasoLlaves`, `PasoCapacidad`, `PasoFechas`, `PasoDatos`, `PasoGuardados`), con 7 tests en `FormularioReserva.test.jsx` | `71fb582` |
| v1 | Medición a 390×844 de los seis pasos antes de B2 y base de capturas a 1440×900 | (solo `revision/v1/medicion.md`) |
| f2 | B2: contención del ancho del bracket y del formulario bajo `(max-width: 63.9375em)` | `2eafffa` |
| v2 | Verificación final: S2 y S7 pasan; S8 pasa a 390 pero falla a 960×800 | (`revision/v2/verificacion.md`) |
| corrección | `contain: inline-size` también en `.bracket-torneo__canvas-scroll` (entre 900 px y 64em el bracket usa el lienzo de escritorio) | `442a92b` |
| v3 | Recomprobación acotada: 960×800 y 390×844 sin desborde, 1440×900 con 0 % de diferencia | (al final de `verificacion.md`) |

## Decisiones

- El fieldset "Formato del torneo" de escritorio junta formato, emparejamiento y
  capacidad, pero en móvil van en pasos distintos. Por eso los bloques se
  extrajeron más finos que los pasos y `FormularioReserva` los compone de dos
  maneras. Sin `seccion` (o con un valor desconocido, o fuera del modo torneo),
  el árbol es el de antes.
- `fechas` = calendario por fases + capacidad y tiempo estimado (con
  `AlertaTiempo`); `llaves` = fieldset "Emparejamiento" (el `Bracket` lo sigue
  poniendo `SeccionLlaves`, del frente A).
- La causa del desborde (diagnóstico de v1): el bracket simétrico tiene ancho
  fijo (616-646 px) y su `min-content` subía por el grid de la página aunque su
  contenedor tuviera `overflow-x: auto`; el marco lo recortaba sin scroll, así que
  el contenido quedaba cortado. `contain: inline-size` corta esa propagación y el
  bracket desplaza dentro de su caja.

## Verificación

- RED: los 5 tests de `seccion` fallaron antes de implementar.
- Prueba diferencial (temporal, borrada): snapshot del formulario sin `seccion`
  en los tres modos antes del cambio; pasó después sin actualizarla.
- `npm test`: 20 archivos, 227 tests pasan. `npm run lint`: sin errores ni
  warnings. `npm run build`: correcto.
- 390×844: todos los pasos con `scrollWidth` 390 (en `resumen`, 2 px de las
  muescas decorativas del voucher, recortados por el marco, sin scroll). Bracket
  320 / 646 y llega hasta la final; texto mínimo de 12 px.
- 960×800: `llaves` y "Torneos reservados" sin desborde (en v2 eran 1167 y
  1150 px).
- 1440×900: 0 % de píxeles distintos en las capturas del formulario; en las que
  incluyen el carrusel solo varía la animación Ken Burns de las fotos.

## Pendiente

- C1 (frente A, tras unir las dos ramas): prueba de costura, revisión visual
  conjunta, README y capturas.
- Advertencia sin arreglar (fuera de la superficie del frente B): las muescas del
  voucher sobresalen 2 px en `resumen`; no generan scroll.
- Las capturas que nombran `revision/v1/medicion.md` y `revision/v2/verificacion.md`
  no se versionaron (unos 2 MB); quedan solo `revision/v2/390-llaves-final.webp` y
  `390-resumen-guardados.webp`. Se regeneran con las tareas v1 y v2.
