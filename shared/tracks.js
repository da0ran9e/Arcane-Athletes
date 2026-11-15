// Track definitions shared by server (rules) and client (3D layout).
// sp: { spaceIndex: 'S' (star) | 'T' (trip) | number (arrow: move that many spaces) }
// Position 0 = Start, position L = Finish.
export const TRACKS = [
  { id: 'plains', L: 28, c1: 9, c2: 18, layout: 'oval', img: 'images/bc84b1380de5',
    sp: { 5: 'S', 8: 2, 13: 'T', 16: 'S', 21: -2, 24: 'S' } },
  { id: 'wildwood', L: 30, c1: 10, c2: 20, layout: 'snake', img: 'images/cf3c7ffb6ddc',
    sp: { 3: 2, 6: 'T', 9: 'S', 12: 'T', 14: -3, 17: 1, 19: 'T', 22: 'S', 24: -2, 26: 'T', 28: 1 } },
  { id: 'spiral', L: 32, c1: 11, c2: 21, layout: 'spiral', img: 'images/07245029d251',
    sp: { 4: 'S', 7: 'T', 10: 1, 13: -1, 15: 'S', 18: 'T', 20: 2, 23: -4, 25: 'S', 28: 'T', 30: -1 } },
  { id: 'vortex', L: 34, c1: 12, c2: 23, layout: 'helix', img: 'images/875e1c0e6ba2',
    sp: { 3: 1, 5: 'T', 8: 'S', 11: -3, 14: 'T', 16: 4, 19: 'S', 22: 'T', 25: -2, 27: 'S', 29: 3, 31: 'T', 33: -5 } },
];

// Board effect of a space, or null.
export function spaceAt(tr, i) {
  const s = tr.sp[i];
  if (s == null) return null;
  return s === 'S' ? { t: 'star' } : s === 'T' ? { t: 'trip' } : { t: 'arrow', n: s };
}

// Twist T-04: Start and Finish trade places. Logical space i becomes L - i.
export function reverseTrack(tr) {
  const sp = {};
  for (const [i, s] of Object.entries(tr.sp)) sp[tr.L - i] = typeof s === 'number' ? -s : s;
  return { ...tr, sp, c1: tr.L - tr.c2, c2: tr.L - tr.c1, rev: !tr.rev };
}

// Parametric centre-lines, u in [0,1] -> [x, y, z]. World is ~64 units across.
const TAU = Math.PI * 2;
const CURVES = {
  oval: u => { const a = TAU * (0.56 + 0.9 * u); return [25 * Math.cos(a), 0, 15 * Math.sin(a)]; },
  snake: u => [21 * Math.sin(u * 3 * Math.PI), 0, -19 + 38 * u],
  spiral: u => { const a = TAU * 1.75 * u + 2.4, r = 26 - 20 * u; return [r * Math.cos(a), 0, r * Math.sin(a)]; },
  helix: u => { const a = TAU * 2 * u + 2.4, r = 25 - 18 * u; return [r * Math.cos(a), 0, r * Math.sin(a)]; },
};

export const BOARD_W = 64; // world width of the board image; depth = BOARD_W * aspect

// L+1 world points [x, 0, z] along the track (geometric order: index 0 = original Start).
// Tracks loaded from waypoint JSON carry tr.norm ([[norm_x, norm_y], ...]) taken from the board image;
// the built-in tracks fall back to a generated curve.
export function trackPoints(tr) {
  if (tr.norm) return tr.norm.map(([x, y]) => [(x - 0.5) * BOARD_W, 0, (y - 0.5) * BOARD_W * (tr.aspect || 1)]);
  const f = CURVES[tr.layout], M = 1500, pts = [], len = [0];
  for (let i = 0; i <= M; i++) {
    pts.push(f(i / M));
    if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  }
  const out = [];
  for (let k = 0, j = 0; k <= tr.L; k++) {
    const target = len[M] * k / tr.L;
    while (j < M && len[j] < target) j++;
    out.push(pts[j]);
  }
  return out;
}

// ---------- waypoint JSON (master spec, Part V.2) ----------
const NAMES = ['Emerald Plains', 'Wildwood Rapids', 'Obsidian Spiral', 'Celestial Vortex'];

// Built-in track -> JSON in the documented schema (used to generate placeholder data).
export function toJson(tr, i, size = 2048) {
  const pts = trackPoints(tr);
  return {
    track_id: 'track_' + (i + 1), track_name: NAMES[i], image_path: `assets/${tr.img}.png`,
    image_resolution: { width: size, height: size }, total_spaces: tr.L + 1,
    first_corner_index: tr.c1, second_corner_index: tr.c2, finish_space_index: tr.L,
    waypoints: pts.map((p, k) => {
      const s = tr.sp[k], w = { index: k, type: k === 0 ? 'START' : k === tr.L ? 'FINISH' : s === 'T' ? 'TRIP' : s === 'S' ? 'STAR' : s != null ? 'ARROW' : 'NORMAL' };
      if (typeof s === 'number') w.steps = s;
      if (s === 'S') w.points = 1;
      w.norm_x = +((p[0] / BOARD_W) + 0.5).toFixed(4); w.norm_y = +((p[2] / BOARD_W) + 0.5).toFixed(4);
      return w;
    }),
  };
}

// JSON -> internal track. Waypoints may be sparse: missing coordinates are interpolated, missing types are NORMAL.
export function fromJson(j, i) {
  const base = TRACKS[i], wp = new Map((j.waypoints || []).map(w => [w.index, w]));
  const L = j.finish_space_index ?? Math.max(...wp.keys());
  if (!(L >= 5 && L <= 200)) throw new Error('bad finish_space_index');
  const sp = {}, norm = [];
  for (let k = 0; k <= L; k++) {
    const w = wp.get(k);
    if (w && k > 0 && k < L) {
      if (w.type === 'TRIP') sp[k] = 'T';
      else if (w.type === 'STAR') sp[k] = 'S';
      else if (w.type === 'ARROW' && Number.isInteger(w.steps) && w.steps) sp[k] = w.steps;
    }
    norm.push(w && Number.isFinite(w.norm_x) && Number.isFinite(w.norm_y) ? [w.norm_x, w.norm_y] : null);
  }
  const known = norm.map((p, k) => p ? k : -1).filter(k => k >= 0);
  if (known.length < 2) throw new Error('need at least 2 waypoints with coordinates');
  for (let k = 0; k <= L; k++) if (!norm[k]) {
    const a = known.filter(x => x < k).pop() ?? known[0], b = known.find(x => x > k) ?? known.at(-1);
    const f = a === b ? 0 : (k - a) / (b - a);
    norm[k] = [norm[a][0] + (norm[b][0] - norm[a][0]) * f, norm[a][1] + (norm[b][1] - norm[a][1]) * f];
  }
  const res = j.image_resolution || {};
  const clamp = v => Math.max(1, Math.min(L - 1, Math.round(v)));
  return {
    id: base.id, L, c1: clamp(j.first_corner_index ?? L / 3), c2: clamp(j.second_corner_index ?? 2 * L / 3), sp, norm,
    aspect: res.width > 0 && res.height > 0 ? res.height / res.width : 1,
    podium: Array.isArray(j.podium) ? j.podium.filter(p => Number.isFinite(p.norm_x) && Number.isFinite(p.norm_y)).map(p => [p.norm_x, p.norm_y]) : [],
    img: String(j.image_path || base.img).replace(/^\/?assets\//, '').replace(/\.\w+$/, ''),
  };
}
