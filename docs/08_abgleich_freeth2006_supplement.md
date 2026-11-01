# 08 · Abgleich mit dem Supplement zu Freeth et al. 2006

**Quelle:** T. Freeth et al., *Decoding the ancient Greek astronomical calculator known as the Antikythera Mechanism*, Nature 444, 587–591 (2006), **Supplementary Information** (27 Seiten). Artikel: <https://doi.org/10.1038/nature05357> – das Zusatzmaterial ist auf der Artikelseite unter „Supplementary information“ frei abrufbar.

> **Nachtrag v0.6:** Die Radgrößen kommen inzwischen aus der neueren Messung in Freeth et al. 2021, Tabelle S8 (siehe [docs/09](09_abgleich_freeth2021_supplement.md)). Statt eines gemeinsamen Moduls je Eingriffspaar hat jetzt jedes gemessene Rad seinen eigenen Teilkreis – wie im Original. Die Zähnezahl-Grenzen unten bleiben gültig.

Stand: November 2026. Geprüft wurden alle drei Teile: *Notes 1* (Fragmente), *Notes 2* (Glyphen und Inschriften), *Notes 3* (Zahnräder).

## 1. Was das Supplement enthält – und was nicht

| Inhalt | im Supplement | für uns genutzt |
|---|---|---|
| Zähnezahlen aller erhaltenen Räder mit Bestwert und Grenzen, Vergleich mit Price, Karakalos, Wright | ja (Tabelle in Notes 3) | ja |
| **Gemessene Radien** (Mittel zu den Zahnspitzen ±, Best-Fit-Kreise durch Zahngrund und Spitzen, ±0,5 mm) | ja | **ja – neu: Radgrößen im Modell** |
| Herleitung aller Übersetzungen aus babylonischen Periodenrelationen | ja | Abgleich: identisch |
| Beweis, dass Stift-Schlitz auf e3 = Hipparchs Mondtheorie | ja | Abgleich: identisch |
| Drehrichtungen der Zifferblätter | ja | Abgleich: identisch |
| **Koordinaten der Achsen** | **nein** | – (Richtungen bleiben schematisch) |
| Fragmentflächen und -gewichte, Schichtdicken der Bleche | ja | nur Hintergrund |
| Schriftdatierung, Transkriptionen Vorder-/Rücktür | ja | Abgleich Zeitstrahl: passt |

## 2. Abweichungen, die korrigiert wurden

1. **Radgrößen.** Bisher: einheitlich Modul 0,5 mm (b1: 0,58 mm). Jetzt: Für jedes Eingriffspaar wird ein gemeinsamer Modul so gewählt, dass die Teilkreise am besten zu den gemessenen Radien passen (Teilkreis ≈ Mitte zwischen Fuß- und Kopfkreis, passend zu den Dreieckszähnen). Ergebnis: Modul 0,42–0,58 mm, alle Räder innerhalb ±0,7 mm der Messung (siehe Tabelle). Die Zähne greifen weiterhin exakt ineinander, weil kämmende Räder immer denselben Modul haben. Auffällig waren vorher vor allem **e3** (Modell 55,8 mm statt gemessen 52,0 mm) und **e4** (47,0 statt 49,5 mm) sowie die kleinen 60er-Räder h1, i1, o1 (15,0 statt 12,5–13,4 mm).
2. **Achse E.** Der Abstand B–E folgt jetzt aus dem Eingriff e1~b3 mit gemessenen Radien (17,9 mm statt 16 mm). Die Lage von N und G wurde so angepasst, dass alle Eingriffe erfüllbar bleiben.
3. **Stift-Schlitz.** Der Achsversatz K→K′ bleibt bei 1,1 mm. Der Modul des Paars k2/e6 ergibt sich daraus zu 0,534 mm – gemessen 0,54 ± 0,02 mm. Das passt gut zusammen: e6 und k2 sind im Original messbar etwas größer als e5 und k1.
4. **b1: 223 statt 224 Zähne.** Freeth 2006 nennt 223 als Bestwert (Grenzen 223/224). Folge: Eine Kurbelumdrehung entspricht jetzt 48/223 Jahr ≈ 78,6 Tage (vorher 78,3).
5. **ma1 (Mondphasen-Kronrad): 20 Zähne**, Spitzenradius 5,3 mm. Im Supplement heißt dieses Rad noch „q1“ (Fragment C). Die offene TODO-Stelle ist damit geschlossen.
6. **Benennung n2/n3.** Im Supplement treibt **n2 (15 Zähne)** den Kallipp-Zug (n2~p1). Bei uns waren n2 und n3 vertauscht. Jetzt: n2 = 15 → p1 (Kallipp), n3 = 57 → o1 (Spiele). Übersetzungen unverändert.
7. **Info-Karte.** Ein Klick auf ein erhaltenes Rad zeigt jetzt die CT-Messung (Spitzenradius, Zähne mit Grenzen) und den Vergleich Messung ↔ Modell.

## 3. Was das Supplement bestätigt (keine Änderung nötig)

- Alle Zahnradzüge der Rückseite und des Mondes: Metonisch 5/19, Kallipp 1/76, Saros 4·235/(223·19), Exeligmos 1/3 Saros, siderischer Monat 254/19 – identisch mit unseren Zügen.
- **e3 dreht mit der Apsidendrehung** (477/(19·223) U/Jahr ≈ 8,88 Jahre) und trägt k1/k2 – genau so modelliert.
- **Drehrichtungen:** e3 im Uhrzeigersinn von hinten; Metonisch, Saros, Exeligmos und Kallipp im Uhrzeigersinn. Das Supplement sagt „alle Zifferblätter laufen im Uhrzeigersinn“ – das war vor der Entdeckung der Spiele-Anzeige (2008), die als einzige gegenläufig ist. Unser Modell folgt hier Freeth 2008.
- **e5 = 50:** CT-Bestwert ist 52 (Grenzen 50–52), im Text wird mit 50 = k1 gerechnet, weil sonst die Mondanomalie die falsche Periode hätte. So auch bei uns.
- **o1:** 2006 noch dem Kallipp-Zug zugeordnet, seit 2008 Spiele-Anzeige. Bei uns: Spiele (Stand 2008).
- **Datierung der Schrift:** 150–100 v. Chr. plausibel (Kritzas). Steht so im Zeitstrahl.
- **Rücktür-Inschrift:** „die Spirale in 235 Abschnitte geteilt“, „auszulassende Tage“, „die 76 Jahre, 19 Jahre“, „223“ – passt zu Metonischer Spirale, Kallipp und Saros im Modell.
- **r1 (Fragment D):** 63 Zähne, eindeutig nur ein Rad im Fragment. Teilkreis jetzt 16,4 mm wie gemessen (Venus-Paar mit Modul 0,521 mm).

## 4. Gemessene Radien und Modell (nach der Korrektur)

| Rad | Zähne Modell | CT-Bestwert (Grenzen) | Teilkreis gemessen [mm] | Modell [mm] | Abw. [mm] | Modul [mm] |
|---|---|---|---|---|---|---|
| a1 | 48 | 48 (eindeutig) | – (Spitze 13,6) | 13,86 | – | 0,578 |
| b1 | 223 | 223 (223/224) | 64,40 | 64,40 | 0,00 | 0,578 |
| b2 | 64 | 64 (64-66) | 15,30 | 15,42 | 0,12 | 0,482 |
| b3 | 32 | 32 (eindeutig) | 8,75 | 8,95 | 0,20 | 0,559 |
| c1 | 38 | 38 (38/39) | 9,85 | 9,15 | -0,70 | 0,482 |
| c2 | 48 | 47/48 (47-49) | 10,75 | 10,78 | 0,03 | 0,449 |
| d1 | 24 | 24 (eindeutig) | 5,45 | 5,39 | -0,06 | 0,449 |
| d2 | 127 | 127 (eindeutig) | 31,15 | 31,06 | -0,09 | 0,489 |
| e2 | 32 | 32 (eindeutig) | 7,45 | 7,83 | 0,38 | 0,489 |
| e5 | 50 | 52 (50-52) | 12,65 | 12,80 | 0,15 | 0,512 |
| e3 | 223 | 220-225 (217-235) | 51,95 | 51,95 | 0,00 | 0,466 |
| e4 | 188 | 187-191 (180-192) | 49,50 | 49,54 | 0,04 | 0,527 |
| k1 | 50 | 49/50 (48-51) | 12,95 | 12,80 | -0,15 | 0,512 |
| k2 | 50 | 50 (48-52) | 13,55 | 13,35 | -0,20 | 0,534 |
| e6 | 50 | 50 (49/50) | 13,40 | 13,35 | -0,05 | 0,534 |
| e1 | 32 | 32 (eindeutig) | 9,15 | 8,95 | -0,20 | 0,559 |
| f1 | 53 | 53 (53/54) | 14,10 | 13,97 | -0,13 | 0,527 |
| f2 | 30 | 30 (eindeutig) | 7,80 | 7,74 | -0,06 | 0,516 |
| g1 | 54 | 54 (54-56) | 13,90 | 13,93 | 0,03 | 0,516 |
| g2 | 20 | 20 (eindeutig) | 4,50 | 4,46 | -0,04 | 0,446 |
| h1 | 60 | 60-64 (60-64) | 13,35 | 13,37 | 0,02 | 0,446 |
| h2 | 15 | 15 (eindeutig) | 3,40 | 3,24 | -0,16 | 0,431 |
| i1 | 60 | 60 (59-62) | 12,90 | 12,94 | 0,04 | 0,431 |
| l1 | 38 | 38 (eindeutig) | 8,65 | 9,15 | 0,50 | 0,482 |
| l2 | 53 | 53 (eindeutig) | 12,90 | 13,23 | 0,33 | 0,499 |
| m1 | 96 | 96/97 (96-99) | 24,15 | 23,97 | -0,18 | 0,499 |
| m2 | 15 | 15 (eindeutig) | 3,85 | 3,85 | -0,00 | 0,513 |
| o1 | 60 | 60 (57-61) | 12,50 | 12,50 | 0,00 | 0,417 |
| ma1 | 20 | 20 (eindeutig) | – (Spitze 5,3) | – | – | – |
| r1 | 63 | 63 (eindeutig) | 16,40 | 16,40 | 0,00 | 0,521 |

Hinweise: „Teilkreis gemessen“ = Mittelwert der Best-Fit-Kreise durch Zahngrund und Zahnspitzen. c1 weicht mit 0,7 mm am stärksten ab; laut Supplement ist gerade bei c1 die Mitte „fast unmöglich genau zu bestimmen“. Räder ohne Messung (m3, n1–n3, p1, p2, q1, Kosmos-Getriebe) bekommen Modul 0,5 mm bzw. den Modul ihres gemessenen Partners.

## 5. Interessantes am Rand

- Hipparch bevorzugte vermutlich 251 synodische = 269 anomalistische Monate (genauer). Der Mechanismus nutzt 223 = 239 – wohl, weil sich das mit dem Saros-Zug teilen ließ und ein großes Rad mit der Primzahl 251 vermieden wurde.
- Fragment A wiegt 369,1 g; die Bleche sind meist 1–2 mm dick.
- Die Zähnezahl-Bestimmung reagiert empfindlich auf die angenommene Radmitte: 1 mm Versatz kann bei e3 drei Zähne Unterschied auf einem Halbkreis ausmachen.

## 6. Weiter offen

- Achskoordinaten (Richtungen) – im Supplement 2006 nicht als Zahlen enthalten. Nächster Schritt: Supplement 2021 (Vorderseite) und 2008 (Spiele, Saros) prüfen.
