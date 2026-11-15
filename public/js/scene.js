// 3D view: themed surroundings, board image, thick cut-out standees, dice. Pure renderer driven by snapshots and animation calls from main.js.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TRACKS, trackPoints, reverseTrack, spaceAt, BOARD_W } from '../shared/tracks.js';
import { CARD } from '../shared/cards.js';
import { ICONS } from './icons.js';

export const COLORS = ['#e5484d', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6'];
const THEMES = {
  plains: { sky: 0x9fd6ff, ground: 0x6dbb58, rim: 0x5a4028, deco: 'tree', decoCol: 0x2f8a3c, n: 110, light: 1 },
  wildwood: { sky: 0x86c5b0, ground: 0x2e6a3c, rim: 0x3d2b1a, deco: 'tree', decoCol: 0x174d27, n: 220, light: 0.92 },
  spiral: { sky: 0x1a1126, ground: 0x2b2340, rim: 0x15101f, deco: 'crystal', decoCol: 0xb07cff, n: 120, light: 0.85 },
  vortex: { sky: 0x040716, ground: 0x0c1230, rim: 0x0a0d22, deco: 'crystal', decoCol: 0x7fe3ff, n: 90, light: 0.9, stars: true },
};
function rng32(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TYPE_COL = { n: 0xf4ecd0, star: 0xffd54a, trip: 0xe2574c, up: 0x4cc38a, down: 0xb06cf0, start: 0xffffff, finish: 0x333333 };
const QUALITY = { low: [1, false], med: [1.5, false], high: [2, true] };
const DICE_ROT = { 1: [0, 0, Math.PI / 2], 6: [0, 0, -Math.PI / 2], 2: [0, 0, 0], 5: [Math.PI, 0, 0], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] };
const STANDEE_H = 6, THICK = 0.2, LAYERS = 7; // cut-out height, cardboard thickness (world units), slices
const RIM = 0.2, RIM_DARK = 0.1; // bright outline around each standee plus a thin dark edge, in world units
const VIEW_DIR = new THREE.Vector3(0, 0.74, 0.68).normalize(); // default direction from the board centre to the camera
const initial = n => ([...String(n ?? '?').replace(/^🤖\s*/u, '').replace(/[^\p{L}\p{N}]/gu, '')][0] || '?').toUpperCase();

const texCache = new Map();
function canvasTex(key, w, h, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}
// Shared image textures; onLoad fires once the image size is known.
const loader = new THREE.TextureLoader(), imgCache = new Map();
function imageTex(url, onLoad) {
  let e = imgCache.get(url);
  if (!e) {
    e = { cbs: [], done: false };
    e.t = loader.load(url, () => { e.done = true; e.cbs.forEach(f => f(e.t)); e.cbs = []; });
    e.t.colorSpace = THREE.SRGBColorSpace; e.t.anisotropy = 4;
    imgCache.set(url, e);
  }
  if (onLoad) e.done ? onLoad(e.t) : e.cbs.push(onLoad);
  return e.t;
}
const labelTex = (text, color = '#222') => canvasTex('L' + text + color, 128, 128, g => {
  g.font = `bold ${text.length > 2 ? 50 : 76}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = color; g.fillText(text, 64, 70);
});
// used only when a standee PNG is missing (and for the Devourer token)
const fallbackTex = code => canvasTex('S' + code, 240, 400, g => {
  g.fillStyle = code[0] === 'T' ? '#8a1c1c' : '#667'; g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(42, 392); g.bezierCurveTo(30, 250, 70, 190, 120, 190); g.bezierCurveTo(170, 190, 210, 250, 198, 392); g.closePath(); g.stroke(); g.fill();
  g.beginPath(); g.arc(120, 112, 96, 0, 7); g.fillStyle = '#fff6de'; g.fill(); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '118px serif'; g.fillText(ICONS[code] || '❓', 120, 122);
});
const shadowTex = () => canvasTex('shadow', 64, 64, g => {
  const r = g.createRadialGradient(32, 32, 4, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});
const diceTex = n => canvasTex('D' + n, 128, 128, g => {
  g.fillStyle = '#fffdf5'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#c9b98a'; g.lineWidth = 8; g.strokeRect(4, 4, 120, 120);
  g.fillStyle = n === 1 ? '#d33' : '#222';
  const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
  for (const [x, y] of P) { g.beginPath(); g.arc(30 + x * 34, 30 + y * 34, 12, 0, 7); g.fill(); }
});
// Outline behind a standee so it stands out on a busy, colourful board: the art's silhouette, dilated, drawn as a
// white rim with a thin dark edge (readable on light and dark squares alike). The quad is larger than the art by `pad`.
function rimMaterial(map) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { map: { value: map }, pad: { value: new THREE.Vector2(1, 1) }, rad: { value: new THREE.Vector2(0.05, 0.05) }, grow: { value: 1 + RIM_DARK / RIM } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D map; uniform vec2 pad, rad; uniform float grow; varying vec2 vUv;
      float alphaAt(vec2 uv) { return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? 0.0 : texture2D(map, uv).a; }
      void main() {
        vec2 uv = (vUv - 0.5) * pad + 0.5;
        float inner = 0.0, outer = 0.0;
        for (int i = 0; i < 12; i++) {
          float t = float(i) * 0.5235988;
          vec2 d = vec2(cos(t), sin(t)) * rad;
          inner = max(inner, max(alphaAt(uv + d), alphaAt(uv + d * 0.5)));
          outer = max(outer, alphaAt(uv + d * grow));
        }
        if (inner >= 0.5) gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        else if (outer >= 0.5) gl_FragColor = vec4(0.07, 0.08, 0.16, 1.0);
        else discard;
      }`,
  });
}
// Owner badge floating above a standee: the player's initial on their colour (gold rim = your own runner).
const badgeTex = (ch, color, mine) => canvasTex('B' + ch + color + mine, 64, 64, g => {
  g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fillStyle = color; g.fill();
  g.lineWidth = 5; g.strokeStyle = mine ? '#ffd24a' : '#ffffff'; g.stroke();
  g.font = 'bold 32px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(ch, 32, 34);
});
const flagTex = (text, color) => canvasTex('F' + text + color, 128, 80, g => {
  g.beginPath(); g.moveTo(2, 4); g.lineTo(124, 40); g.lineTo(2, 76); g.closePath();
  g.fillStyle = color; g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
  g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(text, 36, 42);
});

export class Scene {
  constructor(canvas, hasAsset, assetUrl, pickAsset) {
    this.hasAsset = hasAsset; this.assetUrl = assetUrl; this.pickAsset = pickAsset; this.canvas = canvas; this.tracks = TRACKS;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.5, 500);
    this.ctl = new OrbitControls(this.cam, canvas);
    Object.assign(this.ctl, { enableDamping: true, maxPolarAngle: 1.45, minDistance: 8, maxDistance: 160, autoRotateSpeed: 0.5 });
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x556070, 1.3);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.3);
    this.sun.position.set(25, 60, 30);
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 160 });
    this.world = new THREE.Group(); this.pieces = new THREE.Group(); this.chipG = new THREE.Group();
    this.scene.add(this.hemi, this.sun, this.world, this.pieces, this.chipG);

    this.st = new Map(); this.tweens = []; this.key = null; this.pts = []; this.L = 0; this.rev = false;
    this.active = null; this.follow = true; this.chipKey = ''; this.targets = new Set();
    this.insets = [0, 0, 0, 0]; this.depth = BOARD_W; this.fitDist = 80; this.userMoved = false; this.camBusy = false; this.camTween = null;
    const flat = g => g.rotateX(-Math.PI / 2);
    this.geo = {
      tile: new THREE.CylinderGeometry(1.7, 1.7, 0.1, 24), flat: flat(new THREE.PlaneGeometry(1, 1)),
      card: new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), ring: flat(new THREE.RingGeometry(0.95, 1.25, 28)),
      chip: new THREE.CylinderGeometry(0.45, 0.45, 0.14, 14),
    };
    this.dice = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), [1, 6, 2, 5, 3, 4].map(n => new THREE.MeshBasicMaterial({ map: diceTex(n) })));
    this.dice.visible = false; this.diceHide = 0;
    this.ring = new THREE.Mesh(flat(new THREE.RingGeometry(1.35, 1.6, 32)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false }));
    this.ring.visible = false;
    this.scene.add(this.dice, this.ring);

    let q = 'med';
    try { q = localStorage.getItem('agp.q') || q; } catch {}
    this.setQuality(q);
    addEventListener('resize', () => this.resize());
    this.resize();
    // once the player moves the camera themselves, stop re-framing the board automatically
    let dragging = false;
    this.ctl.addEventListener('start', () => { dragging = true; });
    this.ctl.addEventListener('end', () => { dragging = false; });
    this.ctl.addEventListener('change', () => { if (dragging) this.userMoved = true; });
    canvas.addEventListener('dblclick', () => this.resetView());
    // click (not drag) on a standee -> onPick(runnerId)
    let down = null;
    const ray = new THREE.Raycaster();
    canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), this.cam);
      const hit = ray.intersectObjects(this.pieces.children, true)[0];
      if (hit) { let o = hit.object; while (o && !o.userData.id) o = o.parent; if (o) this.onPick?.(o.userData.id); }
    });
    this.last = performance.now();
    const loop = now => { requestAnimationFrame(loop); if (!document.hidden) this.frame(now); };
    requestAnimationFrame(loop);
  }

  setQuality(q) {
    if (!QUALITY[q]) q = 'med';
    this.q = q;
    try { localStorage.setItem('agp.q', q); } catch {}
    const [pr, shadows] = QUALITY[q];
    this.r.setPixelRatio(Math.min(devicePixelRatio, pr));
    this.r.shadowMap.enabled = shadows; this.sun.castShadow = shadows;
    this.scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
  }

  // ---------- camera ----------
  resize() {
    this.r.setSize(innerWidth, innerHeight, false);
    this.cam.aspect = innerWidth / innerHeight;
    this.cam.fov = innerWidth < innerHeight ? 72 : 50; // portrait phones need a wider view
    this.applyOffset();
    if (!this.userMoved && this.key) this.resetView(0);
  }
  // HUD panels cover parts of the window: [left, right, top, bottom] in px. The view is shifted so the orbit centre
  // sits in the middle of the free area, and the default zoom fits the board into it.
  setInsets(...v) {
    if (v.every((x, i) => x === this.insets[i])) return;
    this.insets = v;
    this.applyOffset();
    if (!this.userMoved && this.key) this.resetView(350);
  }
  applyOffset() {
    const [l, r, t, b] = this.insets;
    if (l || r || t || b) this.cam.setViewOffset(innerWidth, innerHeight, (r - l) / 2, (b - t) / 2, innerWidth, innerHeight);
    else this.cam.clearViewOffset();
    this.cam.updateProjectionMatrix();
  }
  // Camera distance at which the whole board fits the free part of the window.
  fit() {
    const [l, r, t, b] = this.insets, tv = Math.tan(this.cam.fov * Math.PI / 360);
    const fw = Math.max(0.25, (innerWidth - l - r) / innerWidth), fh = Math.max(0.25, (innerHeight - t - b) / innerHeight);
    return Math.min(150, Math.max(26, (BOARD_W / 2 + 5) / (tv * this.cam.aspect * fw), (this.depth * 0.38 + 6) / (tv * fh)));
  }
  // Default camera position: the whole board on landscape screens; closer (and following the action) on portrait phones.
  home() {
    this.fitDist = this.fit();
    return VIEW_DIR.clone().multiplyScalar(innerWidth < innerHeight ? this.fitDist * 0.62 : this.fitDist);
  }
  camTo(pos, target, ms) {
    const old = this.tweens.indexOf(this.camTween); // camera moves are exclusive: a new one replaces the one in flight
    if (old >= 0) this.tweens.splice(old, 1);
    this.camTween = null; this.camBusy = false;
    if (!ms) { this.cam.position.copy(pos); this.ctl.target.copy(target); return; }
    const p0 = this.cam.position.clone(), t0 = this.ctl.target.clone();
    this.camBusy = true;
    this.camTween = this.tween(ms, k => { const e = k * k * (3 - 2 * k); this.cam.position.lerpVectors(p0, pos, e); this.ctl.target.lerpVectors(t0, target, e); }, () => { this.camBusy = false; });
  }
  resetView(ms = 450) { this.userMoved = false; this.camTo(this.home(), new THREE.Vector3(), ms); }
  topView() { this.userMoved = true; this.camTo(new THREE.Vector3(0, this.fit() * 1.02, 0.5), new THREE.Vector3(), 450); }
  // Idle = slow orbit behind the home screen and lobby.
  setIdle(on) {
    if (this.ctl.autoRotate === on) return;
    this.ctl.autoRotate = on;
    if (!on) this.resetView(0);
  }

  // ---------- board ----------
  gi(pos) { return Math.max(0, Math.min(this.L, this.rev ? this.L - pos : pos)); }
  build(id, rev) {
    const base = this.tracks.find(t => t.id === id) || TRACKS.find(t => t.id === id);
    const img = this.pickAsset(base.img, ['.webp'], ['.png', '.jpg']);
    const key = id + (rev ? '~' : '') + (img && this.assetUrl(img)) + base.L;
    if (key === this.key) return;
    this.key = key;
    const tr = rev ? reverseTrack(base) : base, W = this.world, D = BOARD_W * (base.aspect || 1);
    W.traverse(o => { if (o.geometry && !Object.values(this.geo).includes(o.geometry)) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
    W.clear();
    this.pts = trackPoints(base).map(p => new THREE.Vector3(...p)); this.L = base.L; this.rev = !!rev;
    const add = (geo, mat, pos) => { const m = new THREE.Mesh(geo, mat); m.position.copy(pos); m.receiveShadow = true; W.add(m); return m; };
    const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, ...extra });

    // themed surroundings; the board image lies on a slab in the middle and already shows the spaces
    const th = THEMES[id] || THEMES.plains;
    this.scene.background = new THREE.Color(th.sky);
    this.scene.fog = new THREE.Fog(th.sky, 110, 300);
    this.hemi.intensity = 1.3 * th.light; this.sun.intensity = 1.3 * th.light;
    const ground = add(new THREE.CircleGeometry(280, 48).rotateX(-Math.PI / 2), lam(th.ground), new THREE.Vector3(0, -0.8, 0));
    add(new THREE.BoxGeometry(BOARD_W + 2.4, 0.7, D + 2.4), lam(th.rim), new THREE.Vector3(0, -0.46, 0)).castShadow = true;
    if (th.stars) {
      const r = rng32(7), v = [];
      for (let i = 0; i < 700; i++) { const a = r() * 6.28, b = r() * 1.2 + 0.1, R = 240; v.push(R * Math.cos(a) * Math.cos(b), R * Math.sin(b), R * Math.sin(a) * Math.cos(b)); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      W.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, fog: false })));
      ground.material.transparent = true; ground.material.opacity = 0.6;
    }
    { // scenery ring, kept clear of the board
      const r = rng32(id.length * 97 + 3), spots = [], tree = th.deco === 'tree';
      for (let i = 0; i < 6000 && spots.length < th.n; i++) {
        const a = r() * 6.283, d = 10 + r() * 85, x = Math.cos(a) * d, z = Math.sin(a) * d;
        const front = z > 0 && z < 75 && Math.abs(x) < BOARD_W / 2 + 12; // keep the default line of sight clear
        if (!front && (Math.abs(x) > BOARD_W / 2 + 4 || Math.abs(z) > D / 2 + 4)) spots.push([x, z, 0.8 + r() * 1.6]);
      }
      const inst = new THREE.InstancedMesh(tree ? new THREE.ConeGeometry(1.5, 4.2, 7) : new THREE.OctahedronGeometry(1.2), tree ? lam(th.decoCol) : lam(th.decoCol, { emissive: th.decoCol, emissiveIntensity: 0.45 }), spots.length);
      const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion();
      spots.forEach(([x, z, sc], i) => inst.setMatrixAt(i, m4.compose(new THREE.Vector3(x, tree ? 2.1 * sc - 0.8 : 0.4 * sc + (th.stars ? r() * 12 : 0), z), qt.setFromEuler(new THREE.Euler(0, r() * 6, tree ? 0 : r())), new THREE.Vector3(sc, sc, sc))));
      inst.castShadow = true;
      W.add(inst);
    }
    if (img) {
      const tex = imageTex(this.assetUrl(img), t => { // the board always takes the picture's own proportions, whatever the JSON says
        const real = t.image.height / t.image.width;
        if (base.norm && this.key === key && Math.abs(real - (base.aspect || 1)) > 0.01 * real) { base.aspect = real; this.key = null; this.build(id, rev); }
      });
      add(new THREE.PlaneGeometry(BOARD_W, D).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex }), new THREE.Vector3(0, -0.1, 0));
    }
    else { // no board image at all: draw plain markers so the game stays playable
      add(new THREE.PlaneGeometry(BOARD_W, D).rotateX(-Math.PI / 2), lam(0x3c6b45), new THREE.Vector3(0, -0.1, 0));
      for (let g = 0; g <= this.L; g++) {
        const i = rev ? this.L - g : g, p = this.pts[g], s = spaceAt(tr, i);
        const kind = i === 0 ? 'start' : i === this.L ? 'finish' : !s ? 'n' : s.t === 'arrow' ? (s.n > 0 ? 'up' : 'down') : s.t;
        add(this.geo.tile, lam(TYPE_COL[kind]), p);
        const text = i === 0 ? 'GO' : i === this.L ? '🏁' : !s ? String(i) : s.t === 'star' ? '★' : s.t === 'trip' ? '⚠' : (s.n > 0 ? '+' : '−') + Math.abs(s.n);
        add(this.geo.flat, new THREE.MeshBasicMaterial({ map: labelTex(text, s ? '#fff' : '#333'), transparent: true, depthWrite: false }), p.clone().setY(0.08)).scale.setScalar(2.2);
      }
    }
    // flags beside the 1st and 2nd corner: several abilities depend on where a runner is relative to them
    for (const [c, col, n] of [[tr.c1, '#38bdf8', '1'], [tr.c2, '#fb7185', '2']]) {
      const p = this.pts[this.gi(c)], out = new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(3.3);
      add(new THREE.CylinderGeometry(0.08, 0.08, 5.4, 6), lam(0xeeeeee), new THREE.Vector3(p.x + out.x, 2.2, p.z + out.z));
      const flag = new THREE.Sprite(new THREE.SpriteMaterial({ map: flagTex(n, col) }));
      flag.center.set(0, 0.5); flag.scale.set(2.3, 1.45, 1); flag.position.set(p.x + out.x, 4.1, p.z + out.z);
      W.add(flag);
    }
    if (rev) for (const [g, text, col] of [[this.L, 'GO', '#4ade80'], [0, '🏁', '#fff']]) { // direction flipped: mark the new ends
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(text, col), depthTest: false }));
      s.position.copy(this.pts[g]).setY(6.5); s.scale.setScalar(4); W.add(s);
    }
    this.podium = rev ? [] : (base.podium || []).map(([x, y]) => new THREE.Vector3((x - 0.5) * BOARD_W, 0, (y - 0.5) * D));
    this.depth = D;
    this.resetView(0);
  }

  slot(pos, k, n) {
    const p = this.pts[this.gi(pos)].clone();
    if (n > 1) { const rad = (pos <= 0 || pos >= this.L ? 2.1 : 1.4) + (n > 4 ? 0.5 : 0), a = k / n * 6.283 + 0.6; p.x += Math.cos(a) * rad; p.z += Math.sin(a) * rad; }
    return p;
  }

  // ---------- pieces ----------
  // A standee is the character PNG "thickened": the same alpha-cut texture stacked in slices,
  // art on the outer faces and plain cardboard in between, so it reads as a solid cut-out from any angle.
  ensure(id, code, owner, label, mine) {
    let s = this.st.get(id);
    const key = [code, owner, label, mine].join('|');
    if (s && s.key === key) return s;
    if (s) this.pieces.remove(s.g);
    const color = COLORS[owner] || '#b91c1c';
    const g = new THREE.Group();
    g.userData.id = id;
    const shadow = new THREE.Mesh(this.geo.flat, new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
    shadow.scale.setScalar(4.6); shadow.position.y = 0.03;
    const ring = new THREE.Mesh(this.geo.ring, new THREE.MeshBasicMaterial({ color }));
    ring.position.y = 0.05;
    const body = new THREE.Group();
    const face = new THREE.MeshBasicMaterial({ map: fallbackTex(code), alphaTest: 0.5, side: THREE.DoubleSide });
    const edge = new THREE.MeshBasicMaterial({ map: face.map, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x8a7558 });
    for (let i = 0; i < LAYERS; i++) {
      const m = new THREE.Mesh(this.geo.card, i === 0 || i === LAYERS - 1 ? face : edge);
      m.position.z = (i / (LAYERS - 1) - 0.5) * THICK; m.castShadow = i === 0;
      body.add(m);
    }
    const rim = new THREE.Mesh(this.geo.card, rimMaterial(face.map));
    rim.position.z = -THICK / 2 - 0.03; // the standee always faces the camera, so the rim sits just behind it
    body.add(rim);
    const size = w => { // body is the unit card scaled to w x STANDEE_H; the rim quad is larger by the outline width
      const pad = RIM + RIM_DARK, u = rim.material.uniforms;
      body.scale.set(w, STANDEE_H, 1);
      rim.scale.set(1 + 2 * pad / w, 1 + 2 * pad / STANDEE_H, 1); rim.position.y = -pad / STANDEE_H;
      u.pad.value.set(rim.scale.x, rim.scale.y); u.rad.value.set(RIM / w, RIM / STANDEE_H);
    };
    size(STANDEE_H * 0.6); body.position.y = 0.06;
    const img = CARD[code]?.img;
    if (img && this.hasAsset(img)) imageTex(this.assetUrl(img), t => {
      face.map = edge.map = rim.material.uniforms.map.value = t; face.needsUpdate = edge.needsUpdate = true;
      size(STANDEE_H * t.image.width / t.image.height);
    });
    g.add(shadow, ring, body);
    let tag = null;
    if (owner >= 0) { // whose runner this is, readable from any distance
      tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex(label, color, mine), depthTest: false, fog: false }));
      tag.scale.setScalar(mine ? 1.5 : 1.25); tag.renderOrder = 5;
      g.add(tag);
    }
    this.pieces.add(g);
    const prev = s;
    s = { g, body, ring, tag, color: new THREE.Color(color), key, target: new THREE.Vector3(), busy: false, trip: false, vis: true, hot: false, fresh: !prev };
    if (prev) g.position.copy(prev.g.position);
    this.st.set(id, s);
    return s;
  }

  sync(snap, you = -1) {
    const rc = snap?.race;
    if (!rc) { for (const s of this.st.values()) this.pieces.remove(s.g); this.st.clear(); this.active = null; this.chipG.clear(); this.chipKey = ''; return; }
    this.build(rc.track, rc.rev);
    const list = rc.runners.map(r => ({ ...r }));
    if (rc.monster != null) list.push({ id: 'monster', code: 'T-01', owner: -1, pos: rc.monster });
    const groups = {};
    for (const r of list) if (!r.out) (groups[r.pos] ||= []).push(r);
    const seen = new Set();
    for (const r of list) {
      const s = this.ensure(r.id, r.code, r.owner, r.owner >= 0 ? initial(snap.players[r.owner]?.name) : '', r.owner === you), grp = groups[r.pos] || [r];
      s.target = r.fin && this.podium[r.fin - 1] ? this.podium[r.fin - 1].clone() : this.slot(r.pos, Math.max(0, grp.indexOf(r)), grp.length);
      s.trip = !!r.trip; s.vis = !r.out;
      if (s.fresh) { s.g.position.copy(s.target); s.fresh = false; }
      seen.add(r.id);
    }
    for (const [id, s] of this.st) if (!seen.has(id)) { this.pieces.remove(s.g); this.st.delete(id); }
    this.active = rc.cur;
    const ck = this.key + rc.chips.join();
    if (ck !== this.chipKey) {
      this.chipKey = ck; this.chipG.clear();
      const m = new THREE.MeshLambertMaterial({ color: 0xffc83d, emissive: 0x7a5200 });
      for (const pos of rc.chips) { const c = new THREE.Mesh(this.geo.chip, m); c.position.copy(this.pts[this.gi(pos)]).add(new THREE.Vector3(1.2, 0.1, 1.2)); this.chipG.add(c); }
    }
  }
  // Runners the player is being asked to choose between: their rings pulse gold and their badges bounce.
  setTargets(ids) { this.targets = new Set(ids); }

  tween(d, fn, done) { const t = { t0: performance.now(), d: Math.max(1, d), fn, done }; this.tweens.push(t); return t; }

  animMove(id, from, to, d, warp) {
    const s = this.st.get(id);
    if (!s || !this.pts.length) return;
    s.busy = true;
    const at = p => this.pts[this.gi(p)].clone();
    if (warp) {
      const a = s.g.position.clone(), b = at(to);
      return this.tween(d * 0.9, k => { s.g.scale.setScalar(Math.max(0.01, Math.abs(1 - 2 * k))); s.g.position.copy(k < 0.5 ? a : b); s.g.position.y += Math.sin(k * Math.PI) * 3; }, () => { s.busy = false; });
    }
    const path = [s.g.position.clone()], step = Math.sign(to - from);
    for (let p = from + step; p !== to + step; p += step) path.push(at(p));
    const n = path.length - 1;
    if (n < 1) { s.busy = false; return; }
    this.tween(d * 0.92, k => {
      const f = Math.min(n - 1e-6, k * n), i = Math.floor(f), fr = f - i;
      s.g.position.lerpVectors(path[i], path[i + 1], fr);
      s.body.position.y = 0.06 + Math.sin(fr * Math.PI) * 1.1; // jump arc; the shadow stays on the board
    }, () => { s.busy = false; s.body.position.y = 0.06; });
  }

  // Tumble the die above a runner (or above the board centre when id is unknown) and settle on v.
  animRoll(id, v, d) {
    const s = this.st.get(id), dice = this.dice;
    const p = s ? s.g.position : this.ctl.target, h = s ? STANDEE_H + 2.6 : 5;
    dice.position.set(p.x, p.y + h, p.z);
    dice.visible = true; this.diceHide = performance.now() + d + 900;
    const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...DICE_ROT[v] || [0, 0, 0]));
    const spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), qs = new THREE.Quaternion();
    this.tween(d * 0.7, k => {
      const e = 1 - (1 - k) ** 3;
      dice.quaternion.copy(q0).multiply(qs.setFromAxisAngle(spin, (1 - e) * 14)).slerp(q1, e);
      dice.position.y = p.y + h + Math.abs(Math.sin(k * 9)) * (1 - k) * 1.8;
    }, () => { dice.quaternion.copy(q1); });
  }

  hop(id) { // little celebration jump
    const s = this.st.get(id);
    if (s) this.tween(900, k => { s.body.position.y = 0.06 + Math.abs(Math.sin(k * 9.4)) * (1 - k) * 1.8; });
  }

  frame(now) {
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    for (const t of [...this.tweens]) { // oldest first, so the most recent animation of a property has the last word
      let k = Math.max(0, Math.min(1, (now - t.t0) / t.d)); // rAF time can lag performance.now()
      try { t.fn(k); } catch (e) { console.error(e); k = 1; }
      if (k >= 1) { const i = this.tweens.indexOf(t); if (i >= 0) this.tweens.splice(i, 1); t.done?.(); }
    }
    const ease = 1 - Math.exp(-dt * 9), cam = this.cam.position;
    for (const [id, s] of this.st) {
      const g = s.g;
      if (!s.busy) { g.position.lerp(s.target, ease); g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s.vis ? 1 : 0.001, ease)); }
      g.visible = g.scale.x > 0.02;
      g.rotation.y = Math.atan2(cam.x - g.position.x, cam.z - g.position.z);
      // lean back a little toward a high camera so the art is not foreshortened; tripped = lying flat
      const lean = Math.min(0.7, Math.atan2(cam.y - g.position.y, Math.hypot(cam.x - g.position.x, cam.z - g.position.z)) * 0.6);
      const rx = s.body.rotation.x = THREE.MathUtils.lerp(s.body.rotation.x, s.trip ? -Math.PI / 2 + 0.06 : -lean, ease);
      const hot = this.targets.has(id);
      if (hot !== s.hot) { s.hot = hot; s.ring.material.color.set(hot ? 0xffd24a : s.color); s.ring.scale.setScalar(1); }
      if (hot) s.ring.scale.setScalar(1.3 + 0.22 * Math.sin(now / 140));
      if (s.tag) s.tag.position.set(0, 0.75 + s.body.position.y + STANDEE_H * Math.cos(rx) + (hot ? 0.4 * Math.abs(Math.sin(now / 220)) : 0), STANDEE_H * Math.sin(rx));
    }
    if (this.dice.visible && now > this.diceHide) this.dice.visible = false;
    const a = this.active && this.st.get(this.active);
    this.ring.visible = !!a && a.g.visible;
    if (a) {
      this.ring.position.copy(a.g.position); this.ring.position.y = 0.07;
      this.ring.scale.setScalar(1 + 0.12 * Math.sin(now / 180));
    }
    // when zoomed in, gently pan so the active runner stays in view (zoomed out, the whole board is visible anyway)
    if (this.follow && a && !this.ctl.autoRotate && !this.camBusy && cam.distanceTo(this.ctl.target) < this.fitDist * 0.8) {
      const dlt = a.g.position.clone().setY(0).sub(this.ctl.target).multiplyScalar(1 - Math.exp(-dt * 1.4));
      this.ctl.target.add(dlt); cam.add(dlt);
    }
    this.ctl.update();
    this.r.render(this.scene, this.cam);
  }
}
