// Prüft die Kinematik gegen die Zähnezahlen und gegen den echten Himmel (astronomy-engine).
// Aufruf: npm test   (oder: node --test test/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RATES, stateAt, EPOCH } from '../app/js/kinematics.js';
import { realSky, angDiff, julianDay, nextEclipses } from '../app/js/astro.js';
import { PLACE, ARBORS, pitchR, moduleOf } from '../app/js/layout.js';
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

test('Getriebe-Geometrie: jedes Eingriffspaar hat gleichen Modul und passenden Achsabstand', () => {
  const abs = (id) => { const p = PLACE[id]; return p.frame === 'e3' ? [ARBORS.E[0] + p.at[0], ARBORS.E[1] + p.at[1]] : p.at; };
  const back = GEARS.gears.filter((g) => PLACE[g.id] && (!PLACE[g.id].frame || PLACE[g.id].frame === 'e3'));
  let n = 0;
  for (const g of back) for (const o of g.meshes ?? []) {
    if (!PLACE[o] || (PLACE[o].frame && PLACE[o].frame !== 'e3')) continue;
    close(moduleOf(g.id), moduleOf(o), 1e-12);
    const [a, b] = [abs(g.id), abs(o)];
    close(Math.hypot(a[0] - b[0], a[1] - b[1]), pitchR(g.id) + pitchR(o), 1e-9); n++;
  }
  assert.ok(n >= 20, `nur ${n} Paare geprüft`);
});

test('Radien stimmen mit den CT-Messungen (Freeth 2006) auf ±0,75 mm überein', () => {
  for (const g of GEARS.gears) if (g.measured?.rIn != null) {
    const m = (g.measured.rIn + g.measured.rOut) / 2;
    assert.ok(Math.abs(pitchR(g.id) - m) <= 0.75, `${g.id}: Modell ${pitchR(g.id).toFixed(2)} mm, gemessen ${m.toFixed(2)} mm`);
  }
});

test('Stift-Schlitz: Achse K\' liegt 1,1 mm neben K', () => {
  close(PLACE.k2.at[0] - PLACE.k1.at[0], 1.1, 1e-12);
});
