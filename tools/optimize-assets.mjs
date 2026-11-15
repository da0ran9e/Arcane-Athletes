// Optional: make heavy source assets web-friendly. Originals are kept.
//   board maps  public/assets/images/<id>.png (8000px) -> <id>.webp (2048px)   needs: npm i sharp
//   music       public/assets/audio/*.wav              -> *.ogg                 needs: ffmpeg on PATH
// Usage: node tools/optimize-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadTracks } from '../server/tracks.js';
const TRACKS = loadTracks();

const A = path.resolve(import.meta.dirname, '../public/assets');
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.log('sharp not installed -> skipping images (npm i sharp)'); }
if (sharp) for (const t of TRACKS) {
  const src = path.join(A, t.img + '.png'), out = path.join(A, t.img + '.webp');
  if (!fs.existsSync(src)) { console.log('missing', t.img + '.png'); continue; }
  if (fs.existsSync(out)) continue;
  await sharp(src, { limitInputPixels: false }).resize(2048, 2048, { fit: 'inside' }).webp({ quality: 82 }).toFile(out);
  console.log('wrote', path.relative(A, out));
}

const dir = path.join(A, 'audio');
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
if (!hasFfmpeg) console.log('ffmpeg not found -> skipping audio');
else for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.wav')) : []) {
  const out = path.join(dir, f.replace(/\.wav$/, '.ogg'));
  if (fs.existsSync(out)) continue;
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', path.join(dir, f), '-c:a', 'libvorbis', '-q:a', '4', out]);
  console.log(r.status === 0 ? 'wrote' : 'FAILED', 'audio/' + path.basename(out));
}
