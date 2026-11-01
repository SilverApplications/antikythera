# Forschungsdossier Antikythera-Mechanismus

Stand: 01.11.2026 · Grundlage für 3D-Modell, Kinematik und Infotexte

## 1. Steckbrief

| Merkmal | Wert | Sicherheit |
|---|---|---|
| Art | Mechanischer Analogrechner für Sonne, Mond, 5 Planeten, Kalender, Finsternisse, Spiele | gesichert |
| Erhalten | 82 Fragmente (A–G große, 1–75 kleine), ca. 1/3 des Originals, 30 Bronzezahnräder | gesichert |
| Gehäuse | ca. 34 × 18 × 9 cm, Holzrahmen mit bronzenen Front- und Rückplatten, Deckel mit Inschriften | Maße unsicher |
| Größtes Rad | b1, ca. 13 cm Durchmesser, 4 Speichen | gesichert |
| Zahnform | Dreieckszähne, mittlere Teilung 1,6 mm, Radstärke ~1,4 mm, Modul ~0,5 mm (b1 ~0,58 mm) | gesichert (Mittelwerte) |
| Antrieb | Handkurbel → Kronrad a1 (48 Z.) → b1 (1 Umdrehung = 1 Jahr) | Kurbel verloren |
| Material | Bronze (heute großteils zu Atacamit korrodiert), Holzkasten verloren | gesichert |
| Untergang | Schiff gesunken ca. 70–60 v. Chr. | gesichert (Spanne) |
| Startdatum Skalen | 205 v. Chr. (Saros/Kalender) – alternativ 178 v. Chr. | Hypothese, breit akzeptiert |
| Baujahr | zwischen ca. 205 und ~87 v. Chr., oft 150–100 v. Chr. | offen |
| Herkunft | Rhodos (Favorit), Epirus als Nutzer, korinthischer Kalender; Syrakus eher ausgeschlossen | offen |

## 2. Anzeigen

### Front (Kosmos-Anzeige)
- **Zodiak-Skala:** fester Ring, 12 × 30°, griechische Tierkreisnamen.
- **Kalenderring:** drehbar, ägyptische Monatsnamen (12 × 30 + 5 Zusatztage). Darunter eine Lochreihe: Neuere Analysen ergeben **354 (oder 355) Löcher auf Radius 77,1 mm (±1/3 mm)** → Mondjahr, nicht 365. Widerspruch zur Beschriftung = spannender Infopunkt.
- **Kosmos (Freeth 2021):** konzentrische Ringe in der „üblichen kosmologischen Reihenfolge“: Mond (Mitte) – Merkur – Venus – Sonne – Mars – Jupiter – Saturn, außen Datum. Planeten durch Edelstein-Marker (Merkur Türkis, Venus Lapislazuli, Sonne goldene Kugel; übrige nicht überliefert → spekulativ).
- **Mond:** Zeiger mit Kugel ~6 mm, halb hell / halb dunkel → zeigt Mondphase.
- **Drachenzeiger:** zweiendig, zeigt Mondknoten (Finsternis-Zonen) – laut Autoren selbst ohne direkte Evidenz.
- **Parapegma:** Sternauf- und -untergänge als Inschrift über/unter der Anzeige.

### Rückseite
- **Metonische Spirale (oben):** 5 Windungen, 235 Zellen = 19 Jahre; Monatsnamen des korinthischen Kalenders.
- **Kallipp-Anzeige:** 76 Jahre in 4 Sektoren.
- **Spiele-Anzeige:** 4 Sektoren: Isthmia/Olympia, Nemea/Naa, Isthmia/Pythia, Nemea/Halieia.
- **Saros-Spirale (unten):** 4 Windungen, 223 Zellen; Glyphen in 51 Zellen = 38 Mond- und 27 Sonnenfinsternisse.
- **Exeligmos:** 3 Saros = 54 Jahre, Sektoren mit Zeitkorrektur 0 / +8 / +16 Stunden.
- **Zeiger mit Läufer:** Ein Stift im Zeiger läuft in der Spirale und verlängert/verkürzt den Zeiger (in der Rekonstruktion üblich).

## 3. Getriebe (verifiziert)

Alle Züge sind in `data/gears.json` hinterlegt und mit `tools/verify_gearing.py` exakt nachgerechnet.

| Ausgang | Zug | Umdrehungen/Jahr | Periode Mechanismus | heutiger Wert |
|---|---|---|---|---|
| Mond siderisch | b2~c1+c2~d1+d2~e2+e5~k1⊕k2~e6+e1~b3 | 254/19 | 27,32 d | 27,32 d |
| Synodischer Monat | Differenz Mond – Sonne | 235/19 | 29,530 d | 29,531 d |
| Metonisch | b2~l1+l2~m1+m2~n1 | 5/19 | 19 J. / 5 Windungen | – |
| Spiele | …+n3~o1 | 1/4 | 4 Jahre | – |
| Kallipp | …+n2~p1+p2~q1 | 1/76 | 76 Jahre | – |
| Saros | …m1+m3~e3+e4~f1+f2~g1 | 940/4237 | 223 Monate / 4 Windungen | Abw. −0,001 % |
| Exeligmos | …+g2~h1+h2~i1 | 235/12711 | 54 Jahre | Abw. −0,001 % |
| Merkur | 51~72+89~40~20⊕ | 1513/480 | 115,87 d | 115,88 d |
| Venus | 51~44+34~26~63⊕ | 289/462 | 583,88 d | 583,92 d |
| Wahre Sonne | 56~52~56⊕ | Epizykel raumfest | 1 Jahr mit Anomalie | – |
| Mars | 56~64+38~40~71⊕80~80 | 133/284 | 779,92 d | 779,94 d |
| Jupiter | 56~64+45~40~43⊕65~65 | 315/344 | 398,87 d | 398,88 d |
| Saturn | 56~52+61~40~68⊕86~86 | 427/442 | 378,07 d | 378,09 d |
| Mondknoten | 49~62+64~48 | −5/93 raumfest | 18,6 Jahre | 18,6 Jahre |

Legende: `~` kämmt, `+` gleiche Welle, `⊕` Stift-Schlitz-Kopplung.

**Kernprinzip für Laien:** Die Zähnezahlen sind die Primfaktoren astronomischer Perioden. Beispiel Venus: 289 Zyklen in 462 Jahren = 17² / (2·3·7·11) → Zahnräder 51 (=3·17), 34 (=2·17), 44, 63. Die 63 ist das echte, rätselhafte Rad aus Fragment D.

**Mondanomalie (Hipparch):** Zwei gleich große Räder k1/k2 sitzen mit ~1,1 mm Achsversatz auf dem drehenden Rad e3. Ein Stift in k1 greift in einen Schlitz in k2 → der Mond läuft mal schneller, mal langsamer. Weil e3 sich langsam dreht (8,88 Jahre), wandert auch die schnellste Stelle – wie die echte Mondbahn.

## 4. Evidenz-Bilanz (für die Kennzeichnung im 3D-Modell)

| Klasse | Bedeutung | Anzahl Räder (aktuell) |
|---|---|---|
| E1 erhalten | physisch da, Zähne per CT gezählt | 30 |
| E2 erschlossen | verloren, aber Übersetzung durch erhaltene Skalen erzwungen (m3, n1–n3, p1–p2, q1) | 7 |
| E3 rekonstruiert | Freeth 2021 Kosmos (inkl. mittlere Sonne b0) | 28 |
| E4 spekulativ | Drachenzeiger, Kurbel, Gehäusedetails, Marker Mars/Jupiter/Saturn | 4 Räder + Bauteile |

Summe 69 Räder – deckt sich mit der Gesamtzahl im Paper. ma1 = 20 Zähne (Freeth 2006, dort „q1“), b0 = 20 Zähne (Freeth 2021, S6.2.6); Benennung n2/n3 an die Literatur angepasst. Details: docs/08–10, Literatur-Übersicht docs/literatur/.

## 5. Kontroversen, die wir in der App zeigen sollten

1. **Funktionierte er überhaupt?** Szigety & Arenas (2025, Preprint) simulierten Dreieckszähne plus gemessene Teilungsfehler: Das Getriebe blockierte in ~90 % der Läufe meist vor 4 Monaten Sonnenweg. Die Autoren sagen selbst: Messdaten aus korrodierten Teilen könnten die Ursache sein. Medien machten daraus „nur ein Spielzeug“ – das steht nicht im Paper.
2. **Mond- oder Sonnenkalender?** 354 Löcher vs. ägyptische 365-Tage-Beschriftung.
3. **Wann gebaut?** Startdatum 205 v. Chr. ≠ Baujahr.
4. **Wo gebaut?** Rhodos vs. Korinth-Kolonie vs. Syrakus.
5. **Planeten-Getriebe:** Fast vollständig verloren. Freeth 2021 passt zu allen Indizien, ist aber ausdrücklich kein Replikat.

## 6. Datenlücken / TODO
- ~~Gemessene Radien~~ → erledigt mit Freeth 2021, Tabelle S8 (docs/09); Kosmos-Lagerstellen aus den Speichen von b1. Offen: **Koordinaten** der Achsen hinter b1 (nicht als Zahlen veröffentlicht; ggf. aus CT-Abbildungen ablesen).
- ~~Zähnezahl ma1~~ → 20 (Freeth 2006).
- Exakte Geometrie Front-/Rückplatte, Spiralabstände, Zellenradien.
- Parapegma- und Inschriftentexte (neue Edition Iversen in Arbeit, siehe MPIWG-Vortrag Feb. 2026).
- 2025er Grabungsergebnisse (Abschlusskampagne).

## 7. Vorhandene Open-Source-Referenz
`github.com/ylfeid/antikythera` – Browser-Modell (WebGPU, TypeScript, MIT-Lizenz), 69 Räder nach Freeth 2021, geprüft gegen Ephemeriden. Nützlich als Gegencheck für unsere Kinematik und Radien. Bei Code-Übernahme MIT-Hinweis nötig.
