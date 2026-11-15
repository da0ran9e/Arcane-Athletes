#!/usr/bin/env node
// One command to put the game online:  node run.mjs   (or start-server.cmd on Windows, start.sh on Ubuntu)
// Reads .env, asks for the Cloudflare Tunnel token when it is missing (interactive runs only), starts the game server
// and the Cloudflare Tunnel connector (cloudflared, downloaded into bin/ when it is not installed), restarting the
// connector whenever it stops. See docs/DEPLOY.md.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const log = (...a) => console.log('[run]', ...a);
const interactive = process.stdin.isTTY && process.stdout.isTTY; // false under systemd / Task Scheduler: never wait for input there

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 11)) {
  console.error(`Cần Node.js 20.11 trở lên (máy này đang có ${process.version}). Tải ở https://nodejs.org`);
  process.exit(1);
}

// ---------- settings: .env (real environment variables win) ----------
const envFile = path.join(ROOT, '.env');
if (!fs.existsSync(envFile) && fs.existsSync(envFile + '.example')) {
  fs.copyFileSync(envFile + '.example', envFile);
  log('Đã tạo .env từ .env.example');
}
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
}
if (!process.env.BASE_PATH && process.env.PUBLIC_URL) { // the path part of the public address is where the game is mounted
  try { process.env.BASE_PATH = new URL(process.env.PUBLIC_URL).pathname; } catch { log('PUBLIC_URL không phải địa chỉ hợp lệ:', process.env.PUBLIC_URL); }
}

// ---------- Cloudflare Tunnel token ----------
// Accepts the bare token or the whole "cloudflared ... eyJ..." command pasted from the dashboard. A token is base64 JSON
// ({"a": account, "t": tunnel id, "s": secret}), so a paste that lost characters fails to decode and is caught here.
function parseToken(text) {
  const token = String(text || '').match(/eyJ[A-Za-z0-9+/_=-]{20,}/)?.[0];
  try { return { token, tunnel: String(JSON.parse(Buffer.from(token, 'base64').toString()).t || '') }; } catch { return null; }
}
function saveEnv(key, value) {
  const text = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '', re = new RegExp(`^[ \\t]*${key}[ \\t]*=.*$`, 'm');
  fs.writeFileSync(envFile, re.test(text) ? text.replace(re, () => `${key}=${value}`) : text.replace(/\s*$/, '\n') + `${key}=${value}\n`);
  if (process.platform !== 'win32') try { fs.chmodSync(envFile, 0o600); } catch {}
}
async function askToken() {
  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('SIGINT', () => process.exit(130));
  console.log([
    '',
    '  Cần Cloudflare Tunnel token để đưa game lên mạng.',
    '  Lấy ở Cloudflare dashboard → Zero Trust → Networks → Tunnels → chọn tunnel → Configure',
    '  (chuỗi dài bắt đầu bằng eyJ...; dán cả dòng lệnh cài connector ở đó cũng được).',
    '  Dán vào đây (chuột phải hoặc Ctrl+V) rồi bấm Enter. Để trống rồi Enter = chỉ chạy trong máy này.',
    '',
  ].join('\n'));
  try {
    for (;;) {
      const answer = (await rl.question('  Token: ')).trim();
      if (!answer) return null;
      const t = parseToken(answer);
      if (t) return t;
      console.log('  Không nhận ra token (có thể thiếu ký tự khi copy). Dán lại, hoặc để trống để bỏ qua.');
    }
  } finally { rl.close(); }
}

const rawToken = (process.env.TUNNEL_TOKEN || '').trim(), tunnelOff = /^off$/i.test(rawToken); // off = never ask (cloudflared runs as a service)
let tunnel = parseToken(rawToken);
if (!tunnel && rawToken && !tunnelOff) log('TUNNEL_TOKEN trong .env không đúng dạng (thiếu ký tự?).');
if (!tunnel && !tunnelOff && interactive) {
  tunnel = await askToken();
  if (tunnel) {
    saveEnv('TUNNEL_TOKEN', tunnel.token);
    log(`Đã lưu token vào .env (tunnel ${tunnel.tunnel.slice(0, 8) || '?'}...). Lần sau chỉ cần chạy lại, không phải dán nữa.`);
    log('Muốn đổi token: mở .env, xoá giá trị sau TUNNEL_TOKEN= rồi chạy lại. File .env không bị đưa lên git.');
  }
}

// ---------- dependencies (release packages ship them; a git checkout installs them on first run) ----------
if (['node_modules/ws/package.json', 'node_modules/three/build/three.module.min.js'].some(f => !fs.existsSync(path.join(ROOT, f)))) {
  log('Đang cài thư viện (chỉ lần đầu)...');
  const r = spawnSync('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.error('[run] Không cài được thư viện. Chạy "npm ci --omit=dev" trong thư mục này rồi thử lại.'); process.exit(1); }
}

// ---------- game server (same process) ----------
await import('./server/index.js');
if (process.env.PUBLIC_URL) log('Địa chỉ cho người chơi:', process.env.PUBLIC_URL);

// ---------- Cloudflare Tunnel connector ----------
const exe = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared', ownCopy = path.join(ROOT, 'bin', exe);
// official release files: https://github.com/cloudflare/cloudflared/releases (Windows on ARM runs the x64 build)
const RELEASE = {
  'win32-x64': 'cloudflared-windows-amd64.exe', 'win32-arm64': 'cloudflared-windows-amd64.exe', 'win32-ia32': 'cloudflared-windows-386.exe',
  'linux-x64': 'cloudflared-linux-amd64', 'linux-arm64': 'cloudflared-linux-arm64', 'linux-arm': 'cloudflared-linux-arm', 'linux-ia32': 'cloudflared-linux-386',
}[`${process.platform}-${process.arch}`];

function findCloudflared() {
  const file = [process.env.CLOUDFLARED, path.join(ROOT, exe), ownCopy].find(f => f && fs.existsSync(f));
  if (file) return file;
  return spawnSync(exe, ['--version'], { stdio: 'ignore' }).error ? null : exe; // installed on PATH (apt, winget, ...)
}
// Downloads the official build into bin/. CLOUDFLARED_URL replaces the download folder (a mirror, or a local server in tests).
async function downloadCloudflared() {
  if (!RELEASE) return null;
  const url = (process.env.CLOUDFLARED_URL || 'https://github.com/cloudflare/cloudflared/releases/latest/download/') + RELEASE;
  const part = ownCopy + '.part';
  log(`Chưa có cloudflared → đang tải bản chính thức (khoảng 40-60 MB): ${url}`);
  try {
    fs.mkdirSync(path.dirname(ownCopy), { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(part));
    const size = fs.statSync(part).size, want = !res.headers.get('content-encoding') && Number(res.headers.get('content-length')) || size;
    const head = Buffer.alloc(4), fd = fs.openSync(part, 'r');
    fs.readSync(fd, head, 0, 4, 0); fs.closeSync(fd);
    const magic = process.platform === 'win32' ? head.subarray(0, 2).toString('latin1') === 'MZ' : head.toString('latin1') === '\x7fELF';
    if (size !== want || size < 1e6 || !magic) throw new Error(`file tải về không đúng (${size} byte)`);
    if (process.platform !== 'win32') fs.chmodSync(part, 0o755);
    fs.renameSync(part, ownCopy);
    log(`Đã tải xong: ${path.relative(ROOT, ownCopy)} (${(size / 1048576).toFixed(0)} MB)`);
    return ownCopy;
  } catch (e) {
    fs.rmSync(part, { force: true });
    log('Không tải được cloudflared:', e.message);
    return null;
  }
}
function installHint() {
  console.error('[run] Không có cloudflared nên tunnel CHƯA được bật (game vẫn chạy trong máy này).');
  console.error(process.platform === 'win32'
    ? '      Cài bằng:  winget install --id Cloudflare.cloudflared   (hoặc đặt cloudflared.exe vào thư mục bin\\)'
    : process.platform === 'darwin'
      ? '      Cài bằng:  brew install cloudflared'
      : '      Cài theo https://pkg.cloudflare.com (Ubuntu: thêm kho rồi "sudo apt install cloudflared")');
}

if (tunnelOff) log('TUNNEL_TOKEN=off: không bật tunnel từ đây.');
else if (!tunnel) {
  log('Chưa có TUNNEL_TOKEN: game chỉ vào được từ máy này.');
  log('Dán token vào .env (hoặc chạy lại trong cửa sổ dòng lệnh để được hỏi) để lên mạng; ghi TUNNEL_TOKEN=off nếu máy đã chạy cloudflared dạng service.');
} else {
  const bin = findCloudflared() || await downloadCloudflared();
  if (!bin) installHint();
  else {
    let child = null, stopping = false, delay = 2000, online = false;
    const failed = e => {
      stopping = true; // nothing to retry: the program is missing or cannot be started (the game keeps running)
      if (e.code === 'ENOENT') return installHint();
      console.error('[run] Không chạy được cloudflared:', e.message);
      if (bin === ownCopy) console.error('      Xoá thư mục bin rồi chạy lại để tải lại cloudflared.');
    };
    const launch = () => {
      const started = Date.now();
      online = false;
      // the token travels in the environment, not on the command line, so it does not show up in process listings
      try { child = spawn(bin, ['tunnel', '--no-autoupdate', 'run'], { env: { ...process.env, TUNNEL_TOKEN: tunnel.token }, stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (e) { return failed(e); } // e.g. a file that is not a program for this machine
      for (const s of [child.stdout, child.stderr]) s.on('data', d => {
        for (const l of String(d).split(/\r?\n/)) if (l.trim()) {
          console.log('[tunnel]', l);
          if (!online && /Registered tunnel connection/i.test(l)) {
            online = true;
            log(`✔ Đã lên mạng. Người chơi vào: ${process.env.PUBLIC_URL || '(địa chỉ đã khai báo trong Cloudflare)'}`);
            log('  Nếu địa chỉ chưa mở được: kiểm tra tab Public Hostname của tunnel (docs/DEPLOY.md, bước 4).');
          }
        }
      });
      child.on('error', failed);
      child.on('exit', (code, signal) => {
        if (stopping) return;
        if (Date.now() - started > 60000) delay = 2000; // it had been running fine: retry quickly
        log(`cloudflared dừng (${signal || 'mã ' + code}); bật lại sau ${delay / 1000}s`);
        setTimeout(launch, delay);
        delay = Math.min(delay * 2, 60000);
      });
    };
    const stop = () => { stopping = true; child?.kill(); };
    process.on('exit', stop);
    for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => { stop(); process.exit(0); });
    log('Đang bật Cloudflare Tunnel...');
    launch();
  }
}
