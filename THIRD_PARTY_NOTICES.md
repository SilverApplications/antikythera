# Third-party notices

| Component | Use | License | Source |
|---|---|---|---|
| three.js r170 | 3D rendering (`app/vendor/three.module.min.js`, `OrbitControls`, `RoomEnvironment`) | MIT | https://github.com/mrdoob/three.js |
| astronomy-engine | Real-sky comparison and eclipse search (`app/vendor/astronomy.js`) | MIT | https://github.com/cosinekitty/astronomy |
| IBM Plex Sans / Mono | Fonts (`app/fonts/`, Latin1 + Greek subsets) | SIL Open Font License 1.1 | https://github.com/IBM/plex |
| Natural Earth 1:10m | Coastlines and land for the map (`app/js/generated/map-data.js`) | Public domain | https://www.naturalearthdata.com |
| Freeth et al. 2021, "A Model of the Cosmos in the ancient Greek Antikythera Mechanism", Sci. Rep. 11, 5821 | Front gear trains (tooth counts) | CC BY 4.0 | https://doi.org/10.1038/s41598-021-84310-w |
| Freeth et al. 2006 / 2008 (Nature) | Rear gear trains (tooth counts, facts) | facts, cited | see `data/sources.json` |

Full license texts: `app/vendor/LICENSE-three.txt`, `app/vendor/LICENSE-astronomy-engine.txt`, `app/fonts/OFL-IBM-Plex.txt`.

The procedural textures, the intro scene and all 3D geometry are generated in code (no external images or models).
