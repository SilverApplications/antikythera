# 09 · Abgleich mit dem Supplement zu Freeth et al. 2021

**Quelle:** T. Freeth, D. Higgon, A. Dacanalis, L. MacDonald, M. Georgakopoulou, A. Wojcik, *A Model of the Cosmos in the ancient Greek Antikythera Mechanism*, Scientific Reports 11, 5821 (2021), **Supplementary Information 4** (59 Seiten, korrigierte Fassung). Artikel (Open Access): <https://doi.org/10.1038/s41598-021-84310-w>, Zusatzmaterial auf der Artikelseite unter „Supplementary information“.

Stand: November 2026. Gelesen: S1 (physische Evidenz), S2 (Texte und Inschriften), S3 (Planetenperioden), S4 (theoretische Getriebe, **Tabelle S8**, **Tabelle S9**), S5 (Abgleich mit Fragment A und D), S6 (Rekonstruktion des Kosmos).

> Hinweis zur Benennung: Im Code stand früher „Supplement S8“ als Quelle für Achskoordinaten. Tabelle S8 enthält **Radien, Radstärken und Module**, aber **keine Achskoordinaten**.

## 1. Was übernommen wurde

### 1.1 Tabelle S8 – gemessene Zahnräder
CT-Messungen mit VGStudio Max: Außen- und Innenradius, Teilkreis (Mitte dazwischen), Radstärke, Modul (Teilkreisdurchmesser / Zähne). Mittlerer Modul 0,495 mm. Kämmende Räder haben im Original **leicht verschiedene Module** – im Mittel 3,7 %, höchstens 7,6 % (b2/c1).

**Umsetzung:** Alle 28 gemessenen Räder haben jetzt genau den Teilkreis aus S8, der Achsabstand ist die Summe der Teilkreise. Die Radstärken (0,5–2,7 mm) werden ebenfalls übernommen (auf höchstens 2,4 mm begrenzt, damit sich Ebenen nicht durchdringen). Einzige Anpassung: k2 und e6 werden gemeinsam um 0,8 % verkleinert, damit der Stift-Schlitz-Versatz bei 1,1 mm bleibt. Ohne diese Anpassung ergäbe sich 1,3 mm.

Auffällig: In S8 sind bei f1 Außen- und Innenradius vertauscht (12,9/13,6 mm), der Teilkreis 13,2 mm ist plausibel. Freeth 2006 hatte für f1 noch 14,1 mm gemessen.

### 1.2 Speichen von b1 (Supplementary Fig. S12)
Die Speichen heißen nach ihrer Lage im Fragment A (Ansicht von vorn): A = 1 Uhr, B = 4 Uhr, C = 7 Uhr, D = 10 Uhr.

| Speiche | Merkmal | Abstand von der Mitte | Rolle im Modell |
|---|---|---|---|
| A | abgeflachte Stelle 10,5 × 10,3 mm, 1,1 mm tief | 31,6 mm | Welle 72 + 89 (Merkur) |
| A | runde Senkung, Ø ca. 5,3 mm | 41,4 mm | unklar, evtl. Abstandshalter für 89 |
| B | rundes Loch | 27,0 mm | Lager 62 + 64 (Drachenzeiger) |
| C | rundes Loch | 25,6 mm | Lager 44 + 34 (Venus) |
| C | erhöhte Fläche 14,2 × 12,0 mm mit Niet | 46,2 mm | Halter für die lange Welle 44 + 34 |
| D | durchbohrter Block 5,0 × 5,5 × 3,4 mm, Loch Ø 1,4 mm | 31,8 mm | Steg der mittleren Sonne (→ b0) |

**Umsetzung:** b1 ist so gedreht, dass Speiche A auf 1 Uhr liegt. Die Wellen 72 + 89, 62 + 64 und 44 + 34 sitzen genau an diesen Lagerstellen.

### 1.3 Tabelle S9 – Geometrie der Planetengetriebe

| Planet | Abstand von der Sonne (AE) | Achse des letzten Epizykels bzw. Versatz | Stiftabstand |
|---|---|---|---|
| Merkur | 0,39 | 36,0 mm von der Mitte | 14,04 mm |
| Venus | 0,72 | 27,8 mm von der Mitte | 20,01 mm |
| Mars | 1,52 | Versatz Stift- zu Schlitzrad 6,58 mm | 10,00 mm |
| Jupiter | 5,20 | 1,58 mm | 8,22 mm |
| Saturn | 9,58 | 1,50 mm | 14,37 mm |

**Umsetzung:** Venus-Epizykel r1 (63, Fragment D) sitzt 27,8 mm von der Mitte über Speiche D, Merkur-Epizykel 20 sitzt 36,0 mm von der Mitte. Für Merkur liegt er bei −20° statt genau auf Speiche B: Mit Modul 0,5 reicht der Zug 89 ~ 40 ~ 20 sonst nicht ganz hin. Die Planetenabstände in der Kinematik stammen jetzt aus dieser Tabelle (Saturn 9,58 statt 9,537 AE). Der alte Code-Kommentar „Freeth 2021 nutzt antike Werte“ war falsch: Die Tabelle rechnet mit modernen Werten und merkt an, dass antike ebenso möglich wären.

### 1.4 Module der Kosmos-Getriebe
- Festrad 51 (Merkur und Venus): Modul ca. 0,53. 44 ca. 0,54, damit die Welle genau auf das Lager in Speiche C (25,6 mm) trifft.
- 72: Teilkreis ≈ 31,6 − 13,52 mm, also Modul ≈ 0,50.
- Venus 34, 26, 63: Modul 0,521 wie das gemessene r1.
- Drachenzeiger 49 ~ 62 + 64 ~ 48: Module 0,486 und 0,482, damit 62 + 64 im Lager bei 27,0 mm läuft und 48 wieder auf der Mittelachse sitzt.

### 1.5 Ebenen zwischen b1 und Strap
Von b1 nach vorn: mittlere Sonne, Knoten, Merkur, Venus. Zwischen Strap und Kreisplatte: wahre Sonne, Mars, Jupiter, Saturn. Das ist die übliche griechische Reihenfolge der Himmelskörper (CCO).

**Umsetzung:** Der Drachenzeiger lag bisher ganz vorn (z = 25–27,5 mm) und ist jetzt direkt hinter b1 (z = 4,5–6,5 mm). Merkur liegt bei 8,5 mm, Venus bei 10,3 mm. Eine automatische Prüfung findet keine Überschneidungen.

### 1.6 Weitere Einzelheiten
- **b0 = 20 Zähne:** gleiche Zähnezahl wie das Kronrad der Mondphase. Bisher war die Zähnezahl offen.
- Fragment D: D-Platte 25,3 mm breit, 1,0 mm dick; Zahnrad 63 mit Innenradius 15,9, Außenradius 16,9 mm, 1,5 mm dick; Scheibe r = 21,5 mm, 1,0 mm dick. Eindeutig **nur ein** Zahnrad im Fragment.
- Säulen auf b1: 4 lange (32,0 mm, Schulter bei 27,5 mm) und 4 kurze (20,4 mm, Schulter bei 16,2 mm). Strap ca. 1,6 mm dick, Kreisplatte 2,0 mm. Platz b1→Strap ca. 15,0 mm (9 Lagen), Strap→Kreisplatte 9,7 mm (5 Lagen). Der Strap steht 11° schräg zu den Speichen. Im Modell ist das noch nicht als Bauteil dargestellt.
- Summe: 30 erhaltene Räder, 35 im Getriebe hinter b1 einschließlich, 34 im Kosmos → **69 Räder**. Stimmt mit unseren Daten überein.
- Mondkugel ca. 6 mm Durchmesser, halb dunkel und halb hell bzw. halb versilbert. Die Mondphase entsteht über ein Differential aus 2 Rädern (b0 ~ ma1).
- Fragment 3 (Zierleiste 38,3 mm hoch) könnte den vorderen Deckel gerahmt haben, der dann 128,8 mm im Quadrat maß und nur das Zifferblatt bedeckte.
- Kallipp: Das Schaltjahr-System des verschiebbaren Kalenderrings folgt automatisch dem Kallippischen Zyklus (76 × 365 + 19 = 27.759 Tage). Der „verlorene Tag“ entsteht einfach dadurch, dass in einem der vier Metonischen Teilzyklen ein Schalttag fehlt.
- Planetensteine nach einem Papyrus des 2./3. Jh. n. Chr.: Sonne Gold, Mond Silber, Saturn Obsidian, Mars rötlicher Onyx, Venus Lapislazuli mit Goldadern, Merkur Türkis, Jupiter weißlicher (?) Kristall.

## 2. Was bestätigt wurde
- Periodenrelationen: Merkur (1513, 480), Venus (289, 462), Mars (133, 284), Jupiter (315, 344), Saturn (427, 442), Knoten −5/93 – identisch mit unseren Daten.
- Alle Getriebezüge der Kosmos-Getriebe (Venus 51 ~ 44 + 34 ~ 26 ~ 63, Merkur 51 ~ 72 + 89 ~ 40 ~ 20, Festrad 56 auf der Kreisplatte, 52 gemeinsam für wahre Sonne und Saturn, 64 gemeinsam für Mars und Jupiter).
- Ringanzeige der Planeten in der Reihenfolge Mond, Merkur, Venus, Sonne, Mars, Jupiter, Saturn (Rückdeckel-Inschrift).
- Datumszeiger auf einem eigenen äußersten Ring.

## 3. Bewusst nicht übernommen / weiter offen
- **365 Löcher** unter dem Kalenderring (S6.4.2): Inzwischen widerlegt durch Budiselic et al. 2020 und Woan & Bayley 2024 (354/355). Wir bleiben bei 354.
- Lage der Getriebe auf der Kreisplatte (wahre Sonne in Linie mit Speiche D, Mars/Jupiter/Saturn auf den übrigen Speichen): nur als Prinzip beschrieben, ohne Maße. Bei uns bleibt das schematisch.
- Strap, Säulen und Steg der mittleren Sonne sind noch nicht als 3D-Teile modelliert.
- Achskoordinaten hinter b1: nicht in Zahlen veröffentlicht.
