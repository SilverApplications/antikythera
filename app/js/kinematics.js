// Kinematik des Mechanismus: Datum (JD) -> Stellung aller Anzeigen und Zahnräder.
// Alle Geschwindigkeiten stammen aus den Zähnezahlen in data/gears.json (exakte Brüche),
// nicht aus moderner Astronomie. Nur die Anfangsstellung (Epoche) wird einmal an
// mittleren Bahnelementen kalibriert - so wie ein antiker Benutzer das Gerät eingestellt hätte.
import { GEARS } from './generated/data.js';
import { julianDay, meanElements, TROPICAL_YEAR, norm360, egyptianDate } from './astro.js';

const Z = Object.fromEntries(GEARS.gears.map((g) => [g.id, g.teeth]));
const R = (a, b) => Z[a] / Z[b];
const TAU = Math.PI * 2, D2R = Math.PI / 180, R2D = 180 / Math.PI;

// --- Übersetzungen (Umdrehungen pro Jahr), direkt aus den Zähnen -----------------
export const RATES = {
  moonSidereal: R('b2', 'c1') * R('c2', 'd1') * R('d2', 'e2'),       // 254/19
  apsides: R('b2', 'l1') * R('l2', 'm1') * R('m3', 'e3'),              // 477/4237
  metonic: R('b2', 'l1') * R('l2', 'm1') * R('m2', 'n1'),              // 5/19
};
RATES.anomaly = RATES.moonSidereal - RATES.apsides;
RATES.olympiad = RATES.metonic * R('n2', 'o1');                         // 1/4
RATES.callippic = RATES.metonic * R('n3', 'p1') * R('p2', 'q1');        // 1/76
RATES.saros = RATES.apsides * R('e4', 'f1') * R('f2', 'g1');            // 940/4237
RATES.exeligmos = RATES.saros * R('g2', 'h1') * R('h2', 'i1');          // 235/12711
RATES.synodic = RATES.moonSidereal - 1;                                 // 235/19
RATES.nodes = 1 - R('Dr-49', 'Dr-62') * R('Dr-64', 'Dr-48');            // -5/93
// Synodische Raten der Planeten (Epizykel relativ zur mittleren Sonne)
RATES.syn = {
  mercury: R('V-51', 'Me-72') * R('Me-89', 'Me-20'),   // 1513/480
  venus: R('V-51', 'V-44') * R('V-34', 'r1'),          // 289/462
  mars: R('CP-56', 'MJ-64') * R('Ma-38', 'Ma-71'),     // 133/284
  jupiter: R('CP-56', 'MJ-64') * R('Ju-45', 'Ju-43'),  // 315/344
  saturn: R('CP-56', 'S-52') * R('Sa-61', 'Sa-68'),    // 427/442
};

// --- Parameter, die nicht aus Zähnezahlen folgen (Evidenz E3/E4) ----------------
export const PARAMS = {
  pinRadius: 9.6, pinOffset: 1.1,                 // mm, Stift-Schlitz Mond (Freeth 2006, Näherung)
  sunEcc: 1 / 24, sunApogee: 65.5,                // Hipparch: Exzentrizität und Apogäum
  // Epizykel/Deferent-Verhältnis: hier moderne große Halbachsen (Freeth 2021 nutzt antike Werte)
  a: { mercury: 0.387, venus: 0.723, mars: 1.524, jupiter: 5.203, saturn: 9.537 },
  inferior: { mercury: true, venus: true, mars: false, jupiter: false, saturn: false },
};

// --- Epochen -------------------------------------------------------------------
// Saros-Monat 1: Neumond ca. 28. April 205 v. Chr. (Freeth 2014; Carman & Evans 2014: Vollmond 12. Mai)
// Kalenderstart (Metonisch, Spiele, Kallipp): kurz nach Neumond 23. August 205 v. Chr. (Iversen 2017)
export const EPOCH = {
  saros: julianDay(-204, 4, 28),
  calendar: julianDay(-204, 8, 24),
};
export const START_JD = EPOCH.saros;

// Kalibrierung der Anfangsstellung an mittleren Elementen zur Saros-Epoche
const E0 = meanElements(EPOCH.saros);

export const GAMES = [
  ['Isthmia', 'Olympia'], ['Nemea', 'Naa'], ['Isthmia', 'Pythia'], ['Nemea', 'Halieia'],
];
export const EXELIGMOS = ['0 h', '+8 h', '+16 h'];
export const CORINTHIAN_MONTHS = ['Phoinikaios', 'Kraneios', 'Lanotropios', 'Machaneus', 'Dodekateus', 'Eukleios',
  'Artemisios', 'Psydreus', 'Gameilios', 'Agrianios', 'Panamos', 'Apellaios'];

const frac = (x) => x - Math.floor(x);

// Stift-Schlitz: Ausgangswinkel aus Eingangswinkel (rad), Versatz in Richtung 0°
export function pinSlot(phi, r = PARAMS.pinRadius, d = PARAMS.pinOffset) {
  return Math.atan2(r * Math.sin(phi), r * Math.cos(phi) - d);
}
export const pinSlotDeg = (deg) => {
  const p = deg * D2R; let o = pinSlot(p) * R2D;
  return deg + norm360(o - deg + 180) - 180;
};

function geocentric(planet, sunMean, years) {
  const a = PARAMS.a[planet];
  const s = RATES.syn[planet];
  const rate = PARAMS.inferior[planet] ? 1 + s : 1 - s;
  const L = E0.helio[planet] + 360 * rate * years;
  const ls = sunMean * D2R, lp = L * D2R;
  // Erde -> Sonne (mittlere Sonne) + Sonne -> Planet
  const x = Math.cos(ls) + a * Math.cos(lp), y = Math.sin(ls) + a * Math.sin(lp);
  return norm360(Math.atan2(y, x) * R2D);
}

/** Vollständiger Zustand für ein julianisches Datum. */
export function stateAt(jd) {
  const years = (jd - EPOCH.saros) / TROPICAL_YEAR;
  const yc = (jd - EPOCH.calendar) / TROPICAL_YEAR;

  // Sonne
  const sunMean = norm360(E0.sunL + 360 * years);
  const A = PARAMS.sunApogee * D2R, ls = sunMean * D2R, e = PARAMS.sunEcc;
  const sunTrue = norm360(Math.atan2(e * Math.sin(A) + Math.sin(ls), e * Math.cos(A) + Math.cos(ls)) * R2D);

  // Mond: mittlere Länge + Stift-Schlitz-Korrektur auf die Anomalie
  const moonMean = norm360(E0.moonL + 360 * RATES.moonSidereal * years);
  const anomaly = norm360(E0.moonM + 360 * RATES.anomaly * years);
  const moonTrue = norm360(moonMean + (pinSlotDeg(anomaly) - anomaly));
  const elong = norm360(moonTrue - sunTrue);
  const illum = (1 - Math.cos(elong * D2R)) / 2;

  const node = norm360(E0.node + 360 * RATES.nodes * years);

  const planets = {};
  for (const p of Object.keys(RATES.syn)) planets[p] = geocentric(p, sunMean, years);

  // Rückseite
  const metFrac = frac(yc / 19);
  const metCell = Math.floor(metFrac * 235);
  const metYear = Math.floor(metFrac * 19);
  const gamesYear = Math.floor(frac(yc / 4) * 4);
  const callFrac = frac(yc / 76);
  const sarosFrac = frac(years * RATES.saros / 4); // eine Saros-Periode = 4 Windungen
  const sarosCell = Math.floor(sarosFrac * 223);
  const exeFrac = frac(years * RATES.exeligmos);
  const eg = egyptianDate(jd);

  return {
    jd, years,
    sunMean, sunTrue, moonMean, moonTrue, anomaly, elong, illum, node, planets,
    // Monatsnamen pro Zelle (inkl. Schaltmonate) folgen in v0.3 aus Freeth 2008 / Iversen 2017
    metonic: { frac: metFrac, cell: metCell, year: metYear, turns: metFrac * 5 },
    games: { year: gamesYear, names: GAMES[gamesYear], frac: frac(yc / 4) },
    callippic: { frac: callFrac, sector: Math.floor(callFrac * 4) },
    saros: { frac: sarosFrac, cell: sarosCell, turns: sarosFrac * 4 },
    exeligmos: { frac: exeFrac, sector: Math.floor(exeFrac * 3), label: EXELIGMOS[Math.floor(exeFrac * 3)] },
    egyptian: eg,
    crankTurns: years * Z.b1 / Z.a1,
  };
}

/** Winkel (rad) jeder Welle im festen Gestell für die 3D-Ansicht. Positiv = gegen den Uhrzeigersinn von vorn. */
export function gearAngles(state) {
  const t = state.years;
  const ang = {};
  const b = -TAU * t; // b1 dreht im Uhrzeigersinn (von vorn)
  ang.b = b;
  ang.a = TAU * t * Z.b1 / Z.a1;
  ang.c = -b * R('b2', 'c1');
  ang.d = -ang.c * R('c2', 'd1');
  ang.e5 = -ang.d * R('d2', 'e2');            // e2+e5
  ang.l = -b * R('b2', 'l1');
  ang.m = -ang.l * R('l2', 'm1');
  ang.n = -ang.m * R('m2', 'n1');
  ang.o = -ang.n * R('n2', 'o1');
  ang.p = -ang.n * R('n3', 'p1');
  ang.q = -ang.p * R('p2', 'q1');
  ang.e3 = -ang.m * R('m3', 'e3');            // e3+e4 (Träger)
  ang.f = -ang.e3 * R('e4', 'f1');
  ang.g = -ang.f * R('f2', 'g1');
  ang.h = -ang.g * R('g2', 'h1');
  ang.i = -ang.h * R('h2', 'i1');
  // Epizykel k1/k2 relativ zum Träger e3
  const relE5 = ang.e5 - ang.e3;
  const k1rel = -relE5 * R('e5', 'k1');
  const k2rel = pinSlot(k1rel);
  ang.k1rel = k1rel; ang.k2rel = k2rel;
  ang.k1 = ang.e3 + k1rel; ang.k2 = ang.e3 + k2rel;
  ang.e6 = ang.e3 - k2rel * R('k2', 'e6');     // e6+e1
  ang.b3 = -ang.e6 * R('e1', 'b3');
  return ang;
}
