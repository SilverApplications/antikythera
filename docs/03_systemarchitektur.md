# Systemarchitektur

Zwei Ebenen: (A) das **Produkt** Antikythera-Mechanismus, gegliedert wie eine heutige Baugruppenstruktur, und (B) die **Web-App**, die es darstellt.

## A. Produktstruktur (Baugruppen nach heutigem Maßstab)

Gliederung nach Funktion (funktionale Baugruppen) mit Sachnummern. Jede Position trägt eine Evidenzklasse (E1–E4, siehe Dossier).

```
AM-000  Antikythera-Mechanismus (Gesamtsystem)
├─ AM-100  Gehäuse & Tragstruktur
│   ├─ AM-110  Holzkasten mit Rahmen                       E4 (Form) / E1 (Holzreste belegt)
│   ├─ AM-120  Frontplatte (Bronze)                         E1 Reste
│   ├─ AM-130  Rückplatte (Bronze)                          E1 Reste
│   ├─ AM-140  Front- und Rückdeckel mit Inschriften (FCI/BCI) E1 Reste
│   ├─ AM-150  Mittelplatte, Säulen, Lagerbrücken, Kreisplatte (CP), Strap  E1/E3
│   └─ AM-160  Verbindungselemente (Stifte, Keile, Splinte)  E1/E4
├─ AM-200  Antrieb
│   ├─ AM-210  Handkurbel + Welle                           E4
│   ├─ AM-220  Kronrad a1 (48)                              E1
│   └─ AM-230  Hauptantriebsrad b1 (224) + b2 (64)          E1
├─ AM-300  Kosmos-Getriebe (Front, auf b1)
│   ├─ AM-310  Innere Planeten (Festrad 51)
│   │   ├─ AM-311  Merkur 72+89 ~ 40 ~ 20 ⊕                E3
│   │   └─ AM-312  Venus 44+34 ~ 26 ~ 63 ⊕ (63 aus Frgm. D) E3/E1
│   ├─ AM-320  Äußere Planeten + Sonne (Festrad 56 auf CP)
│   │   ├─ AM-321  Wahre Sonne 52 ~ 56 ⊕                   E3
│   │   ├─ AM-322  Mars 64+38 ~ 40 ~ 71 ⊕ 80~80             E3
│   │   ├─ AM-323  Jupiter (64)+45 ~ 40 ~ 43 ⊕ 65~65        E3
│   │   └─ AM-324  Saturn (52)+61 ~ 40 ~ 68 ⊕ 86~86         E3
│   ├─ AM-330  Mondknoten / Drachenzeiger 49~62+64~48       E4
│   └─ AM-340  Ausgangsrohre (9 koaxiale Hohlwellen)        E3
├─ AM-400  Mondgetriebe
│   ├─ AM-410  Siderischer Zug b2~c1+c2~d1+d2~e2            E1
│   ├─ AM-420  Anomalie: e5~k1 ⊕ k2~e6 auf Träger e3        E1
│   ├─ AM-430  Rückführung e1~b3 → Mondzeiger               E1
│   └─ AM-440  Mondphase: Kronrad ma1 + Kugel, mittl. Sonne b0  E1/E3
├─ AM-500  Kalendergetriebe (Rückseite oben)
│   ├─ AM-510  Metonisch b2~l1+l2~m1+m2~n1                  E1/E2
│   ├─ AM-520  Spiele n2~o1                                 E2/E1
│   └─ AM-530  Kallipp n3~p1+p2~q1                          E2
├─ AM-600  Finsternisgetriebe (Rückseite unten)
│   ├─ AM-610  Saros m3~e3+e4~f1+f2~g1                      E2/E1
│   └─ AM-620  Exeligmos g2~h1+h2~i1                        E1
├─ AM-700  Frontanzeige
│   ├─ AM-710  Zodiak-Skala                                 E1
│   ├─ AM-720  Kalenderring (354 Löcher) + Stellstift       E1
│   ├─ AM-730  Planetenringe + Marker (Edelsteine)          E3/E4
│   ├─ AM-740  Mondzeiger + Phasenkugel                     E1/E3
│   └─ AM-750  Datumszeiger                                 E3
├─ AM-800  Rückanzeige
│   ├─ AM-810  Metonische Spirale (5 Windungen, 235 Zellen) E1
│   ├─ AM-820  Saros-Spirale (4 Windungen, 223 Zellen)      E1
│   ├─ AM-830  Nebenzifferblätter Spiele/Kallipp/Exeligmos  E1/E2
│   └─ AM-840  Spiralzeiger mit Läufer                      E3
└─ AM-900  Dokumentation am Gerät („Bedienungsanleitung“)
    ├─ AM-910  Parapegma
    ├─ AM-920  Frontdeckel-Inschrift (Planetenperioden 462, 442)
    └─ AM-930  Rückdeckel-Inschrift (Beschreibung Kosmos)
```

Die Struktur liegt maschinenlesbar in `data/assemblies.json` (zu erstellen) bzw. über das Feld `assembly` in `data/gears.json`.

### Regeln für spekulative Teile (E4)
- Gestaltung epochengerecht: Bronze, handgefeilte Dreieckszähne, keine modernen Formen (keine Evolventen, keine Kugellager, keine Schrauben).
- Standardansicht realistisch (alles Bronze). Umschalter **„Evidenz zeigen“** färbt nach Klasse und blendet ein Label „spekulativ“ ein.
- Kennzeichnung nie nur über Farbe: zusätzlich Schraffur/Muster und Text (Barrierefreiheit).

## B. Web-App-Architektur (Vorschlag – Entscheidung offen)

```
src/
├─ data/            → JSON aus /data (Single Source of Truth)
├─ kinematics/      → Kinematik-Engine: Zeit (Tage seit Epoche) → Winkel aller Räder
│                     exakte Brüche aus Zähnezahlen, Stift-Schlitz analytisch
├─ geometry/        → prozedurale Zahnräder (Dreieckszahn, Speichen), Platten, Spiralen
├─ scene/           → Three.js: Kamera, Orbit, Licht, Materialien (Bronze/Patina)
│   ├─ explode.ts   → Explosionsansicht entlang Achsen
│   ├─ section.ts   → Schnittebenen (Clipping Planes)
│   └─ visibility.ts→ Baugruppen ein/aus
├─ ui/              → Baugruppenbaum, Zeitsteuerung (Kurbel/Datum), Evidenz-Toggle
├─ content/         → Karte, Zeitstrahl, Paper-Karten
└─ i18n/            → DE / EN
```

**Kernidee:** Ein einziger Zustand „Datum“ treibt alles. Kurbel drehen = Datum ändern. Dadurch sind Anzeigen immer konsistent und gegen echte Astronomie prüfbar.

**Technik-Kandidaten:**
- 3D: Three.js (WebGL, läuft überall) – Alternative WebGPU (schneller, aber noch nicht auf allen Geräten).
- Build: Vite + TypeScript, statische Auslieferung.
- Karte: Leaflet + freie Kacheln (z. B. OpenStreetMap / historische Kartenstile), Datenschutz beachten.
- Deployment: Unterpfad `silverapplications.com/apps/antikythera/` (passt zum bestehenden Muster `/apps/<app>/`).

**Performance-Budget (Mobil):** 69 Räder × ~100–220 Zähne → Instancing bzw. zusammengeführte Geometrien; Ziel < 150k Dreiecke, 60 fps auf Mittelklasse-Smartphone.
