// Achslagen und Ebenen.
// Radien: aus den CT-Messungen von Freeth et al. 2006 (Supplementary Notes 3). Für jedes
// Eingriffspaar wird ein gemeinsamer Modul so gewählt, dass die Teilkreise am besten zu den
// gemessenen Radien passen (Mitte zwischen Fuß- und Kopfkreis). Damit stimmen Größe und
// Achsabstand mit dem Original überein, und die Zähne greifen trotzdem sauber ineinander.
// Räder ohne Messung (verlorene Räder, Kosmos-Getriebe) erhalten Modul 0,5 mm.
// Die RICHTUNGEN zwischen den Achsen sind weiterhin schematisch: Koordinaten der Achsen
// sind in den Supplements nicht als Zahlen veröffentlicht.
import { GEARS } from './generated/data.js';

export const MODULE = 0.5;
const Z = Object.fromEntries(GEARS.gears.map((g) => [g.id, g.teeth]));
const MEAS = Object.fromEntries(GEARS.gears.filter((g) => g.measured?.rIn != null)
  .map((g) => [g.id, (g.measured.rIn + g.measured.rOut) / 2]));
const MESH_GROUPS = [
  ['a1', 'b1'], ['b2', 'c1', 'l1'], ['c2', 'd1'], ['d2', 'e2'], ['e5', 'k1'], ['k2', 'e6'], ['e1', 'b3'],
  ['l2', 'm1'], ['m2', 'n1'], ['m3', 'e3'], ['e4', 'f1'], ['f2', 'g1'], ['g2', 'h1'], ['h2', 'i1'],
  ['n3', 'o1'], ['n2', 'p1'], ['p2', 'q1'],
  ['V-34', 'V-26', 'r1'], // Venus: r1 aus Fragment D ist gemessen
];
const MOD = {};
for (const grp of MESH_GROUPS) {
  let zr = 0, zz = 0;
  for (const id of grp) if (MEAS[id] != null) { zr += Z[id] * MEAS[id]; zz += Z[id] ** 2; }
  for (const id of grp) MOD[id] = zz ? (2 * zr) / zz : MODULE;
}
// Stift-Schlitz: Achse K' von k2 liegt ca. 1,1 mm weiter außen als K (Freeth 2006).
// Der Modul von k2/e6 folgt daraus (ergibt 0,534 mm, gemessen 0,54 ± 0,02 mm).
export const PIN_OFFSET = 1.1;
MOD.k2 = MOD.e6 = ((Z.e5 + Z.k1) * MOD.e5 / 2 + PIN_OFFSET) * 2 / (Z.k2 + Z.e6);
export const moduleOf = (id) => MOD[id] ?? MODULE;
export const MODULE_B1 = moduleOf('b1');
export const pitchR = (id) => (Z[id] ?? 20) * moduleOf(id) / 2;
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
const O = polar(N, d('n3', 'o1'), 20);
const P = polar(N, d('n2', 'p1'), 160);
const Q = polar(P, d('p2', 'q1'), 200);

export const ARBORS = { B, E, N, G, M, L, C, D, F, H, I, O, P, Q };

// Spiralen und Nebenzifferblätter der Rückseite (mm)
export const BACK = {
  metonic: { c: N, r0: 47, r1: 74, turns: 5, cells: 235 },
  saros: { c: G, r0: 46, r1: 70, turns: 4, cells: 223 },
  games: { c: O, r: 9 }, callippic: { c: Q, r: 9 }, exeligmos: { c: I, r: 9 },
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
  // Merkur + Venus am Festrad 51
  fixed('V-51', 2.5);
  const v44 = polar(B, d('V-51', 'V-44'), 45); put('V-44', v44, 2.5); put('V-34', v44, 5);
  const v26 = polar(v44, d('V-34', 'V-26'), 20); put('V-26', v26, 5);
  put('r1', polar(v26, d('V-26', 'r1'), 0), 5);
  const m72 = polar(B, d('V-51', 'Me-72'), 225); put('Me-72', m72, 2.5); put('Me-89', m72, 7.5);
  const m40 = polar(m72, d('Me-89', 'Me-40'), 200); put('Me-40', m40, 7.5);
  put('Me-20', polar(m40, d('Me-40', 'Me-20'), 150), 7.5);
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
  // Drachenzeiger (spekulativ): Festrad 49, Epizykel 62+64, Ausgang 48
  fixed('Dr-49', -2.5 + 0.0001); PLACE['Dr-49'].z = 25;
  const dr = polar(B, d('Dr-49', 'Dr-62'), 160); put('Dr-62', dr, 25); put('Dr-64', dr, 27.5);
  PLACE['Dr-48'] = { frame: 'out', at: B, z: 27.5, planet: 'Dr' };
})();

// Kronrad a1: Achse entlang x, greift seitlich in b1
export const A1 = { x: pitchR('b1') + 1.2, y: 0, z: pitchR('a1') };
