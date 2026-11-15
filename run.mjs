#!/usr/bin/env node
// One command to put the game online:  node run.mjs   (or start.sh / start.bat)
// Reads .env, starts the game server and - when TUNNEL_TOKEN is set - the Cloudflare Tunnel connector (cloudflared),
// restarting the connector whenever it stops. See docs/DEPLOY.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const log = (...a) => console.log('[run]', ...a);

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 11)) {
  console.error(`Node.js 20.11 or newer is required (this is ${process.version}). Get it from https://nodejs.org`);
  process.exit(1);
}

// ---------- settings: .env (real environment variables win) ----------
const envFile = path.join(ROOT, '.env');
if (!fs.existsSync(envFile) && fs.existsSync(envFile + '.example')) {
  fs.copyFileSync(envFile + '.example', envFile);
  log('Created .env from .env.example - open it and paste your Cloudflare Tunnel token after TUNNEL_TOKEN=');
}
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
}
if (!process.env.BASE_PATH && process.env.PUBLIC_URL) { // the path part of the public address is where the game is mounted
  try { process.env.BASE_PATH = new URL(process.env.PUBLIC_URL).pathname; } catch { log('PUBLIC_URL is not a valid address:', process.env.PUBLIC_URL); }
}

// ---------- dependencies (release packages ship them; a git checkout installs them on first run) ----------
if (['node_modules/ws/package.json', 'node_modules/three/build/three.module.min.js'].some(f => !fs.existsSync(path.join(ROOT, f)))) {
  log('Installing dependencies (first run)...');
  const r = spawnSync('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.error('Could not install dependencies. Run "npm ci --omit=dev" in this folder, then start again.'); process.exit(1); }
}

// ---------- game server (same process) ----------
await import('./server/index.js');
if (process.env.PUBLIC_URL) log('Public address:', process.env.PUBLIC_URL);

// ---------- Cloudflare Tunnel connector ----------
// Accepts the bare token or the whole "cloudflared ... eyJ..." command pasted from the dashboard.
const raw = (process.env.TUNNEL_TOKEN || '').trim(), token = raw.match(/eyJ[A-Za-z0-9+/_=-]{20,}/)?.[0] || raw;
if (!token) {
  log('TUNNEL_TOKEN is empty: the game is reachable on this machine only.');
  log('Paste the token into .env and start again to go online (not needed if cloudflared already runs here as a service).');
} else {
  const exe = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  const bin = [process.env.CLOUDFLARED, path.join(ROOT, exe), path.join(ROOT, 'bin', exe)].find(f => f && fs.existsSync(f)) || 'cloudflared';
  let child = null, stopping = false, delay = 2000;
  const launch = () => {
    const started = Date.now();
    // the token travels in the environment, not on the command line, so it does not show up in process listings
    child = spawn(bin, ['tunnel', '--no-autoupdate', 'run'], { env: { ...process.env, TUNNEL_TOKEN: token }, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const s of [child.stdout, child.stderr]) s.on('data', d => { for (const l of String(d).split(/\r?\n/)) if (l.trim()) console.log('[tunnel]', l); });
    child.on('error', e => {
      stopping = true; // nothing to retry: the program is missing or cannot be started
      if (e.code !== 'ENOENT') return console.error('[run] Could not start cloudflared:', e.message);
      console.error('[run] cloudflared is not installed, so the tunnel was NOT started (the game still runs locally).');
      console.error(process.platform === 'win32'
        ? '      Install it with:  winget install --id Cloudflare.cloudflared   (or put cloudflared.exe next to run.mjs)'
        : '      Install it from https://pkg.cloudflare.com (Ubuntu: add the repository, then "sudo apt install cloudflared")');
    });
    child.on('exit', (code, signal) => {
      if (stopping) return;
      if (Date.now() - started > 60000) delay = 2000; // it had been running fine: retry quickly
      log(`cloudflared stopped (${signal || 'exit code ' + code}); restarting in ${delay / 1000}s`);
      setTimeout(launch, delay);
      delay = Math.min(delay * 2, 60000);
    });
  };
  const stop = () => { stopping = true; child?.kill(); };
  process.on('exit', stop);
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => { stop(); process.exit(0); });
  log('Starting Cloudflare Tunnel connector...');
  launch();
}
