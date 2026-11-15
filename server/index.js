// Aetheria Grand Prix server: static files + WebSocket rooms.
// Env: PORT (3000), HOST (0.0.0.0), BASE_PATH ('' or e.g. /game when the site is published at example.com/game).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { Room } from './room.js';
import { loadTracks } from './tracks.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = +process.env.PORT || 3000, HOST = process.env.HOST || '0.0.0.0';
// '' or '/game'. A reverse proxy or Cloudflare Tunnel forwards the full path, so the prefix is stripped here.
// The client uses relative URLs only, so the same build works with or without a prefix.
const BASE = ('/' + (process.env.BASE_PATH || '')).replace(/\/+/g, '/').replace(/\/$/, '');
const MOUNTS = [ // url prefix -> directory
  ['/shared/', path.join(ROOT, 'shared')],
  ['/vendor/three/', path.join(ROOT, 'node_modules/three')],
  ['/', path.join(ROOT, 'public')],
];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
};

// ---------- asset manifest (which optional files exist) ----------
let manifest = { at: 0, body: '{}' };
function walk(dir, base, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name.startsWith('.')) continue;
    if (f.isDirectory()) walk(path.join(dir, f.name), base + f.name + '/', out);
    else out[base + f.name] = Math.round(fs.statSync(path.join(dir, f.name)).mtimeMs);
  }
  return out;
}
function getManifest() {
  if (Date.now() - manifest.at > 5000) {
    let files = {};
    try { files = walk(path.join(ROOT, 'public/assets'), '', {}); } catch {}
    manifest = { at: Date.now(), body: JSON.stringify(files) };
  }
  return manifest.body;
}

// ---------- static files ----------
function serve(req, res) {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (BASE) {
    const prefixed = url === BASE || url.startsWith(BASE + '/');
    if (prefixed) url = url.slice(BASE.length);
    if (url === '' || (!prefixed && url === '/')) { // the page must be opened as BASE/ (with the slash) for relative URLs to resolve
      const q = req.url.indexOf('?');
      return res.writeHead(302, { Location: BASE + '/' + (q < 0 ? '' : req.url.slice(q)) }).end();
    }
  }
  if (url === '/healthz') return res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
  if (url === '/api/manifest') return res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache' }).end(getManifest());
  if (url === '/api/tracks') return res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache' }).end(JSON.stringify(loadTracks()));
  if (url === '/') url = '/index.html';
  const [prefix, dir] = MOUNTS.find(m => url.startsWith(m[0]));
  const file = path.join(dir, url.slice(prefix.length));
  if (!file.startsWith(dir + path.sep)) return res.writeHead(403).end();
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    const mtime = st.mtime.toUTCString();
    const head = {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Last-Modified': mtime, 'Accept-Ranges': 'bytes',
      'Cache-Control': url.startsWith('/vendor/') ? 'public, max-age=86400' : 'no-cache', // assets revalidate so replaced files show at once
    };
    if (req.headers['if-modified-since'] === mtime) return res.writeHead(304, head).end();
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) { // range requests let browsers stream/seek large audio
      const start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) return res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }).end();
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...head, 'Content-Length': st.size });
    req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
  serve(req, res);
});

// ---------- rooms ----------
const rooms = new Map();
const MAX_ROOMS = 200;
function newCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) {
    const c = Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
    if (!rooms.has(c)) return c;
  }
}
const clean = s => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'Player';

const wss = new WebSocketServer({ noServer: true, maxPayload: 8192 });
server.on('upgrade', (req, socket, head) => {
  let p = '';
  try { p = new URL(req.url, 'http://x').pathname; } catch {}
  if (p !== '/ws' && p !== BASE + '/ws') return socket.destroy();
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});
wss.on('connection', ws => {
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', data => {
    let m;
    try { m = JSON.parse(data); } catch { return; }
    if (!m || typeof m !== 'object') return;
    const err = key => ws.send(JSON.stringify({ t: 'err', key }));
    try {
      if (m.t === 'create' || m.t === 'join') {
        if (ws.room) ws.room.leave(ws);
        let room;
        if (m.t === 'create') {
          if (rooms.size >= MAX_ROOMS) return err('err.busy');
          room = new Room(newCode());
          rooms.set(room.code, room);
        } else room = rooms.get(String(m.code || '').toUpperCase());
        if (!room) return err('err.noRoom');
        const e = room.join(ws, clean(m.name), typeof m.token === 'string' ? m.token : null);
        if (e) err(e);
      } else if (ws.room) ws.room.handle(ws, m);
    } catch (e) { console.error('[ws]', e); }
  });
  ws.on('close', () => { if (ws.room) ws.room.leave(ws); });
  ws.on('error', () => {});
});

// Keep-alive pings (Cloudflare drops idle sockets) and cleanup of abandoned rooms.
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
  for (const [code, room] of rooms) {
    if (room.empty() && Date.now() - room.touched > (room.playing ? 30 : 2) * 60000) { room.destroy(); rooms.delete(code); }
  }
}, 30000);

server.on('error', e => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is already in use - is the game already running? Stop it or set another PORT.` : e);
  process.exit(1);
});
server.listen(PORT, HOST, () => console.log(`Aetheria Grand Prix: http://localhost:${PORT}${BASE}/`));
