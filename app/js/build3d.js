// Prozedurale 3D-Geometrie: Zahnräder mit Dreieckszähnen, Platten, Zifferblätter, Gehäuse.
import * as THREE from '../vendor/three.module.min.js';
import { GEARS } from './generated/data.js';
import { PLACE, ARBORS, BACK, PLATE, FRONT, A1, pitchR, moduleOf, thickOf, SPOKE } from './layout.js';
import { deviceText } from './i18n.js';
import { METONIC_CELLS, GLYPH_BY_CELL } from './kinematics.js';
import { patinaTextures, oliveWood, engravedTexture, engraveStroke, engraveText } from './patina.js';

const TAU = Math.PI * 2;
const GEAR = Object.fromEntries(GEARS.gears.map((g) => [g.id, g]));

// ---------------------------------------------------------------- Materialien
export function makeMaterials(envMap) {
  const std = (color, metal, rough, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, envMap, side: THREE.DoubleSide, ...extra });
  const hatch = document.createElement('canvas'); hatch.width = hatch.height = 64;
  const g = hatch.getContext('2d'); g.fillStyle = '#1D7A6E'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#F4F5F6'; g.lineWidth = 6; for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  const hatchTex = new THREE.CanvasTexture(hatch); hatchTex.wrapS = hatchTex.wrapT = THREE.RepeatWrapping; hatchTex.repeat.set(0.15, 0.15);
  hatchTex.colorSpace = THREE.SRGBColorSpace;
  const pt = patinaTextures(1 / 60), ptPlate = patinaTextures(1 / 80);
  const pat = (color, tex, extra = {}) => std(color, 1, 1, { map: tex.map, metalnessMap: tex.mr, roughnessMap: tex.mr, ...extra });
  const wood = oliveWood();
  return {
    bronze: pat(0xffffff, pt),
    bronzeDark: pat(0xb8a890, pt),
    plate: pat(0xffffff, ptPlate),
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
function gearShape(z, m) {
  const rp = z * m / 2, h = 2.2 * m, ra = rp + 0.5 * h, rf = rp - 0.5 * h;
  const s = new THREE.Shape();
  for (let i = 0; i < z; i++) {
    const a0 = (i / z) * TAU, a1 = ((i + 0.5) / z) * TAU;
    const p0 = [Math.cos(a0) * ra, Math.sin(a0) * ra], p1 = [Math.cos(a1) * rf, Math.sin(a1) * rf];
    if (i === 0) s.moveTo(...p0); else s.lineTo(...p0);
    s.lineTo(...p1);
  }
  s.closePath();
  const bore = new THREE.Path(); bore.absarc(0, 0, Math.min(1.2, rf * 0.3), 0, TAU, true); s.holes.push(bore);
  // Speichen bei großen Rädern (b1 und e3 nachweislich 4 Speichen)
  if (z >= 60) {
    const n = 4, hub = Math.max(4, rp * 0.16), rim = rf - Math.max(2.2, rp * 0.07), sw = Math.max(1.6, rp * 0.05);
    if (rim - hub > 4) for (let k = 0; k < n; k++) {
      const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU;
      const di = sw / hub, dout = sw / rim;
      const hole = new THREE.Path();
      hole.absarc(0, 0, hub, a0 + di, a1 - di, false);
      hole.absarc(0, 0, rim, a1 - dout, a0 + dout, true);
      hole.closePath();
      s.holes.push(hole);
    }
  }
  return s;
}

const geoCache = new Map();
function spurGeometry(z, m, t = 1.4) {
  const key = `${z}-${m}-${t}`;
  if (!geoCache.has(key)) {
    const g = new THREE.ExtrudeGeometry(gearShape(z, m), { depth: t, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -t / 2); g.computeVertexNormals();
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}

// Kronrad: Zähne auf der Stirnseite eines Rings (Achse = lokale z)
function crownGeometry(z, m) {
  const rp = z * m / 2, rin = rp - 1.4, rout = rp + 1.4, base = 2.5, h = 2.2 * m;
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
  const disk = new THREE.CylinderGeometry(rin, rin, 1.2, 48, 1, false); disk.rotateX(Math.PI / 2); disk.translate(0, 0, 0.6);
  return [g, disk];
}

function tag(obj, data) { obj.userData = { ...obj.userData, ...data }; obj.traverse((o) => { o.userData = { ...o.userData, ...data }; }); return obj; }

export function buildMechanism(mat) {
  const root = new THREE.Group(); root.name = 'mechanism';
  const parts = [];        // alles, was explodiert / ein- und ausgeblendet wird
  const gearObjs = {};     // id -> Object3D
  const add = (parent, obj, info) => { tag(obj, info); parent.add(obj); parts.push(obj); obj.userData.baseZ = obj.position.z; obj.userData.basePos = obj.position.clone(); return obj; };

  const fixed = new THREE.Group(); root.add(fixed);
  const carrier = new THREE.Group(); carrier.name = 'carrier'; root.add(carrier);
  const e3frame = new THREE.Group(); e3frame.position.set(ARBORS.E[0], ARBORS.E[1], 0); root.add(e3frame);

  for (const [id, pl] of Object.entries(PLACE)) {
    const g = GEAR[id]; if (!g) continue;
    const teeth = g.teeth ?? 40;
    const m = moduleOf(id);
    const mesh = new THREE.Mesh(spurGeometry(teeth, m, thickOf(id)), mat.bronze);
    if (id === 'b1') mesh.rotation.z = SPOKE.A * Math.PI / 180; // Speiche A auf 1 Uhr (Freeth 2021)
    const holder = new THREE.Group(); holder.add(mesh);
    holder.position.set(pl.at[0], pl.at[1], pl.z);
    const info = { kind: 'gear', id, teeth: g.teeth, assembly: g.assembly, evidence: g.evidence, label: `${id} · ${g.teeth ?? '?'} Zähne`, func: g.function, note: g.note, frame: pl.frame || 'fixed' };
    const parent = pl.frame === 'carrier' ? carrier : pl.frame === 'e3' ? e3frame : fixed;
    add(parent, holder, info);
    gearObjs[id] = holder;
  }

  // Kronrad a1 (Antrieb) + Kurbel (spekulativ)
  {
    const [ring, disk] = crownGeometry(48, moduleOf('a1'));
    const a1 = new THREE.Group();
    a1.add(new THREE.Mesh(ring, mat.bronze), new THREE.Mesh(disk, mat.bronze));
    a1.rotation.y = -Math.PI / 2; // Zahnseite zeigt Richtung b1 (-x)
    const holder = new THREE.Group(); holder.add(a1); holder.position.set(A1.x + 2.5, A1.y, A1.z);
    add(fixed, holder, { kind: 'gear', id: 'a1', teeth: 48, assembly: 'AM-200', evidence: 'E1', label: 'a1 · 48 Zähne (Kronrad)', func: GEAR.a1.function, axis: 'x' });
    gearObjs.a1 = holder;
    const crank = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 40, 16), mat.bronzeDark); shaft.rotation.z = Math.PI / 2; shaft.position.x = 20;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 34, 4), mat.bronzeDark); arm.position.set(40, 15, 0);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 18, 20), mat.wood); knob.rotation.z = Math.PI / 2; knob.position.set(49, 30, 0);
    crank.add(shaft, arm, knob);
    const ch = new THREE.Group(); ch.add(crank); ch.position.set(A1.x + 2.5, A1.y, A1.z);
    add(fixed, ch, { kind: 'part', id: 'crank', assembly: 'AM-210', evidence: 'E4', label: 'Handkurbel', func: 'Antrieb von Hand. Die Kurbel ist verloren; Form epochengerecht ergänzt.' });
    gearObjs.crank = ch;
  }

  // Wellen (dünne Achsen) im Gestell
  const arborZ = {};
  for (const [id, pl] of Object.entries(PLACE)) {
    if (pl.frame) continue;
    const k = `${pl.at[0].toFixed(2)},${pl.at[1].toFixed(2)}`;
    (arborZ[k] ??= { at: pl.at, z: [] }).z.push(pl.z);
  }
  for (const a of Object.values(arborZ)) {
    const z0 = Math.min(...a.z) - 1.5, z1 = Math.max(...a.z) + 1.5;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, z1 - z0, 10), mat.bronzeDark);
    cyl.rotation.x = Math.PI / 2; const h = new THREE.Group(); h.add(cyl); h.position.set(a.at[0], a.at[1], (z0 + z1) / 2);
    add(fixed, h, { kind: 'part', id: 'arbor', assembly: 'AM-150', evidence: 'E1', label: 'Welle', func: 'Bronzewelle (Lage schematisch).' });
  }

  // Kreisplatte (Träger der äußeren Planetenräder) auf b1
  {
    const ring = new THREE.Mesh(new THREE.RingGeometry(34, 58, 64), mat.bronzeDark);
    const h = new THREE.Group(); h.add(ring); h.position.z = 11.0; // zwischen Venus (9,9) und den vorderen CP-Rädern (12)
    add(carrier, h, { kind: 'part', id: 'CP', assembly: 'AM-150', evidence: 'E3', label: 'Kreisplatte (CP)', func: 'Trägt die Epizykelräder für Sonne, Mars, Jupiter, Saturn (Freeth 2021).' });
  }

  const front = buildFront(mat, add, fixed);
  const back = buildBack(mat, add, fixed);
  const box = buildCase(mat, add, fixed);
  return { root, parts, gearObjs, carrier, e3frame, front, back, box };
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
}

function buildFront(mat, add, parent) {
  const out = {};
  const zf = PLATE.zFront;
  const s = new THREE.Shape();
  const { w, yMin, yMax } = PLATE;
  s.moveTo(-w / 2, yMin); s.lineTo(w / 2, yMin); s.lineTo(w / 2, yMax); s.lineTo(-w / 2, yMax); s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, FRONT.cosmosHole, 0, TAU, true); s.holes.push(hole);
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: PLATE.t, bevelEnabled: false, curveSegments: 64 }), mat.plate);
  const ph = new THREE.Group(); ph.add(plate); ph.position.z = zf;
  add(parent, ph, { kind: 'part', id: 'frontplate', assembly: 'AM-120', evidence: 'E1' });

  // Lochkreis (354 Löcher) unter dem Kalenderring
  const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 6), mat.bronzeDark, 354);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 354; i++) { const a = (i / 354) * TAU; m4.makeRotationX(Math.PI / 2); m4.setPosition(Math.sin(a) * FRONT.holesR, Math.cos(a) * FRONT.holesR, 0); holes.setMatrixAt(i, m4); }
  const hh = new THREE.Group(); hh.add(holes); hh.position.z = zf + PLATE.t + 0.1;
  add(parent, hh, { kind: 'part', id: 'holes', assembly: 'AM-720', evidence: 'E1' });

  const [zi, zo] = FRONT.zodiac;
  const zr = new THREE.Mesh(new THREE.RingGeometry(zi, zo, 256), dialMat(zodiacTexture(), mat.bronze.envMap));
  const zh = new THREE.Group(); zh.add(zr); zh.position.z = zf + PLATE.t + 0.3;
  add(parent, zh, { kind: 'dial', id: 'zodiac', assembly: 'AM-710', evidence: 'E1' });
  out.zodiac = zh; out.zodiacMesh = zr;

  const [ci, co] = FRONT.calendar;
  const cr = new THREE.Mesh(new THREE.RingGeometry(ci, co, 256), dialMat(calendarTexture(), mat.bronze.envMap));
  const ch = new THREE.Group(); ch.add(cr); ch.position.z = zf + PLATE.t + 0.6;
  add(parent, ch, { kind: 'dial', id: 'calendar', assembly: 'AM-720', evidence: 'E1' });
  out.calendar = ch; out.calendarMesh = cr;

  // Kosmos-Ringe (Freeth 2021), von innen nach außen
  const rings = [['mercury', 21], ['venus', 25.5], ['sun', 30], ['mars', 34.5], ['jupiter', 39], ['saturn', 43.5], ['date', 48]];
  out.rings = {}; out.ghosts = {};
  const zc = zf + PLATE.t + 0.2;
  rings.forEach(([key, r], i) => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.RingGeometry(r - 1.6, r + 1.6, 128), mat.bronze));
    const ev = key === 'date' ? 'E3' : ['mars', 'jupiter', 'saturn'].includes(key) ? 'E4' : 'E3';
    if (key === 'sun') {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), mat.gold); ball.position.set(0, r, 1.2); grp.add(ball);
      const ptr = new THREE.Mesh(new THREE.BoxGeometry(1.3, FRONT.zodiac[1] - r, 0.45), mat.gold); ptr.position.set(0, (r + FRONT.zodiac[1]) / 2, 0.6); grp.add(ptr);
    } else if (key === 'date') {
      const ptr = new THREE.Mesh(new THREE.BoxGeometry(1.5, FRONT.calendar[1] - r, 0.5), mat.bronzeDark); ptr.position.set(0, (r + FRONT.calendar[1]) / 2, 1.4); grp.add(ptr);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 3), mat.bronzeDark); tip.position.set(0, FRONT.calendar[1] + 1.2, 1.4); grp.add(tip);
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

  // Mondzeiger mit Phasenkugel
  {
    const grp = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 18, 0.5), mat.bronzeDark); arm.position.set(0, 9, 0); grp.add(arm);
    const phaseTex = canvasTex(256, (g) => { g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1a1a1a'; g.fillRect(128, 0, 128, 128); }, 128);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 20), new THREE.MeshStandardMaterial({ map: phaseTex, roughness: 0.5, metalness: 0.1 }));
    ball.position.set(0, 12, 2.4); grp.add(ball);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.5, 20), mat.bronzeDark); hub.rotation.x = Math.PI / 2; grp.add(hub);
    grp.position.z = zc + 1.0;
    add(parent, grp, { kind: 'dial', id: 'moon-pointer', assembly: 'AM-740', evidence: 'E3' });
    out.moon = grp; out.moonBall = ball;
    const ghost = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), mat.ghost); ghost.renderOrder = 10;
    const gg = new THREE.Group(); ghost.position.set(0, 16, 4.5); gg.add(ghost); gg.position.z = zc; gg.visible = false; parent.add(gg); out.ghosts.moon = gg;
  }
  // Drachenzeiger (spekulativ)
  {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 112, 0.4), mat.bronzeDark));
    const head = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4, 3), mat.bronzeDark); head.position.set(0, 57, 0); grp.add(head);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), mat.bronzeDark); tail.position.set(0, -57, 0); grp.add(tail);
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
  const pointer = (key, sp, len, at, meta) => {
    const grp = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, len, 0.5), mat.bronzeDark); bar.position.y = len / 2; grp.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.2, 16), mat.bronzeDark); hub.rotation.x = Math.PI / 2; grp.add(hub);
    let slider = null;
    if (sp) { slider = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.2, 12), mat.bronze); slider.rotation.x = Math.PI / 2; slider.position.z = -0.8; grp.add(slider); }
    grp.position.set(at[0], at[1], zb);
    add(parent, grp, meta); out[key] = { grp, slider, sp };
  };
  pointer('metonic', BACK.metonic, BACK.metonic.r1 + 3, BACK.metonic.c, { kind: 'dial', id: 'ptr-metonic', assembly: 'AM-840', evidence: 'E3' });
  pointer('saros', BACK.saros, BACK.saros.r1 + 3, BACK.saros.c, { kind: 'dial', id: 'ptr-saros', assembly: 'AM-840', evidence: 'E3' });
  pointer('games', null, BACK.games.r, BACK.games.c, { kind: 'dial', id: 'ptr-games', assembly: 'AM-830', evidence: 'E1' });
  pointer('callippic', null, BACK.callippic.r, BACK.callippic.c, { kind: 'dial', id: 'ptr-callippic', assembly: 'AM-830', evidence: 'E2' });
  pointer('exeligmos', null, BACK.exeligmos.r, BACK.exeligmos.c, { kind: 'dial', id: 'ptr-exeligmos', assembly: 'AM-830', evidence: 'E1' });
  return out;
}

function buildCase(mat, add, parent) {
  const { w, yMin, yMax } = PLATE; const H = yMax - yMin, cy = (yMax + yMin) / 2;
  const t = 6, z0 = PLATE.zBack - PLATE.t - 4, z1 = PLATE.zFront + PLATE.t + 6, D = z1 - z0, cz = (z0 + z1) / 2;
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
