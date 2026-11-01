// Kollisionsprüfung der Tragstruktur und der Getriebe (Freeth 2021): nichts darf sich durchdringen.
// Alles vor b1 wird im mitdrehenden System von b1 geprüft; Teile auf der Mittelachse (fest oder Ausgang)
// überstreichen dabei einen vollen Kreis, ebenso alles Feststehende außerhalb (Halter, Kronrad a1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLACE, ARBORS, pitchR, moduleOf, thickOf, LAYER, STRUCT, B1F, MAIN, PLATE, A1, carrierArbors, strapCoords, DISK_ON } from '../app/js/layout.js';
import { GEARS } from '../app/js/generated/data.js';

const G = Object.fromEntries(GEARS.gears.map((g) => [g.id, g]));
const meshes = (a, b) => (G[a]?.meshes ?? []).includes(b) || (G[b]?.meshes ?? []).includes(a);
const tipR = (id) => pitchR(id) + 1.36 * moduleOf(id);
const zr = (id) => [PLACE[id].z - thickOf(id) / 2, PLACE[id].z + thickOf(id) / 2];
const zOver = (a, b, eps = 0.02) => a[0] < b[1] - eps && b[0] < a[1] - eps;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const R = (p) => Math.hypot(p[0], p[1]);

// Elemente im System von b1: Scheiben (Räder, Platten-Scheiben), Zylinder (Wellen, Säulen), Ringe (Stifte)
function frontElements() {
  const el = [];
  for (const [id, p] of Object.entries(PLACE)) {
    if (!p.frame || p.frame === 'e3') continue;
    el.push({ id, kind: 'gear', center: p.frame !== 'carrier', at: p.at, r: tipR(id), z: zr(id), pinSlot: p.pinSlot });
  }
  for (const a of carrierArbors()) el.push({ id: `arbor[${a.ids.join('+')}]`, kind: 'arbor', at: a.at, r: 0.8, z: [a.z0, a.z1], ids: a.ids, support: a.support });
  const S = STRUCT;
  for (const at of S.shortP.at) el.push({ id: 'shortPillar', kind: 'pillar', at, r: S.pillar.rad, z: [B1F, B1F + S.shortP.len] });
  for (const at of S.longP.at) el.push({ id: 'longPillar', kind: 'pillar', at, r: S.pillar.rad, z: [B1F, B1F + S.longP.len] });
  // Steg der mittleren Sonne (L3) mit Block auf Speiche D; Halter der Welle 44+34 auf Speiche C (Pfosten + Arm in L7)
  const along = (ang, r0, r1, rad, z, id) => { for (let r = r0; r <= r1 + 1e-9; r += rad) el.push({ id, kind: 'struct', at: [r * Math.cos(ang * Math.PI / 180), r * Math.sin(ang * Math.PI / 180)], r: rad, z }); };
  const D = 150, C = 240;
  along(D, 3, S.steg.r + 2, S.steg.w / 2, [LAYER.L3.z0, LAYER.L3.z1], 'steg');
  along(D, S.steg.r, S.steg.r, 2.2, [B1F, LAYER.L3.z0], 'steg-block');
  along(C, S.bracketC, S.bracketC, 1.2, [B1F, LAYER.L7.z1], 'bracketC-post');
  along(C, 25.6 + 1.6, S.bracketC, 1.5, [LAYER.L7.z0, LAYER.L7.z1], 'bracketC-arm');
  // Scheiben mit Stift (Stift läuft auf einem Kreis um die Radmitte bis in die Lage des Folgers)
  const disk = { Me: ['Me-20', LAYER.L5], Ve: ['r1', LAYER.L6] };
  for (const [k, [gid, fl]] of Object.entries(disk)) {
    const d = STRUCT.disks[k], c = PLACE[gid].at;
    el.push({ id: `disk-${k}`, kind: 'disk', at: c, r: d.r, z: [LAYER.L7.z0, LAYER.L7.z1], on: gid });
    el.push({ id: `pin-${k}`, kind: 'pinring', at: c, ring: d.pin, r: 0.6, z: [fl.c, LAYER.L7.z0], on: gid });
  }
  return el;
}

test('Lagen: 9 zwischen b1 und Strap, 5 zwischen Strap und CP, ohne Überlappung', () => {
  const ks = Object.keys(LAYER);
  assert.equal(ks.filter((k) => /^L\d$/.test(k)).length, 9);
  assert.equal(ks.filter((k) => /^s\d$/.test(k)).length, 5);
  const list = Object.values(LAYER).sort((a, b) => a.z0 - b.z0);
  for (let i = 1; i < list.length; i++) assert.ok(list[i].z0 >= list[i - 1].z1 - 1e-9);
  // Freeth 2021: 15,0 mm bzw. 9,7 mm Platz
  assert.ok(Math.abs(STRUCT.strap.z0 - (B1F + STRUCT.disc.t) - 15.0) < 0.01);
  assert.ok(Math.abs(STRUCT.cp.z0 - (STRUCT.strap.z0 + STRUCT.strap.t) - 9.7) < 0.01);
});

test('Jedes Rad vor b1 liegt vollständig in einer Lage', () => {
  for (const [id, p] of Object.entries(PLACE)) {
    if (!p.frame || p.frame === 'e3') continue;
    const L = Object.values(LAYER).find((l) => Math.abs(l.c - p.z) < 1e-9);
    assert.ok(L, `${id}: keine Lage`);
    assert.ok(thickOf(id) <= L.t + 1e-9, `${id} dicker als seine Lage`);
  }
});

test('Ausgänge in der kosmologischen Reihenfolge (innen = weiter hinten)', () => {
  const z = (id) => PLACE[id].z;
  // mittlere Sonne (Steg L3) < Knoten (48) < Merkur-Folger (L5) < Venus-Folger (L6) < Mars < Jupiter < Saturn
  const seq = [LAYER.L3.c, z('Dr-48'), LAYER.L5.c, LAYER.L6.c, z('Ma-80b'), z('Ju-65b'), z('Sa-86b')];
  for (let i = 1; i < seq.length; i++) assert.ok(seq[i] > seq[i - 1], `Reihenfolge bei ${i}`);
});

test('Vor b1: keine Durchdringungen (Räder, Wellen, Säulen, Scheiben, Stifte)', () => {
  const el = frontElements(), bad = [];
  const onArbor = (e, g) => e.kind === 'arbor' && e.ids.includes(g.id);
  for (let i = 0; i < el.length; i++) for (let j = i + 1; j < el.length; j++) {
    const a = el[i], b = el[j];
    if (!zOver(a.z, b.z)) continue;
    if (a.kind === 'gear' && b.kind === 'gear' && meshes(a.id, b.id)) continue;
    if (onArbor(a, b) || onArbor(b, a)) continue;
    if ((a.on && (a.on === b.id || b.ids?.includes(a.on))) || (b.on && (b.on === a.id || a.ids?.includes(b.on)))) continue;
    if (a.kind === 'pinring' && b.kind === 'disk' && a.id.slice(4) === b.id.slice(5)) continue;
    if (a.kind === 'struct' && b.kind === 'struct') continue;
    const bracketOwn = (x, y) => x.id.startsWith('bracketC') && y.kind === 'arbor' && y.ids.includes('V-34');
    if (bracketOwn(a, b) || bracketOwn(b, a)) continue;
    // exzentrisches Stift-Schlitz-Paar: Welle von g6 läuft durch das große Loch in g5 (und umgekehrt)
    const pair = (x, y) => x.kind === 'arbor' && y.kind === 'gear' && PLACE[x.ids[0]]?.pinSlot && PLACE[x.ids[0]].pinSlot === y.id.slice(0, 2) && /-(71|43|68)$/.test(y.id);
    const pair2 = (x, y) => x.kind === 'arbor' && y.kind === 'gear' && PLACE[y.id]?.pinSlot && /-(71|43|68)$/.test(x.ids[0]) && x.ids[0].slice(0, 2) === y.id.slice(0, 2);
    if (pair(a, b) || pair(b, a) || pair2(a, b) || pair2(b, a)) continue;
    const ecc = (x, y) => x.kind === 'arbor' && y.kind === 'arbor' && x.ids.some((i) => PLACE[i].pinSlot) && y.ids.some((i) => /-(71|43|68)$/.test(i)) && x.ids[0].slice(0, 2) === y.ids[0].slice(0, 2);
    if (ecc(a, b) || ecc(b, a)) continue;
    // Mitte gegen Mitte: konzentrisch, verschiedene Lagen → oben bereits per z getrennt
    if (a.kind === 'gear' && a.center && b.kind === 'gear' && b.center) { bad.push(`${a.id}~${b.id} (Mitte)`); continue; }
    if (a.center || b.center) { // überstrichener Kreis
      const [c, o] = a.center ? [a, b] : [b, a];
      const ro = o.kind === 'pinring' ? R(o.at) - o.ring - o.r : R(o.at) - o.r;
      if (ro < c.r) bad.push(`${c.id} (Mitte, r ${c.r.toFixed(1)}) ~ ${o.id} (bis r ${ro.toFixed(1)})`);
      continue;
    }
    if (a.kind === 'pinring' || b.kind === 'pinring') {
      const [p, o] = a.kind === 'pinring' ? [a, b] : [b, a];
      const dd = dist(p.at, o.at);
      if (dd - o.r < p.ring + p.r && dd + o.r > p.ring - p.r) bad.push(`${p.id} ~ ${o.id}`);
      continue;
    }
    if (dist(a.at, b.at) < a.r + b.r) bad.push(`${a.id}(z ${a.z.map((v) => v.toFixed(1))}) ~ ${b.id}(z ${b.z.map((v) => v.toFixed(1))}) d=${dist(a.at, b.at).toFixed(1)} < ${(a.r + b.r).toFixed(1)}`);
  }
  assert.deepEqual(bad, []);
});

test('Folger von Merkur und Venus: Arm überstreicht nur freie Bereiche in seiner Lage', () => {
  const el = frontElements().filter((e) => e.kind !== 'pinring');
  const sweep = { Me: ['Me-20', LAYER.L5], Ve: ['r1', LAYER.L6] }, bad = [];
  for (const [k, [gid, L]] of Object.entries(sweep)) {
    const c = PLACE[gid].at, pin = STRUCT.disks[k].pin, len = R(c) + pin + 3;
    const half = Math.asin(pin / R(c)) + 0.06, a0 = Math.atan2(c[1], c[0]);
    for (const o of el) {
      if (!zOver(o.z, [L.z0, L.z1]) || o.center) continue;
      if (o.kind === 'arbor' && o.ids.includes(gid)) continue;
      const ro = R(o.at), ao = Math.atan2(o.at[1], o.at[0]);
      let da = Math.abs(((ao - a0 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      const widen = Math.asin(Math.min(1, (o.r + 2) / Math.max(ro, o.r + 2)));
      if (ro - o.r < len && da < half + widen) bad.push(`${k}-Folger ~ ${o.id}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('Platten vor b1: Strap, D-Platte und CP nur von ihren eigenen Wellen und Säulen durchstoßen', () => {
  const S = STRUCT, el = frontElements(), bad = [];
  // Abstand eines Punkts (Strap-Koordinaten) von einem Rechteck
  const rectD = (p, u0, u1, v0, v1) => { const [u, v] = strapCoords(p); return Math.hypot(Math.max(u0 - u, 0, u - u1), Math.max(v0 - v, 0, v - v1)); };
  const inStrap = (p, m = 0) => rectD(p, -S.strap.r, S.strap.r, -S.strap.w / 2, S.strap.w / 2) < m && R(p) < S.strap.r + m;
  const inD = (p, m = 0) => rectD(p, S.dplate.along[0], S.dplate.along[1], -S.strap.w / 2, S.strap.w / 2) < m;
  const zs = [S.strap.z0, S.strap.z0 + S.strap.t], zd = [S.strap.z0 - S.dplate.t, S.strap.z0], zc = [S.cp.z0, S.cp.z0 + S.cp.t];
  for (const o of el) {
    const own = (sup) => o.kind === 'arbor' && o.support === sup;
    if (zOver(o.z, zs) && inStrap(o.at, o.r + 1e-6) && !own('strap') && !(o.kind === 'pillar' && o.id === 'shortPillar') && !o.center) bad.push(`Strap ~ ${o.id}`);
    if (zOver(o.z, zd) && inD(o.at, o.r + 1e-6) && !own('dplate') && !o.center) bad.push(`D-Platte ~ ${o.id}`);
    if (zOver(o.z, zc) && R(o.at) - (o.r ?? 0) < S.cp.r && !own('cp') && o.id !== 'longPillar' && !o.center) bad.push(`CP ~ ${o.id}`);
    if (o.center && zOver(o.z, zs) && o.r > S.strap.hole) bad.push(`Strap-Loch ~ ${o.id}`);
  }
  assert.deepEqual(bad, []);
});

test('Alles Mitdrehende bleibt innerhalb von b1 und frei von Kronrad a1 und den Haltern', () => {
  const el = frontElements(), bad = [];
  const a1in = A1.x + 2.5 - 3.8; // Innenkante des Kronrads
  for (const o of el) {
    if (o.center) continue;
    const ro = R(o.at) + (o.kind === 'pinring' ? o.ring : 0) + o.r;
    if (o.z[0] < A1.z * 2 + 1.4 && ro > a1in - 0.3) bad.push(`a1 ~ ${o.id} (r ${ro.toFixed(1)})`);
  }
  // Halter: Lasche über dem Kranz ab r = 60,8 mm, von b1 bis 2,15 mm
  for (const o of el) if (zOver(o.z, [B1F, B1F + 0.8]) && R(o.at) + o.r > 60.8 && !o.center) bad.push(`Halter ~ ${o.id}`);
  assert.deepEqual(bad, []);
});

test('Hinter b1: keine Durchdringungen; Hauptplatte und Rückplatte frei', () => {
  const grp = (id) => PLACE[id].frame;
  const pos = (id) => (PLACE[id].frame === 'e3' ? [ARBORS.E[0] + PLACE[id].at[0], ARBORS.E[1] + PLACE[id].at[1]] : PLACE[id].at);
  const ids = Object.keys(PLACE).filter((id) => G[id] && (!PLACE[id].frame || PLACE[id].frame === 'e3') && id !== 'b1');
  const bad = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j];
    if (meshes(a, b) || (PLACE[a].arbor && PLACE[a].arbor === PLACE[b].arbor)) continue;
    if (!zOver(zr(a), zr(b))) continue;
    if (dist(pos(a), pos(b)) < tipR(a) + tipR(b) - 0.2 * (moduleOf(a) + moduleOf(b))) bad.push(`${a}~${b}`);
  }
  const mainBack = MAIN.zf - MAIN.t;
  for (const id of ids) { const z = zr(id); if (z[1] > mainBack) bad.push(`${id} ragt in die Hauptplatte`); if (z[0] < PLATE.zBack) bad.push(`${id} ragt in die Rückplatte`); }
  assert.deepEqual(bad, []);
});

test('Kosmos: Eingriffe mit Rädern auf der Mittelachse sitzen im Abstand der Teilkreise', () => {
  let n = 0;
  for (const g of GEARS.gears) for (const o of g.meshes ?? []) {
    const a = PLACE[g.id], b = PLACE[o]; if (!a || !b) continue;
    const center = (p) => p.frame === 'fixedCenter' || p.frame === 'out';
    if (!(center(a) && b.frame === 'carrier')) continue;
    assert.ok(Math.abs(R(b.at) - (pitchR(g.id) + pitchR(o))) < 1e-9, `${g.id}~${o}`); n++;
  }
  assert.ok(n >= 9, `nur ${n} Eingriffe geprüft`);
});
