# Antikythera 3D – v1.0

Erste vollständige Fassung der interaktiven 3D-Rekonstruktion des Antikythera-Mechanismus.
Live: https://silverapplications.com/apps/antikythera/

## Neu seit v0.7

### Aufbau nach Freeth et al. 2021
- **Hauptplatte** hinter b1 mit 4 genieteten Haltern und 5 Abstandsstreifen; alle Räder hinter b1 sitzen jetzt dahinter.
- **Mitdrehende Tragstruktur auf b1:** 4 kurze Säulen (20,4 mm) mit Strap (11° zu den Speichen) und 4 lange Säulen (32,0 mm) mit Kreisplatte.
- **Lagen in kosmologischer Reihenfolge:** 9 Lagen zwischen b1 und Strap, 5 zwischen Strap und Kreisplatte, eine Lage davor (Festrad 56, 52, 56, 64).
- **D-Platte**, Steg der mittleren Sonne, Halter auf Speiche C, **Scheiben mit Stift** und **Schlitz-Folger** für Merkur und Venus.
- **Stift-Schlitz-Paare** für Mars, Jupiter und Saturn, exzentrisch auf der Kreisplatte.
- **Unterplatte** mit Festrad 56 und Lager für das Rohrbündel, **Festrohr** durch b1, **10 koaxiale Ausgangsrohre**.

### Anzeigen
- **Ringe mit gebogenen Armen** nach Albert Rehm (1905/06), wie von Freeth 2021 übernommen: Jeder Ring hängt an seinem Rohr, die Arme laufen in getrennten Ebenen.
- **Mondzeiger** bis zur Tierkreisskala.
- **Mondphasen-Getriebe:** b0 (20 Zähne) an der mittleren Sonne treibt das Kronrad ma1 (20 Zähne) und darüber die Phasenkugel (Freeth 2021, S6.2.4).
- **Spiralzeiger als Schiebezeiger:** Ein Stift läuft in der Spiralnut, die Stange gleitet durch die Nabe.
- **Parapegma-Platten** oberhalb und unterhalb des Zifferblatts. Der Text ist nur angedeutet.
- **Einstellmarke** bei Waage 17,7° und **Daumenriegel** an der Zifferblatt-Platte.

### Gehäuse und Deckel
- **Vorderdeckel**, abnehmbar, 128,8 mm, Inschrift außen mit den Zahlen 462 und 442.
- **Rückdeckel** mit Inschrift innen und Schieberiegel. Beide Deckel sind beim Start ausgeblendet (Baugruppe AM-140).
- Gehäuse ca. 10 cm tief, passend zu den Maßen bei Freeth 2008.

### Zahnräder
- **Gleichseitige Dreieckszähne** (Zahnhöhe 2,72 × Modul), **Vierkant-Naben**.
- **Speichen nur bei b1:** 4 Speichen, schwalbenschwanzförmig, mit Mittelscheibe und Nieten.
- **Aufsteckbare Kurbel** mit Vierkant in a1.

### Darstellung
- **Technische Farben:** Räder, die ineinandergreifen, haben dieselbe Farbe; Räder auf einer Welle haben verschiedene Farben; Platten werden durchsichtig.
- Platten mit eigener, dunkel gehämmerter Patina, Zahnräder blanker. Dadurch ist der Kontrast besser.
- **Behoben:** Flackern der Parapegma-Platten auf Mobilgeräten.

### Qualität
- Neue **Kollisionsprüfung** (`test/structure.test.mjs`) für alle Lagen, Säulen, Platten, Folger und Stifte; insgesamt 21 Tests.
- Doku: `docs/12_systemarchitektur_befunde.md` mit dem Abgleich aller Befunde zum Modell.
- Neue Quelle: Freeth & Jones 2012 (ISAW Papers 4).

## Bekannte Grenzen
- Die Richtungen der Wellen hinter b1 und die Lage der Räder auf der Kreisplatte sind schematisch.
- Die Planetenstellung wird mit dem gleichwertigen Epizykel-Modell berechnet; die 3D-Folger sind damit noch nicht exakt abgeglichen.
- Inschriften (Parapegma, Deckel) sind nur angedeutet, nicht wiedergegeben.

---

## English summary

First complete version. New since v0.7:
- Main plate with retainers and spacer strips.
- Rotating Strap and circular plate on pillars, with 9 + 5 gear layers in the cosmological order (Freeth 2021).
- Nested output tubes; Rehm-style rings connected by curved arms.
- Lunar phase differential (b0 + contrate gear).
- Sliding spiral pointers; parapegma plates; front and back covers (hidden by default).
- Equilateral triangular teeth with square hubs; only b1 has spokes.
- New "technical colours" mode and a collision test suite.

Hobby project built with AI assistance (Claude, Anthropic). Not for academic citation.
