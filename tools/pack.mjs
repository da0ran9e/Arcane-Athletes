// Builds a self-contained release: the game, its two runtime dependencies and the start scripts.
// On the server only Node.js (and cloudflared for the tunnel) has to be installed - no "npm install" needed.
// Usage: node tools/pack.mjs  ->  release/aetheria-grand-prix/  +  .tar.gz  (+ .zip when the zip command exists)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..'), NAME = 'aetheria-grand-prix';
const OUT = path.join(ROOT, 'release'), DST = path.join(OUT, NAME);
const rel = f => path.relative(ROOT, f);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(DST, { recursive: true });

// Heavy originals are left out when a web-friendly version sits next to them (the client prefers .webp / .ogg / .mp3).
const skipped = [];
function redundant(file) {
  const base = file.replace(/\.\w+$/, ''), ext = path.extname(file).toLowerCase();
  if (ext === '.wav') return ['.ogg', '.mp3'].some(e => fs.existsSync(base + e));
  if (ext === '.png' || ext === '.jpg') return fs.existsSync(base + '.webp');
  return false;
}
const filter = src => {
  if (path.basename(src) === '.DS_Store') return false;
  if (fs.statSync(src).isFile() && redundant(src)) { skipped.push(rel(src)); return false; }
  return true;
};
for (const item of ['server', 'shared', 'public', 'docs', 'deploy', 'run.mjs', 'start.sh', 'start.bat', '.env.example', 'package.json', 'package-lock.json', 'README.md']) {
  fs.cpSync(path.join(ROOT, item), path.join(DST, item), { recursive: true, filter });
}
// runtime dependencies: ws (server) and the two three.js files the page loads
const copy = f => { fs.mkdirSync(path.dirname(path.join(DST, f)), { recursive: true }); fs.cpSync(path.join(ROOT, f), path.join(DST, f), { recursive: true }); };
for (const f of ['node_modules/ws', 'node_modules/three/package.json', 'node_modules/three/LICENSE', 'node_modules/three/build/three.module.min.js', 'node_modules/three/examples/jsm/controls/OrbitControls.js']) {
  if (!fs.existsSync(path.join(ROOT, f))) { console.error(`missing ${f} - run "npm install" first`); process.exit(1); }
  copy(f);
}
fs.chmodSync(path.join(DST, 'start.sh'), 0o755);
fs.chmodSync(path.join(DST, 'deploy/install-service.sh'), 0o755);

const run = (cmd, args) => spawnSync(cmd, args, { cwd: OUT, stdio: 'inherit' }).status === 0;
const made = [];
if (run('tar', ['-czf', NAME + '.tar.gz', NAME])) made.push(NAME + '.tar.gz');
if (spawnSync('zip', ['-v'], { stdio: 'ignore' }).status === 0 && run('zip', ['-qr', NAME + '.zip', NAME])) made.push(NAME + '.zip');

const size = f => (fs.statSync(path.join(OUT, f)).size / 1048576).toFixed(1) + ' MB';
if (skipped.length) console.log(`left out ${skipped.length} heavy original(s) that have a web version:`, skipped.slice(0, 6).join(', ') + (skipped.length > 6 ? ', ...' : ''));
console.log('release folder: ' + rel(DST));
for (const f of made) console.log(`archive: ${rel(path.join(OUT, f))} (${size(f)})`);
console.log('On the server: unpack, put the Cloudflare Tunnel token in .env, run start.sh (Ubuntu) or start.bat (Windows).');
