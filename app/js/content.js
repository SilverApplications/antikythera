// Inhalte: Karte, Zeitstrahl, Forschung (mehrsprachig).
import { LOCATIONS, TIMELINE, PAPERS, SOURCES, GEARS, I18N } from './generated/data.js';
import { MAP } from './generated/map-data.js';
import { t, td, lang } from './i18n.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const word = (w) => (lang === 'de' ? w : I18N[lang]?.words?.[w] ?? w);
const proj = (lon, lat) => [(lon - MAP.lon0) / (MAP.lon1 - MAP.lon0) * MAP.width, (MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0) * MAP.height];
// historische Jahreszahl (negativ = v. Chr.)
const histYear = (y) => (y < 0 ? (lang === 'en' ? `${-y} BC` : `${-y} ${t('bc')}`) : (lang === 'en' ? `AD ${y}` : `${y} ${t('ad')}`));

const GROUPS = [
  { key: 'Fundort', cats: ['Fundort'], color: '#e0261b' },
  { key: 'Aufbewahrung', cats: ['Aufbewahrung'], color: '#f2c14e' },
  { key: 'Herkunft', cats: ['Herkunft', 'Herkunft/Nutzer', 'Kalender'], color: '#123F39' },
  { key: 'Spiele-Anzeige', cats: ['Spiele-Anzeige'], color: '#fbf3e6' },
  { key: 'Schiffsroute', cats: ['Schiffsroute'], color: '#4a2516' },
  { key: 'Wissensquelle', cats: ['Wissensquelle'], color: '#7d8287' },
];
const colorOf = (cat) => (GROUPS.find((g) => g.cats.includes(cat)) ?? GROUPS[5]).color;

export function renderMap(el, listEl, legendEl) {
  const locs = LOCATIONS.locations;
  const byId = Object.fromEntries(locs.map((l) => [l.id, l]));
  const name = (l) => td('locations', l.id, 'name', l.name);
  const route = LOCATIONS.routes[0].points.map((id) => proj(byId[id].lon, byId[id].lat));
  const left = new Set(['epirus-dodona', 'ambracia', 'corinth', 'nemea', 'olympia', 'syracuse', 'babylon']);
  const labelled = new Set(['wreck', 'athens-nam', 'rhodes', 'syracuse', 'corinth', 'epirus-dodona', 'pergamon', 'babylon', 'alexandria', 'rome']);
  const mk = locs.map((l) => {
    const [x, y] = proj(l.lon, l.lat); const wreck = l.id === 'wreck'; const big = wreck || ['athens-nam', 'rhodes'].includes(l.id);
    const side = left.has(l.id) ? -1 : 1; const short = l.id === 'athens-nam' ? (lang === 'el' ? 'Αθήνα' : lang === 'en' ? 'Athens' : 'Athen') : name(l).replace(/\s*\(.*\)/, '').replace(/^(Wrack von |Antikythera wreck|Ναυάγιο των )/, (m) => m);
    const pulse = wreck ? '<circle class="wreck-pulse" r="14"/>' : '';
    const label = labelled.has(l.id) ? `<text x="${side * (big ? 20 : 14)}" y="8" text-anchor="${side < 0 ? 'end' : 'start'}" ${wreck ? 'class="wreck-label"' : ''}>${esc(short)}</text>` : '';
    return `<g class="mk" data-id="${l.id}" data-name="${esc(short)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${pulse}<circle r="${wreck ? 13 : big ? 10 : 7.5}" fill="${colorOf(l.kategorie)}"/>${label}</g>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 ${MAP.width} ${MAP.height}" role="img" aria-label="${esc(t('mapH'))}"><rect class="sea" width="${MAP.width}" height="${MAP.height}"/><path class="land" d="${MAP.land}"/><path class="coast" d="${MAP.coast}"/><polyline class="route" points="${route.map((p) => p.join(',')).join(' ')}"/>${mk}</svg>`;
  legendEl.innerHTML = GROUPS.map((g) => `<span><i style="background:${g.color}"></i>${esc(word(g.key))}</span>`).join('') + `<span><i style="background:none;border:0;border-top:2px dashed #fbf3e6;border-radius:0;width:18px;height:0"></i>${esc(t('route'))}</span>`;
  listEl.innerHTML = locs.map((l) => `<div class="loc" id="loc-${l.id}"><b>${esc(name(l))}</b> <span class="tagline">${esc(word(l.kategorie))} · ${esc(word(l.evidenz))}</span><br>${esc(td('locations', l.id, 'text', l.text))}</div>`).join('');
  attachMapNav(el, locs, labelled, listEl);
}

// ---------------------------------------------------------------- Karte: Zoom & Verschieben (2D)
let mapView = null; // bleibt bei Sprachwechsel erhalten
function attachMapNav(el, locs, labelled, listEl) {
  const svg = el.querySelector('svg'); const W = MAP.width, H = MAP.height;
  const v = mapView ?? (mapView = { x: 0, y: 0, w: W, h: H });
  const mks = [...svg.querySelectorAll('.mk')].map((g) => { const l = locs.find((o) => o.id === g.dataset.id); const [x, y] = proj(l.lon, l.lat); return { g, x, y, minor: !labelled.has(l.id), text: g.querySelector('text') }; });
  const minorLabel = (m) => { if (!m.text && m.minor) { const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('x', 14); t.setAttribute('y', 8); t.textContent = m.g.dataset.name; m.g.appendChild(t); m.text = t; } };
  const apply = () => {
    const z = W / v.w, s = 1 / Math.pow(z, 0.8);
    svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
    for (const m of mks) { m.g.setAttribute('transform', `translate(${m.x.toFixed(1)},${m.y.toFixed(1)}) scale(${s.toFixed(4)})`); if (m.minor) { minorLabel(m); m.text.style.display = z > 2.4 ? '' : 'none'; } }
  };
  const clampV = () => { v.w = Math.min(W, Math.max(W / 10, v.w)); v.h = v.w * H / W; v.x = Math.min(W - v.w, Math.max(0, v.x)); v.y = Math.min(H - v.h, Math.max(0, v.y)); };
  const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return [v.x + (cx - r.left) / r.width * v.w, v.y + (cy - r.top) / r.height * v.h]; };
  const zoomAt = (px, py, f) => { const nw = Math.min(W, Math.max(W / 10, v.w / f)); const k = nw / v.w; v.x = px - (px - v.x) * k; v.y = py - (py - v.y) * k; v.w = nw; v.h = nw * H / W; clampV(); apply(); };
  svg.addEventListener('wheel', (e) => { e.preventDefault(); const [px, py] = toSvg(e.clientX, e.clientY); zoomAt(px, py, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  svg.addEventListener('dblclick', (e) => { const [px, py] = toSvg(e.clientX, e.clientY); zoomAt(px, py, 2); });
  const ptrs = new Map(); let moved = 0, pinch = null;
  svg.addEventListener('pointerdown', (e) => { svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; svg.classList.add('drag'); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; } });
  svg.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const r = svg.getBoundingClientRect();
    if (ptrs.size === 1) { const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy); v.x -= dx / r.width * v.w; v.y -= dy / r.height * v.h; clampV(); apply(); }
    else if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const [px, py] = toSvg((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); zoomAt(px, py, d / pinch.d); pinch.d = d; moved += 10; }
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) svg.classList.remove('drag'); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  const ctl = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
  ctl('mapIn', () => zoomAt(v.x + v.w / 2, v.y + v.h / 2, 1.6)); ctl('mapOut', () => zoomAt(v.x + v.w / 2, v.y + v.h / 2, 1 / 1.6));
  ctl('mapReset', () => { Object.assign(v, { x: 0, y: 0, w: W, h: H }); apply(); });
  for (const m of mks) m.g.addEventListener('click', () => {
    if (moved > 6) return;
    mks.forEach((o) => o.g.classList.toggle('sel', o === m));
    listEl.querySelectorAll('.loc').forEach((o) => o.classList.remove('sel'));
    const item = listEl.querySelector(`#loc-${m.g.dataset.id}`); item.classList.add('sel'); item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  apply();
}

export function renderLinks(el) {
  const L = [
    ['https://en.wikipedia.org/wiki/Antikythera_mechanism', 'link.wiki', 'link.wikiSub', ''],
    ['https://www.dpma.de/dpma/veroeffentlichungen/meilensteine/computer-pioniere/antikytera-mechanismus/index.html', 'link.dpma', 'link.dpmaSub', ''],
    ['https://atlas.geschichte.fm/map', 'link.atlas', 'link.atlasSub', 'thanks'],
  ];
  el.innerHTML = L.map(([u, a, b, c]) => `<a class="${c}" href="${u}" target="_blank" rel="noopener"><b>${esc(t(a))}</b><span>${esc(t(b))}</span></a>`).join('');
}

export function renderTimeline(el, onJump) {
  const ev = TIMELINE.events.map((e, i) => ({ ...e, i })).sort((a, b) => a.year - b.year);
  el.innerHTML = ev.map((e, k) => {
    const tr = lang === 'de' ? null : I18N[lang]?.timeline?.[e.i];
    const y = e.range ? `${histYear(e.range[0])} – ${histYear(e.range[1])}` : histYear(e.year);
    const jump = e.year >= -205 && e.year <= -60 ? `<button class="chip jump" data-k="${k}">${esc(t('jump', { y: histYear(e.year) }))}</button>` : '';
    return `<div class="tl k-${e.kategorie}"><span class="y">${y}</span> <span class="tagline">${esc(word(e.sicherheit))}</span><b>${esc(tr?.label ?? e.label)}</b><p>${esc(tr?.text ?? e.text)}</p>${jump}</div>`;
  }).join('');
  el.querySelectorAll('.jump').forEach((b) => b.addEventListener('click', () => onJump(ev[+b.dataset.k].year)));
}

export function renderResearch(eviEl, papersEl, srcEl) {
  const counts = {}; GEARS.gears.forEach((g) => { counts[g.evidence] = (counts[g.evidence] || 0) + 1; });
  eviEl.innerHTML = Object.entries(GEARS.meta.evidenzklassen).map(([k, v]) => `<div><span class="ev ev-${k}">${k}</span>${esc(td('evidence', k, null, v))} <span class="tagline">(${counts[k] || 0} ${t('gears')})</span></div>`).join('');
  papersEl.innerHTML = PAPERS.papers.map((p, i) => {
    const tr = lang === 'de' ? {} : I18N[lang]?.papers?.[i] ?? {}; const f = (k) => esc(tr[k] ?? p[k]);
    return `<article class="paper"><div class="h"><span>${p.jahr} · ${esc(p.autor)}</span><span class="lvl lvl-${p.level}">${esc(t(`lvl.${p.level}`))}</span></div><b>${f('titel')}</b><dl><dt>${t('done')}</dt><dd>${f('gemacht')}</dd><dt>${t('result')}</dt><dd>${f('ergebnis')}</dd><dt>${t('why')}</dt><dd>${f('warum')}</dd><dt>${t('certainty')}</dt><dd>${f('sicherheit')}</dd></dl></article>`;
  }).join('');
  srcEl.innerHTML = SOURCES.sources.map((s) => `<li>${esc(s.autoren || '')}${s.autoren ? ' ' : ''}(${s.jahr ?? 'o. J.'}): ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.titel)}</a>` : esc(s.titel)}${s.ort ? `. ${esc(s.ort)}` : ''}</li>`).join('');
}
