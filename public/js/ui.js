// DOM user interface: screens, HUD, prompts and modals — all rendered from the shared state object S owned by main.js.
import { t, card, track, LANGS, lang } from './i18n.js';
import { CARD, CARDS, SHEETS, cell, TWISTS } from '../shared/cards.js';
import { reverseTrack, spaceAt } from '../shared/tracks.js';
import { ICONS } from './icons.js';
import { COLORS } from './scene.js';

// Share of a runner card's height (from the top) shown on card tiles; the whole card shows in the detail view. Use 1 for full cards.
const ART_CROP = 0.62;
const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S, act, backTo = null, timerId = null;

// Replace an element's content only when it changed, so hover states, scroll positions and CSS animations survive re-renders.
function setHTML(el, html) {
  if (el._html === html) return false;
  el._html = html; el.innerHTML = html;
  return true;
}

// ---------- small building blocks ----------
const PIPS = [, [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
// A die face as inline SVG (scales with the font size).
export const die = (n, cls = '') => PIPS[n]
  ? `<svg class="die${n === 1 ? ' one' : ''} ${cls}" viewBox="0 0 24 24" role="img" aria-label="${n}"><rect x=".5" y=".5" width="23" height="23" rx="5"/>${PIPS[n].map(i => `<circle cx="${6 + i % 3 * 6}" cy="${6 + (i / 3 | 0) * 6}" r="2.2"/>`).join('')}</svg>`
  : `<b>${esc(n)}</b>`;
const bare = n => String(n ?? '?').replace(/^🤖\s*/u, '');
const initial = n => ([...bare(n).replace(/[^\p{L}\p{N}]/gu, '')][0] || '?').toUpperCase();
const seat = p => S.snap?.players[p] || S.room?.seats[p];
const av = (p, cls = '') => `<span class="av ${cls}" style="--c:${COLORS[p]}" title="${esc(bare(seat(p)?.name))}">${seat(p)?.bot ? '🤖' : esc(initial(seat(p)?.name))}</span>`;
const tag = (key, cls = '') => `<span class="tag ${cls}">${t(key)}</span>`;
const prize = (s, i, sep = ' · ') => s.gold ? `🥇 +${s.gold[i]}${sep}🥈 +${s.silver[i]}` : '';
const runnerOf = (s, id) => s?.race?.runners.find(r => r.id === id);
// The track being raced, with its special spaces (reversed when the Conveyor Belt twist flipped it).
const trackOf = rc => { const b = S.tracks?.find(x => x.id === rc.track); return b && (rc.rev ? reverseTrack(b) : b); };

// A runner's standee art as a small portrait (emoji only when the image is missing).
export function portrait(code, cls = '') {
  const img = CARD[code]?.img;
  return img && S.assets.has(img) ? `<img class="pt ${cls}" src="${S.assetUrl(img)}" alt="" draggable="false">` : `<span class="pt emo ${cls}">${ICONS[code] || '❓'}</span>`;
}
export const pn = p => `<b style="color:${COLORS[p]}">${esc(S.names[p] ?? '?')}</b>`;
export const cn = c => `<b>${portrait(c, 'xs')} ${esc(card(c).name)}</b>`;
export function rn(s, id) {
  const r = runnerOf(s, id);
  return r ? `<b style="color:${COLORS[r.owner]}">${portrait(r.code, 'xs')} ${esc(card(r.code).name)}</b>` : '?';
}

// ---------- cards ----------
const TW = Object.fromEntries(TWISTS.map(x => [x.code, x]));
const setOf = c => c[0] === 'T' ? 'twist' : CARD[c]?.set || 'base';
// CSS showing a card's cell of its sprite sheet (optionally only the top `crop` share of it); '' when the sheet is missing.
export function artStyle(code, crop = 1) {
  const id = (CARD[code] || TW[code])?.id, cl = id && cell(id), sh = cl && SHEETS[cl.sheet];
  const file = sh && S.pickAsset(sh.file.replace(/\.\w+$/, ''), ['.webp'], ['.jpg', '.png']);
  if (!file) return '';
  if (cl.sheet === 'twist') crop = 1;
  return `background-image:url(${S.assetUrl(file)});background-size:${sh.cols * 100}% ${sh.rows * 100 / crop}%;background-position:${cl.col / (sh.cols - 1 || 1) * 100}% ${cl.row / (sh.rows - crop || 1) * 100}%`;
}
// Card tile with localized rules text. `attrs` adds data attributes (data-sel makes it selectable), `cls` extra classes.
export function rich(code, attrs = '', cls = '') {
  const c = card(code), set = setOf(code), sp = artStyle(code, ART_CROP);
  const art = sp ? `<span class="art" style="${sp}${set === 'twist' ? '' : `;aspect-ratio:5/${(7 * ART_CROP).toFixed(2)}`}"></span>` : `<span class="art emo">${ICONS[code] || '❓'}</span>`;
  return `<div class="rc ${set} ${cls}" data-card="${code}" ${attrs}>${art}<b>${esc(c.name)}</b><i>${code}${c.cat ? ' · ' + esc(c.cat) : ''}</i><p>${esc(c.desc)}</p></div>`;
}
function mini(code, cls = '') {
  const sp = artStyle(code);
  return `<span class="mini ${cls}" data-card="${code}" title="${esc(card(code).name)}" ${sp ? `style="${sp}"` : ''}>${sp ? '' : ICONS[code] || '?'}</span>`;
}
// Face-down card: other players' hands stay secret.
const BACK = 'cards/4a7954234c04.jpg';
const back = () => `<span class="mini back" ${S.assets.has(BACK) ? `style="background-image:url(${S.assetUrl(BACK)});background-size:cover"` : ''}></span>`;

// ---------- transient feedback ----------
export function toast(msg, ok) {
  const el = $('toast');
  el.textContent = msg; el.className = ok ? 'ok' : ''; el.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => { el.hidden = true; }, 3500);
}
export function banner(html, ms = 2200, cls = '', color = '') {
  const el = document.createElement('div');
  el.className = 'bn ' + cls; el.innerHTML = html;
  if (color) el.style.setProperty('--c', color);
  const box = $('banner');
  box.append(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), ms);
}
export function logLine(html, cls = '') {
  if (!html) return;
  const box = $('logBody'), el = document.createElement('div');
  const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 60; // only follow the log while the reader is at its end
  el.className = cls; el.innerHTML = html;
  box.append(el);
  while (box.children.length > 300) box.firstChild.remove();
  if (stick) box.scrollTop = box.scrollHeight;
}
export function clearLog() { $('logBody').innerHTML = ''; }
// "+2 ★" floating up from a player's score.
export function flyPts(p, n) {
  const at = document.querySelector(`.pl[data-p="${p}"] .pts`)?.getBoundingClientRect();
  if (!at || !at.width) return;
  const el = document.createElement('span');
  el.className = 'fly' + (n < 0 ? ' neg' : ''); el.textContent = (n > 0 ? '+' : '−') + Math.abs(n) + ' ★';
  el.style.left = at.left - 4 + 'px'; el.style.top = at.bottom - 2 + 'px';
  $('fx').append(el);
  setTimeout(() => el.remove(), 1400);
}
export function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = $('fx'), cols = ['#ffc83d', '#e5484d', '#3b82f6', '#22c55e', '#a855f7', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('i');
    el.className = 'conf';
    el.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};--x:${Math.round((Math.random() - .5) * 240)}px;--rot:${Math.round((Math.random() - .5) * 1400)}deg;animation-duration:${(2.2 + Math.random() * 2.4).toFixed(2)}s;animation-delay:${(Math.random() * 1.2).toFixed(2)}s`;
    box.append(el);
    setTimeout(() => el.remove(), 6200);
  }
}

// ---------- modals ----------
function openModal(html) { const m = $('modal'); m.innerHTML = html; m.hidden = false; }
export const modalOpen = () => !$('modal').hidden;
export function closeModal() {
  const m = $('modal');
  if (m.hidden) return false;
  if (backTo) { const f = backTo; backTo = null; f(); return true; } // a card opened from the gallery returns to it
  m.hidden = true; m.innerHTML = '';
  return true;
}
const closeBtn = () => `<button class="icon x" data-act="closeModal" title="${esc(t('ui.close'))}">✕</button>`;
// Card detail; with a runner id it also shows that runner's race status and any abilities it gained.
export function detail(code, rid) {
  const c = card(code), set = setOf(code), sp = artStyle(code), s = S.snap, r = rid && runnerOf(s, rid);
  let info = '';
  if (r) {
    const st = r.fin ? t('det.fin', { n: r.fin }) : r.out ? t('det.out') : t('det.pos', { n: r.pos });
    info = `<div class="rinfo">${av(r.owner, 'sm')}${pn(r.owner)}<span class="tag">${st}</span>${r.trip ? tag('det.tripped', 'off') : ''}${r.mount ? tag('det.mount', 'me') : ''}`
      + `${r.mate ? `<span class="tag">💗 ${rn(s, r.mate)}</span>` : ''}${r.predict ? `<span class="tag">♟ ${rn(s, r.predict)}</span>` : ''}</div>`
      + (r.extra.length ? `<h4>${t('det.extra')}</h4><ul class="xlist">${r.extra.map(x => `<li>${cn(x)}<br>${esc(card(x).desc)}</li>`).join('')}</ul>` : '');
  }
  openModal(`<div class="sheet detail ${set}">${closeBtn()}${sp ? `<div class="bigart" style="${sp}"></div>` : `<div class="bigart emo">${ICONS[code] || '❓'}</div>`}
    <div><h2>${esc(c.name)}</h2><div class="meta"><span class="setb ${set}">${t('det.set.' + set)}</span>${code}${c.cat ? ' · ' + esc(c.cat) : ''}</div><p>${esc(c.desc)}</p>${info}</div></div>`);
}
const book = { set: 'all', q: '' };
function bookCards() {
  const q = book.q.trim().toLowerCase(), rank = { base: 0, exp: 1, twist: 2 };
  const list = [...CARDS.map(c => c.code), ...TWISTS.map(x => x.code)]
    .filter(code => { const c = card(code); return (book.set === 'all' || book.set === setOf(code)) && (!q || `${code} ${c.name} ${c.cat} ${c.desc}`.toLowerCase().includes(q)); })
    .sort((a, b) => rank[setOf(a)] - rank[setOf(b)] || a.localeCompare(b));
  return list.length ? list.map(c => rich(c)).join('') : `<p class="hint">${t('book.none')}</p>`;
}
function openBook() {
  backTo = null;
  const tab = (k, label) => `<button data-act="bookSet" data-set="${k}" class="${book.set === k ? 'on' : ''}">${label}</button>`;
  openModal(`<div class="sheet book">${closeBtn()}<header><h2>📖 ${t('hud.book')}</h2>
    <div class="seg">${tab('all', t('book.all'))}${tab('base', t('book.base'))}${tab('exp', t('book.exp'))}${tab('twist', t('book.twists'))}</div>
    <input id="bookQ" type="search" placeholder="${esc(t('book.search'))}" value="${esc(book.q)}"></header><div class="cards" id="bookGrid">${bookCards()}</div></div>`);
  $('bookQ').oninput = e => { book.q = e.target.value; $('bookGrid').innerHTML = bookCards(); };
}
function openHelp() {
  backTo = null;
  openModal(`<div class="sheet help">${closeBtn()}<h2>${t('help.title')}</h2><ol>${[1, 2, 3, 4, 5, 6, 7].map(i => `<li>${t('help.' + i)}</li>`).join('')}</ol>
    <div class="legend"><span><i class="mk star">★</i>${t('mark.star')}</span><span><i class="mk trip">!</i>${t('mark.trip')}</span><span><i class="mk up">+2</i>${t('mark.up')}</span><span><i class="mk dn">−2</i>${t('mark.down')}</span></div>
    <p class="hint">${t('help.ctl')}</p><p class="hint">${t('help.keys')}</p></div>`);
}

// ---------- lobby ----------
function lobbyHTML() {
  const r = S.room, host = r.host === S.you, o = r.opts, dis = host ? '' : 'disabled', n = r.seats.length;
  const seg = (k, vals) => `<div class="seg">${vals.map(([v, l]) => `<button data-opt="${k}" data-val="${v}" class="${String(o[k]) === String(v) ? 'on' : ''}" ${dis}>${l}</button>`).join('')}</div>`;
  const tog = k => `<button class="tog ${o[k] ? 'on' : ''}" data-opt="${k}" data-val="${!o[k]}" role="switch" aria-checked="${!!o[k]}" ${dis}><i></i></button>`;
  const row = (k, ctl) => `<div class="orow"><div><b>${t('opt.' + k)}</b><small>${t('opt.' + k + '.d')}</small></div>${ctl}</div>`;
  let seats = '', add = host;
  for (let i = 0; i < 6; i++) {
    const s = r.seats[i];
    if (s) seats += `<li style="--c:${COLORS[i]}">${av(i)}<b>${esc(bare(s.name))}</b>${i === r.host ? tag('lobby.host') : ''}${i === S.you ? tag('lobby.you', 'me') : ''}${s.bot ? tag('lobby.bot') : s.on ? '' : tag('lobby.offline', 'off')}<span class="grow"></span>${host && s.bot ? `<button class="icon sm" data-act="rmBot" data-seat="${i}">✕</button>` : ''}</li>`;
    else if (add) { add = false; seats += `<li class="empty add"><button data-act="addBot">＋ ${t('lobby.addBot')}</button></li>`; }
    else seats += `<li class="empty">${t('lobby.empty')}</li>`;
  }
  const ok = o.double ? n >= 2 && n <= 3 : n >= 3;
  return `<div class="lhead"><div><small>${t('lobby.room')}</small><div class="code">${r.code}</div></div><span class="grow"></span>
      <button data-act="copy">🔗 ${t('lobby.copy')}</button><button class="ghost" data-act="leave">${t('lobby.leave')}</button></div>
    <div class="lcols"><section><h3>${t('lobby.players')} · ${n}/6</h3><ul class="seats">${seats}</ul></section>
      <section><h3>${t('lobby.options')}</h3>
        ${row('sets', seg('sets', [['all', t('opt.sets.all')], ['base', t('opt.sets.base')], ['exp', t('opt.sets.exp')]]))}
        ${row('twists', tog('twists'))}${row('double', tog('double'))}
        ${row('speed', seg('speed', [[0.6, '0.6×'], [1, '1×'], [1.5, '1.5×'], [2.5, '2.5×']]))}
        ${row('timer', seg('timer', [[20, '20s'], [45, '45s'], [90, '90s'], [180, '3′']]))}</section></div>
    <div class="lfoot"><p class="hint grow ${ok ? '' : 'warn'}">${t(o.double ? 'lobby.hintDouble' : 'lobby.hint')}</p>
      ${host ? `<button class="primary big" data-act="start" ${ok ? '' : 'disabled'}>${t('lobby.start')}</button>` : `<span class="dim"><i class="spin"></i> ${t('lobby.waitHost')}</span>`}</div>`;
}

// ---------- in-game HUD ----------
function stageHTML(s) {
  if (s.phase === 'draft') return `<span class="ph-name">${t('phase.draft')}</span>`;
  const rc = s.race;
  const pips = [0, 1, 2, 3].map(i => `<i class="pip${i < s.results.length ? ' done' : i === s.raceIdx ? ' cur' : ''}" title="${esc(t('res.raceN', { n: i + 1 }))} ${prize(s, i, ' ')}">${i + 1}</i>`).join('');
  return `<span class="pips">${pips}</span><span class="ph-name">${s.phase === 'end' ? t('phase.end') : esc(track(rc.track).name)}</span>`
    + (rc ? rc.twists.map(c => `<button class="tw" data-card="${c}">${ICONS[c] || ''} ${esc(card(c).name)}</button>`).join('') : '');
}
function playersHTML(s) {
  const rc = s.race, cur = rc && runnerOf(s, rc.cur), show = rc && s.phase !== 'pick';
  return s.players.map((p, i) => {
    const runs = show ? rc.runners.filter(r => r.owner === i).map(r => {
      const st = r.fin ? (r.fin === 1 ? '🥇' : '🥈') : r.out ? '✖' : '#' + r.pos;
      const extra = r.extra.map(c => `<span class="xab" title="${esc(card(c).name)}">+${portrait(c, 'xs')}</span>`).join('');
      return `<div class="rn${r.out ? ' out' : ''}${r.id === rc.cur ? ' cur' : ''}" data-card="${r.code}" data-rid="${r.id}">${portrait(r.code)}<span class="rnm">${esc(card(r.code).name)} ${extra}${r.trip ? ' 💫' : ''}</span><small>${st}</small><i class="bar"><i style="width:${r.fin ? 100 : Math.round(r.pos / rc.L * 100)}%"></i></i></div>`;
    }).join('') : '';
    return `<div class="pl${cur?.owner === i ? ' turn' : ''}" data-p="${i}" style="--c:${COLORS[i]}">
      <div class="ph">${av(i)}<b class="nm">${esc(bare(p.name))}</b>${i === S.you ? tag('lobby.you', 'me') : ''}${S.wait.includes(i) ? '<span>⏳</span>' : ''}<span class="pts">★ ${p.pts}</span></div>
      ${runs}<div class="hand">${p.hand ? p.hand.map(c => mini(c)).join('') : back().repeat(p.handN)}${p.used.map(c => mini(c, 'used')).join('')}</div></div>`;
  }).join('');
}
// Linear view of the race: special spaces, corner flags and one token per runner, so "who is ahead" reads at a glance.
function renderTracker(s) {
  const rc = s.race, el = $('tracker'), show = !!rc && (s.phase === 'race' || s.phase === 'raceEnd');
  el.hidden = !show;
  if (!show) return;
  const tr = trackOf(rc), L = rc.L, x = i => +(i / L * 100).toFixed(2) + '%';
  let h = '';
  if (tr) for (let i = 1; i < L; i++) {
    const sp = spaceAt(tr, i);
    if (sp) h += `<i class="mk ${sp.t === 'arrow' ? (sp.n > 0 ? 'up' : 'dn') : sp.t}" style="left:${x(i)}" title="#${i}">${sp.t === 'star' ? '★' : sp.t === 'trip' ? '!' : (sp.n > 0 ? '+' : '−') + Math.abs(sp.n)}</i>`;
  }
  for (const [c, k] of [[rc.c1, 1], [rc.c2, 2]]) h += `<i class="fl f${k}" data-n="${k}" style="left:${x(c)}" title="${esc(t('mark.c' + k))} · #${c}"></i>`;
  for (const c of rc.chips) h += `<i class="coin" style="left:${x(c)}"></i>`;
  setHTML($('trkMarks'), h);
  setHTML($('trkPrize'), prize(s, s.raceIdx, '<br>'));
  // tokens stay in the DOM (keyed by runner id) so they glide along the line instead of jumping
  const list = rc.runners.filter(r => !r.out).map(r => ({ r, pos: r.fin ? L : r.pos }));
  if (rc.monster != null) list.push({ r: { id: 'monster', code: 'T-01', owner: -1 }, pos: rc.monster });
  const groups = {};
  for (const it of list) (groups[it.pos] ||= []).push(it);
  const box = $('trkTokens'), have = new Map([...box.children].map(c => [c.dataset.rid, c]));
  for (const it of list) {
    const { r, pos } = it, g = groups[pos], k = g.indexOf(it), row = k / 3 | 0, cols = Math.min(3, g.length - row * 3);
    let c = have.get(r.id);
    if (!c) { c = document.createElement('span'); c.dataset.rid = r.id; box.append(c); }
    have.delete(r.id);
    const key = `${r.code}|${r.fin || ''}`;
    if (c._key !== key) { c._key = key; c.dataset.card = r.code; c.innerHTML = portrait(r.code) + (r.fin ? `<b class="medal">${r.fin === 1 ? '🥇' : '🥈'}</b>` : ''); }
    c.className = `tk${r.trip ? ' trip' : ''}${r.id === rc.cur ? ' cur' : ''}${r.owner < 0 ? ' mon' : ''}`;
    c.title = `${card(r.code).name} · #${pos}`;
    c.style.cssText = `left:${x(pos)};--c:${COLORS[r.owner] || '#b91c1c'};--dx:${(k % 3 - (cols - 1) / 2) * 13};--dy:${row * 15}`;
  }
  for (const c of have.values()) c.remove();
}

// ---------- centre overlay panels ----------
const isCards = q => q.opts.length > 0 && q.opts.every(o => o.c);
const cardGrid = q => `<div class="cards pickable">${q.opts.map(o => rich(o.c, `data-sel="${o.id}"`, S.sel === o.id ? 'sel' : '')).join('')}</div>`;
// Card choices are two-step (select, then confirm): they cannot be undone and a mis-tap is easy on a phone.
function confirmBar(q) {
  const o = q.opts.find(o => o.id === S.sel);
  return `<footer class="confirm">${o ? `${mini(o.c)}<div class="grow"><b>${esc(card(o.c).name)}</b><p>${esc(card(o.c).desc)}</p></div>` : `<span class="grow dim">${t('ui.pickOne')}</span>`}
    <button class="primary" data-ans="${o ? o.id : ''}" ${o ? '' : 'disabled'}>${t('ui.confirm')}<kbd>↵</kbd></button></footer>`;
}
function rolloffPanel(s, q) {
  const rolls = S.rolls || {};
  const rows = s.players.map((p, i) => {
    const v = rolls[i];
    return `<li style="--c:${COLORS[i]}">${av(i)}<b>${esc(bare(p.name))}</b>${i === S.you ? tag('lobby.you', 'me') : ''}<span class="grow"></span>${v > 0 ? die(v, S.lastRoll === i ? 'pop' : '') : v === 0 ? `<small class="tie">${t('roll.tie')}</small>` : '<small class="dim">…</small>'}</li>`;
  }).join('');
  return `<div class="panel narrow rolloff"><h2>🎲 ${t('roll.title')}</h2><p class="hint">${t(s.phase === 'draft' ? 'roll.sub.draft' : 'roll.sub.race')}</p><ul class="rolls">${rows}</ul>
    ${S.rollMsg ? `<p class="rollmsg">${S.rollMsg}</p>` : ''}${q ? `<button class="primary big" data-ans="roll">${t('opt.roll')}<kbd>↵</kbd></button>` : ''}</div>`;
}
function draftPanel(s, q) {
  const d = s.draft, N = s.N, order = d.order || [], seq = [...order, ...[...order].reverse()], done = 2 * N - d.row.length, me = s.players[S.you];
  const strip = seq.length ? `<div class="seq"><small>${t('draft.order')}</small>${seq.map((p, i) => `${i === N ? '<span>↩</span>' : ''}${av(p, i < done ? 'done' : i === done && d.picker != null ? 'now' : '')}`).join('')}</div>` : '';
  const hint = d.picker == null ? '' : q ? `<b class="you">${t('q.draft')}</b>` : t('draft.turn', { p: pn(d.picker) });
  const team = me?.hand ? me.hand.map(c => mini(c)).join('') + '<span class="mini slot"></span>'.repeat(Math.max(0, 4 * s.per - me.hand.length)) : '';
  return `<div class="panel draft"><div class="phead"><h2>${t('phase.draft')}</h2><span class="dim">${t('draft.row', { n: d.n + 1, m: s.per * 2 })}</span></div>${strip}<p class="hint">${hint}</p>
    <div class="cards ${q ? 'pickable' : 'locked'}">${d.row.map(c => rich(c, q ? `data-sel="${c}"` : '', q && S.sel === c ? 'sel' : '')).join('')}</div>
    ${q ? confirmBar(q) : ''}<div class="team"><span>${t('draft.team')}</span>${team}</div></div>`;
}
function trackFacts(rc) {
  const tr = trackOf(rc), n = { star: 0, trip: 0, arrow: 0 };
  if (tr) for (let i = 1; i < rc.L; i++) { const sp = spaceAt(tr, i); if (sp) n[sp.t]++; }
  const mk = (cls, ch, k) => n[k] ? `<span><i class="mk ${cls}">${ch}</i>×${n[k]}</span>` : '';
  return `<div class="facts"><span>🏁 ${t('pick.spaces', { n: rc.L })}</span><span>${t('pick.c1', { n: rc.c1 })}</span><span>${t('pick.c2', { n: rc.c2 })}</span>${mk('star', '★', 'star')}${mk('trip', '!', 'trip')}${mk('up', '±', 'arrow')}</div>`;
}
function pickPanel(s, q) {
  const rc = s.race, tr = track(rc.track), others = S.wait.filter(i => i !== S.you);
  const done = S.picked >= s.per || (!q && S.wait.length > 0 && !S.wait.includes(S.you));
  const body = q ? `<h3>${t('q.pick')}</h3>${cardGrid(q)}${confirmBar(q)}`
    : done ? `<p class="okline">✔ ${t('pick.done')}${others.length ? `<span class="dim">⏳ ${t('hud.waiting', { p: others.map(pn).join(', ') })}</span>` : ''}</p>` : '';
  return `<div class="panel mid pick"><div class="phead"><h2>${t('res.raceN', { n: s.raceIdx + 1 })} · ${esc(tr.name)}</h2><span class="prize">${prize(s, s.raceIdx)}</span></div>
    <p class="hint">${esc(tr.desc)}</p>${trackFacts(rc)}${body}</div>`;
}
function choicePanel(q) {
  return `<div class="panel mid choice"><div class="phead"><h2>${t(q.key, q.params)}</h2></div>${cardGrid(q)}${confirmBar(q)}</div>`;
}
function standings(s) {
  const max = Math.max(1, ...s.players.map(p => p.pts));
  return `<ol class="stand">${s.players.map((p, i) => [p, i]).sort((a, b) => b[0].pts - a[0].pts)
    .map(([p, i], k) => `<li style="--c:${COLORS[i]}"><span class="rk">${s.champs?.includes(i) ? '🏆' : k + 1}</span>${av(i, 'sm')}<b>${esc(bare(p.name))}</b><i class="bar"><i style="width:${p.pts / max * 100}%"></i></i><span class="pts">★ ${p.pts}</span></li>`).join('')}</ol>`;
}
function resultsPanel(s) {
  const end = s.phase === 'end', res = s.results.at(-1), idx = s.results.length - 1;
  if (end) {
    const who = x => x ? `${portrait(x.code, 'xs')} ${esc(card(x.code).name)} · ${pn(x.owner)}` : '—';
    const races = s.results.map((r, i) => `<li><b>${t('res.raceN', { n: i + 1 })}</b>${r.cancelled ? `<span class="dim">${t('res.cancelledShort')}</span>` : `<span>🥇 ${who(r.first)}</span><span>🥈 ${who(r.second)}</span>`}</li>`).join('');
    return `<div class="panel mid results final"><div class="trophy">🏆</div><h2>${t('end.title', { p: s.champs.map(pn).join(' & ') })}</h2>
      <h4>${t('phase.end')}</h4>${standings(s)}<h4>${t('end.races')}</h4><ol class="races">${races}</ol>
      ${S.room?.host === S.you ? `<button class="primary big" data-act="again">${t('end.again')}</button>` : `<p class="hint"><i class="spin"></i> ${t('lobby.waitHost')}</p>`}</div>`;
  }
  const pod = (x, k) => x
    ? `<div class="pod ${k}" style="--c:${COLORS[x.owner]}" data-card="${x.code}"><span class="medal">${k === 'gold' ? '🥇' : '🥈'}</span>${portrait(x.code, 'big')}<b>${esc(card(x.code).name)}</b><span>${av(x.owner, 'sm')}${esc(bare(s.players[x.owner].name))}</span>${s.gold ? `<em>+${(k === 'gold' ? s.gold : s.silver)[idx]} ★</em>` : ''}</div>`
    : `<div class="pod none"><span class="medal">${k === 'gold' ? '🥇' : '🥈'}</span><span class="dim">${t('res.none')}</span></div>`;
  return `<div class="panel narrow results"><div class="phead"><h2>${t('res.title', { n: s.results.length })}</h2></div>
    ${res.cancelled ? `<p class="hint">${t('res.cancelled')}</p>` : `<div class="podium">${pod(res.first, 'gold')}${pod(res.second, 'silver')}</div>`}${standings(s)}
    <div class="next"><i style="animation-duration:${S.holdMs || 5000}ms"></i></div><p class="hint">${t(s.results.length < 4 ? 'res.next' : 'res.final')}</p></div>`;
}
// Returns [kind, html]; the kind decides when the entry animation plays.
function overlayHTML(s) {
  const q = S.prompt, rc = s.race;
  if (S.rolls || q?.key === 'q.rolloff') return ['roll', rolloffPanel(s, q?.key === 'q.rolloff' ? q : null)];
  if (s.phase === 'draft' && s.draft) return ['draft', draftPanel(s, q?.key === 'q.draft' ? q : null)];
  if (s.phase === 'pick' && rc) return ['pick', pickPanel(s, q?.key === 'q.pick' ? q : null)];
  if ((s.phase === 'raceEnd' && s.results.length > s.raceIdx) || s.phase === 'end') return [s.phase, resultsPanel(s)];
  if (q && isCards(q)) return ['choice', choicePanel(q)];
  return ['', ''];
}

// ---------- quick decisions (bottom sheet) and status ----------
const DIE_KEYS = new Set(['q.reroll', 'q.alch', 'q.critic']); // prompts whose {n} is a die face
function renderPrompt(s) {
  const q = S.prompt, el = $('prompt');
  if (!q || q.key === 'q.rolloff' || isCards(q)) { el.hidden = true; return; }
  const p = { ...q.params };
  if (p.r) p.r = rn(s, p.r);
  if (p.c) p.c = cn(p.c);
  if (DIE_KEYS.has(q.key)) p.n = die(p.n);
  const btns = q.opts.map(o => {
    const r = o.r && runnerOf(s, o.r);
    if (r) return `<button class="ropt" data-ans="${o.id}" style="--c:${COLORS[r.owner]}">${portrait(r.code)}<span><b>${esc(card(r.code).name)}</b><small>#${r.pos} · ${esc(bare(s.players[r.owner].name))}</small></span></button>`;
    if (o.n && !o.k) return `<button class="num" data-ans="${o.id}" title="${o.n}">${die(o.n)}</button>`;
    const key = o.id === 'y' ? 'Y' : o.id === 'n' ? 'N' : o.id === 'roll' || q.opts.length === 1 ? '↵' : '';
    return `<button class="${o.id === 'y' || o.id === 'roll' ? 'primary' : ''}" data-ans="${o.id}">${esc(t(o.k, o))}${key ? `<kbd>${key}</kbd>` : ''}</button>`;
  }).join('');
  setHTML(el, `<h3>${t(q.key, p)}</h3><div class="pbody">${q.params?.c ? rich(q.params.c) : ''}<div class="optrow">${btns}</div></div>`);
  el.hidden = false;
}
function statusHTML(s) {
  const rc = s.race, cur = rc && runnerOf(s, rc.cur), others = S.wait.filter(i => i !== S.you);
  if (s.phase !== 'race') return '';
  let h = cur ? `${portrait(cur.code)}<span>${cur.owner === S.you ? `<b>${t('hud.yourTurn')}</b> · ` : ''}${esc(card(cur.code).name)} · ${pn(cur.owner)}</span>` : '';
  if (others.length) h += `<span>⏳ ${t('hud.waiting', { p: others.map(pn).join(', ') })}</span>`;
  return h;
}
// Thin countdown under the top bar while a decision is pending.
function syncTimer() {
  const q = S.prompt, el = $('timer');
  if ((q?.id ?? null) === timerId) return;
  timerId = q?.id ?? null;
  el.hidden = !q;
  if (!q) return;
  const bar = el.firstElementChild;
  bar.style.animation = 'none'; void bar.offsetWidth;
  bar.style.animation = `shrink ${q.ms}ms linear forwards`;
}

export function render() {
  const s = S.snap, r = S.room;
  $('home').hidden = !!r;
  $('lobby').hidden = !r || !!s;
  $('game').hidden = !s;
  $('conn').hidden = S.online;
  $('btnLog').hidden = !s;
  $('btnLog').classList.toggle('on', S.logOpen);
  document.body.classList.toggle('nolog', !S.logOpen);
  const chip = $('roomChip');
  chip.hidden = !r;
  if (r) chip.textContent = r.code;
  if (r && !s) { S.names = r.seats.map(x => x.name); setHTML($('lobbyBox'), lobbyHTML()); }
  setHTML($('stage'), s ? stageHTML(s) : '');
  if (s) {
    S.names = s.players.map(p => p.name);
    $('game').dataset.phase = s.phase;
    setHTML($('players'), playersHTML(s));
    renderTracker(s);
    const ov = $('overlay'), [kind, html] = overlayHTML(s);
    if (setHTML(ov, html) && kind !== ov._kind) ov.firstElementChild?.classList.add('in');
    ov._kind = kind;
    renderPrompt(s);
    const st = $('status'), cur = s.race && runnerOf(s, s.race.cur);
    setHTML(st, $('prompt').hidden ? statusHTML(s) : '');
    st.classList.toggle('you', s.phase === 'race' && cur?.owner === S.you);
  } else $('prompt').hidden = true;
  syncTimer();
}

export function initUI(state, actions) {
  S = state; act = actions;
  const local = {
    closeModal, book: openBook, help: openHelp,
    bookSet: d => { book.set = d.set; openBook(); },
    toggleLog: () => {
      S.logOpen = !S.logOpen;
      try { localStorage.setItem('agp.log', S.logOpen ? '1' : '0'); } catch {}
      render();
      $('logBody').scrollTop = $('logBody').scrollHeight;
      act.layout();
    },
  };
  $('selLang').innerHTML = Object.entries(LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('selLang').onchange = e => act.lang(e.target.value);
  $('selQ').onchange = e => act.quality(e.target.value);
  $('btnCreate').onclick = () => act.create($('inName').value);
  $('btnJoin').onclick = () => act.join($('inCode').value, $('inName').value);
  $('inCode').onkeydown = e => { if (e.key === 'Enter') $('btnJoin').click(); };
  $('inName').onkeydown = e => { if (e.key === 'Enter') ($('inCode').value.trim().length === 4 ? $('btnJoin') : $('btnCreate')).click(); };
  $('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('click', e => {
    const hit = sel => e.target.closest(sel), menu = $('settings');
    if (menu.open && !menu.contains(e.target)) menu.open = false;
    let el;
    if ((el = hit('[data-ans]'))) { if (S.prompt && el.dataset.ans) act.answer(el.dataset.ans); }
    else if ((el = hit('[data-sel]'))) { S.sel = el.dataset.sel; render(); }
    else if ((el = hit('[data-act]'))) (local[el.dataset.act] || act[el.dataset.act])?.(el.dataset);
    else if ((el = hit('[data-opt]'))) { const k = el.dataset.opt, v = el.dataset.val; act.opts({ [k]: v === 'true' ? true : v === 'false' ? false : k === 'sets' ? v : +v }); }
    else if ((el = hit('[data-card]'))) { backTo = hit('.book') ? openBook : null; detail(el.dataset.card, el.dataset.rid); }
  });
  document.addEventListener('dblclick', e => { const el = e.target.closest('[data-sel]'); if (el && S.prompt) act.answer(el.dataset.sel); });
}
// Controls that live outside render(): settings menu, language switch on the home screen.
export function refreshStatic(q, soundOn) {
  $('selLang').value = lang();
  $('selQ').innerHTML = ['low', 'med', 'high'].map(k => `<option value="${k}" ${k === q ? 'selected' : ''}>${t('hud.q.' + k)}</option>`).join('');
  $('btnSound').classList.toggle('on', soundOn);
  $('btnSound').setAttribute('aria-checked', soundOn);
  $('btnFull').hidden = !document.documentElement.requestFullscreen;
  $('langs').innerHTML = Object.entries(LANGS).map(([k, v]) => `<button data-act="lang" data-l="${k}" class="${k === lang() ? 'on' : ''}">${v}</button>`).join('');
}
