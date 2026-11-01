#!/usr/bin/env bash
# Kopiert die App in das Website-Repo (silverapplications.com) nach /apps/antikythera/.
# Aufruf: tools/sync_to_site.sh /pfad/zum/silverapplications-repo
set -euo pipefail
SITE="${1:?Pfad zum Website-Repo angeben}"
SRC="$(cd "$(dirname "$0")/.." && pwd)/app"
test -f "$SITE/netlify.toml" || { echo "Kein Website-Repo: $SITE"; exit 1; }
rm -rf "$SITE/apps/antikythera"
cp -r "$SRC" "$SITE/apps/antikythera"
# CSP der Website: keine Inline-Skripte und keine on*-Attribute erlaubt
if grep -q '<script>' "$SITE/apps/antikythera/index.html" || grep -Eq ' on[a-z]+=' "$SITE/apps/antikythera/index.html"; then echo "CSP-Verstoß in index.html"; exit 1; fi
echo "OK: $SITE/apps/antikythera aktualisiert"
