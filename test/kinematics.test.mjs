// Prüft die Kinematik gegen die Zähnezahlen und gegen den echten Himmel (astronomy-engine).
// Aufruf: npm test   (oder: node --test test/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RATES, stateAt, EPOCH } from '../app/js/kinematics.js';
import { realSky, angDiff, julianDay, nextEclipses } from '../app/js/astro.js';

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

test('Kurbel: eine Umdrehung ≈ 78,3 Tage', () => {
  const a = stateAt(EPOCH.saros), b = stateAt(EPOCH.saros + 365.24219 * 48 / 224);
  close(b.crankTurns - a.crankTurns, 1, 1e-9);
});
