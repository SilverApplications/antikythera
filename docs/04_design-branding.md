# Design nach SILVER-APPLICATIONS-CI

Quelle: bestehendes Brand-Board (Farbwelt, Typografie final). Die Logo-Frage ist noch offen → in der App vorerst Wortmarke in IBM Plex Sans, kein Bildzeichen.

## Tokens
```css
:root {
  --anthrazit-900: #15181B;  /* Hintergrund */
  --anthrazit-700: #1E2328;  /* Panels */
  --graphit-500:   #3A4148;  /* Linien, Rahmen */
  --silber-300:    #9BA3AB;  /* Sekundärtext */
  --silber-100:    #D9DDE1;  /* Text */
  --weiss:         #F4F5F6;  /* Überschriften */
  --petrol-500:    #1D7A6E;  /* Akzent, aktive Elemente */
  --petrol-300:    #3FA893;  /* Hover, Hervorhebung */
  --tanne-700:     #123F39;  /* Akzentflächen */
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```
Verteilung ca. 70 % Anthrazit / 20 % Silber / 10 % Petrol.

## Regeln
- Du-Ansprache, modern, keine Emojis.
- Kein AI-Look: keine Lila-Blau-Verläufe, kein Neon, keine generischen 3D-Formen, keine Stockfotos.
- Buchstabenfolge „SA“ nirgends verwenden (auch nicht als Kürzel in Code-Klassen, die sichtbar werden).
- IBM Plex Mono für Zähnezahlen, Perioden, Sachnummern (AM-312) → wirkt wie technische Zeichnung.

## Zusammenspiel mit dem Objekt
- UI bleibt kühl (Anthrazit/Silber/Petrol), das Objekt bringt die Wärme (Bronze, Patina-Grün). Der Kontrast ist gewollt: „Präzision trifft Phantasie“.
- Evidenz-Farben (nur bei aktivem Toggle): E1 Bronze-Patina natürlich · E2 Silber 300 · E3 Petrol 300 · E4 Petrol 500 + Schraffur + Label „spekulativ“.
- Bemaßungs- und Explosionslinien in Silber 300, dünn, wie technische Zeichnung.

## Layout-Idee (Desktop / Mobil)
- Desktop: 3D-Ansicht zentral (ca. 65 %), rechts Panel mit Tabs: Baugruppen · Anzeigen · Karte · Zeitstrahl · Forschung.
- Mobil: 3D-Ansicht oben (Vollbreite), Bottom-Sheet mit denselben Tabs, Datumsregler als Daumen-Kurbel.
