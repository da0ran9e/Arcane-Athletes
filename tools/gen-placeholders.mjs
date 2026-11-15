// Generates stand-in assets under public/assets with the exact file names of the real ones,
// so pasting the real asset folder on top simply replaces them. Existing files are kept unless --force.
//   cards/   3 sprite sheets + 2 card backs      images/  4 board maps + 72 standees
//   tracks/  4 waypoint JSON files               audio/   19 short music loops (wav)
// Images are drawn in headless Chrome (set CHROME=/path/to/chrome if it is not found).
// Usage: node tools/gen-placeholders.mjs [--force]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import { CARDS, TWISTS, SHEETS, cell } from '../shared/cards.js';
import { TRACKS, toJson } from '../shared/tracks.js';
import { ICONS } from '../public/js/icons.js';

const ROOT = path.resolve(import.meta.dirname, '..'), A = path.join(ROOT, 'public/assets');
const force = process.argv.includes('--force');
const text = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/locales/en.cards.json'), 'utf8'));
const save = (rel, buf) => { const f = path.join(A, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); console.log('wrote', rel, Math.round(buf.length / 1024) + ' KB'); };
const need = rel => force || !fs.existsSync(path.join(A, rel));

// ---------- tracks ----------
const tracks = TRACKS.map((t, i) => toJson(t, i));
tracks.forEach((j, i) => { const rel = `tracks/track_${i + 1}.json`; if (need(rel)) save(rel, JSON.stringify(j, null, 1)); });

// ---------- audio: simple seamless arpeggio loops ----------
const AUDIO = ['7a51de6c732a', '725c65ca467f', 'ec306252ee5f', '11f56ebd7af3', '4836b4f7a3a8', 'f99fca88af73', 'c0bb6e40dd7a', '3ccf4beaef3c', '52e4fee42b7d',
  'e2a840af2c58', '18cf6745aed1', 'a91a1fd56436', '485d17c7f06e', '882f19abf609', 'b72fe54926cb', '4d807db012f3', 'ea20e830418a', '59db7703c5a3', '46582ff5f072'];
AUDIO.forEach((id, k) => {
  const rel = `audio/${id}.wav`;
  if (!need(rel)) return;
  const sr = 16000, bpm = 84 + (k * 13) % 60, beat = 60 / bpm, steps = 32, n = Math.round(sr * beat / 2 * steps);
  const minor = k % 2, root = 110 * 2 ** ((k * 5 % 12) / 12), scale = minor ? [0, 3, 7, 10, 12, 15] : [0, 4, 7, 9, 12, 16];
  const prog = [[0, 5, 3, 4], [0, 3, 4, 0], [0, 4, 5, 3]][k % 3], data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sr, 24); data.writeUInt32LE(sr * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(n * 2, 40);
  const stepLen = n / steps;
  for (let i = 0; i < n; i++) {
    const s = Math.floor(i / stepLen), t = (i - s * stepLen) / sr, chord = prog[Math.floor(s / 8)] * (minor ? 2 : 1);
    const f = root * 2 ** ((chord + scale[(s * (1 + k % 3)) % scale.length]) / 12), bass = root / 2 * 2 ** (chord / 12);
    const v = Math.sin(6.2832 * f * t) * Math.exp(-t * 5) * 0.32 + Math.sin(6.2832 * bass * i / sr) * 0.16 * Math.min(1, t * 40);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32000), 44 + i * 2);
  }
  save(rel, data);
});

// ---------- images (drawn in the browser) ----------
const jobs = [];
const info = c => ({ code: c.code, icon: ICONS[c.code] || '?', set: c.code[0] === 'T' ? 'twist' : c.set, ...(text.cards[c.code] || text.twists[c.code]) });
for (const [key, sh] of Object.entries(SHEETS)) {
  const list = (key === 'twist' ? TWISTS : CARDS.filter(c => c.set === key)).map(c => ({ ...info(c), ...cell(c.id) }));
  const [cw, ch] = key === 'twist' ? [520, 286] : [300, 420];
  jobs.push([sh.file, `sheet(${JSON.stringify(list)},${sh.cols},${sh.rows},${cw},${ch})`]);
}
jobs.push(['cards/4a7954234c04.jpg', 'back(257,358,"AETHERIA","#3b2a6b")'], ['cards/ffcbbc9bd1d4.jpg', 'back(330,186,"REALM SURGE","#7a1f33")']);
for (const c of CARDS) jobs.push([c.img, `standee(${JSON.stringify(info(c))})`]);
tracks.forEach((j, i) => jobs.push([j.image_path.replace('assets/', ''), `board(${JSON.stringify(j)},${i})`]));
const todo = jobs.filter(j => need(j[0]));

const PAGE = String.raw`
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const out = (c, type) => c.toDataURL(type, 0.86).split(',')[1];
const hue = s => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);
function wrap(g, str, x, y, maxW, lh, maxLines) {
  let line = '', n = 0;
  for (const w of str.split(' ')) {
    if (g.measureText(line + w).width > maxW && line) { g.fillText(line.trim() + (++n === maxLines ? '…' : ''), x, y); if (n === maxLines) return y; line = ''; y += lh; }
    line += w + ' ';
  }
  g.fillText(line.trim(), x, y); return y;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function card(g, x, y, w, h, c) {
  const col = { base: ['#f6e2ae', '#b9791f'], exp: ['#d9d0ff', '#5a3fd0'], twist: ['#ffd0d6', '#b0273f'] }[c.set], wide = w > h, u = h / 420 * (wide ? 1.45 : 1);
  g.save(); g.translate(x, y);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, col[0]); gr.addColorStop(1, '#fff');
  g.fillStyle = col[1]; g.fillRect(0, 0, w, h);
  rr(g, 8 * u, 8 * u, w - 16 * u, h - 16 * u, 14 * u); g.fillStyle = gr; g.fill();
  g.textBaseline = 'middle';
  if (wide) {
    g.font = 110 * u + 'px serif'; g.textAlign = 'center'; g.fillText(c.icon, 95 * u, h / 2);
    g.textAlign = 'left'; g.fillStyle = '#221'; g.font = 'bold ' + 25 * u + 'px Helvetica';
    let yy = wrap(g, c.name, 180 * u, 42 * u, w - 200 * u, 28 * u, 2);
    g.font = 17 * u + 'px Helvetica'; g.fillStyle = '#433'; wrap(g, c.desc, 180 * u, yy + 34 * u, w - 200 * u, 21 * u, 5);
    g.fillStyle = col[1]; g.font = 'bold ' + 16 * u + 'px Helvetica'; g.fillText(c.code, 180 * u, h - 24 * u);
  } else {
    rr(g, 22 * u, 22 * u, w - 44 * u, 170 * u, 10 * u); g.fillStyle = 'hsl(' + hue(c.code) + ' 55% 82%)'; g.fill();
    g.font = 120 * u + 'px serif'; g.textAlign = 'center'; g.fillText(c.icon, w / 2, 112 * u);
    g.fillStyle = '#221'; g.font = 'bold ' + 24 * u + 'px Helvetica';
    let yy = wrap(g, c.name, w / 2, 218 * u, w - 40 * u, 26 * u, 2);
    g.fillStyle = col[1]; g.font = 'italic ' + 15 * u + 'px Helvetica'; g.fillText(c.code + ' · ' + c.cat, w / 2, yy + 24 * u);
    g.fillStyle = '#433'; g.font = 15.5 * u + 'px Helvetica'; wrap(g, c.desc, w / 2, yy + 50 * u, w - 44 * u, 19 * u, 7);
  }
  g.restore();
}
function sheet(list, cols, rows, cw, ch) {
  const [c, g] = mk(cols * cw, rows * ch);
  g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
  for (const x of list) card(g, x.col * cw, x.row * ch, cw, ch, x);
  return out(c, 'image/jpeg');
}
function back(w, h, label, col) {
  const [c, g] = mk(w, h);
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ffd76a'; g.lineWidth = 6; rr(g, 12, 12, w - 24, h - 24, 14); g.stroke();
  g.globalAlpha = 0.25; g.lineWidth = 2; for (let i = -h; i < w; i += 18) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
  g.globalAlpha = 1; g.fillStyle = '#ffd76a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = Math.min(w, h) * 0.3 + 'px serif'; g.fillText('🏁', w / 2, h * 0.42);
  g.font = 'bold ' + Math.min(w, h) * 0.1 + 'px Helvetica'; g.fillText(label, w / 2, h * 0.72);
  return out(c, 'image/jpeg');
}
// cut-out character: transparent PNG, roughly 240x400 like the real standees
function standee(c) {
  const w = 240, h = 400, [cv, g] = mk(w, h), H = hue(c.code), dark = c.set === 'exp';
  const shape = () => { g.beginPath(); g.moveTo(42, 392); g.bezierCurveTo(30, 250, 70, 190, 120, 190); g.bezierCurveTo(170, 190, 210, 250, 198, 392); g.closePath(); };
  g.lineJoin = 'round'; g.lineWidth = 14; g.strokeStyle = '#fff';
  shape(); g.stroke(); g.beginPath(); g.arc(120, 112, 96, 0, 7); g.stroke();
  shape(); g.fillStyle = 'hsl(' + H + ' 60% ' + (dark ? 34 : 48) + '%)'; g.fill();
  g.beginPath(); g.ellipse(120, 330, 52, 44, 0, 0, 7); g.fillStyle = 'hsl(' + H + ' 60% ' + (dark ? 46 : 64) + '%)'; g.fill();
  g.beginPath(); g.arc(120, 112, 96, 0, 7); g.fillStyle = dark ? '#2a2342' : '#fff6de'; g.fill();
  g.lineWidth = 8; g.strokeStyle = 'hsl(' + H + ' 60% 40%)'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '118px serif'; g.fillText(c.icon, 120, 122);
  g.font = 'bold 38px Helvetica'; g.fillStyle = '#fff'; g.fillText(c.code, 120, 332);
  return out(cv, 'image/png');
}
const THEME = [['#8fd27a', '#4f9e45', '#f4ecd0', '#c9b27a'], ['#3f8a55', '#1f5a34', '#e3c08a', '#7a5a36'], ['#3a2d55', '#191226', '#a99ad0', '#5a4c80'], ['#152050', '#050818', '#7fa8ff', '#33499a']];
function board(j, i) {
  const S = j.image_resolution.width, [cv, g] = mk(S, S), th = THEME[i], P = j.waypoints.map(w => [w.norm_x * S, w.norm_y * S]);
  const bg = g.createRadialGradient(S / 2, S / 2, 100, S / 2, S / 2, S * 0.75); bg.addColorStop(0, th[0]); bg.addColorStop(1, th[1]);
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  let seed = 11 + i; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let k = 0; k < 500; k++) { // scenery specks, kept off the path
    const x = rnd() * S, y = rnd() * S, r = 8 + rnd() * 26;
    if (P.some(p => Math.hypot(p[0] - x, p[1] - y) < 120)) continue;
    g.globalAlpha = 0.5; g.fillStyle = i > 1 ? (rnd() < 0.5 ? '#fff' : th[2]) : '#1f6b2e';
    g.beginPath(); if (i > 1) g.arc(x, y, r / 5, 0, 7); else { g.moveTo(x, y - r * 1.6); g.lineTo(x + r, y + r); g.lineTo(x - r, y + r); } g.fill();
  }
  g.globalAlpha = 1; g.lineCap = g.lineJoin = 'round';
  g.beginPath(); P.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.strokeStyle = '#0005'; g.lineWidth = 62; g.stroke(); g.strokeStyle = th[3]; g.lineWidth = 46; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  j.waypoints.forEach((w, k) => {
    const [x, y] = P[k], end = w.type === 'START' || w.type === 'FINISH', r = end ? 88 : 56;
    const col = { TRIP: '#e2574c', STAR: '#ffd54a', ARROW: w.steps > 0 ? '#4cc38a' : '#b06cf0', START: '#fff', FINISH: '#fff' }[w.type] || th[2];
    g.beginPath(); g.arc(x, y + 6, r, 0, 7); g.fillStyle = '#0006'; g.fill();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff'; g.stroke();
    if (w.type === 'FINISH') { g.save(); g.clip(); for (let a = -4; a < 4; a++) for (let b = -4; b < 4; b++) { g.fillStyle = (a + b) % 2 ? '#111' : '#fff'; g.fillRect(x + a * 26, y + b * 26, 26, 26); } g.restore(); }
    const label = { START: 'GO', FINISH: '', TRIP: '⚠', STAR: '★', ARROW: (w.steps > 0 ? '+' : '−') + Math.abs(w.steps) }[w.type] ?? String(k);
    g.fillStyle = w.type === 'NORMAL' ? '#0007' : w.type === 'START' ? '#333' : '#fff';
    g.font = 'bold ' + (w.type === 'NORMAL' ? 40 : 58) + 'px Helvetica'; g.fillText(label, x, y + 3);
    if (k === j.first_corner_index || k === j.second_corner_index) {
      const first = k === j.first_corner_index, fx = x + (x > S / 2 ? 78 : -78);
      g.fillStyle = '#eee'; g.fillRect(fx - 4, y - 110, 8, 130);
      g.fillStyle = first ? '#38bdf8' : '#fb7185'; g.fillRect(fx + 4, y - 110, 64, 44);
      g.fillStyle = '#fff'; g.font = 'bold 34px Helvetica'; g.fillText(first ? '1' : '2', fx + 36, y - 86);
    }
  });
  g.fillStyle = '#fff9'; g.font = 'bold 54px Helvetica'; g.textAlign = 'left'; g.fillText(j.track_name, 50, 70);
  g.font = '30px Helvetica'; g.fillText('placeholder board — replace with the real map + waypoint JSON', 50, 122);
  return out(cv, 'image/png');
}`;

if (!todo.length) { console.log('all image placeholders already exist (use --force to redraw)'); process.exit(0); }
const CHROME = process.env.CHROME || { darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }[process.platform] || 'google-chrome';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agp-chrome-')), PORT = 9334;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${tmp}`, 'about:blank'], { stdio: 'ignore' });
chrome.on('error', e => { console.error(`Cannot start Chrome (${CHROME}): ${e.message}. Set CHROME=/path/to/chrome`); process.exit(1); });
let tabs;
for (let i = 0; i < 40 && !tabs; i++) { await new Promise(r => setTimeout(r, 250)); try { tabs = await (await fetch(`http://localhost:${PORT}/json`)).json(); } catch {} }
if (!tabs) { console.error('Chrome did not open its debugging port'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl, { maxPayload: 1 << 28 });
await new Promise(r => ws.on('open', r));
let id = 0; const pend = new Map();
ws.on('message', d => { const m = JSON.parse(d); pend.get(m.id)?.(m); });
const run = expression => new Promise((res, rej) => {
  pend.set(++id, m => m.result?.exceptionDetails || m.error ? rej(new Error(JSON.stringify(m.result?.exceptionDetails || m.error).slice(0, 400))) : res(m.result.result.value));
  ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
});
try {
  await run(PAGE + '; 1');
  for (const [rel, expr] of todo) save(rel, Buffer.from(await run(expr), 'base64'));
} finally {
  chrome.kill();
  await new Promise(r => setTimeout(r, 500));
  try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5 }); } catch {}
}
process.exit(0);
