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
export const thickOf = (id) => (id === 'b1' ? GB.b1?.measured2021?.thick ?? 2.7 : Math.min(2.4, GB[id]?.measured2021?.thick ?? 1.4));
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

// --- Hauptplatte (Freeth 2021, S5.5.2) ---------------------------------------------
// b1 (2,7 mm) gleitet auf 5 Abstandsstreifen (0,6 mm) vor der Hauptplatte (1,5 mm); 4 genietete
// Halter drücken den Kranz nieder. Alle Räder hinter b1 liegen deshalb um ZB weiter hinten als in v0.7.
const B1_T = GB.b1?.measured2021?.thick ?? 2.7;
export const B1F = B1_T / 2;                              // Vorderfläche von b1
export const MAIN = { zf: -B1F - 0.6, t: 1.5 };           // zf = Vorderfläche der Hauptplatte
const ZB = -2.4;

export const PLATE = { w: 180, yMin: -168, yMax: 144, zFront: 35, zBack: -35, t: 2 };
export const FRONT = { cosmosHole: 60, zodiac: [62, 72], calendar: [73.5, 84], holesR: 77.1 };

// --- Zahnräder hinter b1: Welle, z-Ebene (v0.7-Werte, unten um ZB verschoben) ------------
// frame: 'fixed' = Gestell, 'carrier' = dreht mit b1, 'e3' = dreht mit e3, 'out' = Ausgang auf der Mittelachse
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
for (const [id, p] of Object.entries(PLACE)) if (id !== 'b1') p.z += ZB;

// --- Tragstruktur vor b1 (Freeth 2021, S5.2 und S6.2.2) ------------------------------
// Säulen auf dem Kranz von b1: 4 kurze (20,4 mm, Schulter 16,2) tragen den Strap (1,6 mm, 11° schräg zu den
// Speichen), 4 lange (32,0 mm, Schulter 27,5) die Kreisplatte CP (2,0 mm). Zwischen Mittelscheibe (1,2 mm) und
// Strap bleiben 15,0 mm für 9 Lagen, zwischen Strap und CP 9,7 mm für 5 Lagen. Strap und CP drehen mit b1.
const DISC_T = 1.2;
const strap0 = B1F + 16.2, cp0 = B1F + 27.5;
const SHORT_AXIS = SPOKE.D + 11;                            // Strap-Achse: 161° (über Speiche D und B, 11° gedreht)
const PILLAR_R = 58.6;                                      // auf dem inneren Teil des Kranzes (57–63,6 mm)
const shortAt = (() => {
  const lat = 25.3 / 2 - 1.5, along = Math.sqrt(PILLAR_R ** 2 - lat ** 2), a = SHORT_AXIS * deg;
  const u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]];
  return [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([s, t]) => [s * along * u[0] + t * lat * n[0], s * along * u[1] + t * lat * n[1]]);
})();
export const STRUCT = {
  b1Front: B1F, disc: { r: 14, t: DISC_T }, ringIn: 57.0,
  pillar: { r: PILLAR_R, rad: 1.0 },
  shortP: { len: 20.4, shoulder: 16.2, at: shortAt },
  longP: { len: 32.0, shoulder: 27.5, at: [15, 105, 195, 285].map((a) => polar(B, PILLAR_R, a)) }, // je mittig zwischen zwei Speichen
  strap: { z0: strap0, t: 1.6, w: 25.3, axis: SHORT_AXIS, r: 61, hole: 2.4 },
  cp: { z0: cp0, t: 2.0, r: 61, hole: 3.9 },
  sub: { z0: 33.5, t: 1.5, r: 62, bore: 4.1 },             // Unterplatte: feste runde Scheibe hinter der Frontplatte, schließt deren Öffnung
  dplate: { along: [8.2, 31.5], t: 1.0 },                   // D-Platte 25,3 mm breit (Fragment D), an den Strap gelötet
  steg: { r: 31.8, w: 4 },                                  // mittlere Sonne: Steg vom Block auf Speiche D zur Mitte
  bracketC: 46.2,                                           // Halter der Welle 44+34 auf Speiche C (Fig. S12)
  holders: [45, 135, 225, 315], strips: [18, 90, 162, 234, 306],
  disks: { Me: { r: 15.5, pin: 14.04 }, Ve: { r: 21.5, pin: 20.0 } },  // Tabelle S9; Venus-Scheibe aus Fragment D
};
// Lagen: Dicke in mm; Lücken werden gleichmäßig verteilt, die letzte Lage liegt am Strap bzw. an der CP an.
function stack(z0, z1, list) {
  const gap = (z1 - z0 - list.reduce((s, [, t]) => s + t, 0)) / list.length; let z = z0; const o = {};
  for (const [k, t] of list) { z += gap; o[k] = { z0: z, z1: z + t, c: z + t / 2, t }; z += t; }
  return o;
}
export const LAYER = {
  // b1 → Strap (Reihenfolge der Ausgänge: mittlere Sonne, Knoten, Merkur, Venus)
  ...stack(B1F + DISC_T, strap0, [['L1', 1.4], ['L2', 1.4], ['L3', 1.2], ['L4', 1.4], ['L5', 1.0], ['L6', 1.0], ['L7', 1.0], ['L8', 1.6], ['L9', 1.4]]),
  // Strap → CP (wahre Sonne, Mars, Jupiter, Saturn)
  ...stack(strap0 + 1.6, cp0, [['s1', 1.4], ['s2', 1.4], ['s3', 1.4], ['s4', 1.4], ['s5', 1.4]]),
  CPF: { z0: cp0 + 2.0, z1: cp0 + 3.4, c: cp0 + 2.7, t: 1.4 },  // eine Lage vor der CP: 56, 52, 56, 64
};
// Stift-Schlitz-Paare der äußeren Planeten: kleinerer Modul, damit g6 auf die CP passt (Freeth 2021: Multiplikator 7–10)
for (const id of ['Ma-80a', 'Ma-80b', 'Ju-65a', 'Ju-65b', 'Sa-86a', 'Sa-86b']) MOD[id] = 0.44;
// Exzentrizität zwischen g5 (Stift) und g6 (Schlitz), schematisch; bei Saturn am kleinsten
const ECC = { Ma: 1.5, Ju: 1.0, Sa: 0.6 };
// Ausgänge der Stift-Schlitz-Getriebe auf den Speichen ausgerichtet (Freeth 2021, Fig. S23a). Mars und Jupiter
// liegen je 15° neben Speiche C bzw. B, Saturn 5° neben Speiche A: sonst überschneiden sich 38/71, 45/43 bzw.
// 61/68 in ihrer Lage. Die Zuordnung Planet → Speiche ist schematisch.
const OUT_ANG = { Sa: SPOKE.A - 5, Ma: SPOKE.C - 15, Ju: SPOKE.B + 15 };
// Punkt auf dem Strahl unter Winkel ang, der von P den Abstand r hat (äußere Lösung)
function onRay(P, r, ang) {
  const u = [Math.cos(ang * deg), Math.sin(ang * deg)], b = P[0] * u[0] + P[1] * u[1], c = P[0] ** 2 + P[1] ** 2 - r * r;
  const t = b + Math.sqrt(b * b - c); return [t * u[0], t * u[1]];
}
const lateral = (p) => { const a = (SHORT_AXIS + 90) * deg; return p[0] * Math.cos(a) + p[1] * Math.sin(a); };
export const strapCoords = (p) => { const a = SHORT_AXIS * deg; return [p[0] * Math.cos(a) + p[1] * Math.sin(a), lateral(p)]; };

// Epizyklische Getriebe vor b1 (Koordinaten im mitdrehenden System von b1)
(function carrier() {
  const Ly = LAYER;
  const put = (id, at, z, support, extra = {}) => { PLACE[id] = { frame: 'carrier', at, z, support, ...extra }; };
  const fixed = (id, z) => { PLACE[id] = { frame: 'fixedCenter', at: B, z }; };
  const out = (id, z, planet) => { PLACE[id] = { frame: 'out', at: B, z, planet }; };
  // L1: Festrad 51 (Merkur + Venus) mit 72 (Speiche A) und 44 (Speiche C)
  fixed('V-51', Ly.L1.c);
  const vC = polar(B, BEARING.C, SPOKE.C); put('V-44', vC, Ly.L1.c, 'b1'); put('V-34', vC, Ly.L8.c, 'b1');
  const mA = polar(B, BEARING.A, SPOKE.A); put('Me-72', mA, Ly.L1.c, 'b1'); put('Me-89', mA, Ly.L9.c, 'b1');
  // L2/L4: Mondknoten (hypothetisch): Festrad 49, 62+64 im Lager auf Speiche B (27,0 mm), Ausgang 48
  fixed('Dr-49', Ly.L2.c);
  const dr = polar(B, BEARING.B, SPOKE.B); put('Dr-62', dr, Ly.L2.c, 'b1'); put('Dr-64', dr, Ly.L4.c, 'b1'); out('Dr-48', Ly.L4.c, 'Dr');
  // L8: Venus 34 ~ 26 ~ 63; 26 und 63 laufen in der D-Platte (L9) am Strap. Scheibe an 63 in L7, Folger in L6.
  const vR = polar(B, 27.8, SPOKE.D);
  put('V-26', circ(vC, d('V-34', 'V-26'), vR, d('V-26', 'r1'), -1), Ly.L8.c, 'dplate'); put('r1', vR, Ly.L8.c, 'dplate');
  // L9: Merkur 89 ~ 40 ~ 20; 40 und 20 hängen am Strap. Scheibe an 20 in L7, Folger in L5.
  const mE = polar(B, 36.0, -20);
  const m40 = [1, -1].map((s) => circ(mA, d('Me-89', 'Me-40'), mE, d('Me-40', 'Me-20'), s)).sort((a, b) => Math.abs(lateral(a)) - Math.abs(lateral(b)))[0];
  put('Me-40', m40, Ly.L9.c, 'strap'); put('Me-20', mE, Ly.L9.c, 'strap');
  // Vor der CP: Festrad 56 (an der Unterplatte), 52 nordwestlich davon (wahre Sonne + Saturn), 56 der wahren Sonne
  // auf Linie von Speiche D, 64 (Mars + Jupiter)
  fixed('CP-56', Ly.CPF.c);
  const s52 = polar(B, d('CP-56', 'S-52'), 120); put('S-52', s52, Ly.CPF.c, 'cp'); put('Sa-61', s52, Ly.s5.c, 'cp');
  put('S-56', onRay(s52, d('S-52', 'S-56'), SPOKE.D), Ly.CPF.c, 'cp');
  const mj = polar(B, d('CP-56', 'MJ-64'), 285); put('MJ-64', mj, Ly.CPF.c, 'cp'); put('Ma-38', mj, Ly.s2.c, 'cp'); put('Ju-45', mj, Ly.s5.c, 'cp');
  // Stift-Schlitz: g5 (71/43/68, trägt den Stift) und g6 (80/65/86, mit Schlitz) auf exzentrischen Achsen an der CP,
  // g7 (80/65/86) auf dem Ausgangsrohr in der Mitte (Freeth 2021, Fig. 3d)
  const pin = (key, g4, g5, g6, g7, from, l5, l6, side) => {
    const p6 = polar(B, d(g6, g7), OUT_ANG[key]), p5 = polar(B, d(g6, g7) - ECC[key], OUT_ANG[key]);
    put(g5, p5, l5, 'cp'); put(g4, circ(from, d(PREV[g4], g4), p5, d(g4, g5), side), l5, 'cp');
    put(g6, p6, l6, 'cp', { pinSlot: key }); out(g7, l6, key);
  };
  const PREV = { 'Ma-40': 'Ma-38', 'Ju-40': 'Ju-45', 'Sa-40': 'Sa-61' };
  pin('Ma', 'Ma-40', 'Ma-71', 'Ma-80a', 'Ma-80b', mj, Ly.s2.c, Ly.s1.c, 1);
  pin('Ju', 'Ju-40', 'Ju-43', 'Ju-65a', 'Ju-65b', mj, Ly.s5.c, Ly.s3.c, -1);
  pin('Sa', 'Sa-40', 'Sa-68', 'Sa-86a', 'Sa-86b', s52, Ly.s5.c, Ly.s4.c, 1);
})();

// Wellen der Epizykel-Räder: von der Lagerstelle (Speiche von b1, Strap, D-Platte oder CP) bis zum letzten Rad.
// Merkur 20 und Venus 63 reichen bis zu ihrer Scheibe in L7.
export const DISK_ON = { 'Me-20': 'Me', r1: 'Ve' };
export function carrierArbors() {
  const by = {};
  for (const [id, p] of Object.entries(PLACE)) {
    if (p.frame !== 'carrier') continue;
    const k = p.at.map((v) => v.toFixed(3)).join(',');
    const a = (by[k] ??= { at: p.at, ids: [], z: [], support: p.support });
    a.ids.push(id); a.z.push(p.z - thickOf(id) / 2, p.z + thickOf(id) / 2);
    if (DISK_ON[id]) a.z.push(LAYER.L7.z0);
  }
  const S = STRUCT;
  const sup = { b1: [B1F], strap: [S.strap.z0 + S.strap.t], dplate: [S.strap.z0], cp: [S.cp.z0 + S.cp.t] };
  return Object.values(by).map((a) => { const zs = [...a.z, ...sup[a.support]]; return { ...a, z0: Math.min(...zs), z1: Math.max(...zs) }; });
}

// Kronrad a1: Achse entlang x, greift seitlich in b1
export const A1 = { x: pitchR('b1') + 1.2, y: 0, z: pitchR('a1') };
