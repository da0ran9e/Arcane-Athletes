// Tracks come from public/assets/tracks/track_<n>.json (waypoint schema, master spec Part V.2).
// A missing or invalid file falls back to the built-in layout for that race.
import fs from 'node:fs';
import path from 'node:path';
import { TRACKS, fromJson } from '../shared/tracks.js';

const ASSETS = path.resolve(import.meta.dirname, '../public/assets');

// Width and height of a PNG, WebP or JPEG file, read from its header; null if unknown.
function imageSize(file) {
  let fd = null;
  try {
    fd = fs.openSync(file, 'r');
    const b = Buffer.alloc(262144), n = fs.readSync(fd, b, 0, b.length, 0);
    if (n > 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (n > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
      const kind = b.toString('latin1', 12, 16);
      if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
      if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { width: 1 + (v & 0x3fff), height: 1 + (v >>> 14 & 0x3fff) }; }
    }
    if (n > 4 && b[0] === 0xff && b[1] === 0xd8) for (let i = 2; i + 9 < n;) { // JPEG: find the start-of-frame segment
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch {} finally { if (fd !== null) fs.closeSync(fd); }
  return null;
}

export function loadTracks() {
  return TRACKS.map((t, i) => {
    const f = path.join(ASSETS, 'tracks', `track_${i + 1}.json`);
    if (!fs.existsSync(f)) return t;
    try {
      const tr = fromJson(JSON.parse(fs.readFileSync(f, 'utf8')), i);
      // the board is as wide/tall as the picture really is; image_resolution in the JSON is only a fallback
      const size = ['.png', '.webp', '.jpg'].map(e => imageSize(path.join(ASSETS, tr.img + e))).find(s => s && s.width > 0 && s.height > 0);
      if (size) tr.aspect = size.height / size.width;
      return tr;
    } catch (e) { console.error(`[tracks] ${path.basename(f)}: ${e.message} - using built-in layout`); return t; }
  });
}
