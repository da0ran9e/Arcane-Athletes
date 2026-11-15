// A room: lobby seats, options, and one running Game. Bridges the engine's io to WebSockets.
import crypto from 'node:crypto';
import { Game } from '../shared/engine.js';
import { loadTracks } from './tracks.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
// Animation time (ms) the clients get for each event type before the engine continues.
const DELAY = {
  roll: 1300, swap: 900, abil: 1100, pts: 650, trip: 600, stand: 300, elim: 1100, finish: 1400, turn: 250, twist: 2800,
  rolloff: 200, droll: 1500, order: 2000, draftStart: 300, draftRow: 900, draftTurn: 100, pick: 700, raceIntro: 1500, reveal: 2800, raceEnd: 5000,
  gameEnd: 0, dist: 500, msg: 900, gain: 900, monster: 1100, cheat: 1600, space: 300, reverse: 1500, fixed: 700,
};
const delayOf = e => e.type === 'move' ? (e.warp ? 800 : Math.min(1800, 350 + 140 * Math.abs(e.to - e.from))) : DELAY[e.type] ?? 500;
// What seat i may see: other players' hands are hidden (only the count), and so is the card they just drafted.
const view = (s, i) => ({ ...s, players: s.players.map((p, j) => j === i ? p : { ...p, hand: null, handN: p.hand.length }) });
const BOT_NAMES = ['Zephyr', 'Mossy', 'Onyx', 'Nova', 'Pip', 'Quill', 'Rune', 'Sable'];
const DEFAULTS = { sets: 'all', twists: false, double: false, speed: 1, timer: 45 };

export class Room {
  constructor(code) {
    this.code = code; this.seats = []; this.host = null; this.opts = { ...DEFAULTS };
    this.playing = false; this.snap = null; this.pending = new Map(); this.pid = 0;
    this.gen = 0; this.touched = Date.now();
  }

  // ---------- lobby ----------
  info() {
    return {
      code: this.code, opts: this.opts, playing: this.playing, host: this.seats.findIndex(s => s.token === this.host),
      seats: this.seats.map(s => ({ name: s.name, bot: s.bot, on: s.bot || !!s.ws })),
    };
  }
  send(seat, msg) { if (seat.ws && seat.ws.readyState === 1) seat.ws.send(JSON.stringify(msg)); }
  cast(msg) { const s = JSON.stringify(msg); for (const x of this.seats) if (x.ws && x.ws.readyState === 1) x.ws.send(s); }
  sync() { this.touched = Date.now(); const room = this.info(); this.seats.forEach((s, you) => this.send(s, { t: 'room', room, you })); }
  humans() { return this.seats.filter(s => !s.bot); }
  empty() { return !this.humans().some(s => s.ws); }

  join(ws, name, token) {
    let seat = token && this.seats.find(s => s.token === token && !s.bot);
    if (!seat) {
      if (this.playing) return 'err.inProgress';
      if (this.seats.length >= 6) return 'err.full';
      seat = { name, token: crypto.randomBytes(12).toString('hex'), bot: false, ws: null };
      this.seats.push(seat);
      if (!this.host) this.host = seat.token;
    } else if (seat.ws && seat.ws !== ws) seat.ws.close();
    seat.ws = ws; ws.seat = seat; ws.room = this;
    this.send(seat, { t: 'joined', code: this.code, seat: this.seats.indexOf(seat), token: seat.token });
    this.sync();
    if (this.playing && this.snap) {
      this.send(seat, { t: 'state', s: view(this.snap, this.seats.indexOf(seat)) });
      for (const [id, q] of this.pending) if (q.seat === seat) this.send(seat, { ...q.msg, ms: Math.max(1000, q.until - Date.now()) });
      this.castWait();
    }
    return null;
  }
  leave(ws) {
    const seat = ws.seat;
    if (!seat || seat.ws !== ws) return;
    seat.ws = null;
    if (!this.playing) {
      this.seats.splice(this.seats.indexOf(seat), 1);
      if (this.host === seat.token) this.host = this.humans()[0]?.token || null;
    } else for (const [id, q] of this.pending) if (q.seat === seat) this.shorten(id, 6000); // absent player: bot answers soon
    this.sync();
  }

  handle(ws, m) {
    const seat = ws.seat, isHost = seat.token === this.host;
    this.touched = Date.now();
    switch (m.t) {
      case 'opts':
        if (!isHost || this.playing || typeof m.opts !== 'object') return;
        for (const k of Object.keys(DEFAULTS)) if (typeof m.opts[k] === typeof DEFAULTS[k]) this.opts[k] = m.opts[k];
        if (!['all', 'base', 'exp'].includes(this.opts.sets)) this.opts.sets = 'all';
        this.opts.speed = Math.min(3, Math.max(0.4, this.opts.speed));
        this.opts.timer = Math.min(180, Math.max(10, this.opts.timer));
        return this.sync();
      case 'bot':
        if (!isHost || this.playing) return;
        if (m.add && this.seats.length < 6) {
          const used = this.seats.map(s => s.name), name = BOT_NAMES.find(n => !used.includes('🤖 ' + n)) || 'Bot';
          this.seats.push({ name: '🤖 ' + name, bot: true, token: null, ws: null });
        } else if (Number.isInteger(m.seat) && this.seats[m.seat]?.bot) this.seats.splice(m.seat, 1);
        return this.sync();
      case 'start': {
        if (!isHost || this.playing) return;
        const n = this.seats.length;
        if (this.opts.double ? n < 2 || n > 3 : n < 3) return this.send(seat, { t: 'err', key: this.opts.double ? 'err.double' : 'err.need3' });
        return this.start();
      }
      case 'answer': {
        const q = this.pending.get(m.id);
        if (q && q.seat === seat && q.msg.opts.some(o => o.id === m.v)) this.resolve(m.id, m.v);
        return;
      }
      case 'again':
        if (!isHost || this.playing) return;
        this.snap = null; this.cast({ t: 'lobby' }); return this.sync();
    }
  }

  // ---------- game ----------
  start() {
    const gen = ++this.gen, room = this;
    this.playing = true; this.pending.clear();
    const live = () => { if (gen !== room.gen) throw new Error('aborted'); };
    const io = {
      async emit(e, s) {
        live();
        room.snap = s;
        const d = Math.round(delayOf(e) / room.opts.speed);
        room.seats.forEach((seat, i) => room.send(seat, { t: 'ev', e: e.type === 'pick' && e.p !== i ? { type: 'pick', p: e.p } : e, s: view(s, i), d }));
        if (d) await sleep(d);
        live();
      },
      async ask(p, q) {
        live();
        const seat = room.seats[p];
        if (seat.bot) { await sleep(500 / room.opts.speed); live(); return q.ai; }
        const id = ++room.pid, ms = seat.ws ? room.opts.timer * 1000 : 6000;
        const msg = { t: 'prompt', id, key: q.key, params: q.params, opts: q.opts, ms };
        const v = await new Promise(res => {
          room.pending.set(id, { seat, msg, ai: q.ai, res, until: Date.now() + ms, timer: setTimeout(() => room.resolve(id, q.ai), ms) });
          room.send(seat, msg);
          room.castWait();
        });
        live();
        return v;
      },
    };
    const game = new Game({ players: this.seats.map(s => ({ name: s.name, bot: s.bot })), opts: this.opts, io, tracks: loadTracks() });
    this.sync();
    game.run().catch(e => { if (e.message !== 'aborted') console.error(`[room ${this.code}]`, e); })
      .finally(() => { if (gen === this.gen) { this.playing = false; this.sync(); } });
  }
  resolve(id, v) {
    const q = this.pending.get(id);
    if (!q) return;
    clearTimeout(q.timer); this.pending.delete(id);
    this.send(q.seat, { t: 'promptEnd', id });
    this.castWait();
    q.res(v);
  }
  shorten(id, ms) {
    const q = this.pending.get(id);
    if (!q || q.until - Date.now() <= ms) return;
    clearTimeout(q.timer); q.until = Date.now() + ms;
    q.timer = setTimeout(() => this.resolve(id, q.ai), ms);
  }
  castWait() { this.cast({ t: 'wait', seats: [...new Set([...this.pending.values()].map(q => this.seats.indexOf(q.seat)))] }); }
  destroy() {
    this.gen++;
    for (const q of this.pending.values()) { clearTimeout(q.timer); q.res(q.ai); }
    this.pending.clear();
  }
}
