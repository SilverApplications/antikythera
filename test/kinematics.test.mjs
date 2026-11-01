// Prüft die Kinematik gegen die Zähnezahlen und gegen den echten Himmel (astronomy-engine).
// Aufruf: npm test   (oder: node --test test/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RATES, stateAt, EPOCH, METONIC_CELLS } from '../app/js/kinematics.js';
import { realSky, angDiff, julianDay, nextEclipses } from '../app/js/astro.js';
import { PLACE, ARBORS, pitchR, moduleOf, BEARING } from '../app/js/layout.js';
import { GEARS } from '../app/js/generated/data.js';

const close = (a, b, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('Übersetzungen entsprechen den Periodenrelationen', () => {
  close(RATES.moonSidereal, 254 / 19); close(RATES.metonic, 5 / 19); close(RATES.saros, 940 / 4237);
  close(RATES.exeligmos, 235 / 12711); close(RATES.callippic, 1 / 76); close(RATES.olympiad, 1 / 4); close(RATES.nodes, -5 / 93);
  close(RATES.syn.mercury, 1513 / 480); close(RATES.syn.venus, 289 / 462); close(RATES.syn.mars, 133 / 284);
  close(RATES.syn.jupiter, 315 / 344); close(RATES.syn.saturn, 427 / 442);
});

test('Zur Startepoche 205 v. Chr. stimmt das Gerät mit dem Himmel überein', () => {
  const s = stateAt(EPOCH.saros), r = realSky(EPOCH.saros);
  assert.ok(Math.abs(angDiff(s.sunTrue, r.sun)) < 2, 'Sonne');
  assert.ok(Math.abs(angDiff(s.moonTrue, r.moon)) < 5, 'Mond');
  for (const p of ['mercury', 'venus', 'mars', 'jupiter']) assert.ok(Math.abs(angDiff(s.planets[p], r[p])) < 12, p);
  assert.ok(Math.abs(angDiff(s.planets.saturn, r.saturn)) < 15, 'saturn (Kreisbahnmodell)');
});

test('Skalen starten bei Zelle 1', () => {
  assert.equal(stateAt(EPOCH.saros).saros.cell, 0);
  assert.equal(stateAt(EPOCH.calendar + 1).metonic.cell, 0);
  assert.deepEqual(stateAt(EPOCH.calendar + 1).games.names, ['Isthmia', 'Olympia']);
});

test('12. Mai 205 v. Chr. ist Vollmond von Saros-Monat 1 (Carman & Evans 2014) – im Gerät und am Himmel', () => {
  const jd = julianDay(-204, 5, 12.5), s = stateAt(jd), r = realSky(jd);
  assert.ok(Math.abs(angDiff(r.moonPhase, 180)) < 15, `Himmel: Phase ${r.moonPhase}`);
  assert.ok(Math.abs(angDiff(s.elong, 180)) < 15, `Gerät: Elongation ${s.elong}`);
  assert.equal(s.saros.cell, 0);
});

test('Erste echte Mondfinsternis nach dem Start: 11. Juni 205 v. Chr.', () => {
  const e = nextEclipses(EPOCH.saros).lunar;
  assert.ok(Math.abs(e.jd - julianDay(-204, 6, 11.5)) < 1, `JD ${e.jd}`);
});

test('Kurbel: eine Umdrehung ≈ 78,6 Tage (48/223 Jahr)', () => {
  const a = stateAt(EPOCH.saros), b = stateAt(EPOCH.saros + 365.24219 * 48 / 223);
  close(b.crankTurns - a.crankTurns, 1, 1e-9);
});

test('Getriebe-Geometrie: jedes Eingriffspaar sitzt im Abstand der Teilkreisradien', () => {
  const abs = (id) => { const p = PLACE[id]; return p.frame === 'e3' ? [ARBORS.E[0] + p.at[0], ARBORS.E[1] + p.at[1]] : p.at; };
  const same = (a, b) => (PLACE[a].frame ?? 'fixed') === (PLACE[b].frame ?? 'fixed') || [PLACE[a].frame, PLACE[b].frame].every((f) => !f || f === 'e3');
  let n = 0;
  for (const g of GEARS.gears) for (const o of g.meshes ?? []) {
    if (!PLACE[g.id] || !PLACE[o] || !same(g.id, o)) continue;
    const [a, b] = PLACE[g.id].frame === 'carrier' || PLACE[g.id].frame === 'fixedCenter' ? [PLACE[g.id].at, PLACE[o].at] : [abs(g.id), abs(o)];
    close(Math.hypot(a[0] - b[0], a[1] - b[1]), pitchR(g.id) + pitchR(o), 1e-9); n++;
    // kämmende Räder: Module höchstens 8 % verschieden (Original: max. 7,6 %, Freeth 2021 S8)
    assert.ok(Math.abs(moduleOf(g.id) - moduleOf(o)) / ((moduleOf(g.id) + moduleOf(o)) / 2) < 0.08, `${g.id}~${o}`);
  }
  assert.ok(n >= 30, `nur ${n} Paare geprüft`);
});

test('Teilkreise = CT-Messung (Freeth 2021, Tabelle S8)', () => {
  for (const g of GEARS.gears) if (g.measured2021) {
    const tol = ['k2', 'e6'].includes(g.id) ? 0.15 : 1e-9; // k2/e6 für den Achsversatz 1,1 mm minimal angepasst
    assert.ok(Math.abs(pitchR(g.id) - g.measured2021.pitch) <= tol, `${g.id}: ${pitchR(g.id)} vs ${g.measured2021.pitch}`);
  }
});

test('Kosmos: Lagerstellen auf den Speichen und Epizykel-Abstände (Freeth 2021, S5/S9)', () => {
  const r = (id) => Math.hypot(...PLACE[id].at);
  close(r('Me-72'), BEARING.A, 1e-9); close(r('Dr-62'), BEARING.B, 1e-9); close(r('V-44'), BEARING.C, 1e-9);
  close(r('r1'), 27.8, 1e-9); close(r('Me-20'), 36.0, 1e-9);
  close(pitchR('Dr-49') + pitchR('Dr-62'), pitchR('Dr-64') + pitchR('Dr-48'), 1e-9); // Ausgang 48 wieder auf der Mittelachse
});

test('Metonischer Kalender: 235 Zellen, Jahr 8 beginnt in Zelle 88 (Freeth 2008)', () => {
  assert.equal(METONIC_CELLS.length, 235);
  assert.equal(METONIC_CELLS.findIndex((c) => c.year === 8) + 1, 88);
  const ic = METONIC_CELLS.map((c, i) => (c.intercalary ? i + 1 : 0)).filter(Boolean);
  const between = (a, b) => ic.filter((x) => x > a && x < b).length;
  assert.equal(between(2, 37), 2); assert.equal(between(49, 87), 1); assert.equal(between(96, 133), 2);
  assert.equal(between(142, 175), 1); assert.equal(ic.filter((x) => x > 189).length, 1);
});

test('Stift-Schlitz: Achse K\' liegt 1,1 mm neben K', () => {
  close(PLACE.k2.at[0] - PLACE.k1.at[0], 1.1, 1e-12);
});
