#!/usr/bin/env python3
"""
Erzeugt aus Natural-Earth-Kuestenlinien (Public Domain) eine stilisierte SVG-Karte
des oestlichen Mittelmeers als JS-Modul (app/js/generated/map-data.js).
Keine Laufzeit-Abhaengigkeit, kein externer Kartendienst.

Aufruf: python3 tools/build_map.py ne_10m_coastline.geojson ne_10m_land.geojson ne_10m_minor_islands.geojson
(Land wird mit fill-rule evenodd gezeichnet: Sutherland-Hodgman erzeugt Randkanten.)
"""
import json, math, sys
from pathlib import Path

LON0, LON1, LAT0, LAT1 = 11.0, 46.0, 29.0, 44.5
W = 1000
KX = math.cos(math.radians((LAT0 + LAT1) / 2))
H = round(W * (LAT1 - LAT0) / ((LON1 - LON0) * KX))
TOL = 0.008  # Grad, Douglas-Peucker (fein genug für Zoom bis ca. 8x)

def proj(lon, lat):
    x = (lon - LON0) / (LON1 - LON0) * W
    y = (LAT1 - lat) / (LAT1 - LAT0) * H
    return x, y

def clip(ring):
    """Sutherland-Hodgman gegen das Rechteck."""
    def inside(p, e):
        return [p[0] >= LON0, p[0] <= LON1, p[1] >= LAT0, p[1] <= LAT1][e]
    def inter(a, b, e):
        (x1, y1), (x2, y2) = a, b
        if e in (0, 1):
            xv = LON0 if e == 0 else LON1
            t = (xv - x1) / (x2 - x1)
            return (xv, y1 + t * (y2 - y1))
        yv = LAT0 if e == 2 else LAT1
        t = (yv - y1) / (y2 - y1)
        return (x1 + t * (x2 - x1), yv)
    out = ring
    for e in range(4):
        inp, out = out, []
        if not inp:
            break
        s = inp[-1]
        for p in inp:
            if inside(p, e):
                if not inside(s, e):
                    out.append(inter(s, p, e))
                out.append(p)
            elif inside(s, e):
                out.append(inter(s, p, e))
            s = p
    return out

def dp(pts, tol):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1e-12
    imax, dmax = 0, 0.0
    for i in range(1, len(pts) - 1):
        d = abs(dy * (pts[i][0] - a[0]) - dx * (pts[i][1] - a[1])) / n
        if d > dmax:
            imax, dmax = i, d
    if dmax > tol:
        return dp(pts[: imax + 1], tol)[:-1] + dp(pts[imax:], tol)
    return [a, b]

def rings_of(geom):
    if geom["type"] == "Polygon":
        yield from geom["coordinates"]
    elif geom["type"] == "MultiPolygon":
        for poly in geom["coordinates"]:
            yield from poly

def lb_clip(a, b):
    """Liang-Barsky: Segment a-b gegen das Rechteck, None wenn ausserhalb."""
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    t0, t1 = 0.0, 1.0
    for pp, qq in ((-dx, x0 - LON0), (dx, LON1 - x0), (-dy, y0 - LAT0), (dy, LAT1 - y0)):
        if pp == 0:
            if qq < 0:
                return None
            continue
        r = qq / pp
        if pp < 0:
            if r > t1: return None
            t0 = max(t0, r)
        else:
            if r < t0: return None
            t1 = min(t1, r)
    return (x0 + t0 * dx, y0 + t0 * dy), (x0 + t1 * dx, y0 + t1 * dy)

def lines_of(geom):
    if geom["type"] == "LineString":
        yield geom["coordinates"]
    elif geom["type"] == "MultiLineString":
        yield from geom["coordinates"]


def build_land(files):
    out = []
    for f in files:
        gj = json.loads(Path(f).read_text())
        for feat in gj["features"]:
            for ring in rings_of(feat["geometry"]):
                xs = [q[0] for q in ring]; ys = [q[1] for q in ring]
                if max(xs) < LON0 or min(xs) > LON1 or max(ys) < LAT0 or min(ys) > LAT1:
                    continue
                r = clip([tuple(q[:2]) for q in ring])
                if len(r) < 3:
                    continue
                h = len(r) // 2
                r = dp(r[: h + 1], TOL)[:-1] + dp(r[h:] + [r[0]], TOL)
                if len(r) < 4:
                    continue
                out.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in (proj(*q) for q in r)) + "Z")
    return "".join(out)

paths = []
for f in [a for a in sys.argv[1:] if 'coastline' in a]:
    gj = json.loads(Path(f).read_text())
    for feat in gj["features"]:
        for line in lines_of(feat["geometry"]):
            cur = []
            for a, b in zip(line, line[1:]):
                seg = lb_clip(tuple(a[:2]), tuple(b[:2]))
                if seg is None:
                    if len(cur) > 1: paths.append(cur)
                    cur = []
                    continue
                s0, s1 = seg
                if not cur:
                    cur = [s0]
                elif cur[-1] != s0:
                    if len(cur) > 1: paths.append(cur)
                    cur = [s0]
                cur.append(s1)
                if s1 != tuple(b[:2]):
                    paths.append(cur); cur = []
            if len(cur) > 1: paths.append(cur)

d_parts = []
for pl in paths:
    if pl[0] == pl[-1] and len(pl) > 3:
        h = len(pl) // 2
        pl = dp(pl[: h + 1], TOL)[:-1] + dp(pl[h:], TOL)
    else:
        pl = dp(pl, TOL)
    if len(pl) < 2:
        continue
    pts = [proj(*q) for q in pl]
    d_parts.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts))
paths = d_parts

out = Path(__file__).resolve().parent.parent / "app" / "js" / "generated" / "map-data.js"
out.parent.mkdir(parents=True, exist_ok=True)
js = (
    "// Generiert von tools/build_map.py aus Natural Earth (Public Domain). Nicht von Hand bearbeiten.\n"
    f"export const MAP = {{ width: {W}, height: {H}, lon0: {LON0}, lon1: {LON1}, lat0: {LAT0}, lat1: {LAT1}, kx: {KX:.6f},\n"
    f"  land: {json.dumps(build_land([a for a in sys.argv[1:] if 'coastline' not in a]))},\n"
    f"  coast: {json.dumps(''.join(paths))} }};\n"
)
out.write_text(js)
print(f"{len(paths)} Ringe, {len(js)//1024} KB, {W}x{H} -> {out}")
