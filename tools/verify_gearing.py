#!/usr/bin/env python3
"""
Prueft alle Zahnradzuege aus data/gears.json:
1. Stimmt das Produkt der Zaehnezahlen exakt mit der erwarteten Periodenrelation ueberein?
2. Wie genau trifft der Mechanismus die heutigen astronomischen Werte?

Aufruf:  python3 tools/verify_gearing.py
"""
import json
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "data" / "gears.json").read_text(encoding="utf-8"))
teeth = {g["id"]: g["teeth"] for g in data["gears"]}

TROPICAL_YEAR = 365.24219  # Tage

# Moderne Referenzwerte (Tage) zum Genauigkeitsvergleich
MODERN = {
    "moon-sidereal": 27.321661,       # siderischer Monat
    "lunar-apsides": 3232.6,          # Apsidenumlauf ~8,85 Jahre
    "metonic": 19 * TROPICAL_YEAR / 5,
    "olympiad": 4 * TROPICAL_YEAR,
    "callippic": 76 * TROPICAL_YEAR,
    "saros": 6585.3211 / 4,           # 1 Saros = 4 Spiralwindungen
    "exeligmos": 3 * 6585.3211,
    "venus": 583.92,                  # synodische Perioden
    "mercury": 115.88,
    "mars": 779.94,
    "jupiter": 398.88,
    "saturn": 378.09,
    "true-sun": TROPICAL_YEAR,
    "nodes": None,
}

def train_ratio(train):
    r = Fraction(1)
    for driver, driven in train["meshes"]:
        r *= Fraction(teeth[driver], teeth[driven])
    return r

ok = True
print(f"{'Zug':<16}{'berechnet':>14}{'erwartet':>14}  {'Periode [d]':>12}{'heute [d]':>12}{'Abw.':>9}")
print("-" * 79)
for t in data["trains"]:
    got = train_ratio(t)
    exp = Fraction(t["expectedTurnsPerYear"])
    match = got == exp
    ok &= match
    period = TROPICAL_YEAR / float(got)
    modern = MODERN.get(t["id"])
    if t["id"] == "nodes":
        # raumfeste Knotenbewegung = 1 - 98/93 = -5/93 Umdrehungen/Jahr
        node = 1 - got
        period = abs(TROPICAL_YEAR / float(node))
        modern = 6793.48
    dev = f"{(period - modern) / modern * 100:+.3f}%" if modern else "-"
    flag = "OK " if match else "FEHLER"
    print(f"{t['id']:<16}{str(got):>14}{str(exp):>14}  {period:>12.2f}{modern if modern else 0:>12.2f}{dev:>9}  {flag}")

# Abgeleitete Groessen
moon = train_ratio(next(t for t in data["trains"] if t["id"] == "moon-sidereal"))
aps = train_ratio(next(t for t in data["trains"] if t["id"] == "lunar-apsides"))
synodic = moon - 1
anomalistic = moon - aps
print("-" * 79)
print(f"synodischer Monat   : {synodic} U/Jahr -> {TROPICAL_YEAR/float(synodic):.4f} d (heute 29.5306 d)")
print(f"anomalist. Monat    : {anomalistic} U/Jahr -> {TROPICAL_YEAR/float(anomalistic):.4f} d (heute 27.5546 d)")
print(f"Monate je Saros     : {synodic / train_ratio(next(t for t in data['trains'] if t['id']=='saros')) * 4} (soll 223)")

sys.exit(0 if ok else 1)
