# Antikythera 3D

**Interactive 3D reconstruction of the Antikythera Mechanism** – rotate it, cut it open, take it apart and turn the crank. A hobby project by [SILVER APPLICATIONS](https://silverapplications.com).

Live: https://silverapplications.com/apps/antikythera/ · Languages: Deutsch · English · Ελληνικά

> **Hobby project, built with AI assistance (Claude, Anthropic).** Carefully researched but without warranty. Please do not cite this app in academic work – use the original publications listed under *Sources*.

---

## Features

- **69 gears** with tooth counts, assemblies (AM-000 … AM-900) and an evidence class for every part:
  `E1` preserved (CT-measured) · `E2` inferred (lost but strictly required) · `E3` reconstructed (Freeth et al. 2021) · `E4` speculative (period-appropriate additions such as the crank, the wooden case or the dragon hand)
- **Working kinematics:** one date drives every wheel and every pointer. All rates come from the tooth counts as exact fractions (e.g. Moon 254/19, Saros 940/4237, Venus 289/462). The pin-and-slot lunar anomaly and the epicyclic planets are modelled.
- **Real-sky comparison** with [astronomy-engine](https://github.com/cosinekitty/astronomy): see how well the device computed around 205 BC and how the error grows over the centuries.
- **Supporting structure after Freeth et al. 2021:** main plate with retainers and spacer strips, pillars on b1 carrying the rotating Strap and circular plate, 9 + 5 gear layers in the cosmological order, nested output tubes, sub-plate, D-plate, slotted followers for Mercury and Venus. Gears with equilateral triangular teeth and square hubs; only b1 has spokes.
- **Covers:** removable front cover (inscription outside) and back cover (inscription inside, sliding catch) – hidden by default, switch them on in the assembly tree (AM-140).
- **Technical colours:** one switch turns the bronze into a schematic view – meshing gears share a colour, gears on one arbor differ, plates become transparent.
- **Tools:** views, disassembly, section plane, assembly tree, colour-by-evidence, crank (1 turn ≈ 78 days), date input.
- **Content:** map (zoom & pan), timeline, research summaries for non-experts, sources.
- **Intro:** re-enacted scene – the wreck in 1900, the sponge diver, the museum in 1902, morphing into the model.
- **Lettering on the device** switchable separately: original Ancient Greek, German or English.

## Run locally

No build step, no dependencies. Any static server works:

```bash
cd app && python3 -m http.server 8765
# open http://localhost:8765  (append #nointro to skip the intro)
```

## Tests

```bash
npm test     # node --test (kinematics vs. tooth counts and real sky, collision check of all layers) + python3 tools/verify_gearing.py
```

## Structure

```
app/            static web app (ES modules, three.js r170, no bundler)
  js/kinematics.js   date -> all angles (exact ratios from data/gears.json)
  js/layout.js       axle positions (distances exact from module × teeth, directions schematic)
  js/build3d.js      procedural gears (triangular teeth), plates, dials, case
  js/intro.js        intro scene
  js/patina.js       procedural bronze patina, olive wood, engraved lettering
  js/i18n.js         DE / EN / EL + device lettering
data/           single source of truth: gears, assemblies, timeline, locations, papers, sources, translations
docs/           research dossier, paper summaries, system architecture, design notes, go-live checklist
tools/          build_data.py, build_map.py (Natural Earth), verify_gearing.py, sync_to_site.sh
test/           automated tests
```

After editing anything in `data/`: `python3 tools/build_data.py`.

## Known limitations

- Gear **sizes, thicknesses and centre distances** follow the CT measurements in Table S8 of the supplement to Freeth et al. 2021; the cosmos gearing sits on the bearings found on the spokes of b1 (Freeth 2021, Suppl. S5/S9). The **directions** between the axles behind b1 are schematic: axle coordinates are not published as numbers. Literature notes: `docs/literatur/`.
- The pin-and-slot devices are modelled as geometry (followers for Mercury and Venus, eccentric gear pairs on the circular plate for Mars, Jupiter and Saturn); the true-Sun follower is not shown. The planets' positions are still computed with the equivalent epicycle model.
- Layer order and pillar heights follow Freeth 2021; the positions of the gears on the circular plate, the assignment planet → spoke, the sub-plate shape, the thumb catches and the cover supports are schematic. Inscriptions on the parapegma plates and covers are only suggested, not reproduced.
- Month names per cell of the Metonic spiral (Freeth 2008) and the 51 eclipse glyphs of the Saros spiral (Iversen & Jones 2019; hours after Carman & Evans 2014) are engraved and shown in the readout; glyph hours exist only for the 22 legible predictions.

## Sources (selection)

- Freeth et al. (2006), *Nature* 444, 587–591 · Freeth et al. (2008), *Nature* 454, 614–617
- Freeth et al. (2021), *Scientific Reports* 11, 5821 – https://doi.org/10.1038/s41598-021-84310-w
- Carman & Evans (2014), *Archive for History of Exact Sciences* 68, 693–774
- Iversen (2017), *Hesperia* 86, 129–203 · Jones (2017), *A Portable Cosmos*
- Woan & Bayley (2024), *Horological Journal*, July 2024 · Freeth & Jones (2012), *ISAW Papers* 4
- Full list: [`data/sources.json`](data/sources.json)

Further reading: [Wikipedia](https://en.wikipedia.org/wiki/Antikythera_mechanism) · [DPMA – Der Mechanismus von Antikythera](https://www.dpma.de/dpma/veroeffentlichungen/meilensteine/computer-pioniere/antikytera-mechanismus/index.html)

**Thanks** to Richard Hemmer and Daniel Meßner, whose book *Mehr Geschichten aus der Geschichte* (Piper, 2026) inspired this project – see also their [GAG Atlas](https://atlas.geschichte.fm/map).

## License

Code: MIT. Texts and data in `docs/` and `data/`: CC BY 4.0. Third-party components: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Deutsch (Kurzfassung)

Interaktive 3D-Rekonstruktion des Antikythera-Mechanismus nach aktuellem Forschungsstand: drehen, schneiden, zerlegen, kurbeln. 69 Zahnräder mit Evidenzklasse, echte Übersetzungen, Vergleich mit dem echten Himmel, Karte, Zeitstrahl und verständliche Forschungszusammenfassungen. **Hobbyprojekt, mit KI-Unterstützung erstellt – nicht als Quelle für wissenschaftliche Arbeiten verwenden.** Details zur Recherche: [`docs/01_forschungsdossier.md`](docs/01_forschungsdossier.md).
