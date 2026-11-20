# Vectorización del logo

Scripts que convirtieron el logo de Sportify (imagen JPG de 2752×1536 sobre
fondo negro) en SVG. La imagen original no se versiona: pásala por ruta.

1. `trazar.py`: separa los tres colores (naranja, verde y blanco) por mezcla
   con el fondo negro, sobremuestrea el alfa ×3 y traza cada capa con potrace
   (`potracer`, en Python puro). Escribe `capas.json` con los segmentos.
2. `armar.py`: arma los SVG con coordenadas enteras ×4 (precisión de 0,25 px
   del original) y en relativo, para que pesen poco:
   - `marca.svg` (solo la "S"), `logo-claro.svg` y `logo-oscuro.svg` (palabra
     blanca o `#0f172a`): copiados a `docs/marca/`.
   - `favicon.svg`: la "S" sobre un cuadrado `#0b0b0b` redondeado. Con el
     tercer argumento (`16`) engruesa el trazo para que se lea a 16 px: así
     está `public/favicon.svg`.
   - `logoSportify.js`: copiado a `src/data/logoSportify.js` (lo usa
     `LogoSportify.jsx`; la palabra va con `currentColor`).

```bash
python -m venv venv && venv/Scripts/python -m pip install pillow numpy potracer
venv/Scripts/python -I trazar.py <original.jpg> <salida>
venv/Scripts/python -I armar.py <salida>/capas.json <salida>          # trazo normal
venv/Scripts/python -I armar.py <salida>/capas.json <salida-favicon> 16  # favicon
```

Los PNG (`public/logo192.png`, `public/logo512.png`) y `public/favicon.ico`
(16, 32, 48 y 64 px) salieron de renderizar `favicon.svg` a 512 px con Chrome
headless y reducirlo con Lanczos (Pillow): el 192 y el 512 con el trazo
normal, el `.ico` con el trazo grueso.
