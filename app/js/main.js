import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/addons/OrbitControls.js';
import { RoomEnvironment } from '../vendor/addons/RoomEnvironment.js';
import { ASSEMBLIES, GEARS } from './generated/data.js';
import { stateAt, gearAngles, START_JD, EPOCH, RATES } from './kinematics.js';
import { PLACE, pitchR } from './layout.js';
import { buildMechanism, makeMaterials, refreshDeviceText } from './build3d.js';
import { t, td, lang, deviceLang, setLang, setDeviceLang, onLangChange, SITE_LANGS, DEVICE_LANGS, partText } from './i18n.js';
import { julianDay, formatDate, calendarName, realSky, nextEclipses, angDiff, zodiacLabel, EG_MONTHS, TROPICAL_YEAR } from './astro.js';

// ------------------------------------------------------------------ Sprache (statische Texte)
function applyStatic() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.title = lang === 'el' ? 'Μηχανισμός των Αντικυθήρων · 3D ανακατασκευή' : lang === 'en' ? 'Antikythera Mechanism · 3D reconstruction' : 'Antikythera-Mechanismus · 3D-Rekonstruktion';
}
applyStatic();
{
  const sl = document.querySelector('#siteLang');
  sl.innerHTML = Object.entries(SITE_LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join(''); sl.value = lang;
  sl.addEventListener('change', () => setLang(sl.value));
  const dl = document.querySelector('#deviceLang');
  const fillDl = () => { dl.innerHTML = Object.entries(DEVICE_LANGS).map(([k, v]) => `<option value="${k}">${v[lang] ?? v.de}</option>`).join(''); dl.value = deviceLang; };
  fillDl(); dl.addEventListener('change', () => setDeviceLang(dl.value)); onLangChange((w) => { if (w === 'site') fillDl(); });
}
import { renderMap, renderTimeline, renderResearch, renderLinks } from './content.js';
import { createIntro } from './intro.js';

const $ = (s) => document.querySelector(s);
const D2R = Math.PI / 180, TAU = Math.PI * 2;

// ------------------------------------------------------------------ Szene
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85; renderer.setClearColor(0x000000, 0);
renderer.localClippingEnabled = false;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = env;
const camera = new THREE.PerspectiveCamera(32, 1, 1, 5000);
const controls = new OrbitControls(camera, canvas);
let needRender = true, dirtyRendered = false;
export const invalidate = () => { needRender = true; };
controls.addEventListener('change', () => invalidate());
controls.enableDamping = true; controls.target.set(0, -12, 0); controls.minDistance = 60; controls.maxDistance = 2200;
const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(200, 300, 400); scene.add(key);
scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x1a1d20, 0.5));

const mat = makeMaterials(env);
const M = buildMechanism(mat);
scene.add(M.root);

// Original-Material merken (für Evidenz-Umschaltung)
M.root.traverse((o) => { if (o.isMesh) o.userData.mat0 = o.material; });

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); invalidate();
}
new ResizeObserver(resize).observe(canvas.parentElement);

// ------------------------------------------------------------------ Ansichten
const VIEWS = {
  front: { pos: [90, 30, 820], explode: 0, hide: [] },
  back: { pos: [-90, 20, -820], explode: 0, hide: [] },
  gears: { pos: [420, 200, 470], explode: 0.15, hide: ['AM-110', 'AM-120', 'AM-130', 'AM-700', 'AM-800'] },
  explode: { pos: [760, 300, 560], explode: 0.8, hide: ['AM-110'] },
};
let tween = null;
function setView(name) {
  const v = VIEWS[name];
  document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
  tween = { from: camera.position.clone(), to: new THREE.Vector3(...v.pos), t: 0 };
  $('#explode').value = v.explode; applyExplode();
  for (const a of ASSEMBLIES.assemblies) checked.set(a.id, !v.hide.includes(a.id));
  syncTreeChecks(); applyVisibility();
}
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

// ------------------------------------------------------------------ Demontage & Schnitt
function applyExplode() {
  const e = +$('#explode').value;
  for (const p of M.parts) {
    const u = p.userData; if (!u.basePos) continue;
    p.position.z = u.baseZ * (1 + 3.2 * e);
    if (u.explodeDir) { p.position.x = u.basePos.x + u.explodeDir[0] * e * 140; p.position.y = u.basePos.y + u.explodeDir[1] * e * 140; }
  }
  for (const [k, g] of Object.entries(M.front.ghosts)) g.position.z = (k === 'moon' ? M.front.moon : M.front.rings[k]).position.z;
}
$('#explode').addEventListener('input', () => { applyExplode(); invalidate(); });

const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);
$('#section').addEventListener('input', () => {
  const v = +$('#section').value;
  clip.constant = v; renderer.clippingPlanes = v >= 100 ? [] : [clip]; invalidate();
});

// ------------------------------------------------------------------ Evidenz
const EVI_TEXT = GEARS.meta.evidenzklassen;
const eviText = (k) => td('evidence', k, null, EVI_TEXT[k]);
const renderLegend = () => { $('#legend').innerHTML = Object.keys(EVI_TEXT).map((k) => `<div><span class="ev ev-${k}">${k}</span>${eviText(k).split(/ [-–] /)[0]}</div>`).join(''); };
renderLegend();
$('#evidence').addEventListener('change', () => {
  const on = $('#evidence').checked;
  M.root.traverse((o) => { if (o.isMesh && o.userData.mat0) o.material = on && o.userData.evidence && o.userData.kind !== 'ghost' ? mat.evidence[o.userData.evidence] : o.userData.mat0; });
  invalidate();
});
$('#ghosts').addEventListener('change', () => { for (const g of Object.values(M.front.ghosts)) g.visible = $('#ghosts').checked; invalidate(); });

// ------------------------------------------------------------------ Baugruppenbaum
const checked = new Map(ASSEMBLIES.assemblies.map((a) => [a.id, true]));
const parentOf = Object.fromEntries(ASSEMBLIES.assemblies.map((a) => [a.id, a.parent]));
const nameOf = (id) => td('assemblies', id, null, ASSEMBLIES.assemblies.find((a) => a.id === id)?.name ?? '');
function visibleAsm(id) { for (let a = id; a; a = parentOf[a]) if (checked.get(a) === false) return false; return true; }
function applyVisibility() { for (const p of M.parts) if (p.userData.assembly) p.visible = visibleAsm(p.userData.assembly); invalidate(); }
function buildTree() {
  const kids = {}; for (const a of ASSEMBLIES.assemblies) (kids[a.parent] ??= []).push(a);
  const node = (a) => {
    const ch = kids[a.id] || [];
    const ev = a.evidence ? `<span class="ev ev-${a.evidence}">${a.evidence}</span>` : '';
    const lab = `<input type="checkbox" data-asm="${a.id}" ${checked.get(a.id) !== false ? 'checked' : ''}> <span>${td('assemblies', a.id, null, a.name)}</span> <span class="code">${a.id}</span> ${ev}`;
    return ch.length ? `<details ${a.parent === null ? 'open' : ''}><summary>${lab}</summary>${ch.map(node).join('')}</details>` : `<div><summary class="leaf">${lab}</summary></div>`;
  };
  $('#tree').innerHTML = node(kids.null[0]);
  $('#tree').querySelectorAll('input').forEach((i) => {
    i.addEventListener('click', (e) => e.stopPropagation());
    i.addEventListener('change', () => { checked.set(i.dataset.asm, i.checked); applyVisibility(); });
  });
}
function syncTreeChecks() { document.querySelectorAll('#tree input').forEach((i) => { i.checked = checked.get(i.dataset.asm) !== false; }); }
buildTree();

// ------------------------------------------------------------------ Auswahl
const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(); let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const r = canvas.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const planes = renderer.clippingPlanes;
  const hits = ray.intersectObjects(M.root.children, true).filter((h) => {
    let o = h.object; while (o) { if (!o.visible) return false; o = o.parent; }
    return h.object.userData.kind && h.object.userData.kind !== 'ghost' && (!planes.length || planes[0].distanceToPoint(h.point) >= 0);
  });
  showInfo(hits[0]?.object.userData);
});
let infoShown = null;
const GEAR_BY_ID = Object.fromEntries(GEARS.gears.map((g) => [g.id, g]));
const fmtNum = (x, d) => x.toLocaleString(lang === 'en' ? 'en-GB' : lang === 'el' ? 'el-GR' : 'de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
function showInfo(u) {
  const el = $('#infocard'); infoShown = u || null;
  if (!u) { el.hidden = true; return; }
  let label, func, note;
  if (u.kind === 'gear') {
    label = `${u.id} · ${u.teeth ?? '?'} ${t('teeth')}`;
    func = td('gears', u.id, 'function', u.func); note = u.note ? td('gears', u.id, 'note', u.note) : '';
    const ms = GEAR_BY_ID[u.id]?.measured;
    if (ms) {
      const f = (x) => fmtNum(x, 1);
      const mid = ms.rIn != null ? (ms.rIn + ms.rOut) / 2 : null;
      note += `${note ? '<br>' : ''}${t('measured', { tip: f(ms.tip), err: f(ms.tipErr), count: ms.count, lim: ms.limits === 'definitiv' ? t('definite') : ms.limits })}`
        + (mid != null && u.id !== 'a1' ? ` ${t('measuredModel', { mid: f(mid), model: f(pitchR(u.id)) })}` : '');
    }
  } else { const pt = partText(u.id) || [u.label ?? u.id, u.func]; label = pt[0]; func = pt[1]; }
  const asm = u.assembly ? `${u.assembly} · ${nameOf(u.assembly)}` : '';
  const ev = u.evidence ? `<span class="ev ev-${u.evidence}">${u.evidence}</span>${eviText(u.evidence)}` : '';
  el.innerHTML = `<button class="close" aria-label="${t('close')}">×</button><h3>${label}</h3><div class="meta">${asm}</div><div>${ev}</div>${func ? `<p>${func}</p>` : ''}${note ? `<p class="hint">${note}</p>` : ''}`;
  el.hidden = false; el.querySelector('.close').onclick = () => { el.hidden = true; infoShown = null; };
}

// ------------------------------------------------------------------ Zeit
let jd = START_JD, playing = false, lastT = performance.now();
const clampJd = (x) => Math.min(Math.max(x, julianDay(-2999, 1, 1)), julianDay(3000, 1, 1));
function setJd(x) { jd = clampJd(x); dirty = true; }
const syncPlay = () => { $('#play').textContent = playing ? '❚❚' : '▶'; $('#play').title = t(playing ? 'pause' : 'play'); };
$('#play').addEventListener('click', () => { playing = !playing; syncPlay(); });
const step = () => +$('#speed').value;
$('#stepBack').addEventListener('click', () => setJd(jd - step()));
$('#stepFwd').addEventListener('click', () => setJd(jd + step()));

// Kurbel: 1 Umdrehung = a1/b1 = 48/223 Jahr ≈ 78,6 Tage (Zähnezahlen nach Freeth 2006)
const DAYS_PER_CRANK = TROPICAL_YEAR * 48 / 223;
{
  const el = $('#crank'); const svg = el.querySelector('svg'); let last = null;
  svg.querySelector('.crank-ticks').innerHTML = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * TAU; return `<line x1="${Math.sin(a) * 49}" y1="${-Math.cos(a) * 49}" x2="${Math.sin(a) * 54}" y2="${-Math.cos(a) * 54}"/>`; }).join('');
  const angle = (e) => { const r = svg.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); last = angle(e); el.setPointerCapture(e.pointerId); el.classList.add('active'); playing = false; syncPlay(); });
  el.addEventListener('pointermove', (e) => {
    if (last === null) return; const a = angle(e); let d = a - last; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; last = a;
    setJd(jd + d / TAU * DAYS_PER_CRANK);
  });
  const end = () => { last = null; el.classList.remove('active'); }; el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', (e) => { e.preventDefault(); setJd(jd + Math.sign(e.deltaY) * DAYS_PER_CRANK / 24); }, { passive: false });
}

// Datumseingabe & Presets
$('#dateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const y = +$('#fYear').value, era = $('#fEra').value;
  setJd(julianDay(era === 'bc' ? 1 - y : y, +$('#fMonth').value, +$('#fDay').value));
});
const PRESETS = [
  ['preset.saros', EPOCH.saros], ['preset.calendar', EPOCH.calendar], ['preset.eclipse', julianDay(-204, 5, 12)],
  ['preset.wreck', julianDay(-64, 6, 1)], ['preset.today', 2440587.5 + Date.now() / 86400000],
];
const renderPresets = () => {
  $('#presets').innerHTML = PRESETS.map(([n], i) => `<button class="chip" data-p="${i}">${t(n)}</button>`).join('');
  $('#presets').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setJd(PRESETS[+b.dataset.p][1])));
};
renderPresets();

// ------------------------------------------------------------------ Aktualisierung
let dirty = true, lastReadout = 0, lastEclJd = null, ang = null, st = null;
function updateMechanism() {
  st = stateAt(jd); ang = gearAngles(st);
  // Wellen im Gestell
  for (const [id, obj] of Object.entries(M.gearObjs)) {
    const pl = PLACE[id];
    if (id === 'a1' || id === 'crank') { obj.rotation.x = ang.a; continue; }
    if (!pl) continue;
    if (!pl.frame) obj.rotation.z = ang[pl.arbor] ?? 0;
  }
  M.e3frame.rotation.z = ang.e3;
  M.gearObjs.k1.rotation.z = ang.k1rel; M.gearObjs.k2.rotation.z = ang.k2rel;
  // Epizyklische Getriebe auf b1
  const b = ang.b; M.carrier.rotation.z = b;
  const rel = {};
  rel['V-44'] = b * 51 / 44; rel['V-34'] = rel['V-44']; rel['V-26'] = -rel['V-34'] * 34 / 26; rel.r1 = -rel['V-26'] * 26 / 63;
  rel['Me-72'] = b * 51 / 72; rel['Me-89'] = rel['Me-72']; rel['Me-40'] = -rel['Me-89'] * 89 / 40; rel['Me-20'] = -rel['Me-40'] * 40 / 20;
  rel['S-52'] = b * 56 / 52; rel['S-56'] = -rel['S-52'] * 52 / 56; rel['Sa-61'] = rel['S-52']; rel['Sa-40'] = -rel['Sa-61'] * 61 / 40; rel['Sa-68'] = -rel['Sa-40'] * 40 / 68;
  rel['MJ-64'] = b * 56 / 64; rel['Ma-38'] = rel['MJ-64']; rel['Ju-45'] = rel['MJ-64'];
  rel['Ma-40'] = -rel['Ma-38'] * 38 / 40; rel['Ma-71'] = -rel['Ma-40'] * 40 / 71; rel['Ju-40'] = -rel['Ju-45'] * 45 / 40; rel['Ju-43'] = -rel['Ju-40'] * 40 / 43;
  rel['Dr-62'] = b * 49 / 62; rel['Dr-64'] = rel['Dr-62'];
  rel.CP = 0;
  for (const [id, r] of Object.entries(rel)) if (M.gearObjs[id]) M.gearObjs[id].rotation.z = r;
  const outAng = { Ma: -st.planets.mars * D2R, Ju: -st.planets.jupiter * D2R, Sa: -st.planets.saturn * D2R, Dr: -st.node * D2R };
  for (const [id, pl] of Object.entries(PLACE)) if (pl.frame === 'out' && M.gearObjs[id]) M.gearObjs[id].rotation.z = (pl.counter ? -1 : 1) * outAng[pl.planet];

  // Front
  const F = M.front;
  F.rings.mercury.rotation.z = -st.planets.mercury * D2R; F.rings.venus.rotation.z = -st.planets.venus * D2R;
  F.rings.mars.rotation.z = -st.planets.mars * D2R; F.rings.jupiter.rotation.z = -st.planets.jupiter * D2R; F.rings.saturn.rotation.z = -st.planets.saturn * D2R;
  F.rings.sun.rotation.z = -st.sunTrue * D2R; F.rings.date.rotation.z = -st.sunMean * D2R;
  // Kalenderring: dreht NICHT mit der Kurbel. Er steckt mit einem Stift in einem der 354 Löcher und wurde
  // von Hand umgesteckt, weil das ägyptische Jahr (365 d) dem Sonnenjahr davonläuft (≈ 1 Loch alle 4 Jahre).
  const HOLE = TAU / 354;
  const ideal = -st.sunMean * D2R + (st.egyptian.frac / 365) * TAU;
  F.calendar.rotation.z = Math.round(ideal / HOLE) * HOLE;
  F.moon.rotation.z = -st.moonTrue * D2R; F.moonBall.rotation.y = st.elong * D2R - Math.PI;
  F.dragon.rotation.z = -st.node * D2R;
  // Rückseite
  const Bk = M.back;
  const spiralPtr = (p, turns) => { p.grp.rotation.z = turns * TAU; p.slider.position.y = p.sp.r0 + (p.sp.r1 - p.sp.r0) * turns / p.sp.turns; };
  spiralPtr(Bk.metonic, st.metonic.turns); spiralPtr(Bk.saros, st.saros.turns);
  Bk.games.grp.rotation.z = -st.games.frac * TAU; Bk.callippic.grp.rotation.z = st.callippic.frac * TAU; Bk.exeligmos.grp.rotation.z = st.exeligmos.frac * TAU;

  $('#dateLabel').textContent = formatDate(jd);
  $('#dateSub').textContent = `${calendarName(jd)} · ${EG_MONTHS[st.egyptian.month]} ${st.egyptian.day} (${t('egShort')}) · ${t('crankTurns', { n: st.crankTurns.toFixed(1) })}`;
  $('#crankArm').setAttribute('transform', `rotate(${(st.crankTurns * 360) % 360})`);
}

const fmtD = (d) => { const a = Math.abs(d); return `<td class="${a < 5 ? 'd-good' : a < 20 ? 'd-mid' : 'd-bad'}">${d >= 0 ? '+' : ''}${d.toFixed(1)}°</td>`; };
function updateReadouts() {
  if (!st) return;
  let sky = null; try { sky = realSky(jd); for (const [k, g] of Object.entries(M.front.ghosts)) g.rotation.z = -sky[k] * D2R; } catch (e) { sky = null; }
  const rows = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].map((k) => [t(k), k === 'sun' ? st.sunTrue : k === 'moon' ? st.moonTrue : st.planets[k], k]);
  $('#readFront').innerHTML = `<tr><th></th><th>${t('mech')}</th><th>${t('sky')}</th><th>Δ</th></tr>` + rows.map(([n, v, k]) => `<tr><td>${n}</td><td>${zodiacLabel(v)}</td><td>${sky ? zodiacLabel(sky[k]) : '–'}</td>${sky ? fmtD(angDiff(v, sky[k])) : '<td>–</td>'}</tr>`).join('')
    + `<tr><td>${t('moonPhase')}</td><td>${t('lit', { n: Math.round(st.illum * 100) })}</td><td>${sky ? Math.round((1 - Math.cos(sky.moonPhase * D2R)) / 2 * 100) + ' %' : '–'}</td>${sky ? fmtD(angDiff(st.elong, sky.moonPhase)) : '<td>–</td>'}</tr>`;
  const gamesNames = st.games.names.map((n) => (lang === 'el' ? { Isthmia: 'Ίσθμια', Olympia: 'Ολύμπια', Nemea: 'Νέμεα', Naa: 'Νάια', Pythia: 'Πύθια', Halieia: 'Αλίεια' }[n] : n)).join(t('and'));
  $('#readBack').innerHTML = [
    [t('metonic'), `${t('monthOf', { a: st.metonic.cell + 1, b: 235 })} · ${t('yearOf', { a: st.metonic.year + 1, b: 19 })}`],
    [t('games'), t('gamesYear', { a: st.games.year + 1, b: gamesNames })],
    [t('callippic'), t('sector', { a: st.callippic.sector + 1, b: 4 })],
    [t('saros'), t('monthOf', { a: st.saros.cell + 1, b: 223 })],
    [t('exeligmos'), t('correction', { a: st.exeligmos.label })],
    [t('egCal'), `${EG_MONTHS[st.egyptian.month]} ${st.egyptian.day}`],
  ].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
  if (lastEclJd === null || Math.abs(jd - lastEclJd) > 3) {
    lastEclJd = jd;
    const ecl = nextEclipses(jd); const kind = (k) => t(`k.${k}`);
    $('#readEcl').innerHTML = [[t('lunarEcl'), ecl.lunar], [t('solarEcl'), ecl.solar]].map(([n, e]) => `<tr><td>${n}</td><td>${e ? `${formatDate(e.jd)} (${kind(e.kind)})` : '–'}</td><td>${e ? `<button class="chip" data-go="${e.jd}">${t('goThere')}</button>` : ''}</td></tr>`).join('');
    $('#readEcl').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => setJd(+b.dataset.go)));
  }
}

// ------------------------------------------------------------------ Tabs & Inhalte
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((o) => o.classList.toggle('active', o === b));
  document.querySelectorAll('.tabpane').forEach((p) => p.classList.toggle('active', p.id === `tab-${b.dataset.tab}`));
}));
const renderContent = () => {
  renderMap($('#map'), $('#maplist'), $('#maplegend'));
  renderTimeline($('#timeline'), (year) => setJd(year === -205 ? EPOCH.saros : julianDay(year < 0 ? year + 1 : year, 6, 1)));
  renderResearch($('#evi'), $('#papers'), $('#sources'));
  renderLinks($('#links'));
};
renderContent();
onLangChange((what) => {
  if (what === 'device') { refreshDeviceText(M); invalidate(); return; }
  applyStatic(); renderLegend(); buildTree(); renderPresets(); renderContent(); syncPlay();
  lastEclJd = null; dirty = true; lastReadout = 0; if (infoShown) showInfo(infoShown);
});
// Schriften für die Gravuren nachladen
if (document.fonts?.ready) document.fonts.ready.then(() => { refreshDeviceText(M); invalidate(); });

// ------------------------------------------------------------------ Loop
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (intro?.active) { intro.update(dt); requestAnimationFrame(frame); return; }
  if (playing) setJd(jd + dt * step());
  if (dirty) { updateMechanism(); dirty = false; dirtyRendered = true; }
  if (now - lastReadout > 250) { updateReadouts(); lastReadout = now; }
  if (tween) { tween.t = Math.min(1, tween.t + dt * 1.6); const k = 1 - Math.pow(1 - tween.t, 3); camera.position.lerpVectors(tween.from, tween.to, k); if (tween.t >= 1) tween = null; }
  if (controls.update()) needRender = true;
  if (tween || dirtyRendered) { needRender = true; dirtyRendered = false; }
  if (needRender) { renderer.render(scene, camera); needRender = false; }
  requestAnimationFrame(frame);
}
resize(); setView('front'); camera.position.set(...VIEWS.front.pos); tween = null;

// ------------------------------------------------------------------ Intro
const FRONT_POSE = { pos: VIEWS.front.pos, target: [0, -12, 0] };
const setExplode = (e) => { $('#explode').value = e; applyExplode(); };
const intro = createIntro({
  renderer, camera, mainScene: scene, M, env, setExplode, frontPose: FRONT_POSE, overlay: $('#intro'), t,
  onDone() {
    controls.enabled = true; controls.target.set(...FRONT_POSE.target); camera.position.set(...FRONT_POSE.pos); controls.update();
    try { localStorage.setItem('ak-intro-seen', '1'); } catch (e) { /* egal */ }
    dirty = true; invalidate();
  },
});
function playIntro() { setView('front'); tween = null; playing = false; syncPlay(); showInfo(null); controls.enabled = false; intro.start(); }
$('#replayIntro').addEventListener('click', playIntro);
let seenIntro = false; try { seenIntro = localStorage.getItem('ak-intro-seen') === '1'; } catch (e) { /* egal */ }
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if (!seenIntro && !reduceMotion && !location.hash.includes('nointro')) playIntro();
requestAnimationFrame(frame);
$('#loading').classList.add('done');
window.__app = { intro, playIntro, showInfo, finishTween() { if (tween) { camera.position.copy(tween.to); tween = null; } controls.update(); invalidate(); }, setJd, setView, M, camera, controls, get jd() { return jd; }, RATES };
