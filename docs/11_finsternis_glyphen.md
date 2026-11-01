# 11 · Finsternis-Glyphen der Saros-Spirale

Stand: November 2026. Ausgewertet wurden vier Arbeiten:

| Quelle | Was wir daraus nehmen |
|---|---|
| Freeth 2014, *Eclipse Prediction …*, PLoS ONE 9(7) e103275 (CC BY) | 51 Glyphen; Aufbau der Glyphen (Σ/Η, Tag/Nacht, Stunde, Indexbuchstabe); zwei Rechenmodelle (Eclipse-Year-Modell, Zickzack-Modell für die Stunden) |
| Carman & Evans 2014, *On the epoch …*, AHES 68 | Vollmond von Monat 1 = **12. Mai 205 v. Chr.**, Exeligmos auf 0 (unser Startdatum); **Tabelle 11**: Stunden aller 22 lesbaren Vorhersagen nach Lesungen von A. Jones; Lösung „7β“ |
| Freeth 2019, *Revising the eclipse prediction scheme …*, Palgrave Communications 5 (CC BY) | Verwirft das Schema von Anastasiou et al. 2016; nach den zwei Alphabeten folgen drei Zusatzsymbole; Gruppen der Indexbuchstaben 4-5-4-4-6-5 |
| Iversen & Jones 2019, *The Back Plate Inscription and eclipse scheme …*, AHES 73 | **Tabelle 3**: alle Zellen mit Mond- und Sonnen-Möglichkeit und Indexbuchstabe, belegt oder erschlossen. **Grundlage unserer Daten.** |

## Wie eine Glyphe aufgebaut ist
- **Σ** (ΣΕΛΗΝΗ) = Mondfinsternis-Möglichkeit zur Monatsmitte (Vollmond); **Η** (ΗΛΙΟΣ) = Sonnenfinsternis-Möglichkeit zum Monatsende (Neumond). Die Monate beginnen mit der ersten Mondsichel. Gibt es beides im selben Monat, steht Σ vor Η.
- Η unter Μ = „bei Tag“ (Mondfinsternis nicht sichtbar), Ν unter Υ = „bei Nacht“ (Sonnenfinsternis nicht sichtbar).
- Stunde: Ligatur aus ω und ρ (ὥρα, Stunde) plus Zahlbuchstabe, gezählt ab Sonnenaufgang bzw. -untergang. Zu jeder Stunde kommt die Korrektur der Exeligmos-Anzeige (0, 8 oder 16 h).
- Unten ein **Indexbuchstabe**: zwei Alphabete, das zweite mit Querstrich (Α̅ …), danach Zusatzsymbole. Er verweist auf Textabschnitte rechts neben der Spirale, die Sonnenfinsternisse nach ihrer Lage zum Mondknoten gruppieren (Richtung der Verfinsterung, Farbe, Größe …).

## Umsetzung in der App
- `data/saros_glyphs.json`: 51 Zellen nach Iversen & Jones 2019, Tabelle 3. Für jede Zelle sind festgehalten: Mond und/oder Sonne mit Status (*belegt* = auf den Fragmenten lesbar, *rekonstruiert* = aus dem Schema erschlossen, *unsicher* = in der Literatur offen), Indexbuchstabe (mit Kennzeichen, ob belegt) und, wo lesbar, die Stunde nach Carman & Evans, Tabelle 11.
- Gravur auf der Rückseite: Σ/Η (bei deutscher und englischer Beschriftung M/S) und der Indexbuchstabe in der Zelle, Oberkante zur Mitte. Unsichere Einträge tragen ein „?“.
- Anzeige im Reiter „Anzeigen“ für die aktuelle Saros-Zelle, z. B. *„Monat 13 / 223 · Sonnenfinsternis möglich (Monatsende) – 1. Stunde nach Sonnenaufgang [belegt] · Index Γ“*. Ein \* hinter dem Indexbuchstaben heißt „erschlossen“.
- Tests: 51 Zellen, 38 Mond-Möglichkeiten (213 oder 214 offen), belegte leere Zellen (19, 113, 190 ohne Sonne), Zelle 13 = 1. Stunde, Vollmond 12. Mai 205 v. Chr. liegt in Zelle 1.

## Offene Punkte (aus der Literatur)
- Mond-Möglichkeit in Zelle **213 oder 214** (Muster α oder β): Iversen & Jones lassen das offen.
- Sonnen-Möglichkeit in Zelle **2**, **196** und **207** unsicher.
- Indexbuchstaben ab Zelle 207 unbekannt (bei Freeth 2019: Ψ̅, Ω̅ und Zusatzsymbole).
- Stunden für 119 (Sonne, ι[ ] = 10–12, hier 11) und 120 (Mond) unsicher; für Glyphe 61 (Anastasiou et al. 2014) und die rekonstruierten Glyphen gibt es keine Stunden. Sie ließen sich mit dem Zickzack-Modell (Freeth 2014) oder der arithmetischen Methode von Carman & Evans (Abschnitt 13) nachrechnen.
- Die Texte der Back Plate Inscription (Iversen & Jones 2019) mit Farben, Windrichtungen und Größen sind noch nicht in der App.
