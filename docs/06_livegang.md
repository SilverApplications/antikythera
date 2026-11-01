# Livegang: silverapplications.com/apps/antikythera/

## Wie die Website deployt wird
- Repo `SilverApplications/silverapplications`, statisch, Netlify-Projekt `silverapplications`.
- **Push auf `main` = Deploy.** Vorbereitet ist alles auf dem lokalen Branch `antikythera` (nicht gepusht).
- CSP der Website: `script-src 'self'`, `font-src 'self'` → die App kommt ohne Inline-Skripte, ohne CDN und ohne Google Fonts aus (geprüft mit echtem CSP-Header, keine Konsolenfehler, keine 404).

## Was der Branch enthält
| Datei | Änderung |
|---|---|
| `apps/antikythera/` | komplette App (≈1,6 MB inkl. three.js, astronomy-engine, Schriften) |
| `index.html`, `en/index.html` | zweite App-Karte im Bereich „Apps“ |
| `datenschutz/index.html` | neuer Abschnitt 5a „Web-App Antikythera-Mechanismus“ (localStorage, keine Übertragung, externe Links), Stand November 2026 |
| `impressum/index.html` | Abschnitt „Hobbyprojekte und KI-Unterstützung“ |
| `sitemap.xml` | neue URL |

## Checkliste vor dem Push
- [ ] Rechtstexte gelesen und freigegeben (kein Anwalt hat sie geprüft)
- [ ] Griechische Übersetzung von einer Person mit Griechisch als Muttersprache gegenlesen lassen (optional, empfohlen)
- [ ] Auf echtem Handy testen: Intro flüssig? Kurbel, Karte (Pinch), Sprachen
- [ ] Repo-Name und Lizenz für das öffentliche GitHub-Projekt bestätigt
- [ ] Push von `antikythera` → `main` (oder Pull Request), danach Netlify-Deploy prüfen (`state: ready`)
- [ ] Nach dem Deploy: https://silverapplications.com/apps/antikythera/ öffnen, Konsole ohne Fehler, OG-Vorschau prüfen

## Aktualisieren
1. Änderungen im Projekt (`app/`, `data/`), dann `python3 tools/build_data.py` und `npm test`.
2. `tools/sync_to_site.sh /pfad/zum/silverapplications-repo`
3. Im Website-Repo committen und pushen.

## Rollback
Netlify → Deploys → vorherigen Deploy „Publish deploy“, oder `git revert` des Merge-Commits.
