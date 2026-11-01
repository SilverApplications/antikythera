// Prozedurale Oberflächen: Bronze mit Patina, Olivenholz, gravierte Schrift mit Schmutz in den Vertiefungen.
import * as THREE from '../vendor/three.module.min.js';

// ---------------------------------------------------------------- Rauschen
// Perlin-Rauschen mit periodischem Gitter (Periode P) -> nahtlos kachelbar.
function makeNoise(seed = 1) {
  const p = new Uint8Array(512); let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const perm = [...Array(256).keys()].sort(() => rnd() - 0.5);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const grad = (h, x, y) => { const a = (h / 256) * Math.PI * 2; return Math.cos(a) * x + Math.sin(a) * y; };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const n2 = (x, y, P) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const X0 = ((xi % P) + P) % P, Y0 = ((yi % P) + P) % P, X1 = (X0 + 1) % P, Y1 = (Y0 + 1) % P;
    const h = (X, Y) => p[(p[X & 255] + Y) & 511];
    const u = fade(fx), v = fade(fy);
    const a = grad(h(X0, Y0), fx, fy), b = grad(h(X1, Y0), fx - 1, fy), c = grad(h(X0, Y1), fx, fy - 1), d = grad(h(X1, Y1), fx - 1, fy - 1);
    return (a + u * (b - a)) + v * ((c + u * (d - c)) - (a + u * (b - a)));
  };
  return (x, y, oct = 4, P = 8) => { let f = 0, amp = 0.5, fr = 1; for (let o = 0; o < oct; o++) { f += amp * n2(x * fr, y * fr, P * fr); amp *= 0.5; fr *= 2; } return f; };
}
const noise = makeNoise(7);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- Bronze-Patina (kachelbar)
let patinaCache = null;
export function patinaTiles(S = 512) {
  if (patinaCache) return patinaCache;
  const col = document.createElement('canvas'); col.width = col.height = S;
  const mr = document.createElement('canvas'); mr.width = mr.height = S;
  const gc = col.getContext('2d'), gm = mr.getContext('2d');
  const ic = gc.createImageData(S, S), im = gm.createImageData(S, S);
  const BR = [178, 134, 76], DK = [104, 74, 42], VG = [96, 146, 118], VG2 = [58, 102, 84];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S * 8, v = y / S * 8;
    const base = noise(u, v, 5, 8);
    const verd = clamp((noise(u + 3.1, v + 1.7, 3, 8) * 0.85 + noise(u * 4 + 1.3, v * 4 + 7.7, 3, 32) * 0.45 + 0.0) * 2.8);
    const pits = clamp((noise(u * 4 + 9, v * 4 + 2, 2, 32) - 0.3) * 5);
    const t = clamp(0.55 + base * 0.8);
    let r = mix(DK[0], BR[0], t), g = mix(DK[1], BR[1], t), b = mix(DK[2], BR[2], t);
    const vg = Math.pow(verd, 1.6) * 0.8;
    r = mix(r, mix(VG2[0], VG[0], t), vg); g = mix(g, mix(VG2[1], VG[1], t), vg); b = mix(b, mix(VG2[2], VG[2], t), vg);
    r = mix(r, 52, pits * 0.55); g = mix(g, 42, pits * 0.55); b = mix(b, 30, pits * 0.55);
    const i = (y * S + x) * 4;
    ic.data[i] = r; ic.data[i + 1] = g; ic.data[i + 2] = b; ic.data[i + 3] = 255;
    // Rauheit (G) und Metallizität (B): Patina ist matt und nicht metallisch
    im.data[i] = 0; im.data[i + 1] = 255 * clamp(0.42 + vg * 0.5 + pits * 0.3 - base * 0.15); im.data[i + 2] = 255 * clamp(0.85 - vg * 0.8 - pits * 0.4); im.data[i + 3] = 255;
  }
  gc.putImageData(ic, 0, 0); gm.putImageData(im, 0, 0);
  patinaCache = { col, mr };
  return patinaCache;
}
export function patinaTextures(repeat = 1 / 60) {
  const { col, mr } = patinaTiles();
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace;
  const mrt = new THREE.CanvasTexture(mr);
  for (const t of [map, mrt]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; }
  return { map, mr: mrt };
}

// ---------------------------------------------------------------- Olivenholz
export function oliveWood(W = 512, H = 512) {
  // Olivenholz: cremegelber Grund, wellige Jahreslinien, feine dunkle Adern; Maserung entlang u.
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); const img = g.createImageData(W, H);
  const LIGHT = [206, 170, 116], MID = [158, 116, 70], DARK = [66, 40, 22];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / H;
    const warp = noise(u * 2, v * 3, 4, 8) * 1.8 + noise(u * 8 + 3, v * 10, 3, 8) * 0.3;
    const gg = v * 9 + warp;
    const band = 0.5 + 0.5 * Math.sin(gg * Math.PI * 2);
    const vein = Math.pow(1 - Math.abs(Math.sin(gg * Math.PI + noise(u * 4, v * 4, 2, 8) * 1.4)), 14);
    const zone = noise(u * 1.5 + 5, v * 1.5, 3, 8);
    const fine = noise(u * 3, v * 90, 2, 8) * 0.18;
    const t = clamp(0.25 + band * 0.5 + zone * 0.7 + fine);
    let r = mix(MID[0], LIGHT[0], t), gr = mix(MID[1], LIGHT[1], t), b = mix(MID[2], LIGHT[2], t);
    const d = clamp(vein * 0.9 + clamp(-zone - 0.15) * 0.8);
    r = mix(r, DARK[0], d); gr = mix(gr, DARK[1], d); b = mix(b, DARK[2], d);
    r *= 0.86; gr *= 0.84; b *= 0.82; // Alterung
    const i = (y * W + x) * 4; img.data[i] = r; img.data[i + 1] = gr; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

// ---------------------------------------------------------------- Gravuren
// draw(g, mode) wird zweimal aufgerufen: 'color' (Patina, Schmutz in den Vertiefungen) und 'bump' (Höhenkarte).
export const ENGRAVE = {
  // textHalo: Patina-Saum um Buchstaben (Farbe) – entfernt, Schrift nur schwarz; Relief (bump) bleibt
  color: { bgPattern: true, halo: 'rgba(58,92,72,0.95)', fill: '#1b1611', haloW: 1.0, textHalo: false, textFill: '#000000' },
  bump: { bgPattern: false, halo: '#5a5a5a', fill: '#000000', haloW: 0.4, textHalo: true, textFill: '#000000' },
};
export function engravedTexture(W, H, draw) {
  const out = {};
  for (const mode of ['color', 'bump']) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    if (mode === 'color') {
      const pat = g.createPattern(patinaTiles().col, 'repeat');
      g.save(); g.scale(W / 2400, W / 2400); g.fillStyle = pat; g.fillRect(0, 0, 2400 * (1 + H / W) + 2400, 2400 * (1 + H / W) + 2400); g.restore();
      // leichter Glanz (abgegriffene Bronze) in der Mitte
      const grd = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      grd.addColorStop(0, 'rgba(210,170,110,0.16)'); grd.addColorStop(1, 'rgba(30,20,10,0.12)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
    } else { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); }
    draw(g, ENGRAVE[mode], mode);
    const t = new THREE.CanvasTexture(c); if (mode === 'color') t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    out[mode === 'color' ? 'map' : 'bump'] = t;
  }
  return out;
}
// Gravierte Linie mit Schmutz-Halo; Text ohne Halo in Schwarz
export function engraveStroke(g, st, path, width) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = st.halo; g.lineWidth = width * (1 + 1.6 * st.haloW); path(); g.stroke();
  g.strokeStyle = st.fill; g.lineWidth = width; path(); g.stroke(); g.restore();
}
export function engraveText(g, st, text, x, y, px, font = '"IBM Plex Sans", "Noto Sans", "DejaVu Sans", sans-serif') {
  g.font = `600 ${px}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round';
  if (st.textHalo) { g.strokeStyle = st.halo; g.lineWidth = px * 0.22 * (0.5 + st.haloW); g.strokeText(text, x, y); }
  else { g.strokeStyle = st.textFill; g.lineWidth = px * 0.05; g.strokeText(text, x, y); } // nur schwarz, minimal kräftiger
  g.fillStyle = st.textFill; g.fillText(text, x, y);
}
