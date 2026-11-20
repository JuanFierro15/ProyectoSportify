"""Arma los SVG del logo a partir de capas.json (segmentos crudos de potrace).

Uso: python armar.py <capas.json> <carpeta_salida> [grosor_favicon]

Las coordenadas se trasladan para que cada viewBox empiece en 0 0, se redondean
a enteros (en la escala del original, ~700 unidades de alto: invisible) y se
escriben en relativo para que el path pese poco.
"""
import json
import sys

capas_json, salida = sys.argv[1], sys.argv[2]
grosor = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
MARGEN = 2
F = 4  # unidades por píxel del original: enteros con precisión de 0.25 px

capas = json.load(open(capas_json, encoding="utf-8"))["capas"]
nar, ver, bla = capas["naranja"], capas["verde"], capas["blanco"]
NAR, VER = nar["color"], ver["color"]


def caja(*cs):
    pts = []
    for c in cs:
        for cr in c["crudos"]:
            pts.append(cr["m"])
            for s in cr["s"]:
                pts.extend(zip(s[1::2], s[2::2]))
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs) - MARGEN, min(ys) - MARGEN, max(xs) + MARGEN, max(ys) + MARGEN


def path(capa, ox, oy):
    """Path relativo con enteros; los deltas salen de absolutos redondeados (sin deriva)."""
    out = []

    def r(x, y):
        return round((x - ox) * F), round((y - oy) * F)

    def num(v, primero):
        t = str(v)
        if primero or v < 0:
            return t
        return " " + t

    def pares(lista):
        t = ""
        for i, (dx, dy) in enumerate(lista):
            t += num(dx, i == 0) + num(dy, False)
        return t

    for cr in capa["crudos"]:
        cx, cy = r(*cr["m"])
        out.append(f"M{cx} {cy}")
        for s in cr["s"]:
            if s[0] == "L":
                a = r(s[1], s[2])
                b = r(s[3], s[4])
                out.append("l" + pares([(a[0] - cx, a[1] - cy), (b[0] - a[0], b[1] - a[1])]))
                cx, cy = b
            else:
                c1 = r(s[1], s[2])
                c2 = r(s[3], s[4])
                e = r(s[5], s[6])
                out.append(
                    "c" + pares([(c1[0] - cx, c1[1] - cy), (c2[0] - cx, c2[1] - cy), (e[0] - cx, e[1] - cy)])
                )
                cx, cy = e
        out.append("z")
    return "".join(out)


def vb(x0, y0, x1, y1):
    return f"0 0 {round((x1 - x0) * F)} {round((y1 - y0) * F)}"


mx0, my0, mx1, my1 = caja(nar, ver)
tx0, ty0, tx1, ty1 = caja(bla)
fx0, fy0, fx1, fy1 = caja(nar, ver, bla)

d_nar, d_ver = path(nar, mx0, my0), path(ver, mx0, my0)
d_pal = path(bla, tx0, ty0)

# 1) Solo la marca
open(f"{salida}/marca.svg", "w", encoding="utf-8").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb(mx0, my0, mx1, my1)}">'
    f'<path fill-rule="evenodd" fill="{NAR}" d="{d_nar}"/><path fill-rule="evenodd" fill="{VER}" d="{d_ver}"/></svg>\n'
)

# 2) Favicon: marca sobre cuadrado oscuro redondeado (trazo opcional para tamaños chicos)
ancho, alto = (mx1 - mx0) * F, (my1 - my0) * F
lado = round(ancho * 1.14)
dx, dy = round((lado - ancho) / 2), round((lado - alto) / 2)
extra = f' stroke-width="{grosor * F:g}" stroke-linejoin="round"' if grosor else ""
open(f"{salida}/favicon.svg", "w", encoding="utf-8").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}">'
    f'<rect width="{lado}" height="{lado}" rx="{round(lado * 0.2)}" fill="#0b0b0b"/>'
    f'<g transform="translate({dx} {dy})">'
    f'<path fill-rule="evenodd" fill="{NAR}"{f" stroke={chr(34)}{NAR}{chr(34)}" if grosor else ""}{extra} d="{d_nar}"/>'
    f'<path fill-rule="evenodd" fill="{VER}"{f" stroke={chr(34)}{VER}{chr(34)}" if grosor else ""}{extra} d="{d_ver}"/>'
    f"</g></svg>\n"
)

# 3) Logo completo con la palabra en claro u oscuro
for nombre, color in (("logo-claro", "#ffffff"), ("logo-oscuro", "#0f172a")):
    open(f"{salida}/{nombre}.svg", "w", encoding="utf-8").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb(fx0, fy0, fx1, fy1)}">'
        f'<path fill-rule="evenodd" fill="{NAR}" d="{path(nar, fx0, fy0)}"/><path fill-rule="evenodd" fill="{VER}" d="{path(ver, fx0, fy0)}"/>'
        f'<path fill-rule="evenodd" fill="{color}" d="{path(bla, fx0, fy0)}"/></svg>\n'
    )

# 4) Módulo de datos para el componente de React (logo completo, un solo viewBox)
modulo = f"""/**
 * Trazos del logo de Sportify (marca "S" + palabra "SPORTIFY"), vectorizados
 * del diseño original con `planificacion/herramientas/logo/`.
 *
 * Archivo generado: no editar a mano. Los tres trazos comparten `viewBox`.
 * La marca lleva sus colores fijos (`COLORES_LOGO`); la palabra se pinta con
 * `currentColor` para seguir el color del navbar. Todos usan
 * `fill-rule="evenodd"` (huecos de la O, la P y la R).
 */
export const COLORES_LOGO = {{ naranja: '{NAR}', verde: '{VER}' }};

export const LOGO_SPORTIFY = {{
  viewBox: '{vb(fx0, fy0, fx1, fy1)}',
  naranja: '{path(nar, fx0, fy0)}',
  verde: '{path(ver, fx0, fy0)}',
  palabra: '{path(bla, fx0, fy0)}',
}};
"""
open(f"{salida}/logoSportify.js", "w", encoding="utf-8").write(modulo)
print("marca", vb(mx0, my0, mx1, my1), "palabra", vb(tx0, ty0, tx1, ty1), "completo", vb(fx0, fy0, fx1, fy1))
print("bytes d:", len(d_nar), len(d_ver), len(d_pal), "modulo:", len(modulo))
