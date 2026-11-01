# Projektwissen: Literatur

Hier liegt das Wissen aus den Originalquellen, die für das Modell ausgewertet wurden: Steckbrief, Bezugsquelle und wo die Daten im Projekt stecken.

**Die PDFs selbst liegen nicht im Repository.** Das Repo ist öffentlich, und die Supplements sind urheberrechtlich geschützt: 2006 und 2008 mit allen Rechten vorbehalten, 2021 enthält Abbildungen Dritter mit Einzelgenehmigung. Alle drei sind frei abrufbar, siehe Links.

| # | Quelle | Umfang | Frei abrufbar | Ausgewertet in | Daten im Projekt |
|---|---|---|---|---|---|
| 1 | Freeth et al. 2006, *Decoding the ancient Greek astronomical calculator known as the Antikythera Mechanism*, Nature 444, 587–591 – **Supplementary Information** | 27 S. | Artikelseite <https://doi.org/10.1038/nature05357> → „Supplementary information“ | [docs/08](../08_abgleich_freeth2006_supplement.md) | `data/gears.json` → `measured` (Zähne-Bestwert und Grenzen, Spitzenradius) |
| 2 | Freeth, Jones, Steele, Bitsakis 2008, *Calendars with Olympiad display and eclipse prediction on the Antikythera Mechanism*, Nature 454, 614–617 – **Supplementary Notes** | 45 S. | <https://doi.org/10.1038/nature07130> oder NYU-Archiv <http://hdl.handle.net/2451/60882> | [docs/10](../10_abgleich_freeth2008_supplement.md) | `app/js/kinematics.js` → `METONIC_CELLS`, `INTERCALARY_YEARS`; `app/js/layout.js` → `BACK` |
| 3 | Freeth, Higgon, Dacanalis, MacDonald, Georgakopoulou, Wojcik 2021, *A Model of the Cosmos in the ancient Greek Antikythera Mechanism*, Scientific Reports 11, 5821 – **Supplementary Information 4** | 59 S. | Open Access: <https://doi.org/10.1038/s41598-021-84310-w> → „Supplementary information“ | [docs/09](../09_abgleich_freeth2021_supplement.md) | `data/gears.json` → `measured2021` (Tabelle S8); `app/js/layout.js` → `SPOKE`, `BEARING`, Kosmos-Getriebe; `app/js/kinematics.js` → `PARAMS.a` (Tabelle S9) |

## Kurzinhalt

**2006 – Rückseite entschlüsselt.** Fragmente: Flächen und Gewichte (A: 369,1 g). Glyphen und Inschriften mit vorläufiger Übersetzung; die Schrift datiert auf ca. 150–100 v. Chr. Zahnräder: Zähnezahlen im Vergleich zu Price, Karakalos und Wright mit gemessenen Radien. Methode der Zahnzählung. Herleitung aller Übersetzungen aus Metonischem und Saros-Zyklus. Beweis, dass Stift-Schlitz auf e3 Hipparchs Mondtheorie entspricht.

**2008 – Kalender, Spiele, Finsternisse.** Metonische Spirale mit korinthischen Monatsnamen, Schaltjahren und ausgelassenen Tagen. Herkunft des Kalenders (Epirus, Korinth, Syrakus). Olympiaden-Anzeige (Spiele inkl. Naa, gegenläufig, 8° gekippt) mit Rad n3 (57). Kallipp-Anzeige spiegelbildlich. Saros-Glyphen, Abgleich mit realen Finsternissen und Modell zur Erzeugung der Glyphen. 4 Saros-Windungen = 16 Vollmondzyklen. Exeligmos 0/8/16 h.

**2021 – Kosmos auf der Vorderseite.** Rekonstruktionsprinzipien. Inschriften auf Vorder- und Rückdeckel (Ringe, „kleine Kugeln“, CCO-Reihenfolge, Zahlen 462/442). Herleitung der Planetenperioden (Parmenides-Verfahren). Theoretische Getriebe mit Beweisen. **Tabelle S8:** gemessene Räder. **Tabelle S9:** Planetengeometrie. Merkmale auf den Speichen von b1, Fragment D, Säulen, Strap und Kreisplatte. Mondphase, mittlere Sonne, Knoten, Datumszeiger. 69 Räder insgesamt.

## Nachgelagerte Arbeiten, die einzelne Punkte überholen
- Budiselic et al. 2020; Woan & Bayley 2024: **354 statt 365** Löcher unter dem Kalenderring.
- Freeth 2014; Carman & Evans 2014: überarbeitete Saros-Glyphen, Startdatum 205 v. Chr.
- Iversen 2017: Kalender eher Epirus, Spiele-Jahr 4 „Halieia“ (Rhodos).
