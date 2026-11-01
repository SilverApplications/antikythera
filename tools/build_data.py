#!/usr/bin/env python3
"""Buendelt data/*.json in ein JS-Modul fuer die App (app/js/generated/data.js)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
names = ["gears", "assemblies", "timeline", "locations", "sources", "papers"]
parts = ["// Generiert von tools/build_data.py aus /data. Nicht von Hand bearbeiten."]
for n in names:
    obj = json.loads((ROOT / "data" / f"{n}.json").read_text(encoding="utf-8"))
    parts.append(f"export const {n.upper()} = {json.dumps(obj, ensure_ascii=False)};")
i18n = {l: json.loads((ROOT / "data" / "i18n" / f"{l}.json").read_text(encoding="utf-8")) for l in ("en", "el")}
parts.append(f"export const I18N = {json.dumps(i18n, ensure_ascii=False)};")
out = ROOT / "app" / "js" / "generated" / "data.js"
out.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(f"OK -> {out} ({out.stat().st_size // 1024} KB)")
