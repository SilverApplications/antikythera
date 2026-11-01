// Achslagen und Ebenen.
// Radien: gemessene Teilkreise aus Freeth et al. 2021, Supplementary Table S8 (CT, VGStudio Max;
// Teilkreis = Mitte zwischen Fuß- und Kopfkreis). Wie im Original haben kämmende Räder leicht
// verschiedene Module (im Mittel 3,7 %); der Achsabstand ist die Summe der Teilkreisradien.
// Räder ohne Messung: Modul des gemessenen Partners, sonst 0,5 mm. Kosmos-Getriebe: Module und
// Lagerstellen nach Freeth 2021 (Speichen von b1, Tabelle S9).
// Die RICHTUNGEN zwischen den Achsen hinter b1 sind schematisch: Achskoordinaten sind in den
// Supplements nicht als Zahlen veröffentlicht.
import { GEARS } from './generated/data.js';

export const MODULE = 0.5;
const Z = Object.fromEntries(GEARS.gears.map((g) => [g.id, g.teeth]));
const GB = Object.fromEntries(GEARS.gears.map((g) => [g.id, g]));
const MOD = {};
for (const g of GEARS.gears) if (g.measured2021?.pitch) MOD[g.id] = (2 * g.measured2021.pitch) / g.teeth;
// verlorene Räder: Modul des kämmenden, gemessenen Partners
const PARTNER = { a1: 'b1', m3: 'e3', n1: 'm2', n3: 'o1' };
for (const [id, p] of Object.entries(PARTNER)) MOD[id] = MOD[p];
// Kosmos (Freeth 2021, Suppl. S4-S6): 51 ~ 0,53; 34/26/63 wie r1 (0,521); Knoten 0,486 / 0,482
Object.assign(MOD, { 'V-51': 0.53, 'V-34': MOD.r1, 'V-26': MOD.r1, 'Dr-49': 27.0 * 2 / 111, 'Dr-62': 27.0 * 2 / 111, 'Dr-64': 27.0 * 2 / 112, 'Dr-48': 27.0 * 2 / 112 });
// Lagerstellen auf den Speichen (Abstand von der Mitte, mm) legen 44 und 72 fest
export const SPOKE = { A: 60, B: -30, C: 240, D: 150 }; // Winkel im System von b1 (1, 4, 7, 10 Uhr von vorn)
export const BEARING = { A: 31.6, B: 27.0, C: 25.6, D: 31.8 };
MOD['V-44'] = (BEARING.C - Z['V-51'] * MOD['V-51'] / 2) * 2 / Z['V-44'];
MOD['Me-72'] = (BEARING.A - Z['V-51'] * MOD['V-51'] / 2) * 2 / Z['Me-72'];
// Stift-Schlitz: Achse K' von k2 liegt ca. 1,1 mm weiter außen als K (Freeth 2006). k2 und e6 werden
// dafür gemeinsam um 0,8 % verkleinert (gemessen 13,5 + 13,4 mm, im Modell 13,39 + 13,31 mm).
export const PIN_OFFSET = 1.1;
{
  const want = (Z.e5 * MOD.e5 + Z.k1 * MOD.k1) / 2 + PIN_OFFSET, have = (Z.k2 * MOD.k2 + Z.e6 * MOD.e6) / 2;
  MOD.k2 *= want / have; MOD.e6 *= want / have;
}
export const moduleOf = (id) => MOD[id] ?? MODULE;
export const MODULE_B1 = moduleOf('b1');
export const pitchR = (id) => (Z[id] ?? 20) * moduleOf(id) / 2;
export const thickOf = (id) => Math.min(2.4, GB[id]?.measured2021?.thick ?? 1.4);
const d = (a, b) => pitchR(a) + pitchR(b);
const deg = Math.PI / 180;

const polar = (P, r, a) => [P[0] + r * Math.cos(a * deg), P[1] + r * Math.sin(a * deg)];
function circ(A, ra, B, rb, side) {
  const dx = B[0] - A[0], dy = B[1] - A[1], D = Math.hypot(dx, dy);
  if (D > ra + rb || D < Math.abs(ra - rb)) throw new Error('Achslage nicht erfüllbar');
  const a = (ra * ra - rb * rb + D * D) / (2 * D), h = Math.sqrt(Math.max(0, ra * ra - a * a));
  const mx = A[0] + a * dx / D, my = A[1] + a * dy / D;
  return [mx - side * h * dy / D, my + side * h * dx / D];
}

// --- Feste Wellen (Gestell) --------------------------------------------------
// B-E folgt aus dem Eingriff e1~b3 (gemessene Radien 9,15 + 8,75 mm).
// N (Metonisch) so, dass m3~e3 und m2~n1 erreichbar sind; G (Saros) 150 mm darunter.
const B = [0, 0], E = [0, -d('e1', 'b3')];
const N = [0, E[1] + 0.97 * (d('e3', 'm3') + d('m2', 'n1'))], G = [0, N[1] - 150];
const M = circ(E, d('e3', 'm3'), N, d('m2', 'n1'), -1);
const L = circ(B, d('b2', 'l1'), M, d('l2', 'm1'), -1);
const C = polar(B, d('b2', 'c1'), 180);
const D = circ(C, d('c2', 'd1'), E, d('d2', 'e2'), 1);
const F = circ(E, d('e4', 'f1'), G, d('f2', 'g1'), 1);
const H = polar(G, d('g2', 'h1'), -60);
const I = polar(H, d('h2', 'i1'), -120);
// Spiele-Anzeige: Achsabstand n-o 24,4 mm (Freeth 2008). Kallipp-Anzeige spiegelbildlich dazu (Freeth 2008, 3.7).
const O = polar(N, d('n3', 'o1'), 20);
const Q = [2 * N[0] - O[0], O[1]];
const P = circ(N, d('n2', 'p1'), Q, d('p2', 'q1'), 1);

export const ARBORS = { B, E, N, G, M, L, C, D, F, H, I, O, P, Q };

// Spiralen und Nebenzifferblätter der Rückseite (mm)
export const BACK = {
  // Metonische Spirale: beginnt innen unten und läuft im Uhrzeigersinn nach außen (Freeth 2008, 3.2)
  metonic: { c: N, r0: 47, r1: 74, turns: 5, cells: 235, start: 180 },
  saros: { c: G, r0: 46, r1: 70, turns: 4, cells: 223, start: 0 },
  // Spiele: Jahr 1 unten rechts, gegen den Uhrzeigersinn, Teilung 8° gekippt (Freeth 2008, 3.5)
  games: { c: O, r: 9, start: 172, dir: -1 },
  // Kallipp: hypothetisch, spiegelbildlich zur Spiele-Anzeige
  callippic: { c: Q, r: 9, start: 180, dir: 1 },
  // Exeligmos: leer bei 3 Uhr, H (8) bei 7 Uhr, IϚ (16) bei 11 Uhr (Freeth 2008, 4.8)
  exeligmos: { c: I, r: 9, start: 30, dir: 1 },
};

export const PLATE = { w: 180, yMin: -168, yMax: 144, zFront: 30, zBack: -33, t: 2 };
export const FRONT = { cosmosHole: 60, zodiac: [62, 72], calendar: [73.5, 84], holesR: 77.1 };

// --- Zahnräder: Welle, z-Ebene ------------------------------------------------
// frame: 'fixed' = Gestell, 'carrier' = dreht mit b1, 'e3' = dreht mit e3, 'out' = Ausgangsgetriebe
export const PLACE = {
  b1: { at: B, z: 0, arbor: 'b' }, b2: { at: B, z: -2.5, arbor: 'b' }, b3: { at: B, z: -5, arbor: 'b3' },
  c1: { at: C, z: -2.5, arbor: 'c' }, c2: { at: C, z: -7.5, arbor: 'c' },
  d1: { at: D, z: -7.5, arbor: 'd' }, d2: { at: D, z: -10, arbor: 'd' },
  e2: { at: E, z: -10, arbor: 'e5' }, e5: { at: E, z: -12.5, arbor: 'e5' },
  e6: { at: E, z: -14.5, arbor: 'e6' }, e1: { at: E, z: -5, arbor: 'e6' },
  e3: { at: E, z: -17, arbor: 'e3' }, e4: { at: E, z: -19.5, arbor: 'e3' },
  k1: { frame: 'e3', at: [d('e5', 'k1'), 0], z: -12.5, arbor: 'k1' },
  k2: { frame: 'e3', at: [d('e5', 'k1') + PIN_OFFSET, 0], z: -14.5, arbor: 'k2' },
  l1: { at: L, z: -2.5, arbor: 'l' }, l2: { at: L, z: -22, arbor: 'l' },
  m1: { at: M, z: -22, arbor: 'm' }, m2: { at: M, z: -24.5, arbor: 'm' }, m3: { at: M, z: -17, arbor: 'm' },
  n1: { at: N, z: -24.5, arbor: 'n' }, n3: { at: N, z: -27, arbor: 'n' }, n2: { at: N, z: -29.5, arbor: 'n' },
  o1: { at: O, z: -27, arbor: 'o' },
  p1: { at: P, z: -29.5, arbor: 'p' }, p2: { at: P, z: -31, arbor: 'p' }, q1: { at: Q, z: -31, arbor: 'q' },
  f1: { at: F, z: -19.5, arbor: 'f' }, f2: { at: F, z: -24.5, arbor: 'f' },
  g1: { at: G, z: -24.5, arbor: 'g' }, g2: { at: G, z: -27, arbor: 'g' },
  h1: { at: H, z: -27, arbor: 'h' }, h2: { at: H, z: -31, arbor: 'h' }, i1: { at: I, z: -31, arbor: 'i' },
};

// Epizyklische Getriebe vor b1 (Koordinaten im mitdrehenden System von b1)
(function carrier() {
  const put = (id, at, z, extra = {}) => { PLACE[id] = { frame: 'carrier', at, z, ...extra }; };
  const fixed = (id, z) => { PLACE[id] = { frame: 'fixedCenter', at: B, z }; };
  // Ebenen zwischen b1 und Strap (Freeth 2021): mittlere Sonne, Knoten, Merkur, Venus
  // Festrad 51 (Merkur + Venus) mit 72 (Speiche A) und 44 (Speiche C)
  fixed('V-51', 2.5);
  const vC = polar(B, BEARING.C, SPOKE.C); put('V-44', vC, 2.5); put('V-34', vC, 10.3);
  const vR = polar(B, 27.8, SPOKE.D);                          // Venus-Epizykel 63 über Speiche D (Tabelle S9)
  put('V-26', circ(vC, d('V-34', 'V-26'), vR, d('V-26', 'r1'), -1), 10.3); put('r1', vR, 10.3);
  const mA = polar(B, BEARING.A, SPOKE.A); put('Me-72', mA, 2.5); put('Me-89', mA, 8.5);
  const mE = polar(B, 36.0, -20);                              // Merkur-Epizykel 20, 36 mm von der Mitte, nahe Speiche B
  put('Me-40', circ(mA, d('Me-89', 'Me-40'), mE, d('Me-40', 'Me-20'), 1), 8.5); put('Me-20', mE, 8.5);
  // Sonne und äußere Planeten am Festrad 56 (Kreisplatte)
  fixed('CP-56', 12);
  const s52 = polar(B, d('CP-56', 'S-52'), 135); put('S-52', s52, 12); put('Sa-61', s52, 19.5);
  put('S-56', polar(s52, d('S-52', 'S-56'), 135), 12);
  const sa40 = polar(s52, d('Sa-61', 'Sa-40'), 90); put('Sa-40', sa40, 19.5);
  put('Sa-68', polar(sa40, d('Sa-40', 'Sa-68'), 60), 19.5);
  const mj = polar(B, d('CP-56', 'MJ-64'), -45); put('MJ-64', mj, 12); put('Ma-38', mj, 14.5); put('Ju-45', mj, 17);
  const ma40 = polar(mj, d('Ma-38', 'Ma-40'), -10); put('Ma-40', ma40, 14.5);
  put('Ma-71', polar(ma40, d('Ma-40', 'Ma-71'), 60), 14.5);
  const ju40 = polar(mj, d('Ju-45', 'Ju-40'), -100); put('Ju-40', ju40, 17);
  put('Ju-43', polar(ju40, d('Ju-40', 'Ju-43'), -150), 17);
  // Ausgangspaare (Schlitz-Folger auf exzentrischer Achse -> Zentralrohr), schematisch
  const outs = [['Ma-80a', 'Ma-80b', 22, 100], ['Ju-65a', 'Ju-65b', 24.5, 220], ['Sa-86a', 'Sa-86b', 27, 340]];
  for (const [a, b, z, ang] of outs) {
    PLACE[b] = { frame: 'out', at: B, z, planet: b.slice(0, 2) };
    PLACE[a] = { frame: 'out', at: polar(B, d(a, b), ang), z, planet: a.slice(0, 2), counter: true };
  }
  // Drachenzeiger (hypothetisch): Festrad 49, 62+64 im Lager auf Speiche B (27,0 mm), Ausgang 48
  fixed('Dr-49', 4.5);
  const dr = polar(B, BEARING.B, SPOKE.B); put('Dr-62', dr, 4.5); put('Dr-64', dr, 6.5);
  PLACE['Dr-48'] = { frame: 'out', at: B, z: 6.5, planet: 'Dr' };
})();

// Kronrad a1: Achse entlang x, greift seitlich in b1
export const A1 = { x: pitchR('b1') + 1.2, y: 0, z: pitchR('a1') };
