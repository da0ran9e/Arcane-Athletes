// Optional: make heavy source assets web-friendly. Originals are kept; an output is rebuilt whenever its source is newer.
//   board maps   images/<id>.png      -> <id>.webp   (longest side 4096 px)    needs: npm i sharp
//   card sheets  cards/<sheet>.jpg    -> <sheet>.webp (longest side 4096 px)   needs: npm i sharp
//   music        audio/*.wav          -> *.ogg                                 needs: ffmpeg on PATH
// The game prefers the optimised copy as long as it is not older than the original.
// Usage: node tools/optimize-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadTracks } from '../server/tracks.js';
import { SHEETS } from '../shared/cards.js';

const A = path.resolve(import.meta.dirname, '../public/assets'), MAX = 4096;
const stale = (src, out) => !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs;
const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.log('sharp not installed -> skipping images (npm i sharp)'); }
if (sharp) {
  const sources = [...loadTracks().map(t => ['.png', '.jpg'].map(e => t.img + e).find(f => fs.existsSync(path.join(A, f))) || t.img + '.png'), ...Object.values(SHEETS).map(s => s.file)];
  for (const rel of new Set(sources)) {
    const src = path.join(A, rel), out = src.replace(/\.\w+$/, '.webp');
    if (!fs.existsSync(src)) { console.log('missing', rel); continue; }
    if (!stale(src, out)) continue;
    await sharp(src, { limitInputPixels: false }).resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(out);
    console.log('wrote', path.relative(A, out), `(${kb(src)} -> ${kb(out)})`);
  }
}

const dir = path.join(A, 'audio');
if (spawnSync('ffmpeg', ['-version']).status !== 0) console.log('ffmpeg not found -> skipping audio');
else for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.wav')) : []) {
  const src = path.join(dir, f), out = src.replace(/\.wav$/, '.ogg');
  if (!stale(src, out)) continue;
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-c:a', 'libvorbis', '-q:a', '4', out]);
  console.log(r.status === 0 ? `wrote audio/${path.basename(out)} (${kb(src)} -> ${kb(out)})` : `FAILED audio/${path.basename(out)}`);
}
