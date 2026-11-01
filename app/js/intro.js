// Intro: Wrack am Meeresgrund (1900) -> Taucher birgt den grünen Klumpen -> Umgebung wird zum Labor (1902)
// -> Klumpen löst sich auf, das rekonstruierte Modell setzt sich zusammen.
// Nachgestellte Szene. Fakten (Untertitel) nach den Quellen in docs/01_forschungsdossier.md.
import * as THREE from '../vendor/three.module.min.js';
import { oliveWood } from './patina.js';

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// kleines 3D-Wertrauschen (CPU)
function hash3(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u), x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
const rnd = (() => { let s = 12345; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

const NOISE_GLSL = /* glsl */`
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }`;

// ------------------------------------------------------------------ Bausteine
function seabedMaterial(u) {
  return new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uFogColor; uniform float uFogDensity; uniform float uLight;
      varying vec3 vW; varying vec3 vN;
      ${NOISE_GLSL}
      float caustic(vec2 p){ vec2 i = p; float c = 1.0; float inten = 0.005;
        for (int n = 0; n < 4; n++) { float t = uTime * (1.0 - (3.5 / float(n + 1))); i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten))); }
        c /= 4.0; c = 1.17 - pow(c, 1.4); return clamp(pow(abs(c), 8.0), 0.0, 1.0); }
      void main(){
        float n = vn3(vW * 0.004) * 0.6 + vn3(vW * 0.03) * 0.4;
        vec3 sand = mix(vec3(0.24, 0.24, 0.19), vec3(0.36, 0.34, 0.27), n);
        sand = mix(sand, vec3(0.30, 0.36, 0.28), smoothstep(0.62, 0.8, vn3(vW * 0.0015 + 3.0)) * 0.6);
        float l = max(dot(normalize(vN), normalize(vec3(0.2, 1.0, 0.1))), 0.0) * 0.55 + 0.25;
        vec3 col = sand * l * vec3(0.55, 0.82, 0.88) * uLight;
        col += caustic(vW.xz * 0.0011 + 2.0) * vec3(0.45, 0.8, 0.8) * 0.35 * uLight;
        float d = length(vW - cameraPosition); float f = 1.0 - exp(-uFogDensity * uFogDensity * d * d);
        gl_FragColor = vec4(mix(col, uFogColor, f), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function amphoraGeometry() {
  // Profil einer koischen Amphore (mm), Fuß spitz, langer Hals
  const P = [[0, 0], [14, 10], [30, 40], [70, 120], [118, 230], [140, 330], [138, 420], [112, 500], [62, 540], [44, 560], [42, 700], [52, 712], [50, 724], [36, 724]];
  const g = new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), 22);
  g.translate(0, -360, 0);
  return g;
}
function handleGeometry() { const g = new THREE.TorusGeometry(70, 11, 8, 16, Math.PI * 1.1); g.rotateZ(-Math.PI * 0.05); return g; }

function rockGeometry(r) {
  const g = new THREE.IcosahedronGeometry(r, 2); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 0.7 + vnoise(v.x * 0.004 + 5, v.y * 0.004, v.z * 0.004) * 0.6; v.multiplyScalar(k); v.y *= 0.6; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}

// Liegende Marmorfigur aus einfachen Körpern (Statuen hielt Stadiatis für Leichen)
function lyingFigure(mat, scale = 1) {
  const g = new THREE.Group();
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12);
  const torso = new THREE.Mesh(cap(150, 420), mat); torso.rotation.z = Math.PI / 2; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(105, 16, 12), mat); head.position.set(420, 30, 0); g.add(head);
  const legL = new THREE.Mesh(cap(75, 720), mat); legL.rotation.z = Math.PI / 2; legL.position.set(-640, -20, 70); g.add(legL);
  const legR = new THREE.Mesh(cap(75, 640), mat); legR.rotation.z = Math.PI / 2 + 0.2; legR.position.set(-610, 30, -80); g.add(legR);
  const arm = new THREE.Mesh(cap(55, 520), mat); arm.rotation.set(0.3, 0.6, Math.PI / 2); arm.position.set(150, 60, 220); g.add(arm);
  g.scale.setScalar(scale); return g;
}
function lyingHorse(mat) {
  const g = new THREE.Group(); const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12);
  const body = new THREE.Mesh(cap(330, 900), mat); body.rotation.z = Math.PI / 2; g.add(body);
  const neck = new THREE.Mesh(cap(150, 520), mat); neck.position.set(720, 260, 0); neck.rotation.z = -0.7; g.add(neck);
  const head = new THREE.Mesh(cap(110, 380), mat); head.position.set(980, 380, 0); head.rotation.z = Math.PI / 2 + 0.6; g.add(head);
  for (const [x, z, r] of [[450, 220, 0.4], [450, -220, -0.2], [-450, 220, 0.7], [-450, -220, 0.1]]) { const leg = new THREE.Mesh(cap(70, 700), mat); leg.position.set(x + 200 * Math.sin(r), -260, z); leg.rotation.set(0, 0, Math.PI / 2 - r); g.add(leg); }
  return g;
}

function diver(materials) {
  const { copper, brass, canvas, boots, glass, rubber } = materials;
  const root = new THREE.Group(); // Ursprung: zwischen den Füßen
  const body = new THREE.Group(); body.position.y = 950; root.add(body);
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);
  const torso = new THREE.Mesh(cap(230, 420), canvas); torso.position.y = 150; body.add(torso);
  const corselet = new THREE.Mesh(new THREE.CylinderGeometry(270, 300, 170, 24), brass); corselet.position.y = 500; body.add(corselet);
  const helmet = new THREE.Group(); helmet.position.y = 720; body.add(helmet);
  helmet.add(new THREE.Mesh(new THREE.SphereGeometry(215, 28, 20), copper));
  const port = (rx, ry, rz, r) => { const fr = new THREE.Mesh(new THREE.TorusGeometry(r, 18, 8, 24), brass); const gl = new THREE.Mesh(new THREE.CircleGeometry(r, 20), glass); const g = new THREE.Group(); g.add(fr, gl); g.rotation.set(rx, ry, rz); const d = new THREE.Vector3(0, 0, 212).applyEuler(new THREE.Euler(rx, ry, rz)); g.position.copy(d); return g; };
  helmet.add(port(0, 0, 0, 82), port(0, Math.PI / 2, 0, 58), port(0, -Math.PI / 2, 0, 58));
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 90, 12), brass); valve.rotation.z = Math.PI / 2; valve.position.set(-200, 40, -60); helmet.add(valve);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(235, 40, 8, 24), boots); belt.rotation.x = Math.PI / 2; belt.position.y = -60; body.add(belt);
  const weight = new THREE.Mesh(new THREE.BoxGeometry(260, 220, 60), boots); weight.position.set(0, 330, 250); body.add(weight);
  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 300, 420, 0); body.add(sh);
    const up = new THREE.Mesh(cap(85, 300), canvas); up.position.y = -190; sh.add(up);
    const el = new THREE.Group(); el.position.y = -380; sh.add(el);
    const lo = new THREE.Mesh(cap(75, 280), canvas); lo.position.y = -170; el.add(lo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(62, 12, 10), canvas); hand.scale.set(1, 1.3, 0.8); hand.position.y = -360; el.add(hand);
    return { sh, el, hand };
  };
  const armL = mkArm(1), armR = mkArm(-1);
  const mkLeg = (side) => {
    const hip = new THREE.Group(); hip.position.set(side * 120, -120, 0); body.add(hip);
    const th = new THREE.Mesh(cap(105, 360), canvas); th.position.y = -230; hip.add(th);
    const kn = new THREE.Group(); kn.position.y = -460; hip.add(kn);
    const sh = new THREE.Mesh(cap(95, 300), canvas); sh.position.y = -200; kn.add(sh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(170, 140, 330), boots); boot.position.set(0, -390, 60); kn.add(boot);
    return { hip, kn };
  };
  const legL = mkLeg(1), legR = mkLeg(-1);
  // Luftschlauch nach oben
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-200, 780, -80), new THREE.Vector3(-500, 1600, -300), new THREE.Vector3(-300, 3200, 200), new THREE.Vector3(-900, 6000, 0), new THREE.Vector3(-600, 9000, 300)]);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 32, 8), rubber); body.add(hose);
  const carry = new THREE.Group(); carry.position.set(0, 200, 380); body.add(carry);
  return { root, body, helmet, armL, armR, legL, legR, carry };
}

function lumpGeometry() {
  // Grün korrodierter Klumpen in der Größe des Geräts (ca. 33 x 19 x 10 cm), unregelmäßig
  const g = new THREE.IcosahedronGeometry(1, 6); const p = g.attributes.position; const v = new THREE.Vector3(); const col = [];
  const C1 = new THREE.Color('#3f7258'), C2 = new THREE.Color('#2a3b2d'), C3 = new THREE.Color('#6f6a45'), C4 = new THREE.Color('#5a9a78'), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = vnoise(v.x * 2.2 + 3, v.y * 2.2, v.z * 2.2) * 0.6 + vnoise(v.x * 6, v.y * 6 + 2, v.z * 6) * 0.3 + vnoise(v.x * 15, v.y * 15, v.z * 15 + 7) * 0.1;
    const r = 0.78 + n * 0.45;
    // kastenartige Grundform (das Gerät steckt darin)
    const bx = Math.sign(v.x) * Math.pow(Math.abs(v.x), 0.7), by = Math.sign(v.y) * Math.pow(Math.abs(v.y), 0.7), bz = Math.sign(v.z) * Math.pow(Math.abs(v.z), 0.7);
    p.setXYZ(i, bx * 105 * r, by * 170 * r, bz * 55 * r);
    const k = vnoise(v.x * 4 + 11, v.y * 4, v.z * 4);
    tmp.copy(C1).lerp(C2, clamp((n - 0.45) * 2.5)).lerp(C3, clamp((k - 0.6) * 3) * 0.7).lerp(C4, clamp((0.35 - n) * 3) * 0.6);
    col.push(tmp.r, tmp.g, tmp.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}

function dissolveMaterial(base, uniforms) {
  base.onBeforeCompile = (sh) => {
    sh.uniforms.uDis = uniforms.uDis;
    sh.vertexShader = 'varying vec3 vObjP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vObjP = position;');
    sh.fragmentShader = 'uniform float uDis; varying vec3 vObjP;\n' + NOISE_GLSL + '\n' + sh.fragmentShader
      .replace('void main() {', 'void main() {\n float nn = vn3(vObjP * 0.025) * 0.65 + vn3(vObjP * 0.09) * 0.35;\n if (nn < uDis) discard;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(1.0, 0.55, 0.18) * (1.0 - smoothstep(0.0, 0.06, nn - uDis)) * step(0.001, uDis) * 4.0;');
  };
  return base;
}

function rayTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(255,255,255,0.0)'); v.addColorStop(0.15, 'rgba(255,255,255,0.9)'); v.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = v; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function plasterTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const img = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const n = vnoise(x * 0.05, y * 0.05, 1) * 0.6 + vnoise(x * 0.2, y * 0.2, 2) * 0.4; const i = (y * 256 + x) * 4; img.data[i] = 198 + n * 30; img.data[i + 1] = 184 + n * 28; img.data[i + 2] = 158 + n * 22; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); return t;
}
function notesTexture() {
  // Skizzenblatt ohne erfundene Schrift: Zahnradskizzen und Linien
  const c = document.createElement('canvas'); c.width = 512; c.height = 360; const g = c.getContext('2d');
  g.fillStyle = '#e9e0c9'; g.fillRect(0, 0, 512, 360); g.strokeStyle = 'rgba(40,30,20,0.75)'; g.lineWidth = 2;
  const gear = (x, y, r, n) => { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? r : r + 6; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); g.beginPath(); g.arc(x, y, 4, 0, TAU); g.stroke(); };
  gear(150, 170, 95, 40); gear(285, 120, 38, 15); gear(330, 250, 55, 22);
  g.lineWidth = 1; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(400, 40 + i * 30); g.lineTo(490, 40 + i * 30); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------------ Intro
export function createIntro({ renderer, camera, mainScene, M, env, setExplode, frontPose, overlay, t: tr, onDone }) {
  const scene = new THREE.Scene(); scene.environment = env;
  const SEA = new THREE.Color('#0b4a52'), SEA_DEEP = new THREE.Color('#06262b'), LAB = new THREE.Color('#3a2f24'), HAZE = new THREE.Color('#7fb7b0');
  scene.background = SEA.clone(); scene.fog = new THREE.FogExp2(SEA.clone(), 0.00032);
  const seaY = -4200;
  const uSea = { uTime: { value: 0 }, uFogColor: { value: scene.fog.color }, uFogDensity: { value: 0.00032 }, uLight: { value: 1 } };

  // Licht
  const hemi = new THREE.HemisphereLight(0x9fe3e0, 0x0b2a2a, 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xbfefff, 1.6); sun.position.set(800, 6000, 1200); scene.add(sun);
  const lamp = new THREE.SpotLight(0xffd9a0, 0, 6000, 0.6, 0.6, 1.2); lamp.position.set(600, 1400, 900); lamp.target.position.set(0, -60, 0); scene.add(lamp, lamp.target);
  const fill = new THREE.PointLight(0xffc890, 0, 5000, 1.5); fill.position.set(-1200, 600, 1400); scene.add(fill);

  // ---------------- Meeresgrund
  const sea = new THREE.Group(); scene.add(sea);
  {
    const geo = new THREE.PlaneGeometry(26000, 26000, 140, 140); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, seaY + (vnoise(x * 0.0006, 0, z * 0.0006) - 0.5) * 900 + (vnoise(x * 0.003, 3, z * 0.003) - 0.5) * 140 + Math.sin(x * 0.004 + z * 0.002) * 30 - Math.max(0, x - 2500) * 0.18); }
    geo.computeVertexNormals();
    sea.add(new THREE.Mesh(geo, seabedMaterial(uSea)));
  }
  const groundY = (x, z) => seaY + (vnoise(x * 0.0006, 0, z * 0.0006) - 0.5) * 900 + (vnoise(x * 0.003, 3, z * 0.003) - 0.5) * 140 + Math.sin(x * 0.004 + z * 0.002) * 30 - Math.max(0, x - 2500) * 0.18;
  const mStd = (c, r = 0.85, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
  const terracotta = mStd(0x8a5a3c, 0.95), terracottaGrown = mStd(0x5f6a4c, 1), rock = mStd(0x3a4640, 1), marble = mStd(0xb9b8ad, 0.7), timber = mStd(0x3b2c20, 1), bronzeOld = mStd(0x4f6e57, 0.6, 0.4);
  const amph = amphoraGeometry(), handle = handleGeometry();
  const place = (obj, x, z, lift = 0) => { obj.position.set(x, groundY(x, z) + lift, z); sea.add(obj); return obj; };
  for (let i = 0; i < 34; i++) {
    const a = new THREE.Group(); const m = rnd() < 0.5 ? terracotta : terracottaGrown;
    a.add(new THREE.Mesh(amph, m)); for (const s of [-1, 1]) { const h = new THREE.Mesh(handle, m); h.position.set(s * 60, 250, 0); h.rotation.y = s > 0 ? 0 : Math.PI; a.add(h); }
    const x = -2600 + rnd() * 5400, z = -2200 + rnd() * 3600;
    a.rotation.set(Math.PI / 2 + (rnd() - 0.5) * 0.8, rnd() * TAU, (rnd() - 0.5) * 0.5);
    if (rnd() < 0.3) a.scale.set(1, 0.55, 1); // zerbrochen
    place(a, x, z, 80);
  }
  for (let i = 0; i < 26; i++) { const r = new THREE.Mesh(rockGeometry(200 + rnd() * 700), rock); r.rotation.y = rnd() * TAU; place(r, -4000 + rnd() * 9000, -3500 + rnd() * 5500, 60); }
  // Rumpfspanten und Planken
  for (let i = 0; i < 9; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(1100, 55, 6, 18, Math.PI * 0.55), timber); rib.rotation.set(0, Math.PI / 2, Math.PI * 0.72); place(rib, -1800 + i * 380, -900, -250); }
  for (let i = 0; i < 7; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(3600, 40, 170), timber); pl.rotation.set(0, 0.04 * i, (rnd() - 0.5) * 0.08); place(pl, -300, -1300 + i * 190, 10); }
  const fig1 = place(lyingFigure(marble), -700, 700, 120); fig1.rotation.y = 0.6;
  const fig2 = place(lyingFigure(marble, 0.9), 1300, -300, 100); fig2.rotation.set(0.1, -1.2, 0.15);
  const horse = place(lyingHorse(marble), -2100, 300, 230); horse.rotation.set(0, 0.9, 0.25);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(70, 600, 6, 12), bronzeOld); arm.rotation.set(0.2, 0.4, Math.PI / 2.2); place(arm, 450, 820, 70);
  // Lichtstrahlen
  const rays = []; const rayTex = rayTexture();
  for (let i = 0; i < 9; i++) {
    const m = new THREE.MeshBasicMaterial({ map: rayTex, color: 0xbff6ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const r = new THREE.Mesh(new THREE.PlaneGeometry(500 + rnd() * 700, 9000), m);
    r.position.set(-3000 + rnd() * 6000, seaY + 4300, -2500 + rnd() * 4000); r.rotation.z = 0.12; r.userData.ph = rnd() * TAU; sea.add(r); rays.push(r);
  }
  // Schwebeteilchen ("Meeresschnee")
  const dot = dotTexture();
  const snowN = 2500, snowPos = new Float32Array(snowN * 3);
  for (let i = 0; i < snowN; i++) { snowPos[i * 3] = -4000 + rnd() * 8000; snowPos[i * 3 + 1] = seaY - 200 + rnd() * 5400; snowPos[i * 3 + 2] = -3500 + rnd() * 7000; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: dot, size: 22, color: 0xd8fff8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  sea.add(snow);

  // ---------------- Taucher (Standard-Helmtauchanzug um 1900)
  const dmat = { copper: mStd(0xb8743a, 0.35, 0.9), brass: mStd(0xc9a24e, 0.35, 0.9), canvas: mStd(0x8f8a74, 1), boots: mStd(0x35393c, 0.7, 0.3), glass: mStd(0x0e2226, 0.1, 0.2), rubber: mStd(0x2e2724, 0.8) };
  const D = diver(dmat); sea.add(D.root);
  const diverStart = new THREE.Vector3(250, 0, 300); diverStart.y = groundY(diverStart.x, diverStart.z);
  D.root.position.copy(diverStart); D.root.rotation.y = -0.5;
  // Blasen aus dem Helmventil
  const bubN = 220, bubPos = new Float32Array(bubN * 3), bubVel = new Float32Array(bubN);
  const bubGeo = new THREE.BufferGeometry(); bubGeo.setAttribute('position', new THREE.BufferAttribute(bubPos, 3));
  const bubbles = new THREE.Points(bubGeo, new THREE.PointsMaterial({ map: dot, size: 34, color: 0xe8ffff, transparent: true, opacity: 0.8, depthWrite: false })); sea.add(bubbles);
  for (let i = 0; i < bubN; i++) { bubPos[i * 3 + 1] = -1e6; bubVel[i] = 600 + rnd() * 700; }

  // ---------------- Klumpen
  const uDis = { value: 0 };
  const lumpMat = dissolveMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.15, emissive: 0x000000 }), { uDis });
  const lump = new THREE.Mesh(lumpGeometry(), lumpMat); scene.add(lump);
  const lumpRest = new THREE.Vector3(-120, 0, 520); lumpRest.y = groundY(lumpRest.x, lumpRest.z) + 50;
  // Bröckelnde Patina beim Auflösen
  const flN = 600, flPos = new Float32Array(flN * 3), flVel = new Float32Array(flN * 3);
  const flGeo = new THREE.BufferGeometry(); flGeo.setAttribute('position', new THREE.BufferAttribute(flPos, 3));
  const flakes = new THREE.Points(flGeo, new THREE.PointsMaterial({ map: dot, size: 9, color: 0x6fae86, transparent: true, opacity: 0, depthWrite: false })); scene.add(flakes);
  for (let i = 0; i < flN; i++) { const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(); flPos.set([v.x * 105, v.y * 170 - 12, v.z * 55], i * 3); flVel.set([v.x * 160, 40 + rnd() * 120, v.z * 160], i * 3); }

  // ---------------- Labor (Athen, 1902)
  const lab = new THREE.Group(); lab.visible = false; scene.add(lab);
  const tableTop = -176;
  {
    const wood = oliveWood(); wood.repeat.set(5, 2);
    const tw = mStd(0xd2b08a, 0.7, 0, { map: wood }), dark = mStd(0x2c2219, 0.9), plaster = mStd(0xffffff, 0.95, 0, { map: plasterTexture() });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2400, 60, 1300), tw); top.position.set(0, tableTop - 30, 0); lab.add(top);
    for (const [x, z] of [[-1100, -560], [1100, -560], [-1100, 560], [1100, 560]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(90, 760, 90), dark); l.position.set(x, tableTop - 440, z); lab.add(l); }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), mStd(0x4a3626, 0.9, 0, { map: (() => { const w = oliveWood(); w.repeat.set(10, 10); return w; })() })); floor.rotation.x = -Math.PI / 2; floor.position.y = tableTop - 820; lab.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(14000, 6000), plaster); wall.position.set(0, tableTop + 2100, -2600); lab.add(wall);
    const wainscot = new THREE.Mesh(new THREE.BoxGeometry(14000, 1100, 40), dark); wainscot.position.set(0, tableTop - 270, -2580); lab.add(wainscot);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1900), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); win.position.set(-1900, tableTop + 1600, -2570); lab.add(win);
    for (const [w, h, x, y] of [[40, 1900, -1900, 0], [1300, 40, -1900, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 30), dark); b.position.set(x, tableTop + 1600 + y, -2560); lab.add(b); }
    // Regal mit Kisten und Gefäßen
    for (let r = 0; r < 4; r++) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(1600, 40, 360), dark); sh.position.set(1900, tableTop + 200 + r * 520, -2380); lab.add(sh);
      for (let k = 0; k < 5; k++) { const isJar = (r + k) % 2; const o = new THREE.Mesh(isJar ? new THREE.CylinderGeometry(90, 110, 260, 14) : new THREE.BoxGeometry(220, 200, 240), isJar ? terracotta : mStd(0x6b5136, 0.9)); o.position.set(1300 + k * 300, tableTop + 340 + r * 520, -2380); lab.add(o); }
    }
    // Arbeitsmaterial auf dem Tisch
    const notes = new THREE.Mesh(new THREE.PlaneGeometry(420, 300), mStd(0xffffff, 0.95, 0, { map: notesTexture() })); notes.rotation.set(-Math.PI / 2, 0, 0.18); notes.position.set(520, tableTop + 2, 300); lab.add(notes);
    const brassM = dmat.brass;
    const lens = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(70, 9, 10, 32), brassM); const glassL = new THREE.Mesh(new THREE.CircleGeometry(68, 32), new THREE.MeshStandardMaterial({ color: 0xdff3ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3 }));
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 200, 12), dark); grip.rotation.z = Math.PI / 2; grip.position.x = 170; lens.add(ring, glassL, grip); lens.rotation.x = -Math.PI / 2; lens.position.set(-480, tableTop + 12, 360); lab.add(lens);
    // Messing-Mikroskop
    const mic = new THREE.Group(); const foot = new THREE.Mesh(new THREE.CylinderGeometry(120, 140, 40, 24), brassM); mic.add(foot);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 340, 12), brassM); pillar.position.y = 190; mic.add(pillar);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 300, 16), brassM); tube.position.set(70, 300, 0); tube.rotation.z = 0.25; mic.add(tube);
    mic.position.set(-850, tableTop + 20, -250); lab.add(mic);
    // Fragment-Schalen
    for (const [x, z] of [[760, -280], [980, -120]]) { const tray = new THREE.Mesh(new THREE.CylinderGeometry(150, 130, 40, 24), mStd(0xe8e2d4, 0.6)); tray.position.set(x, tableTop + 20, z); lab.add(tray); const fr = new THREE.Mesh(rockGeometry(70), mStd(0x46705a, 0.9, 0.1)); fr.position.set(x, tableTop + 60, z); lab.add(fr); }
  }

  // ------------------------------------------------------------------ Steuerung
  const DURATION = 29;
  let time = 0, active = false, handed = false;
  const caption = overlay.querySelector('.intro-caption'), skipBtn = overlay.querySelector('.intro-skip'), tag = overlay.querySelector('.intro-tag'), fade = overlay.querySelector('.intro-fade');
  const CAPS = [[0.8, 4.6, 'intro.1'], [4.9, 9.6, 'intro.2'], [9.9, 16.2, 'intro.3'], [17.6, 21.9, 'intro.4'], [22.3, 27.6, 'intro.5']];
  let capKey = null;
  const setCaption = (k) => { if (k === capKey) return; capKey = k; caption.classList.remove('on'); if (k) setTimeout(() => { if (capKey === k) { caption.textContent = tr(k); caption.classList.add('on'); } }, 180); };

  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), tmpV = new THREE.Vector3();
  const handWorld = new THREE.Vector3();
  const mainParent = M.root.parent; const mainFov = camera.fov;

  function poseDiver(tt) {
    const pick = smooth(9.2, 10.6, tt) * (1 - smooth(11.2, 12.4, tt));   // Bücken
    const swim = smooth(12.2, 13.2, tt);
    D.body.rotation.x = pick * 0.75 - swim * 0.1;
    D.body.position.y = 950 - pick * 260;
    for (const [arm, s] of [[D.armL, 1], [D.armR, -1]]) {
      arm.sh.rotation.x = -pick * 1.1 - swim * 0.9 + Math.sin(tt * 1.3 + s) * 0.06;
      arm.sh.rotation.z = s * (0.15 + swim * 0.1);
      arm.el.rotation.x = -0.3 - swim * 1.0;
    }
    for (const [leg, s] of [[D.legL, 1], [D.legR, -1]]) { leg.hip.rotation.x = Math.sin(tt * 1.6 + s) * 0.08 * (1 - swim) + swim * Math.sin(tt * 3 + s * 1.6) * 0.25; leg.kn.rotation.x = pick * 0.6 + swim * 0.3; }
    // Aufstieg
    const up = ease(smooth(12.4, 17.2, tt));
    D.root.position.set(lerp(diverStart.x, 0, smooth(12.4, 16, tt)), diverStart.y + up * (-diverStart.y - 900) + Math.sin(tt * 0.9) * 15, lerp(diverStart.z, 0, smooth(12.4, 16, tt)));
    D.root.rotation.y = lerp(-0.5, 0.3, smooth(12, 15, tt));
  }

  function update(dt) {
    time = Math.min(DURATION, time + dt); render(time);
    if (time >= DURATION) finish();
  }
  function render(tt) {
    uSea.uTime.value = tt * 0.6;
    poseDiver(tt);
    // --- Klumpen: liegt -> in Händen -> schwebt zum Labortisch -> löst sich auf
    D.root.updateMatrixWorld(true);
    D.carry.getWorldPosition(handWorld);
    const grab = smooth(10.6, 11.4, tt), toTable = ease(smooth(16.4, 19.4, tt));
    tmpV.copy(lumpRest).lerp(handWorld, grab);
    lump.position.copy(tmpV).lerp(new THREE.Vector3(0, -12, 0), toTable);
    lump.rotation.set(lerp(1.2, 0, grab) * (1 - toTable), lerp(0.4, D.root.rotation.y, grab) * (1 - toTable), lerp(0.25, 0, grab));
    const dis = smooth(20.6, 24.6, tt); uDis.value = dis * 1.05;
    lump.visible = dis < 1;
    // --- Blasen
    const bp = bubGeo.attributes.position; const helm = tmpV; D.helmet.getWorldPosition(helm);
    for (let i = 0; i < bubN; i++) {
      let y = bubPos[i * 3 + 1];
      if (y < -1e5 || y > helm.y + 3000) { if (rnd() < 0.08 && tt < 17) { bubPos[i * 3] = helm.x - 200 + (rnd() - 0.5) * 60; bubPos[i * 3 + 1] = helm.y + 40; bubPos[i * 3 + 2] = helm.z - 60 + (rnd() - 0.5) * 60; } else { bubPos[i * 3 + 1] = -1e6; continue; } }
      bubPos[i * 3 + 1] += bubVel[i] * 0.016; bubPos[i * 3] += Math.sin(tt * 6 + i) * 3;
    }
    bp.needsUpdate = true;
    for (const r of rays) { r.material.opacity = (0.08 + 0.06 * Math.sin(tt * 0.7 + r.userData.ph)); r.lookAt(camera.position.x, r.position.y, camera.position.z); }
    snow.position.y = -tt * 30;
    // --- Umgebungs-Morph: Meer -> Dunst -> Labor
    const haze = smooth(15.2, 17.6, tt) * (1 - smooth(18.0, 20.2, tt));
    const toLab = tt > 17.6;
    sea.visible = !toLab; lab.visible = toLab; D.root.visible = !toLab;
    const depthLight = lerp(0.75, 1.15, smooth(12, 16.5, tt));
    const fogC = scene.fog.color;
    if (!toLab) { fogC.copy(SEA_DEEP).lerp(SEA, depthLight - 0.6).lerp(HAZE, haze); scene.fog.density = lerp(0.00032, 0.0015, haze); }
    else { fogC.copy(LAB).lerp(HAZE, haze); scene.fog.density = lerp(0.00012, 0.0015, haze); }
    scene.background.copy(fogC); uSea.uFogDensity.value = scene.fog.density; uSea.uLight.value = depthLight;
    hemi.intensity = toLab ? 0.35 : 1.1 * depthLight; hemi.color.set(toLab ? 0xfff0dc : 0x9fe3e0); hemi.groundColor.set(toLab ? 0x2a2118 : 0x0b2a2a);
    sun.intensity = toLab ? 0.0 : 1.6 * depthLight;
    lamp.intensity = toLab ? 2.6 : 0; fill.intensity = toLab ? 0.8 : 0;
    // --- Modell setzt sich zusammen
    const asm = smooth(20.6, 25.4, tt);
    if (tt >= 20.4) {
      if (M.root.parent !== scene) scene.add(M.root);
      M.root.visible = true; M.root.scale.setScalar(lerp(0.55, 1, ease(asm))); setExplode(lerp(1.35, 0, ease(asm)));
    } else { M.root.visible = false; }
    // Patina-Flocken
    const fl = smooth(20.6, 21.2, tt) * (1 - smooth(24.5, 26, tt)); flakes.material.opacity = fl * 0.9; flakes.visible = fl > 0;
    const ft = Math.max(0, tt - 20.6);
    flakes.position.set(0, -ft * 60, 0); flakes.scale.setScalar(1 + ft * 0.35);
    // --- Kamera
    if (tt < 9.4) {
      const k = ease(smooth(0, 9.4, tt));
      camPos.set(lerp(-3400, -1500, k), lerp(seaY + 2900, diverStart.y + 1500, k), lerp(4200, 2900, k));
      camTgt.set(lerp(-300, 150, k), lerp(seaY + 150, diverStart.y + 800, k), lerp(-300, 350, k));
    } else if (tt < 16.4) {
      const k = ease(smooth(9.4, 12.6, tt));
      tmpV.copy(lump.position);
      camPos.set(lerp(-1500, tmpV.x - 1700, k), lerp(diverStart.y + 1500, tmpV.y + 350, k), lerp(2900, tmpV.z + 2000, k));
      camTgt.set(lerp(150, tmpV.x, k), lerp(diverStart.y + 800, tmpV.y + 200, k), lerp(350, tmpV.z, k));
    } else {
      const k = ease(smooth(16.4, 19.4, tt)), k2 = ease(smooth(25, 28.2, tt));
      tmpV.copy(lump.position);
      const labPos = new THREE.Vector3(-520, 260, 1050), labTgt = new THREE.Vector3(0, -40, 0);
      camPos.set(tmpV.x - 1700, tmpV.y + 350, tmpV.z + 2000).lerp(labPos, k);
      camTgt.set(tmpV.x, tmpV.y + 200, tmpV.z).lerp(labTgt, k);
      // langsame Fahrt um das entstehende Modell, dann in die Startansicht der App
      const orbit = smooth(19.4, 25, tt) * 0.5;
      camPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit * 0.55 * (1 - k2));
      camPos.lerp(new THREE.Vector3(...frontPose.pos), k2); camTgt.lerp(new THREE.Vector3(...frontPose.target), k2);
    }
    camera.fov = lerp(50, mainFov, smooth(25, 28.2, tt)); camera.updateProjectionMatrix();
    camera.position.copy(camPos); camera.lookAt(camTgt);
    // --- Untertitel, Blenden
    const cap = CAPS.find(([a, b]) => tt >= a && tt < b); setCaption(cap ? cap[2] : null);
    fade.style.opacity = String(Math.max(1 - smooth(0, 1.2, tt), smooth(27.6, 28.6, tt)));
    renderer.render(scene, camera);
  }

  function start() {
    time = 0; active = true; handed = false; capKey = null;
    overlay.hidden = false; overlay.classList.add('on'); skipBtn.textContent = tr('skip'); tag.textContent = tr('reenact');
    document.body.classList.add('intro-on');
    if (mainParent) scene.add(M.root); M.root.visible = false;
  }
  function finish() {
    if (handed) return; handed = true; active = false;
    M.root.visible = true; M.root.scale.setScalar(1); setExplode(0); mainScene.add(M.root); camera.fov = mainFov; camera.updateProjectionMatrix();
    overlay.classList.remove('on'); setTimeout(() => { overlay.hidden = true; }, 600);
    document.body.classList.remove('intro-on');
    caption.classList.remove('on');
    onDone();
  }
  skipBtn.addEventListener('click', finish);
  return { start, update, finish, seek(tt) { time = tt; render(tt); }, get active() { return active; }, DURATION };
}
