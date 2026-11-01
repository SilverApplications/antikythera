// Prozedurale 3D-Geometrie: Zahnräder mit Dreieckszähnen, Platten, Zifferblätter, Gehäuse.
import * as THREE from '../vendor/three.module.min.js';
import { GEARS } from './generated/data.js';
import { PLACE, ARBORS, BACK, PLATE, FRONT, A1, pitchR, moduleOf, thickOf, SPOKE, STRUCT, LAYER, MAIN, B1F, carrierArbors, strapCoords, DISK_ON } from './layout.js';
import { deviceText, DEVICE } from './i18n.js';
const DEVICE_ORIG = () => DEVICE.orig;
import { METONIC_CELLS, GLYPH_BY_CELL } from './kinematics.js';
import { patinaTextures, oliveWood, engravedTexture, engraveStroke, engraveText } from './patina.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const GEAR = Object.fromEntries(GEARS.gears.map((g) => [g.id, g]));

// ---------------------------------------------------------------- Materialien
export function makeMaterials(envMap) {
  const std = (color, metal, rough, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, envMap, side: THREE.DoubleSide, ...extra });
  const hatch = document.createElement('canvas'); hatch.width = hatch.height = 64;
  const g = hatch.getContext('2d'); g.fillStyle = '#1D7A6E'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#F4F5F6'; g.lineWidth = 6; for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  const hatchTex = new THREE.CanvasTexture(hatch); hatchTex.wrapS = hatchTex.wrapT = THREE.RepeatWrapping; hatchTex.repeat.set(0.15, 0.15);
  hatchTex.colorSpace = THREE.SRGBColorSpace;
  const pt = patinaTextures(1 / 60, 'gear'), ptPlate = patinaTextures(1 / 80, 'plate');
  const pat = (color, tex, extra = {}) => std(color, 1, 1, { map: tex.map, metalnessMap: tex.mr, roughnessMap: tex.mr, ...extra });
  const wood = oliveWood();
  return {
    bronze: pat(0xffffff, pt),
    bronzeDark: pat(0xb8a890, pt),
    plate: pat(0xffffff, ptPlate, { roughness: 1 }),
    wood: std(0xffffff, 0.0, 0.8, { map: wood }),
    steel: std(0x9ba3ab, 0.9, 0.3),
    gold: std(0xd4a640, 1.0, 0.25),
    evidence: {
      E1: std(0xb08d57, 0.85, 0.38),
      E2: std(0x9ba3ab, 0.9, 0.3),
      E3: std(0x3fa893, 0.4, 0.45),
      E4: std(0xffffff, 0.2, 0.6, { map: hatchTex }),
    },
    stones: {
      mercury: std(0x3fb6b0, 0.1, 0.25), venus: std(0x2a4fa8, 0.1, 0.2), sun: std(0xd4a640, 1, 0.2),
      mars: std(0xb3362c, 0.1, 0.25), jupiter: std(0xe6e2d6, 0.1, 0.2), saturn: std(0x2b2b2e, 0.2, 0.2),
    },
    ghost: new THREE.MeshBasicMaterial({ color: 0x3fa893, transparent: true, opacity: 0.85, depthTest: false }),
  };
}

// ---------------------------------------------------------------- Zahnräder
// Dreieckszähne, von Hand gefeilt: gleichseitig, Zahnhöhe = Teilung · √3/2 = 2,72 · Modul (Freeth 2008/2021).
// Nabe: Vierkant (g1, g2, e2, r1 belegt, Freeth 2006 Notes 3), Räder auf Rohren oder Lagern rund.
// Speichen nur bei b1 (4 Speichen, schwalbenschwanzförmig im Kranz); alle anderen Räder sind Vollscheiben.
export const TOOTH_H = 2.72;
function gearShape(z, m, o = {}) {
  const rp = z * m / 2, h = TOOTH_H * m, ra = rp + 0.5 * h, rf = rp - 0.5 * h;
  const s = new THREE.Shape();
  for (let i = 0; i < z; i++) {
    const a0 = (i / z) * TAU, a1 = ((i + 0.5) / z) * TAU;
    const p0 = [Math.cos(a0) * ra, Math.sin(a0) * ra], p1 = [Math.cos(a1) * rf, Math.sin(a1) * rf];
    if (i === 0) s.moveTo(...p0); else s.lineTo(...p0);
    s.lineTo(...p1);
  }
  s.closePath();
  const bore = new THREE.Path();
  if (o.round) bore.absarc(0, 0, o.round, 0, TAU, true);
  else { const q = o.square ?? Math.min(1.0, Math.max(0.55, rf * 0.12)); bore.moveTo(q, q); bore.lineTo(q, -q); bore.lineTo(-q, -q); bore.lineTo(-q, q); bore.closePath(); }
  s.holes.push(bore);
  if (o.spokes) { // b1: Kranz ab o.ringIn, 4 Speichen (Breite 2·sw), am Kranz schwalbenschwanzförmig verbreitert
    const n = 4, hub = o.hub, rim = o.ringIn, rd = rim - 3, sw = o.sw, sw2 = sw + 2;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU, hole = new THREE.Path();
      hole.absarc(0, 0, hub, a0 + sw / hub, a1 - sw / hub, false);
      hole.lineTo(Math.cos(a1 - sw / rd) * rd, Math.sin(a1 - sw / rd) * rd);
      hole.absarc(0, 0, rim, a1 - sw2 / rim, a0 + sw2 / rim, true);
      hole.lineTo(Math.cos(a0 + sw / rd) * rd, Math.sin(a0 + sw / rd) * rd);
      hole.closePath(); s.holes.push(hole);
    }
  }
  return s;
}

const geoCache = new Map();
function spurGeometry(z, m, t = 1.4, o = {}) {
  const key = `${z}-${m}-${t}-${JSON.stringify(o)}`;
  if (!geoCache.has(key)) {
    const g = new THREE.ExtrudeGeometry(gearShape(z, m, o), { depth: t, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -t / 2); g.computeVertexNormals();
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}

// Ausgangsrohre (koaxial, Freeth 2021 S6.2.3): Radius in mm, innen der Mond, außen das Datumsrohr
const TUBE_MOON = 0.7;
export const TUBE = { moon: 0.7, fixed: 1.5, sunMean: 1.05, Dr: 1.4, Me: 1.75, Ve: 2.1, sunTrue: 2.45, Ma: 2.8, Ju: 3.15, Sa: 3.5, date: 3.85 };
function gearOpts(id, pl) {
  if (id === 'b1') return { spokes: true, round: 2.2, hub: STRUCT.disc.r, ringIn: STRUCT.ringIn, sw: 5.5 };
  if (id === 'CP-56') return { round: STRUCT.sub.bore + 0.1 };
  if (pl.frame === 'fixedCenter') return { square: TUBE.fixed };
  if (pl.frame === 'out') return { square: TUBE[pl.planet] };
  if (pl.pinSlot) return { round: 2.6 }; // großes Loch: die Welle von g5 läuft exzentrisch hindurch
  return {};
}
// Flache Platte aus einer Kontur (Punkte in mm), Dicke t, Unterseite bei z = 0
function plateGeo(pts, t, holes = []) {
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
  for (const [x, y, r] of holes) { const h = new THREE.Path(); h.absarc(x, y, r, 0, TAU, true); s.holes.push(h); }
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 48 });
}
const disc = (r, t, hole = 0, seg = 64) => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, TAU, false); if (hole) { const h = new THREE.Path(); h.absarc(0, 0, hole, 0, TAU, true); s.holes.push(h); } return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: seg }); };
const cylZ = (r, z0, z1, seg = 16) => { const g = new THREE.CylinderGeometry(r, r, z1 - z0, seg); g.rotateX(Math.PI / 2); g.translate(0, 0, (z0 + z1) / 2); return g; };
const boxAt = (sx, sy, sz, x, y, z) => { const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(x, y, z); return g; };
const xyStrap = (u, v) => { const a = STRUCT.strap.axis * DEG; return [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]; };

// Kronrad: Zähne auf der Stirnseite eines Rings (Achse = lokale z)
function crownGeometry(z, m) {
  const rp = z * m / 2, rin = rp - 1.4, rout = rp + 1.4, base = 2.5, h = TOOTH_H * m;
  const pos = [], idx = [];
  const n = 2 * z;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, top = base + (i % 2 === 0 ? h : 0);
    const c = Math.cos(a), s = Math.sin(a);
    pos.push(c * rout, s * rout, top, c * rin, s * rin, top, c * rout, s * rout, 0, c * rin, s * rin, 0);
  }
  for (let i = 0; i < n; i++) {
    const o = i * 4, p = o + 4;
    const q = (a, b, c, d) => idx.push(a, b, c, a, c, d);
    q(o, p, p + 1, o + 1);   // Oberseite
    q(o + 2, p + 2, p, o);   // außen
    q(o + 1, p + 1, p + 3, o + 3); // innen
    q(o + 3, p + 3, p + 2, o + 2); // unten
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // Scheibe mit Vierkant-Aussparung für Schlüssel oder Kurbel (Freeth 2014, Fig. 3)
  const ds = new THREE.Shape(); ds.absarc(0, 0, rin, 0, TAU, false);
  const key = new THREE.Path(); const q = 1.6; key.moveTo(q, q); key.lineTo(q, -q); key.lineTo(-q, -q); key.lineTo(-q, q); key.closePath(); ds.holes.push(key);
  const disk = new THREE.ExtrudeGeometry(ds, { depth: 1.2, bevelEnabled: false, curveSegments: 48 });
  return [g, disk];
}

function tag(obj, data) { obj.userData = { ...obj.userData, ...data }; obj.traverse((o) => { o.userData = { ...o.userData, ...data }; }); return obj; }

export function buildMechanism(mat) {
  const root = new THREE.Group(); root.name = 'mechanism';
  const parts = [];        // alles, was explodiert / ein- und ausgeblendet wird
  const gearObjs = {};     // id -> Object3D
  const texts = [];        // Meshes mit Gerätebeschriftung: { mesh, make }
  const add = (parent, obj, info) => { tag(obj, info); parent.add(obj); parts.push(obj); obj.userData.baseZ = obj.position.z; obj.userData.basePos = obj.position.clone(); return obj; };
  const part = (parent, geos, material, info, pos = [0, 0, 0]) => {
    const h = new THREE.Group(); for (const g of [].concat(geos)) h.add(new THREE.Mesh(g, material)); h.position.set(...pos);
    return add(parent, h, { kind: 'part', ...info });
  };

  const fixed = new THREE.Group(); root.add(fixed);
  const carrier = new THREE.Group(); carrier.name = 'carrier'; root.add(carrier);
  const e3frame = new THREE.Group(); e3frame.position.set(ARBORS.E[0], ARBORS.E[1], 0); root.add(e3frame);
  const S = STRUCT, Ly = LAYER;

  for (const [id, pl] of Object.entries(PLACE)) {
    const g = GEAR[id]; if (!g) continue;
    const teeth = g.teeth ?? 40;
    const mesh = new THREE.Mesh(spurGeometry(teeth, moduleOf(id), thickOf(id), gearOpts(id, pl)), mat.bronze);
    if (id === 'b1') mesh.rotation.z = SPOKE.A * DEG; // Speiche A auf 1 Uhr (Freeth 2021)
    const holder = new THREE.Group(); holder.add(mesh);
    holder.position.set(pl.at[0], pl.at[1], pl.z);
    const info = { kind: 'gear', id, teeth: g.teeth, assembly: g.assembly, evidence: g.evidence, label: `${id} · ${g.teeth ?? '?'} Zähne`, func: g.function, note: g.note, frame: pl.frame || 'fixed' };
    const parent = pl.frame === 'carrier' ? carrier : pl.frame === 'e3' ? e3frame : fixed;
    add(parent, holder, info);
    gearObjs[id] = holder;
  }

  // b1: Mittelscheibe (1,2 mm), an die die 4 Speichen genietet sind (Freeth 2021, S6.2.2)
  {
    const h = new THREE.Group(); const dsk = new THREE.Mesh(disc(S.disc.r, S.disc.t, 2.2), mat.bronzeDark); dsk.position.z = B1F; h.add(dsk);
    for (let k = 0; k < 4; k++) for (const off of [-0.32, 0.32]) {
      const a = (SPOKE.A + k * 90) * DEG + off, rv = new THREE.Mesh(cylZ(0.7, B1F + S.disc.t, B1F + S.disc.t + 0.35, 10), mat.bronzeDark);
      rv.position.set(Math.cos(a) * 10.5, Math.sin(a) * 10.5, 0); h.add(rv);
    }
    gearObjs.b1.add(h); tag(h, { kind: 'part', id: 'b1-disc', assembly: 'AM-230', evidence: 'E1' });
  }
  // Scheiben mit Stift: Merkur an 20 (L7), Venus an 63 (Fragment D, angenietet); Stift nach hinten bis zum Folger
  const DISK_INFO = { Me: { gid: 'Me-20', asm: 'AM-311', ev: 'E3', fl: Ly.L5 }, Ve: { gid: 'r1', asm: 'AM-312', ev: 'E1', fl: Ly.L6 } };
  for (const [k, d] of Object.entries(DISK_INFO)) {
    const z0 = PLACE[d.gid].z, ds = S.disks[k], h = new THREE.Group();
    const dm = new THREE.Mesh(disc(ds.r, Ly.L7.t), mat.bronze); dm.position.z = Ly.L7.z0 - z0; h.add(dm);
    h.add(new THREE.Mesh(cylZ(0.55, d.fl.c - z0, Ly.L7.z0 - z0, 10), mat.bronzeDark).translateX(ds.pin));
    if (k === 'Ve') for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.4; h.add(new THREE.Mesh(cylZ(0.5, Ly.L7.z0 - z0 - 0.2, Ly.L8.z1 - z0 + 0.2, 8), mat.bronzeDark).translateX(Math.cos(a) * 12).translateY(Math.sin(a) * 12)); }
    gearObjs[d.gid].add(h); tag(h, { kind: 'part', id: `disk-${k}`, assembly: d.asm, evidence: d.ev });
  }

  // Kronrad a1 (Antrieb) mit Vierkant-Aussparung + aufsteckbare Kurbel
  {
    const [ring, disk] = crownGeometry(48, moduleOf('a1'));
    const a1 = new THREE.Group();
    a1.add(new THREE.Mesh(ring, mat.bronze), new THREE.Mesh(disk, mat.bronze));
    a1.rotation.y = -Math.PI / 2; // Zahnseite zeigt Richtung b1 (-x)
    const holder = new THREE.Group(); holder.add(a1); holder.position.set(A1.x + 2.5, A1.y, A1.z);
    add(fixed, holder, { kind: 'gear', id: 'a1', teeth: 48, assembly: 'AM-200', evidence: 'E1', label: 'a1 · 48 Zähne (Kronrad)', func: GEAR.a1.function, axis: 'x' });
    gearObjs.a1 = holder;
    const crank = new THREE.Group();
    const key = new THREE.Mesh(new THREE.BoxGeometry(7, 3.1, 3.1), mat.bronzeDark); key.position.x = 1.0;  // Vierkant steckt in a1
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 36, 16), mat.bronzeDark); shaft.rotation.z = Math.PI / 2; shaft.position.x = 22;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 34, 4), mat.bronzeDark); arm.position.set(40, 15, 0);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 18, 20), mat.wood); knob.rotation.z = Math.PI / 2; knob.position.set(49, 30, 0);
    crank.add(key, shaft, arm, knob);
    const ch = new THREE.Group(); ch.add(crank); ch.position.set(A1.x + 2.5, A1.y, A1.z);
    add(fixed, ch, { kind: 'part', id: 'crank', assembly: 'AM-210', evidence: 'E4', explodeDir: [1, 0] });
    gearObjs.crank = ch;
  }

  // ------------------------------------------------ Wellen hinter b1: von der Hauptplatte bis zum letzten Rad,
  // Zeigerwellen durch die Rückplatte. Verlängert wird nur, wo kein anderes Rad im Weg ist.
  const ZB_PTR = PLATE.zBack - PLATE.t - 0.6, MAIN_BACK = MAIN.zf - MAIN.t;
  const backDiscs = Object.entries(PLACE).filter(([id, p]) => GEAR[id] && (!p.frame || p.frame === 'e3') && id !== 'b1').map(([id, p]) => {
    const tip = pitchR(id) + 1.36 * moduleOf(id), z = [p.z - thickOf(id) / 2, p.z + thickOf(id) / 2];
    return p.frame === 'e3' ? { id, c: ARBORS.E, rIn: Math.max(0, Math.hypot(...p.at) - tip), rOut: Math.hypot(...p.at) + tip, z } : { id, c: p.at, rIn: 0, rOut: tip, z, arbor: p.arbor };
  });
  const blocked = (at, ids, za, zb) => backDiscs.some((d) => !ids.includes(d.id) && d.z[1] > za && d.z[0] < zb && (() => { const r = Math.hypot(at[0] - d.c[0], at[1] - d.c[1]); return r < d.rOut + 1 && r > d.rIn - 1; })());
  const POINTER_ARBORS = new Set(['N', 'G', 'O', 'Q', 'I'].map((k) => ARBORS[k].map((v) => v.toFixed(2)).join(',')));
  const arborZ = {};
  for (const [id, pl] of Object.entries(PLACE)) {
    if (pl.frame) continue;
    const k = `${pl.at[0].toFixed(2)},${pl.at[1].toFixed(2)}`;
    const a = (arborZ[k] ??= { at: pl.at, z: [], ids: [], key: k }); a.z.push(pl.z); a.ids.push(id);
  }
  for (const a of Object.values(arborZ)) {
    let z0 = Math.min(...a.z) - 1.5, z1 = Math.max(...a.z) + 1.5;
    if (a.ids.includes('b1')) z1 = B1F;                                      // Achse b: endet in b1
    else if (!blocked(a.at, a.ids, z1, MAIN_BACK)) z1 = MAIN_BACK + MAIN.t * 0.6; // Lager in der Hauptplatte
    if (POINTER_ARBORS.has(a.key) && !blocked(a.at, a.ids, ZB_PTR, z0)) z0 = ZB_PTR;   // durch die Rückplatte zum Zeiger
    part(fixed, cylZ(0.9, z0, z1, 10), mat.bronzeDark, { id: 'arbor', assembly: 'AM-150', evidence: 'E3' });
  }
  // Wellen der Epizykel-Räder (drehen mit b1)
  for (const a of carrierArbors()) part(carrier, cylZ(0.8, a.z0, a.z1, 10), mat.bronzeDark, { id: 'arbor-c', assembly: 'AM-150', evidence: 'E3' }, [a.at[0], a.at[1], 0]);

  // ------------------------------------------------ Hauptplatte, Halter, Abstandsstreifen (Freeth 2021, S5.5.2)
  {
    const { w, yMin, yMax } = PLATE;
    const holes = [[0, 0, 2.6], ...Object.entries(ARBORS).filter(([k]) => k !== 'B').map(([, p]) => [p[0], p[1], 1.05])];
    part(fixed, plateGeo([[-w / 2, yMin], [w / 2, yMin], [w / 2, yMax], [-w / 2, yMax]], MAIN.t, holes), mat.plate, { id: 'mainplate', assembly: 'AM-151', evidence: 'E1' }, [0, 0, MAIN.zf - MAIN.t]);
    for (const ang of S.holders) {
      const geos = [
        boxAt(6, 8, 1.0, 70, 0, MAIN.zf + 0.5),                                   // Fuß, genietet
        boxAt(1.6, 6, B1F + 0.8 - MAIN.zf, 66.6, 0, (MAIN.zf + B1F + 0.8) / 2),     // Steg neben dem Zahnkranz
        boxAt(6.6, 6, 0.8, (60.8 + 67.4) / 2, 0, B1F + 0.4),                       // Lasche über dem Kranz von b1
        cylZ(0.9, MAIN.zf + 1.0, MAIN.zf + 1.4, 10).translate(71, 0, 0),
      ];
      const h = part(fixed, geos, mat.bronzeDark, { id: 'holder', assembly: 'AM-151', evidence: 'E1' }); h.rotation.z = ang * DEG;
    }
    S.strips.forEach((ang, i) => {
      const geos = [boxAt(10, 3, 0.6, 60.5, 0, MAIN.zf + 0.3)];
      if (i < 3) geos.push(cylZ(0.6, MAIN.zf + 0.6, MAIN.zf + 0.75, 8).translate(56.5, 0, 0), cylZ(0.6, MAIN.zf + 0.6, MAIN.zf + 0.75, 8).translate(64.5, 0, 0));
      const h = part(fixed, geos, mat.bronze, { id: i < 3 ? 'strip-riveted' : 'strip-soldered', assembly: 'AM-151', evidence: 'E1' }); h.rotation.z = ang * DEG;
    });
    // Festrohr durch b1 (trägt die Festräder 51 und 49), an der Hauptplatte befestigt
    part(fixed, cylZ(TUBE.fixed, MAIN_BACK, Ly.L2.z1, 24), mat.bronzeDark, { id: 'fixedtube', assembly: 'AM-156', evidence: 'E3' });
  }

  // ------------------------------------------------ Säulen, Strap, Kreisplatte (drehen mit b1)
  {
    const pillar = (at, len, shoulder, id, asm) => {
      const geos = [cylZ(1.2, B1F, B1F + shoulder, 12), cylZ(S.pillar.rad * 0.8, B1F + shoulder, B1F + len, 12)];
      const pin = new THREE.CylinderGeometry(0.3, 0.3, 3.4, 6); pin.rotateZ(Math.atan2(at[1], at[0])); pin.translate(0, 0, B1F + len - 1.0); geos.push(pin);
      part(carrier, geos, mat.bronzeDark, { id, assembly: asm, evidence: 'E1' }, [at[0], at[1], 0]);
    };
    S.shortP.at.forEach((at) => pillar(at, S.shortP.len, S.shortP.shoulder, 'pillar-short', 'AM-152'));
    S.longP.at.forEach((at) => pillar(at, S.longP.len, S.longP.shoulder, 'pillar-long', 'AM-153'));
    // Strap: rechteckig, 25,3 mm breit (wie die D-Platte), Enden dem Kranz folgend, 11° schräg zu den Speichen
    const st = S.strap, hw = st.w / 2, ue = Math.sqrt(st.r ** 2 - hw ** 2), pts = [];
    const a0 = Math.atan2(-hw, ue), a1 = Math.atan2(hw, ue);
    for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; pts.push(xyStrap(st.r * Math.cos(a), st.r * Math.sin(a))); }
    for (let i = 0; i <= 12; i++) { const a = Math.PI + a0 + (a1 - a0) * i / 12; pts.push(xyStrap(st.r * Math.cos(a), st.r * Math.sin(a))); }
    part(carrier, plateGeo(pts, st.t, [[0, 0, st.hole]]), mat.plate, { id: 'strap', assembly: 'AM-152', evidence: 'E3' }, [0, 0, st.z0]);
    // D-Platte (Fragment D: 25,3 mm breit, 1,0 mm), an die Rückseite des Straps gelötet; Lager für 26 und 63
    const dp = S.dplate, dpts = [[dp.along[0], -hw], [dp.along[1], -hw], [dp.along[1], hw], [dp.along[0], hw]].map(([u, v]) => xyStrap(u, v));
    part(carrier, plateGeo(dpts, dp.t), mat.bronze, { id: 'dplate', assembly: 'AM-154', evidence: 'E1' }, [0, 0, st.z0 - dp.t]);
    // Kreisplatte CP auf den langen Säulen
    part(carrier, disc(S.cp.r, S.cp.t, S.cp.hole, 96), mat.plate, { id: 'CP', assembly: 'AM-153', evidence: 'E3' }, [0, 0, S.cp.z0]);
    // Steg der mittleren Sonne: vom durchbohrten Block auf Speiche D über die Festräder zur Mitte (Freeth 2021, S6.2.6)
    {
      const u = SPOKE.D * DEG, c = Math.cos(u), sn = Math.sin(u), len = S.steg.r + 2 + 3, mid = (S.steg.r + 2 - 3) / 2;
      const bar = new THREE.BoxGeometry(len, S.steg.w, Ly.L3.t); bar.rotateZ(u); bar.translate(c * mid, sn * mid, Ly.L3.c);
      const block = new THREE.BoxGeometry(4.4, 4.4, Ly.L3.z0 - B1F); block.rotateZ(u); block.translate(c * S.steg.r, sn * S.steg.r, (B1F + Ly.L3.z0) / 2);
      const pin = new THREE.CylinderGeometry(0.35, 0.35, 6, 6); pin.rotateZ(u); pin.translate(c * S.steg.r, sn * S.steg.r, (B1F + Ly.L3.z0) / 2);
      const hubR = disc(2.2, Ly.L3.t, TUBE.moon + 0.1, 24); hubR.translate(0, 0, Ly.L3.z0);
      part(carrier, [bar, block, hubR], mat.bronzeDark, { id: 'steg', assembly: 'AM-350', evidence: 'E3' });
      part(carrier, pin, mat.bronze, { id: 'steg', assembly: 'AM-350', evidence: 'E1' });
    }
    // Halter der langen Welle 44 + 34 auf Speiche C (erhöhte Fläche mit Niet bei 46,2 mm)
    {
      const u = SPOKE.C * DEG, c = Math.cos(u), sn = Math.sin(u), r0 = 25.6, r1 = S.bracketC, mid = (r0 + r1) / 2;
      const post = cylZ(1.2, B1F, Ly.L7.z1, 12); post.translate(c * r1, sn * r1, 0);
      const arm = new THREE.BoxGeometry(r1 - r0, 3, Ly.L7.t); arm.rotateZ(u); arm.translate(c * mid, sn * mid, Ly.L7.c);
      const boss = cylZ(1.6, Ly.L7.z0, Ly.L7.z1, 12); boss.translate(c * r0, sn * r0, 0);
      part(carrier, [post, arm, boss], mat.bronzeDark, { id: 'bracketC', assembly: 'AM-154', evidence: 'E1' });
    }
  }

  // ------------------------------------------------ Unterplatte (fest) mit Festrad 56, Rohrbündel
  {
    const sp = S.sub, hw = sp.w / 2, hh = sp.h / 2;
    const geos = [plateGeo([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], sp.t, [[0, 0, sp.bore]]).translate(0, 0, sp.z0)];
    const hubG = disc(6.5, sp.z0 - Ly.CPF.z1, sp.bore, 32); hubG.translate(0, 0, Ly.CPF.z1); geos.push(hubG);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.785; geos.push(cylZ(0.5, Ly.CPF.c, sp.z0 + sp.t + 0.2, 8).translate(Math.cos(a) * 5.4, Math.sin(a) * 5.4, 0)); }
    part(fixed, geos, mat.plate, { id: 'subplate', assembly: 'AM-155', evidence: 'E3' });
  }
  const zc = PLATE.zFront + PLATE.t + 0.2;   // Ebene der Ringe
  const ZB0 = zc + 0.6;               // Ebene von b0 (Mondphase)
  {
    const T = TUBE, ring = (i) => zc + i * 0.05;
    const tubes = [
      ['tube-moon', T.moon, PLACE.b3.z, ZB0 + 0.6, 'AM-430'], ['tube-sunMean', T.sunMean, Ly.L3.z0, ZB0 - 0.5, 'AM-340'],
      ['tube-Dr', T.Dr, Ly.L4.z0, zc - 0.6, 'AM-340'], ['tube-Me', T.Me, Ly.L5.z0, ring(0), 'AM-340'], ['tube-Ve', T.Ve, Ly.L6.z0, ring(1), 'AM-340'],
      ['tube-sunTrue', T.sunTrue, S.strap.z0 + S.strap.t, ring(2), 'AM-340'], ['tube-Ma', T.Ma, Ly.s1.z0, ring(3), 'AM-340'],
      ['tube-Ju', T.Ju, Ly.s3.z0, ring(4), 'AM-340'], ['tube-Sa', T.Sa, Ly.s4.z0, ring(5), 'AM-340'], ['tube-date', T.date, S.cp.z0 + S.cp.t, ring(6), 'AM-340'],
    ];
    for (const [id, r, z0, z1, asm] of tubes) part(fixed, cylZ(r, z0, z1, 24), mat.bronzeDark, { id, assembly: asm, evidence: 'E3' });
  }
  // Folger von Merkur (L5) und Venus (L6): Arm mit Schlitz, dreht auf der Mittelachse und trägt das Planetenrohr
  const followers = {};
  for (const [k, gid, L, tube] of [['Me', 'Me-20', Ly.L5, TUBE.Me], ['Ve', 'r1', Ly.L6, TUBE.Ve]]) {
    const c = Math.hypot(...PLACE[gid].at), pin = S.disks[k].pin, len = c + pin + 2.5, s0 = Math.max(4, c - pin - 1.2), s1 = c + pin + 1.0;
    const sh = new THREE.Shape(); sh.moveTo(-1.9, -3.0); sh.lineTo(1.9, -3.0); sh.lineTo(1.9, len); sh.lineTo(-1.9, len); sh.closePath();
    const slot = new THREE.Path(); slot.moveTo(0.7, s0); slot.lineTo(0.7, s1); slot.lineTo(-0.7, s1); slot.lineTo(-0.7, s0); slot.closePath(); sh.holes.push(slot);
    const bore = new THREE.Path(); bore.absarc(0, 0, tube, 0, TAU, true); sh.holes.push(bore);
    const g = new THREE.ExtrudeGeometry(sh, { depth: L.t, bevelEnabled: false }); g.translate(0, 0, L.z0);
    const h = part(fixed, [g, disc(tube + 1.0, L.t, tube, 24).translate(0, 0, L.z0)], mat.bronzeDark, { id: `follower-${k}`, assembly: k === 'Me' ? 'AM-311' : 'AM-312', evidence: 'E3' });
    followers[k] = h;
  }

  const front = buildFront(mat, add, fixed, texts);
  const back = buildBack(mat, add, fixed);
  const box = buildCase(mat, add, fixed);
  const covers = buildCovers(mat, add, fixed, texts);
  return { root, parts, gearObjs, carrier, e3frame, front, back, box, covers, followers, texts };
}

// ---------------------------------------------------------------- Texturen
function canvasTex(size, draw, h = size) {
  const c = document.createElement('canvas'); c.width = size; c.height = h;
  const g = c.getContext('2d'); draw(g, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// Ring-Textur: planare UV von RingGeometry -> Kreis mit Radius rOut füllt die Textur. Koordinaten in mm, y nach oben.
function ringTexture(rOut, rIn, draw) {
  const S = 2048, k = S / (2 * rOut);
  return engravedTexture(S, S, (g, st) => { g.translate(S / 2, S / 2); g.scale(k, -k); draw(g, st, rIn, rOut); });
}
function textAt(g, st, text, r, angTop, size) { // angTop: im Uhrzeigersinn ab oben (rad)
  g.save(); g.rotate(-angTop); g.translate(0, r); g.scale(1, -1); engraveText(g, st, text, 0, 0, size); g.restore();
}
function tick(g, st, a, r0, r1, w) { engraveStroke(g, st, () => { g.beginPath(); g.moveTo(Math.sin(a) * r0, Math.cos(a) * r0); g.lineTo(Math.sin(a) * r1, Math.cos(a) * r1); }, w); }
const fitSize = (text, maxW, base) => Math.min(base, maxW / Math.max(1, text.length * 0.68));

export function zodiacTexture() {
  const [zi, zo] = FRONT.zodiac, names = deviceText().zodiac;
  return ringTexture(zo, zi, (g, st, ri, ro) => {
    for (let d = 0; d < 360; d++) { const a = d / 360 * TAU; tick(g, st, a, ro, d % 30 === 0 ? ri : ro - (d % 5 === 0 ? 2.4 : 1.3), d % 30 === 0 ? 0.3 : 0.16); }
    const r = (ri + ro) / 2 - 1.2, arc = (TAU * r) / 12 * 0.8;
    names.forEach((n, i) => textAt(g, st, n, r, (i * 30 + 15) / 360 * TAU, fitSize(n, arc, 3.0)));
  });
}
export function calendarTexture() {
  const [ci, co] = FRONT.calendar, names = deviceText().egMonths;
  return ringTexture(co, ci, (g, st, ri, ro) => {
    for (let d = 0; d < 365; d++) { const a = d / 365 * TAU; const major = d % 30 === 0 || d === 360; tick(g, st, a, ro, major ? ri : ro - 1.7, major ? 0.28 : 0.13); }
    const r = (ri + ro) / 2 - 1.1;
    names.forEach((n, i) => { const span = i === 12 ? 5 : 30; textAt(g, st, n, r, ((i * 30 + span / 2) / 365) * TAU, fitSize(n, (TAU * r) * span / 365 * 0.85, 2.7)); });
  });
}
export function backTexture() {
  const D = deviceText();
  const { w, yMin, yMax } = PLATE; const H = yMax - yMin;
  const S = 1400, k = S / w, Hpx = Math.round(H * k);
  const toC = (x, y) => [S / 2 - x * k, (yMax - y) * k]; // Rückansicht: Leinwand-x = Welt -x
  return engravedTexture(S, Hpx, (g, st) => {
    const spiral = (sp) => {
      const [cx, cy] = toC(...sp.c); const pitch = (sp.r1 - sp.r0) / sp.turns; const rAt = (t) => sp.r0 + pitch * t; const a0 = (sp.start ?? 0) * Math.PI / 180;
      for (const off of [-0.5, 0.5]) engraveStroke(g, st, () => {
        g.beginPath();
        for (let i = 0; i <= sp.turns * 360; i++) { const t = i / 360, a = t * TAU, r = (rAt(t) + off * pitch * 0.9) * k; const x = cx + Math.sin(a + a0) * r, y = cy - Math.cos(a + a0) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      }, 0.35 * k);
      for (let c = 0; c <= sp.cells; c++) {
        const t = c / sp.cells * sp.turns, a = t * TAU + a0, r0 = (rAt(t) - pitch * 0.45) * k, r1 = (rAt(t) + pitch * 0.45) * k;
        engraveStroke(g, st, () => { g.beginPath(); g.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); g.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); }, 0.16 * k);
      }
    };
    spiral(BACK.metonic); spiral(BACK.saros);
    // Finsternis-Glyphen in der Saros-Spirale: Σ/Η (bzw. M/S) und Indexbuchstabe (Iversen & Jones 2019)
    {
      const sp = BACK.saros, [cx, cy] = toC(...sp.c), pitch = (sp.r1 - sp.r0) / sp.turns, a0 = (sp.start ?? 0) * Math.PI / 180;
      for (const gl of Object.values(GLYPH_BY_CELL)) {
        const t = (gl.cell - 0.5) / sp.cells * sp.turns, a = a0 + t * TAU, r = sp.r0 + pitch * t;
        const w = (TAU * r) / (sp.cells / sp.turns) * 0.86;
        const mark = (s, ch) => (s ? ch + (s === 'unsicher' ? '?' : '') : '');
        const top = [mark(gl.lunar, D.glyphL), mark(gl.solar, D.glyphS)].filter(Boolean).join(' ');
        g.save(); g.translate(cx, cy); g.rotate(a); g.translate(0, -r * k); g.rotate(Math.PI);
        engraveText(g, st, top, 0, (gl.index ? -0.85 : 0) * k, fitSize(top, w, 1.45) * k);
        if (gl.index) engraveText(g, st, gl.index, 0, 1.05 * k, fitSize(gl.index, w, 1.2) * k);
        g.restore();
      }
    }
    // Monatsnamen in den 235 Zellen der Metonischen Spirale; Jahresbeginn mit Jahreszeichen (Freeth 2008)
    {
      const sp = BACK.metonic, [cx, cy] = toC(...sp.c), pitch = (sp.r1 - sp.r0) / sp.turns, a0 = sp.start * Math.PI / 180;
      METONIC_CELLS.forEach((cell, i) => {
        const t = (i + 0.5) / sp.cells * sp.turns, a = a0 + t * TAU, r = sp.r0 + pitch * t;
        const w = (TAU * r) / (sp.cells / sp.turns) * 0.86, name = D.metMonths[cell.month - 1];
        const first = cell.month === 1 && !cell.intercalary;
        // Buchstabenoberkante zur Mitte hin (wie auf der Spiele-Anzeige belegt, Freeth 2008, 3.5)
        g.save(); g.translate(cx, cy); g.rotate(a); g.translate(0, -r * k); g.rotate(Math.PI);
        engraveText(g, st, name, 0, (first ? 0.95 : 0) * k, fitSize(name, w, 1.3) * k);
        if (first) { const ym = D.yearMark(cell.year); engraveText(g, st, ym, 0, -1.05 * k, fitSize(ym, w, 1.25) * k); }
        g.restore();
      });
    }
    // Nebenzifferblätter: Sektorgrenzen ab sd.start (Grad, im Uhrzeigersinn von oben, Ansicht von hinten), sd.dir = ±1
    const sub = (sd, labels, n) => {
      const [cx, cy] = toC(...sd.c), r = sd.r * k; const s0 = sd.start * Math.PI / 180, dir = sd.dir;
      engraveStroke(g, st, () => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); }, 0.3 * k);
      for (let i = 0; i < n; i++) {
        const a = s0 + (i / n) * TAU * dir;
        engraveStroke(g, st, () => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * r, cy - Math.cos(a) * r); }, 0.22 * k);
        const am = s0 + ((i + 0.5) / n) * TAU * dir; const L = labels[i]; const lines = Array.isArray(L) ? L : [L];
        lines.forEach((t, j) => { if (t) engraveText(g, st, t, cx + Math.sin(am) * r * 0.56, cy - Math.cos(am) * r * 0.56 + (j - (lines.length - 1) / 2) * 1.7 * k, fitSize(t, sd.r * 0.95, 1.45) * k); });
      }
    };
    sub(BACK.games, D.games, 4); sub(BACK.callippic, D.callippic, 4); sub(BACK.exeligmos, D.exeligmos, 3);
    if (D.metonicTitle) { const [mx, my] = toC(BACK.metonic.c[0], BACK.metonic.c[1] + BACK.metonic.r1 + 4.5); engraveText(g, st, D.metonicTitle, mx, my, 2.6 * k); }
    if (D.sarosTitle) { const [sx, sy] = toC(BACK.saros.c[0], BACK.saros.c[1] - BACK.saros.r1 - 5); engraveText(g, st, D.sarosTitle, sx, sy, 2.6 * k); }
  });
}
const dialMat = (tex, env) => new THREE.MeshStandardMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 1.6, metalness: 0.35, roughness: 0.6, envMap: env, side: THREE.DoubleSide });

/** Gerätebeschriftung neu erzeugen (nach Sprachwechsel oder wenn Schriften geladen sind). */
export function refreshDeviceText(M) {
  const swap = (mesh, tex) => { const m = mesh.userData.mat0 || mesh.material; m.map?.dispose(); m.bumpMap?.dispose(); m.map = tex.map; m.bumpMap = tex.bump; m.needsUpdate = true; };
  swap(M.front.zodiacMesh, zodiacTexture()); swap(M.front.calendarMesh, calendarTexture()); swap(M.back.faceMesh, backTexture());
  for (const t of M.texts) swap(t.mesh, t.make());
}

// Parapegma-Platte: zwei Spalten, je einem Viertel des Tierkreises zugeordnet (Freeth 2021, S6.1.3;
// Bitsakis & Jones). Überschrift = Tierkreiszeichen, darunter angedeutete Zeilen mit Indexbuchstaben.
// Der Wortlaut der Einträge ist hier NICHT wiedergegeben (schematisch).
const IDX_GR = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ', IDX_LAT = 'ABCDEFGHIJKLMNOPQRSTUVWX';
function scribble(g, st, x0, x1, y, k, seed) { // angedeutete Schriftzeile aus kurzen Strichen
  let x = x0, r = seed;
  while (x < x1) { r = (r * 9301 + 49297) % 233280; const len = (0.6 + 2.4 * (r / 233280)) * k; const e = Math.min(x + len, x1);
    engraveStroke(g, st, () => { g.beginPath(); g.moveTo(x, y); g.lineTo(e, y); }, 0.32 * k); x = e + 0.9 * k; }
}
export function parapegmaTexture(wmm, hmm, cols, idx0) {
  const D = deviceText(), k = 9, W = Math.round(wmm * k), H = Math.round(hmm * k), IDX = D === DEVICE_ORIG() ? IDX_GR : IDX_LAT;
  return engravedTexture(W, H, (g, st) => {
    engraveStroke(g, st, () => { g.beginPath(); g.rect(1.2 * k, 1.2 * k, W - 2.4 * k, H - 2.4 * k); }, 0.35 * k);
    engraveStroke(g, st, () => { g.beginPath(); g.moveTo(W / 2, 1.2 * k); g.lineTo(W / 2, H - 1.2 * k); }, 0.3 * k);
    let n = idx0;
    cols.forEach((signs, ci) => {
      const x0 = ci * W / 2 + 3.5 * k, x1 = (ci + 1) * W / 2 - 3 * k, rows = signs.length * 3, dy = (H - 5 * k) / rows;
      signs.forEach((si, j) => {
        const y = 2.5 * k + dy * (j * 3 + 0.5);
        engraveText(g, st, D.zodiac[si], (x0 + x1) / 2, y, Math.min(2.6, dy / k * 0.62) * k);
        for (let l = 1; l <= 2; l++) {
          const yl = y + dy * l; engraveText(g, st, IDX[n % IDX.length], x0 + 1.2 * k, yl, Math.min(2.2, dy / k * 0.55) * k); n++;
          scribble(g, st, x0 + 3.5 * k, x1 - (l === 2 ? 12 : 4) * k, yl, k, si * 7 + l * 13 + ci);
        }
      });
    });
  });
}
// Vorderdeckel-Inschrift (FCI, außen): Abschnitte für die Planeten in kosmologischer Reihenfolge,
// belegt sind u. a. die Zahlen 462 (Venus) und 442 (Saturn) (Freeth 2021, S2.4). Zeilen schematisch.
export function frontCoverTexture(size) {
  const D = deviceText(), k = 8, W = Math.round(size * k);
  return engravedTexture(W, W, (g, st) => {
    const names = D.planetsGen, nums = D.fciNums, sec = (W - 10 * k) / names.length;
    names.forEach((nm, i) => {
      const y0 = 5 * k + i * sec;
      engraveText(g, st, nm, W / 2, y0 + 2.2 * k, 3.0 * k);
      const lines = Math.floor((sec - 5 * k) / (3.2 * k));
      for (let l = 0; l < lines; l++) {
        const y = y0 + 5.6 * k + l * 3.2 * k;
        if (nums[i] && l === 1) { engraveText(g, st, nums[i], 14 * k, y, 2.4 * k); scribble(g, st, 20 * k, W - 8 * k, y, k, i * 31 + l); }
        else scribble(g, st, 8 * k, W - (l === lines - 1 ? 40 : 8) * k, y, k, i * 31 + l);
      }
    });
  });
}
// Rückdeckel-Inschrift (BCI, innen): Beschreibung der Anzeigen; hier nur angedeutete Zeilen in zwei Spalten
export function backCoverTexture(w, h) {
  const k = 5, W = Math.round(w * k), H = Math.round(h * k);
  return engravedTexture(W, H, (g, st) => {
    for (let c = 0; c < 2; c++) for (let y = 12 * k, l = 0; y < H - 10 * k; y += 3.4 * k, l++) {
      const x0 = (c === 0 ? 10 : w / 2 + 4) * k, x1 = (c === 0 ? w / 2 - 4 : w - 10) * k;
      if (l % 11 === 10) continue; scribble(g, st, x0, x1 - ((l * 37) % 5) * 3 * k, y, k, l * 17 + c);
    }
  });
}

function buildFront(mat, add, parent, texts) {
  const out = {};
  const zf = PLATE.zFront;
  const s = new THREE.Shape();
  const { w, yMin, yMax } = PLATE;
  s.moveTo(-w / 2, yMin); s.lineTo(w / 2, yMin); s.lineTo(w / 2, yMax); s.lineTo(-w / 2, yMax); s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, FRONT.cosmosHole, 0, TAU, true); s.holes.push(hole);
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: PLATE.t, bevelEnabled: false, curveSegments: 64 }), mat.plate);
  const ph = new THREE.Group(); ph.add(plate); ph.position.z = zf;
  add(parent, ph, { kind: 'part', id: 'frontplate', assembly: 'AM-120', evidence: 'E1' });
  const zs = zf + PLATE.t; // Oberfläche der Frontplatte

  // Lochkreis (354 Löcher) unter dem Kalenderring
  const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 6), mat.bronzeDark, 354);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 354; i++) { const a = (i / 354) * TAU; m4.makeRotationX(Math.PI / 2); m4.setPosition(Math.sin(a) * FRONT.holesR, Math.cos(a) * FRONT.holesR, 0); holes.setMatrixAt(i, m4); }
  const hh = new THREE.Group(); hh.add(holes); hh.position.z = zs + 0.1;
  add(parent, hh, { kind: 'part', id: 'holes', assembly: 'AM-720', evidence: 'E1' });

  const [zi, zo] = FRONT.zodiac;
  const zr = new THREE.Mesh(new THREE.RingGeometry(zi, zo, 256), dialMat(zodiacTexture(), mat.bronze.envMap));
  const zh = new THREE.Group(); zh.add(zr); zh.position.z = zs + 0.3;
  add(parent, zh, { kind: 'dial', id: 'zodiac', assembly: 'AM-710', evidence: 'E1' });
  out.zodiac = zh; out.zodiacMesh = zr;

  const [ci, co] = FRONT.calendar;
  const cr = new THREE.Mesh(new THREE.RingGeometry(ci, co, 256), dialMat(calendarTexture(), mat.bronze.envMap));
  const ch = new THREE.Group(); ch.add(cr); ch.position.z = zs + 0.6;
  add(parent, ch, { kind: 'dial', id: 'calendar', assembly: 'AM-720', evidence: 'E1' });
  out.calendar = ch; out.calendarMesh = cr;

  // Einstellmarke: radialer Strich auf der Platte knapp außerhalb des Kalenderrings bei Waage 17,7°
  // (Länge 197,7°, nahe Anfang Payni; Price 1974, Carman & Evans 2014 Abschn. 22.3; ob absichtlich, ist umstritten)
  {
    const a = 197.7 * DEG, r0 = co + 0.8, r1 = co + 4.6, g = new THREE.BoxGeometry(0.4, r1 - r0, 0.08);
    g.translate(0, (r0 + r1) / 2, 0); g.rotateZ(-a);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1b1611, roughness: 0.9, metalness: 0.2 }));
    const h = new THREE.Group(); h.add(m); h.position.z = zs + 0.04;
    add(parent, h, { kind: 'dial', id: 'fiducial', assembly: 'AM-720', evidence: 'E1' });
  }

  // Daumenriegel, die die Zifferblatt-Platte am Mechanismus halten (Fragment C, Freeth 2021 S2.3)
  for (const [x, y] of [[-85, 60], [85, 60], [-85, -60], [85, -60]]) {
    const g = new THREE.Group();
    const piv = new THREE.Mesh(cylZ(1.5, 0, 1.0, 14), mat.bronzeDark);
    const lever = new THREE.Mesh(boxAt(3.2, 10, 0.8, 0, 3.2, 1.2), mat.bronzeDark);
    const grip = new THREE.Mesh(cylZ(1.1, 1.2, 3.2, 10).translate(0, 7.2, 0), mat.bronzeDark);
    g.add(piv, lever, grip); g.position.set(x, y, zs); g.rotation.z = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    add(parent, g, { kind: 'part', id: 'catch', assembly: 'AM-160', evidence: 'E1' });
  }

  // Parapegma-Platten oberhalb und unterhalb des Zifferblatts, je zwei Spalten (je ein Viertel des Tierkreises)
  {
    const plates = [
      { id: 'parapegma-top', y0: 92, y1: 140, cols: [[9, 10, 11], [0, 1, 2]], idx0: 0 },
      { id: 'parapegma-bottom', y0: -160, y1: -92, cols: [[8, 7, 6], [5, 4, 3]], idx0: 12 },
    ];
    for (const pp of plates) {
      const W = 172, H = pp.y1 - pp.y0, make = () => parapegmaTexture(W, H, pp.cols, pp.idx0);
      // Platte liegt 0,3 mm über der Frontplatte, Schriftfläche 0,2 mm über der Platte (sonst Z-Fighting auf Mobilgeräten)
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.8), mat.plate); body.position.z = 0.7;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, H - 0.4), dialMat(make(), mat.bronze.envMap)); face.position.z = 1.3;
      const g = new THREE.Group(); g.add(body, face); g.position.set(0, (pp.y0 + pp.y1) / 2, zs);
      add(parent, g, { kind: 'part', id: pp.id, assembly: 'AM-760', evidence: 'E1' });
      texts.push({ mesh: face, make });
    }
  }

  // Kosmos-Ringe (Freeth 2021), von innen nach außen
  const rings = [['mercury', 21], ['venus', 25.5], ['sun', 30], ['mars', 34.5], ['jupiter', 39], ['saturn', 43.5], ['date', 48]];
  out.rings = {}; out.ghosts = {};
  const zc = zs + 0.2;
  rings.forEach(([key, r], i) => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.RingGeometry(r - 1.6, r + 1.6, 128), mat.bronze));
    const ev = key === 'date' ? 'E3' : ['mars', 'jupiter', 'saturn'].includes(key) ? 'E4' : 'E3';
    if (key === 'sun') {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16), mat.gold); ball.position.set(0, r, 1.2); grp.add(ball);
      const ptr = new THREE.Mesh(new THREE.BoxGeometry(1.3, FRONT.zodiac[1] - r, 0.45), mat.gold); ptr.position.set(0, (r + FRONT.zodiac[1]) / 2, 0.6); grp.add(ptr);
    } else if (key === 'date') {
      const ptr = new THREE.Mesh(new THREE.BoxGeometry(1.5, FRONT.calendar[1] - r, 0.5), mat.bronzeDark); ptr.position.set(0, (r + FRONT.calendar[1]) / 2, 1.4); grp.add(ptr);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 3), mat.bronzeDark); tip.position.set(0, FRONT.calendar[1] + 1.2, 1.4); tip.scale.z = 0.5; grp.add(tip);
    } else {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 14), mat.stones[key]); bead.position.set(0, r, 1.2); grp.add(bead);
    }
    grp.position.z = zc + i * 0.05;
    add(parent, grp, { kind: 'dial', id: `ring-${key}`, assembly: key === 'date' ? 'AM-750' : 'AM-730', evidence: ev });
    out.rings[key] = grp;
    if (key !== 'date') {
      const ghost = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), mat.ghost); ghost.renderOrder = 10;
      const gg = new THREE.Group(); ghost.position.set(0, r, 3.2); gg.add(ghost); gg.position.z = zc; gg.visible = false;
      tag(gg, { kind: 'ghost', id: `ghost-${key}` }); parent.add(gg); out.ghosts[key] = gg;
    }
  });

  // Mondphase (Freeth 2021, S6.2.4; Wright): Differential aus zwei Rädern. b0 (20) sitzt fest am Rohr der mittleren
  // Sonne, das Kronrad ma1 (20, Radius ca. 5,3 mm, Zähne zur Mittelachse hin) dreht mit dem Mondzeiger um und rollt
  // auf b0 ab. Seine radiale Welle dreht die Kugel (6 mm, halb hell/halb dunkel) einmal pro synodischem Monat.
  // Der Zeiger hängt am Zylinder um Kronrad und Kugel und reicht bis zur Tierkreisskala.
  {
    const mPh = 0.53, rP = 20 * mPh / 2, zB0 = zc + 0.6;
    // b0 auf dem Rohr der mittleren Sonne (dreht mit der mittleren Sonne)
    const b0 = new THREE.Group(); b0.add(new THREE.Mesh(spurGeometry(20, mPh, 1.0, { round: TUBE_MOON + 0.2 }), mat.bronze)); b0.position.z = zB0;
    add(parent, b0, { kind: 'gear', id: 'b0', teeth: 20, assembly: GEAR.b0?.assembly ?? 'AM-400', evidence: GEAR.b0?.evidence ?? 'E3', label: 'b0 · 20 Zähne', func: GEAR.b0?.function, note: GEAR.b0?.note, frame: 'fixed' });
    out.b0 = b0;
    const grp = new THREE.Group(), tipR = FRONT.zodiac[1] - 1.0;
    const zC = rP, [ring, disk] = crownGeometry(20, mPh), cH = 2.5 + TOOTH_H * mPh;   // Kronrad: Achse radial
    const yC = rP + cH;                                                             // Zahnspitzen bei r ≈ Teilkreis von b0
    const crown = new THREE.Group(); const ci = new THREE.Group(); ci.add(new THREE.Mesh(ring, mat.bronze), new THREE.Mesh(disk, mat.bronze)); ci.rotation.x = Math.PI / 2;
    crown.add(ci); crown.position.set(0, yC, zC); grp.add(crown);
    tag(crown, { kind: 'gear', id: 'ma1', teeth: 20, assembly: GEAR.ma1?.assembly ?? 'AM-400', evidence: GEAR.ma1?.evidence ?? 'E1', label: 'ma1 · 20 Zähne (Kronrad)', func: GEAR.ma1?.function, note: GEAR.ma1?.note });
    const yb = yC + 3.8, rOut = rP + 1.4 + 0.6, zArm = zC + rOut + 0.8;
    const axle = new THREE.CylinderGeometry(0.5, 0.5, yb - yC + 1.2, 10); axle.translate(0, (yC - 1.2 + yb) / 2, zC);
    const phaseTex = canvasTex(256, (g) => { g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1a1a1a'; g.fillRect(128, 0, 128, 128); }, 128);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 20), new THREE.MeshStandardMaterial({ map: phaseTex, roughness: 0.5, metalness: 0.1 }));
    ball.position.set(0, yb, zC); grp.add(ball);
    // Zylinder um die Kugel, vorn offen; Zeigerarm darüber, verbunden mit der Mondwelle in der Mitte
    const cyl = new THREE.CylinderGeometry(3.6, 3.6, 7.4, 24, 1, true, Math.PI / 2, Math.PI); cyl.translate(0, yb, 0); cyl.rotateY(0);
    const cm = new THREE.Mesh(cyl, mat.bronzeDark); cm.position.z = zC; grp.add(cm);
    for (const dy of [-3.7, 3.7]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.35, 8, 24), mat.bronzeDark); rim.rotation.x = Math.PI / 2; rim.position.set(0, yb + dy, zC); grp.add(rim); }
    const frame = [
      axle,
      boxAt(1.2, tipR - 3.2 + 1.5, 0.5, 0, (tipR - 3.2 - 1.5) / 2, zArm),            // Zeigerarm
      cylZ(0.9, 0.6, zArm + 0.4, 12),                                                 // Mondwelle bis zum Arm
      cylZ(2.0, zArm - 0.4, zArm + 0.6, 20),                                          // Nabe
      cylZ(0.6, zC, zArm, 8).translate(0, yb - 3.7, 0), cylZ(0.6, zC, zArm, 8).translate(0, yb + 3.7, 0), // Stützen Zylinder → Arm
    ];
    for (const g of frame) grp.add(new THREE.Mesh(g, mat.bronzeDark));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 3), mat.bronzeDark); tip.position.set(0, tipR - 1.6, zArm); tip.scale.z = 0.35; grp.add(tip);
    grp.position.z = zB0;
    add(parent, grp, { kind: 'dial', id: 'moon-pointer', assembly: 'AM-740', evidence: 'E3' });
    tag(crown, { kind: 'gear', id: 'ma1', teeth: 20, assembly: GEAR.ma1?.assembly ?? 'AM-400', evidence: GEAR.ma1?.evidence ?? 'E1', label: 'ma1 · 20 Zähne (Kronrad)', func: GEAR.ma1?.function, note: GEAR.ma1?.note });
    out.moon = grp; out.moonBall = ball; out.moonCrown = crown; out.moonTop = zB0 + zArm;
    const ghost = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), mat.ghost); ghost.renderOrder = 10;
    const gg = new THREE.Group(); ghost.position.set(0, tipR - 4, zArm + 1.5); gg.add(ghost); gg.position.z = zc; gg.visible = false; parent.add(gg); out.ghosts.moon = gg;
  }
  // Drachenzeiger (spekulativ), flach hinter den Ringen
  {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 112, 0.4), mat.bronzeDark));
    const head = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4, 3), mat.bronzeDark); head.position.set(0, 57, 0); head.scale.z = 0.2; grp.add(head);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), mat.bronzeDark); tail.position.set(0, -57, 0); tail.scale.z = 0.25; grp.add(tail);
    grp.position.z = zc - 0.6;
    add(parent, grp, { kind: 'dial', id: 'dragon', assembly: 'AM-330', evidence: 'E4' });
    out.dragon = grp;
  }
  return out;
}

function buildBack(mat, add, parent) {
  const out = {};
  const { w, yMin, yMax } = PLATE; const H = yMax - yMin;
  const geo = new THREE.PlaneGeometry(w, H); geo.rotateY(Math.PI);
  const face = new THREE.Mesh(geo, dialMat(backTexture(), mat.bronze.envMap)); out.faceMesh = face;
  face.position.set(0, (yMax + yMin) / 2, -PLATE.t - 0.05);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, PLATE.t), mat.plate); body.position.set(0, (yMax + yMin) / 2, -PLATE.t / 2);
  const ph = new THREE.Group(); ph.add(body, face); ph.position.z = PLATE.zBack;
  add(parent, ph, { kind: 'part', id: 'backplate', assembly: 'AM-130', evidence: 'E1' });

  const zb = PLATE.zBack - PLATE.t - 0.6;
  // Spiralzeiger als Schiebezeiger (Freeth 2019, nach Freeth 2006): Ein Stift an der Spitze läuft in der Nut
  // zwischen den Skalenringen, die Zeigerstange gleitet durch einen Schlitz in der Nabe.
  const pointer = (key, sp, len, at, meta) => {
    const grp = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.2, 16), mat.bronzeDark); hub.rotation.x = Math.PI / 2; grp.add(hub);
    let slide = null;
    if (sp) {
      const Lb = sp.r1 + 4; slide = new THREE.Group();
      slide.add(new THREE.Mesh(boxAt(1.1, Lb, 0.5, 0, 2 - Lb / 2, -0.9), mat.bronzeDark));            // Stange, Spitze bei +2
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 3), mat.bronzeDark); tip.position.set(0, 3.1, -0.9); tip.scale.z = 0.4; slide.add(tip);
      slide.add(new THREE.Mesh(cylZ(0.55, -0.9, 1.4, 10), mat.bronze));                                // Stift in der Nut
      grp.add(slide);
      grp.add(new THREE.Mesh(boxAt(3.6, 6.4, 0.6, 0, 0, -1.55), mat.bronzeDark));                      // Führung über der Stange
    } else grp.add(new THREE.Mesh(boxAt(1.1, len, 0.5, 0, len / 2, 0), mat.bronzeDark));
    grp.position.set(at[0], at[1], zb);
    add(parent, grp, meta); out[key] = { grp, slide, sp };
  };
  pointer('metonic', BACK.metonic, BACK.metonic.r1 + 3, BACK.metonic.c, { kind: 'dial', id: 'ptr-metonic', assembly: 'AM-840', evidence: 'E2' });
  pointer('saros', BACK.saros, BACK.saros.r1 + 3, BACK.saros.c, { kind: 'dial', id: 'ptr-saros', assembly: 'AM-840', evidence: 'E2' });
  pointer('games', null, BACK.games.r, BACK.games.c, { kind: 'dial', id: 'ptr-games', assembly: 'AM-830', evidence: 'E1' });
  pointer('callippic', null, BACK.callippic.r, BACK.callippic.c, { kind: 'dial', id: 'ptr-callippic', assembly: 'AM-830', evidence: 'E2' });
  pointer('exeligmos', null, BACK.exeligmos.r, BACK.exeligmos.c, { kind: 'dial', id: 'ptr-exeligmos', assembly: 'AM-830', evidence: 'E1' });
  return out;
}

// Gehäuse: hinten 4 mm hinter der Rückplatte, vorn 18 mm vor der Frontplatte (Platz für Zeiger und Mondphasen-Getriebe)
export const CASE_Z = [PLATE.zBack - PLATE.t - 4, PLATE.zFront + PLATE.t + 18];
function buildCase(mat, add, parent) {
  const { w, yMin, yMax } = PLATE; const H = yMax - yMin, cy = (yMax + yMin) / 2;
  const t = 6, z0 = CASE_Z[0], z1 = CASE_Z[1], D = z1 - z0, cz = (z0 + z1) / 2;
  // Holz-UV: Maserung läuft entlang der langen Seite
  const woodBox = (sx, sy, sz, alongY) => {
    const g = new THREE.BoxGeometry(sx, sy, sz); const uv = g.attributes.uv; const pos = g.attributes.position; const nrm = g.attributes.normal;
    for (let i = 0; i < uv.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i));
      const along = alongY ? y : x, across = ax > 0.5 ? z : ay > 0.5 ? z : (alongY ? x : y);
      uv.setXY(i, along / 220 + 0.13 * (alongY ? 1 : 2), across / 90 + (ax > 0.5 ? 0.3 : 0));
    }
    return g;
  };
  const walls = [
    ['left', woodBox(t, H + 2 * t, D, true), [-w / 2 - t / 2, cy, cz], [-1, 0]],
    ['right', woodBox(t, H + 2 * t, D, true), [w / 2 + t / 2, cy, cz], [1, 0]],
    ['top', woodBox(w, t, D, false), [0, yMax + t / 2, cz], [0, 1]],
    ['bottom', woodBox(w, t, D, false), [0, yMin - t / 2, cz], [0, -1]],
  ];
  return walls.map(([n, geo, p, dir]) => {
    const h = new THREE.Group(); h.add(new THREE.Mesh(geo, mat.wood)); h.position.set(...p);
    add(parent, h, { kind: 'part', id: `case-${n}`, assembly: 'AM-110', evidence: 'E4', explodeDir: dir });
    return h;
  });
}

// Deckel (Baugruppe AM-140, standardmäßig ausgeblendet). Scharniere sind nicht belegt.
// Vorderdeckel: abnehmbare Platte nur über der Kosmos-Anzeige, 128,8 mm im Quadrat, mit Zierrahmen (Fragment 3),
// Inschrift außen (Freeth 2021, S2.4.2). Rückdeckel: ganze Rückseite, Inschrift innen, Schieberiegel unten rechts
// (Fragment F, Freeth & Jones 2012).
function buildCovers(mat, add, parent, texts) {
  const out = {};
  {
    const size = 128.8, t = 1.5, z0 = CASE_Z[1] - t - 0.3, g = new THREE.Group();
    const body = new THREE.Mesh(boxAt(size, size, t, 0, 0, t / 2), mat.plate);
    const make = () => frontCoverTexture(size);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(size - 10, size - 10), dialMat(make(), mat.bronze.envMap)); face.position.z = t + 0.02;
    const fr = 4, geos = [[size + 2 * fr, fr, 0, size / 2 + fr / 2], [size + 2 * fr, fr, 0, -size / 2 - fr / 2], [fr, size, size / 2 + fr / 2, 0], [fr, size, -size / 2 - fr / 2, 0]]
      .map(([sx, sy, x, y]) => boxAt(sx, sy, 3.0, x, y, 0.5));
    const frame = new THREE.Group(); for (const geo of geos) frame.add(new THREE.Mesh(geo, mat.bronzeDark));
    g.add(body, face, frame); g.position.z = z0;
    add(parent, g, { kind: 'part', id: 'cover-front', assembly: 'AM-141', evidence: 'E3' });
    texts.push({ mesh: face, make });
    // Stützen an den Ecken bis auf die Frontplatte (Form nicht belegt)
    const zs = PLATE.zFront + PLATE.t, feet = new THREE.Group();
    for (const [x, y] of [[-63, -63], [63, -63], [-63, 63], [63, 63]]) feet.add(new THREE.Mesh(cylZ(1.2, zs, z0 - 1.0, 10).translate(x, y, 0), mat.bronzeDark));
    add(parent, feet, { kind: 'part', id: 'cover-feet', assembly: 'AM-141', evidence: 'E4' });
    out.front = g;
  }
  {
    const { w, yMin, yMax } = PLATE, H = yMax - yMin, cy = (yMax + yMin) / 2, t = 1.5, z1 = CASE_Z[0], g = new THREE.Group();
    const body = new THREE.Mesh(boxAt(w, H, t, 0, cy, -t / 2), mat.plate);
    const make = () => backCoverTexture(w - 8, H - 8);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 8, H - 8), dialMat(make(), mat.bronze.envMap)); face.position.set(0, cy, 0.02); // Innenseite
    // Schieberiegel unten rechts (von hinten gesehen = links in Weltkoordinaten): Führung + Riegel
    const bx = -w / 2 + 16, by = yMin + 10;
    const guide = new THREE.Mesh(boxAt(10, 7, 1.0, bx, by, -t - 0.5), mat.bronzeDark);
    const bolt = new THREE.Mesh(boxAt(16, 3, 1.4, bx - 6, by, -t - 1.4), mat.bronze);
    const knob = new THREE.Mesh(cylZ(1.2, -t - 3.2, -t - 2.1, 10).translate(bx, by, 0), mat.bronze);
    g.add(body, face, guide, bolt, knob); g.position.z = z1;
    add(parent, g, { kind: 'part', id: 'cover-back', assembly: 'AM-142', evidence: 'E1' });
    texts.push({ mesh: face, make });
    out.back = g;
  }
  return out;
}
