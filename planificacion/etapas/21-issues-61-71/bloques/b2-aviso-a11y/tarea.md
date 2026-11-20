# Tarea del bloque b2: el aviso de conflicto se anuncia una vez y usa tokens (issue #65)

## Objetivo

El aviso global de conflicto (`src/components/shared/AvisoConflictoReserva.jsx`)
tiene dos problemas (lee `gh issue view 65`):

1. Tiene `aria-live="assertive"` en el contenedor y `role="alert"` en cada
   aviso, que ya es una región viva: algunos lectores de pantalla lo anuncian
   dos veces.
2. Sus reglas `.avisos-conflicto*` de `src/App.css` usan colores fijos en
   lugar de tokens.

## Archivos

- Puedes editar solo: `src/components/shared/AvisoConflictoReserva.jsx`,
  `src/components/shared/AvisoConflictoReserva.test.jsx`, `src/App.css` y
  `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. **Una sola región viva.** Quita `aria-live` del contenedor
   `.avisos-conflicto` y conserva `role="alert"` en cada
   `.avisos-conflicto__item`. No agregues otro `role` ni `aria-live`.
2. **Tokens.** En el bloque `:root` de `src/App.css`, junto a los tokens de la
   marca, agrega tokens con prefijo `--aviso-` y un comentario corto, y úsalos
   en todas las reglas `.avisos-conflicto*`. Los valores deben dar **el mismo
   color que hoy** (no cambia nada visible):
   - `--aviso-fondo`: hoy `rgba(26, 26, 26, 0.96)`.
   - `--aviso-texto`: hoy `#fde68a`.
   - `--aviso-borde`: hoy `rgba(246, 169, 75, 0.55)`, que repite
     `--color-marca`; derívalo con
     `color-mix(in srgb, var(--color-marca) 55%, transparent)`.
   - `--aviso-cerrar`: hoy `#f2f2f2` (color del botón de cerrar).
   - `--aviso-cerrar-hover`: hoy `rgba(255, 255, 255, 0.12)`.
   - `--aviso-sombra`: hoy `rgba(0, 0, 0, 0.45)` (en el `box-shadow`).
   Al terminar, ninguna regla `.avisos-conflicto*` tiene un color literal
   (hex, `rgb`, `rgba` ni nombre de color); solo `var(...)`, `transparent` o
   `currentColor`.
3. **Pruebas** en `AvisoConflictoReserva.test.jsx`: con dos avisos, el
   contenedor no tiene `aria-live`, no hay ningún elemento con `aria-live`
   dentro del componente y hay exactamente dos `role="alert"`. Cerrar el
   segundo aviso deja solo el primero (y cerrar el último deja el componente
   vacío).
4. Si `docs/agentes/reservas.md` describe la región viva o los colores del
   aviso, actualízalo.

## Comandos

- `npm test -- src/components/shared src/App.test.jsx`
- `npm run lint` (0 errores y 0 avisos)
