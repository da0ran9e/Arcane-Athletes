// Client entry: WebSocket, ordered event queue, and glue between the 3D scene and the DOM UI.
import { setLang, initialLang, t, card, track } from './i18n.js';
import { Scene, COLORS } from './scene.js';
import { initUI, render, refreshStatic, logLine, clearLog, banner, toast, detail, closeModal, modalOpen, flyPts, celebrate, artStyle, esc, pn, cn, rn, die } from './ui.js';
import { initAudio, music, sfx, toggleSound, soundOn } from './audio.js';
import { ICONS } from './icons.js';

const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
// URL of an asset file, versioned by its modification time so a replaced file is never served from a stale cache.
// All URLs in the client are relative to the page, so the game works at any path (e.g. example.com/game/).
const assetUrl = f => `assets/${f}?v=${S.assets.get(f) || 0}`;
const S = {
  assetUrl, assets: new Map(), tracks: null,
  room: null, you: -1, snap: null, names: [], online: false,
  prompt: null, sel: null, wait: [],                    // my pending decision, the option I selected, seats still deciding
  rolls: null, rollMsg: '', lastRoll: -1,               // roll-off in progress: seat -> die (0 = tied, must roll again)
  picked: 0, holdMs: 0,                                 // runners I fielded this race; how long the results stay up
  logOpen: store.get('agp.log') ? store.get('agp.log') === '1' : innerWidth > 900,
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const TOP = 46; // height of the top bar (px), keep in sync with --top in style.css
let ws, scene, code = null, queue = [], running = false;
// ?demo=1 : watch mode — creates a room with 3 bots and plays random answers for you (handy for testing)
const demo = new URLSearchParams(location.search).has('demo');

// ---------- network ----------
function send(m) { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); }
function connect() {
  const u = new URL('ws', document.baseURI);
  u.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(u);
  ws.onopen = () => {
    S.online = true;
    if (demo && !code) { send({ t: 'create', name: 'Demo' }); send({ t: 'opts', opts: { speed: 2.5, twists: true } }); for (let i = 0; i < 3; i++) send({ t: 'bot', add: true }); send({ t: 'start' }); }
    else if (code) send({ t: 'join', code, name: store.get('agp.name') || 'Player', token: store.get('agp.token.' + code) });
    refresh();
  };
  ws.onclose = () => { S.online = false; refresh(); setTimeout(connect, 2000); };
  ws.onmessage = e => onMessage(JSON.parse(e.data));
}
function onMessage(m) {
  switch (m.t) {
    case 'joined':
      code = m.code; S.you = m.seat;
      store.set('agp.token.' + code, m.token);
      history.replaceState(null, '', '?room=' + code);
      break;
    case 'room': if (m.room.playing && !S.room?.playing) loadTracks(); S.room = m.room; S.you = m.you; refresh(); break;
    case 'state': queue = []; setPrompt(null); S.rolls = null; apply(m.s); break;
    case 'lobby': queue = []; S.snap = null; setPrompt(null); S.rolls = null; clearLog(); scene.sync(null); idle(true); music('home'); refresh(); break;
    case 'ev': case 'prompt': queue.push(m); pump(); break;
    case 'promptEnd':
      queue = queue.filter(x => !(x.t === 'prompt' && x.id === m.id));
      if (S.prompt?.id === m.id) { setPrompt(null); refresh(); }
      break;
    case 'wait': S.wait = m.seats; refresh(); break;
    case 'err':
      toast(t(m.key));
      if (m.key === 'err.noRoom' || m.key === 'err.inProgress') { code = null; history.replaceState(null, '', location.pathname); }
      break;
  }
}

// ---------- state -> screen ----------
async function loadTracks() { try { S.tracks = scene.tracks = await (await fetch('api/tracks', { cache: 'no-store' })).json(); } catch { S.tracks = scene.tracks; } }
function idle(on) { scene.setIdle(on); if (on) scene.build('plains', false); }
function setPrompt(q) { S.prompt = q; S.sel = q && q.opts.length === 1 ? q.opts[0].id : null; }
// Tell the 3D view which part of the window the HUD leaves free, so the board is centred there.
function layout() {
  const wide = innerWidth > 900;
  if (!S.snap) return scene.setInsets(0, 0, TOP, 0);
  const strip = wide ? 0 : Math.round($('players').getBoundingClientRect().bottom);
  if (!wide) document.documentElement.style.setProperty('--strip', strip + 'px');
  const trk = $('tracker'), top = trk.hidden ? (wide ? TOP : strip) : Math.round(trk.getBoundingClientRect().bottom);
  scene.setInsets(wide ? 268 : 0, wide && S.logOpen ? 308 : 0, top + 4, 44);
}
function refresh() {
  render();
  layout();
  scene.setTargets(S.prompt ? S.prompt.opts.filter(o => o.r).map(o => o.r) : []); // runners I may choose pulse on the board
}
function apply(s) {
  S.snap = s;
  idle(false);
  scene.sync(s, S.you);
  music(s.phase === 'race' ? 'race' + s.raceIdx : s.phase);
  refresh();
}

// Events play strictly in order; each gets its animation time d. A backlog (hidden tab) fast-forwards.
async function pump() {
  if (running) return;
  running = true;
  while (queue.length) {
    const m = queue.shift();
    if (m.t === 'prompt') {
      setPrompt(m); sfx('prompt'); refresh();
      if (demo) setTimeout(() => { if (S.prompt === m) actions.answer(m.opts[Math.floor(Math.random() * m.opts.length)].id); }, 1200);
      continue;
    }
    const d = queue.length > 8 ? 30 : m.d;
    pre(m.e, d);
    apply(m.s);
    try { play(m.e, m.s, d); } catch (e) { console.error(e); }
    if (d) await sleep(d - 15);
  }
  running = false;
}

// State that is derived from events rather than carried in snapshots.
function pre(e, d) {
  switch (e.type) {
    case 'draftStart': case 'rolloff': S.rolls = {}; S.rollMsg = ''; S.lastRoll = -1; break;
    case 'droll': (S.rolls ||= {})[e.p] = e.n; S.lastRoll = e.p; break;
    case 'order': S.rollMsg = t('log.order', { p: e.ps.map(pn).join(' → ') }); break;
    case 'msg':
      if (e.k === 'log.tie' && S.rolls) for (const p of e.ps || []) S.rolls[p] = 0;
      if (e.k === 'log.first' && S.rolls) S.rollMsg = t('log.first', { p: pn(e.p) });
      break;
    case 'draftRow': case 'reveal': S.rolls = null; break;
    case 'raceIntro': S.rolls = null; S.picked = 0; break;
    case 'raceEnd': S.holdMs = d; break;
  }
}

// ---------- event presentation: log line, banner, sound, 3D animation ----------
function play(e, s, d) {
  const p = { ...e };
  if (e.r) p.r = rn(s, e.r);
  if (e.r2) p.r2 = rn(s, e.r2);
  if (e.p != null) p.p = pn(e.p);
  if (e.c) p.c = cn(e.c);
  const runner = e.r && s.race?.runners.find(x => x.id === e.r), col = runner && COLORS[runner.owner];
  const art = c => { const st = artStyle(c); return st ? `<span class="bnart" style="${st}"></span>` : `<span class="ico">${ICONS[c] || '✦'}</span>`; };
  let line = null, cls = '';
  switch (e.type) {
    case 'droll': line = t('log.droll', { p: p.p, n: die(e.n) }); sfx('roll'); break;
    case 'order': line = t('log.order', { p: e.ps.map(pn).join(' → ') }); break;
    case 'draftRow': line = `<h4>${t('draft.row', { n: s.draft.n + 1, m: s.per * 2 })}</h4>`; break;
    case 'pick': line = t(e.c ? 'log.pick' : 'log.pickHidden', p); sfx('step'); break;
    case 'raceIntro': line = `<h4>${t('hud.race', { n: s.raceIdx + 1 })} · ${esc(track(s.race.track).name)}</h4>`; sfx('abil'); break;
    case 'reveal': line = s.race.runners.map(r => `${pn(r.owner)}: ${rn(s, r.id)}`).join('<br>'); sfx('finish'); break;
    case 'turn':
      line = t('log.turn', p); cls = 'turnline';
      if (runner?.owner === S.you) banner(`<b>${t('hud.yourTurn')}</b>`, 1100, 'you');
      break;
    case 'roll':
      sfx('roll');
      if (e.dice) { line = t('log.rollMany', { ...p, n: e.dice.map(n => die(n)).join(' ') }); banner(e.dice.map(n => die(n)).join(' '), d, 'dice', col); }
      else { line = t(e.reroll ? 'log.roll6' : e.warden ? 'log.rollWarden' : 'log.roll.' + e.why, { ...p, n: die(e.v) }); scene.animRoll(e.r, e.v, d); }
      break;
    case 'dist': line = t(e.back ? 'log.distBack' : 'log.dist', { ...p, m: e.mods.length ? ' (' + e.mods.map(([c, n]) => `${ICONS[c] || ''}${n > 0 ? '+' : ''}${n}`).join(' ') + ')' : '' }); break;
    case 'move':
      scene.animMove(e.r, e.from, e.to, d, e.warp); sfx(e.warp ? 'warp' : 'step');
      line = t(e.warp ? 'log.warp' : e.to > e.from ? 'log.move' : 'log.moveBack', { ...p, n: Math.abs(e.to - e.from) });
      break;
    case 'swap': line = t('log.swap', p); sfx('warp'); break;
    case 'space': line = t(e.n > 0 ? 'log.arrowUp' : 'log.arrowDown', { ...p, n: Math.abs(e.n) }); break;
    case 'trip': line = t('log.trip', p); sfx('trip'); break;
    case 'stand': line = t('log.stand', p); break;
    case 'elim': line = t('log.elim', p); sfx('elim'); banner(`<span class="ico">💥</span><b>${line}</b>`, 2000, '', col); break;
    case 'finish': line = t('log.finish', p); sfx('finish'); scene.hop(e.r); banner(`<span class="ico">${e.rank === 1 ? '🥇' : '🥈'}</span><b>${line}</b>`, 2500, '', col); break;
    case 'pts': line = t(e.n > 0 ? 'log.gain' : 'log.lose', { ...p, n: Math.abs(e.n), why: t('why.' + e.why) }); sfx('pts'); flyPts(e.p, e.n); break;
    case 'abil': {
      const c = card(e.c);
      line = '✦ ' + t(e.r2 ? 'log.abil2' : 'log.abil', p); cls = 'ab'; sfx('abil');
      banner(`${art(e.c)}<b>${esc(c.name)}</b><small>${esc(c.desc)}</small>`, Math.max(1800, d + 600), '', col);
      break;
    }
    case 'gain': line = t('log.gainAbil', p); break;
    case 'recard': line = t('log.recard', p); break;
    case 'twist': {
      const c = card(e.c);
      line = `<h4>${ICONS[e.c] || ''} ${t('log.twist', p)}</h4>${esc(c.desc)}`; sfx('twist');
      banner(`${art(e.c)}<b>${esc(c.name)}</b><small>${esc(c.desc)}</small>`, 6000, 'big');
      break;
    }
    case 'monster': line = t('log.monster', { n: die(e.n), to: e.to }); sfx('trip'); break;
    case 'cheat': line = t(e.n === e.g ? 'log.cheatHit' : 'log.cheatMiss', { ...p, n: die(e.n), g: e.g ? die(e.g) : '–' }); break;
    case 'fixed': line = t('log.fixed', { ...p, n: die(e.n) }); sfx('roll'); break;
    case 'reverse': line = t('log.reverse'); break;
    case 'chips': line = t('log.chips'); break;
    case 'owners': line = t('log.owners', p); sfx('warp'); break;
    case 'msg':
      line = t(e.k, e.k === 'log.tie' ? { n: die(e.n) } : p);
      if (e.k === 'log.stall') banner(`<span class="ico">🏳️</span><b>${line}</b>`, 5000, 'big');
      break;
    case 'raceEnd': line = `<h4>${e.cancelled ? t('res.cancelled') : t('res.title', { n: s.results.length })}</h4>`; break;
    case 'gameEnd': line = `<h4>🏆 ${t('end.title', { p: e.champs.map(pn).join(' & ') })}</h4>`; sfx('finish'); celebrate(); break;
  }
  logLine(line, cls);
}

// ---------- actions from the UI ----------
const myName = v => { const n = (v || '').trim().slice(0, 16) || 'Player'; store.set('agp.name', n); return n; };
const actions = {
  create: name => send({ t: 'create', name: myName(name) }),
  join: (c, name) => { c = (c || '').trim().toUpperCase(); if (c.length === 4) send({ t: 'join', code: c, name: myName(name), token: store.get('agp.token.' + c) }); },
  leave: () => { history.replaceState(null, '', location.pathname); location.reload(); },
  opts: o => send({ t: 'opts', opts: o }),
  addBot: () => send({ t: 'bot', add: true }),
  rmBot: d => send({ t: 'bot', seat: +d.seat }),
  start: () => send({ t: 'start' }),
  again: () => send({ t: 'again' }),
  answer: v => {
    const q = S.prompt;
    if (!q) return;
    send({ t: 'answer', id: q.id, v });
    if (q.key === 'q.pick') S.picked++;
    setPrompt(null); refresh();
  },
  copy: async () => {
    const url = `${location.origin}${location.pathname}?room=${S.room.code}`;
    try { await navigator.clipboard.writeText(url); toast(t('lobby.copied'), true); }
    catch { // clipboard API is unavailable on plain-http LAN addresses
      const ta = Object.assign(document.createElement('textarea'), { value: url });
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      toast(t(ok ? 'lobby.copied' : 'toast.copyFail'), ok);
    }
  },
  lang: async l => { await setLang(typeof l === 'string' ? l : l.l); refreshStatic(scene.q, soundOn()); refresh(); },
  quality: q => scene.setQuality(q),
  sound: () => refreshStatic(scene.q, toggleSound()),
  fullscreen: () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {}); },
  camReset: () => scene.resetView(),
  camTop: () => scene.topView(),
  layout,
};

// Keyboard: Esc closes dialogs; 1-6 / Y / N / Enter answer the pending decision.
function onKey(e) {
  if (e.key === 'Escape') { if (!closeModal()) $('settings').open = false; return; }
  const q = S.prompt;
  if (!q || modalOpen() || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  let o = null;
  if (k === 'y' || k === 'n') o = q.opts.find(x => x.id === k);
  else if (/^[1-6]$/.test(k)) o = q.opts.find(x => !x.k && !x.r && !x.c && String(x.n) === k);
  else if (k === 'enter') o = q.opts.find(x => x.id === S.sel) || (q.opts.length === 1 ? q.opts[0] : q.opts.find(x => x.id === 'roll'));
  if (o) { e.preventDefault(); actions.answer(o.id); }
}

// ---------- boot ----------
(async () => {
  await setLang(initialLang());
  try { const m = await (await fetch('api/manifest', { cache: 'no-store' })).json(); S.assets = new Map(Array.isArray(m) ? m.map(f => [f, Date.now()]) : Object.entries(m)); } catch {}
  initAudio(S.assets, assetUrl);
  scene = new Scene($('c'), f => S.assets.has(f), assetUrl);
  await loadTracks();
  // a tap on a standee answers a "choose a runner" decision, otherwise it opens that runner's card
  scene.onPick = id => {
    const o = S.prompt?.opts.find(x => x.r === id), r = S.snap?.race?.runners.find(x => x.id === id);
    if (o) actions.answer(o.id); else detail(r ? r.code : 'T-01', r?.id);
  };
  initUI(S, actions);
  refreshStatic(scene.q, soundOn());
  $('inName').value = store.get('agp.name') || '';
  const q = new URLSearchParams(location.search).get('room');
  if (q) { $('inCode').value = q.toUpperCase(); if (store.get('agp.token.' + q.toUpperCase())) code = q.toUpperCase(); }
  if (new URLSearchParams(location.search).has('debug')) window.agp = { S, scene, actions }; // console access for troubleshooting
  addEventListener('resize', layout);
  addEventListener('keydown', onKey);
  idle(true); music('home'); refresh();
  connect();
})();
