"""Vectoriza el logo de Sportify (JPG) por capas de color con potrace.

Uso: python trazar.py <original.jpg> <carpeta_salida>
Genera capas.json con el path de cada color (coordenadas del original).
"""
import json
import sys

import numpy as np
import potrace
from PIL import Image

ESCALA = 3  # sobremuestreo del alfa antes de umbralizar (bordes más finos)

origen, salida = sys.argv[1], sys.argv[2]
img = np.asarray(Image.open(origen).convert("RGB"), dtype=np.float64)
h, w, _ = img.shape

# Colores de referencia aproximados; se refinan con la mediana de cada clase.
referencias = {
    "naranja": np.array([240.0, 118.0, 30.0]),
    "verde": np.array([45.0, 155.0, 92.0]),
    "blanco": np.array([255.0, 255.0, 255.0]),
}


def alfa_y_residuo(c):
    # Mejor alfa en [0,1] para p ~ alfa * c (mezcla con fondo negro)
    a = (img @ c) / (c @ c)
    a = np.clip(a, 0, 1)
    res = np.linalg.norm(img - a[..., None] * c, axis=2)
    return a, res


for _ in range(2):
    datos = {k: alfa_y_residuo(c) for k, c in referencias.items()}
    residuos = np.stack([datos[k][1] for k in referencias])
    clase = np.argmin(residuos, axis=0)
    nuevas = {}
    for i, k in enumerate(referencias):
        sel = (clase == i) & (datos[k][0] > 0.92)
        nuevas[k] = np.median(img[sel], axis=0) if sel.sum() > 50 else referencias[k]
    referencias = nuevas

datos = {k: alfa_y_residuo(c) for k, c in referencias.items()}
residuos = np.stack([datos[k][1] for k in referencias])
clase = np.argmin(residuos, axis=0)

capas = {}
for i, k in enumerate(referencias):
    alfa = np.where(clase == i, datos[k][0], 0.0)
    # Sobremuestrear el alfa y umbralizar a 0.5
    im = Image.fromarray((alfa * 255).astype(np.uint8))
    im = im.resize((w * ESCALA, h * ESCALA), Image.BICUBIC)
    mascara = np.asarray(im) > 127
    bm = potrace.Bitmap(~mascara)  # potracer invierte: True = fondo
    plist = bm.trace(
        turdsize=40 * ESCALA,
        turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
        alphamax=1.0,
        opticurve=True,
        opttolerance=0.5,
    )
    partes = []
    xs, ys = [], []
    crudos = []

    def f(v):
        return f"{v / ESCALA:.1f}".rstrip("0").rstrip(".")

    def punto(p):
        xs.append(p.x / ESCALA)
        ys.append(p.y / ESCALA)
        return f"{f(p.x)} {f(p.y)}"

    for curva in plist:
        cr = {"m": [curva.start_point.x / ESCALA, curva.start_point.y / ESCALA], "s": []}
        for seg in curva:
            if seg.is_corner:
                cr["s"].append(["L", seg.c.x / ESCALA, seg.c.y / ESCALA, seg.end_point.x / ESCALA, seg.end_point.y / ESCALA])
            else:
                cr["s"].append(["C", seg.c1.x / ESCALA, seg.c1.y / ESCALA, seg.c2.x / ESCALA, seg.c2.y / ESCALA, seg.end_point.x / ESCALA, seg.end_point.y / ESCALA])
        crudos.append(cr)
        partes.append("M" + punto(curva.start_point))
        for seg in curva:
            if seg.is_corner:
                partes.append("L" + punto(seg.c) + "L" + punto(seg.end_point))
            else:
                partes.append(
                    "C" + punto(seg.c1) + " " + punto(seg.c2) + " " + punto(seg.end_point)
                )
        partes.append("Z")
    color = "#%02x%02x%02x" % tuple(int(round(v)) for v in referencias[k])
    capas[k] = {
        "color": color,
        "d": "".join(partes),
        "bbox": [min(xs), min(ys), max(xs), max(ys)] if xs else None,
        "curvas": len(plist),
        "crudos": crudos,
    }
    print(k, color, "curvas:", len(plist), "bbox:", capas[k]["bbox"])

with open(f"{salida}/capas.json", "w", encoding="utf-8") as fh:
    json.dump({"ancho": w, "alto": h, "capas": capas}, fh)
