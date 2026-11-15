// Aetheria Grand Prix rules engine. Runs on the server; see docs/RULES_ENGINE.md for rulings.
// io = { emit(event, snapshot) -> Promise, ask(playerIdx, prompt) -> Promise<optionId> }
import { CARDS, TWISTS } from './cards.js';
import { TRACKS, reverseTrack, spaceAt } from './tracks.js';
import { powers } from './powers.js';

export const A = {
  LARVA: 'R-19', SLIME: 'R-14', HARE: 'R-17', SAGE: 'R-11', HITCH: 'R-30', LEAPER: 'R-34', ALCH: 'R-01', GUEST: 'R-36',
  CHEER: 'R-08', ILLU: 'R-26', TWIN: 'R-37', HOPEFUL: 'R-23', OVERDRIVE: 'R-28', BLADE: 'R-10', LANCER: 'R-05',
  ARBITER: 'R-33', GREASE: 'R-07', AERO: 'R-02', VANGUARD: 'R-22', HIJACK: 'R-32', MAW: 'R-24', MIND: 'R-18',
  LOVERS: 'R-31', BONE: 'R-04', MENTOR: 'R-03', PROVOC: 'R-12', GOLIATH: 'R-15', STRIDER: 'R-20', HERALD: 'R-27',
  DRIFTER: 'R-29', TOAD: 'R-25', MIMIC: 'R-06', SHIFTER: 'R-16', ORB: 'R-13', STRAT: 'R-21', FORTUNE: 'R-09',
  NAKED: 'E-01', VOID: 'E-02', RIDER: 'E-03', SOVEREIGN: 'E-04', SLOTH: 'E-05', PATRON: 'E-06', BLASTER: 'E-07',
  HOPPER: 'E-08', TAIL: 'E-09', PRIMA: 'E-10', DICEGM: 'E-11', DARE: 'E-12', APEX: 'E-13', BIO: 'E-14', CHASER: 'E-15',
  DARK: 'E-16', TRAP: 'E-17', AERONAUT: 'E-18', WARDEN: 'E-19', LEVI: 'E-20', FUN: 'E-21', MOLE: 'E-22',
  PENGUIN: 'E-23', TANTRUM: 'E-24', TYCOON: 'E-25', SOULMATE: 'E-26', TEMPEST: 'E-27', HOUND: 'E-28', SWAPPER: 'E-29',
  HEIR: 'E-30', CRITIC: 'E-31', NEMESIS: 'E-32', ETERNAL: 'E-33', WOLF: 'E-34', CHEETAH: 'E-35', UNDERSTUDY: 'E-36',
};
export const GOLD = [3, 4, 4, 5], SILVER = [1, 2, 2, 3];
const YN = [{ id: 'y', k: 'opt.yes' }, { id: 'n', k: 'opt.no' }];
export const NUMS = [1, 2, 3, 4, 5, 6].map(n => ({ id: String(n), n }));

export class Game {
  constructor({ players, opts = {}, io, rng = Math.random, tracks = TRACKS }) {
    this.opts = { sets: 'all', twists: false, double: false, ...opts };
    this.tracks = tracks;
    this.io = io; this.rng = rng;
    this.players = players.map(p => ({ name: p.name, bot: !!p.bot, pts: 0, hand: [], used: [], carry: [], eternal: null }));
    this.N = players.length;
    this.per = this.opts.double ? 2 : 1;
    this.phase = 'draft'; this.raceIdx = 0; this.race = null; this.draft = null;
    this.winners = []; this.results = []; this.champs = null;
    this.rid = 0; this.depth = 0; this.leaping = false; this.loving = false;
    this.deck = []; this.twistDeck = [];
  }

  // ---------- utilities ----------
  rnd(n) { return Math.floor(this.rng() * n); }
  d6() { return 1 + this.rnd(6); }
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = this.rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  async emit(type, data = {}) { await this.io.emit({ type, ...data }, this.snapshot()); }
  async ask(p, key, opts, ai, params = {}) {
    if (!opts.length) return null;
    const v = await this.io.ask(p, { key, params, opts, ai });
    return opts.some(o => o.id === v) ? v : ai;
  }
  async yn(p, key, ai, params) { return (await this.ask(p, key, YN, ai ? 'y' : 'n', params)) === 'y'; }
  // Choose a runner from list; with none=true the player may decline (returns null).
  async pickR(p, key, list, ai, none) {
    if (!list.length) return null;
    const opts = list.map(x => ({ id: x.id, r: x.id }));
    if (none) opts.push({ id: 'n', k: 'opt.no' });
    const v = await this.ask(p, key, opts, ai && list.includes(ai) ? ai.id : none ? 'n' : list[this.rnd(list.length)].id);
    return list.find(x => x.id === v) || null;
  }
  async award(p, n, why) {
    const pl = this.players[p], before = pl.pts;
    pl.pts = Math.max(0, pl.pts + n);
    if (pl.pts !== before) await this.emit('pts', { p, n: pl.pts - before, why });
  }

  snapshot() {
    const rc = this.race;
    return {
      phase: this.phase, raceIdx: this.raceIdx, N: this.N, per: this.per, champs: this.champs, gold: GOLD, silver: SILVER,
      players: this.players.map(p => ({ name: p.name, bot: p.bot, pts: p.pts, hand: p.hand, used: p.used })),
      draft: this.draft, results: this.results,
      race: rc && {
        track: rc.track.id, rev: !!rc.track.rev, L: rc.track.L, c1: rc.track.c1, c2: rc.track.c2,
        cur: rc.cur ? rc.cur.id : null, twists: rc.twists, monster: rc.monster, chips: Object.keys(rc.chips).map(Number),
        fixed: rc.fixed,
        runners: rc.runners.map(r => ({
          id: r.id, code: r.code, owner: r.owner, pos: r.pos, trip: r.trip, out: r.out, fin: r.fin,
          extra: r.abils.slice(1), mount: !!r.f.mount, mate: r.f.mate || null, predict: r.f.predict || null,
        })),
      },
    };
  }

  // ---------- runner queries ----------
  on(r) { return !r.out && r.fin == null; }
  live() { return this.race.runners.filter(r => this.on(r)); }
  others(r) { return this.live().filter(x => x !== r); }
  at(pos, except) { return this.live().filter(x => x.pos === pos && x !== except); }
  byId(id) { return this.race.runners.find(r => r.id === id); }
  isLast(r) { return r.pos === Math.min(...this.live().map(x => x.pos)); }
  soleLast(r) { const o = this.others(r); return o.length > 0 && o.every(x => x.pos > r.pos); }
  soleLead(r) { const o = this.others(r); return o.length > 0 && o.every(x => x.pos < r.pos); }
  leaderOther(r) { // front-most other runner, first in turn order on ties
    let best = null;
    for (const x of this.others(r)) if (!best || x.pos > best.pos) best = x;
    return best;
  }
  // Abilities before Void nullification; Mimic adds the leader's abilities dynamically.
  raw(r) {
    let a = r.abils;
    if (a.includes(A.MIMIC)) {
      const l = this.leaderOther(r);
      if (l && l.pos >= r.pos) a = a.concat(l.abils.filter(c => c !== A.MIMIC));
    }
    return a;
  }
  // True if r stands ahead of a Void Null (loses abilities, -1 main move).
  nulled(r) {
    let vp = Infinity;
    for (const x of this.live()) if (x.pos < vp && this.raw(x).includes(A.VOID)) vp = x.pos;
    return r.pos > vp;
  }
  has(r, code) { return this.on(r) && this.raw(r).includes(code) && !this.nulled(r); }
  who(code, except) { return this.live().filter(x => x !== except && this.has(x, code)); }

  // An ability triggers: announce it, then Nimble Leapers hop.
  async fire(r, code, extra) {
    await this.emit('abil', { r: r.id, c: code, ...extra });
    if (this.leaping) return;
    for (const l of this.who(A.LEAPER, r)) {
      this.leaping = true;
      try { await this.emit('abil', { r: l.id, c: A.LEAPER }); await this.move(l, 1); } finally { this.leaping = false; }
    }
  }

  // ---------- movement ----------
  async move(r, n, o = {}) {
    const race = this.race, L = race.track.L;
    if (!this.on(r) || !n || race.over || this.depth >= 10) return;
    this.depth++;
    try {
      const from = r.pos, dir = Math.sign(n);
      let to;
      if (this.has(r, A.TOAD)) { // occupied spaces are free
        let p = from, k = Math.abs(n);
        while (k > 0) { p += dir; if (p <= 0 || p >= L) break; if (!this.at(p, r).length) k--; }
        to = p;
      } else to = from + n;
      to = Math.max(0, to);
      if (to >= L) {
        const arb = to > L && this.who(A.ARBITER, r)[0];
        if (arb) { await this.fire(arb, A.ARBITER, { r2: r.id }); return; }
        to = L;
      }
      if (to > 0 && to < L) {
        const g = this.at(to, r).find(x => this.has(x, A.GOLIATH));
        if (g) { await this.fire(g, A.GOLIATH, { r2: r.id }); to = Math.max(0, to - 1); }
      }
      if (to === from || !this.on(r)) return;
      r.pos = to;
      await this.emit('move', { r: r.id, from, to, main: !!o.main });
      if (to > 0 && to < L && this.has(r, A.GOLIATH)) for (const x of this.at(to, r)) await this.warp(x, to - 1);
      if (to > from) {
        const passed = this.others(r).filter(x => x.pos > from && x.pos < to);
        let tripMe = false;
        for (const x of passed) {
          if (!this.on(x) || race.over) continue;
          if (r.t.wolf) { await this.fire(r, A.WOLF, { r2: x.id }); await this.elim(x); continue; }
          if (r.t.apex6) await this.trip(x);
          if (this.has(x, A.GREASE)) { await this.fire(x, A.GREASE, { r2: r.id }); tripMe = true; }
          if (x.f.mount && this.has(x, A.RIDER)) { x.f.mount = false; await this.fire(x, A.RIDER); }
          if (this.has(x, A.PENGUIN) && !x.trip) { await this.fire(x, A.PENGUIN); await this.trip(x); }
          if (this.has(r, A.LANCER)) { await this.fire(r, A.LANCER, { r2: x.id }); await this.move(x, -2); }
        }
        if (passed.length && o.main && this.has(r, A.NAKED)) { await this.fire(r, A.NAKED); await this.award(r.owner, 1, 'naked'); }
        if (tripMe && r.pos < L) await this.trip(r);
      }
      if (race.over || !this.on(r)) return;
      if (r.pos >= L) { await this.finish(r); return; }
      if (r.pos !== to) return;
      await this.board(r, o);
      if (race.over || !this.on(r) || r.pos !== to) return;
      await this.landing(r);
    } finally { this.depth--; }
  }

  // Warp: no passing, no board effects, no landing effects (Goliath still refuses company).
  async warp(r, to) {
    const L = this.race.track.L;
    if (!this.on(r) || this.race.over || this.depth >= 10) return;
    this.depth++;
    try {
      to = Math.max(0, Math.min(L - 1, to));
      if (to > 0 && !this.has(r, A.GOLIATH) && this.at(to, r).some(x => this.has(x, A.GOLIATH))) to--;
      if (to === r.pos) return;
      const from = r.pos;
      r.pos = to;
      await this.emit('move', { r: r.id, from, to, warp: true });
      if (to > 0 && this.has(r, A.GOLIATH)) for (const x of this.at(to, r)) await this.warp(x, to - 1);
    } finally { this.depth--; }
  }
  async swap(a, b) {
    [a.pos, b.pos] = [b.pos, a.pos];
    await this.emit('swap', { r: a.id, r2: b.id });
  }

  async board(r, o = {}) {
    const s = spaceAt(this.race.track, r.pos);
    if (!s) return;
    if (s.t === 'arrow') {
      if (o.arrowFrom === r.pos + s.n) return; // paired arrows (A -> B, B -> A): resolve the loop once
      await this.emit('space', { r: r.id, n: s.n }); await this.move(r, s.n, { arrowFrom: r.pos });
    }
    else if (s.t === 'trip') await this.trip(r);
    else await this.award(r.owner, 1, 'star');
  }

  async landing(r) {
    const race = this.race, p = r.pos, L = race.track.L;
    if (p <= 0 || p >= L) return;
    if (race.chips[p]) { delete race.chips[p]; await this.award(r.owner, 1, 'chip'); }
    if (race.infest && p >= L - 2) { await this.emit('msg', { k: 'log.infest', r: r.id }); await this.move(r, -5); return; }
    let others = this.at(p, r);
    if (!others.length) return;
    if (others.length === 1) {
      if (this.has(r, A.MAW)) { await this.fire(r, A.MAW, { r2: others[0].id }); await this.elim(others[0]); }
      if (!this.loving) for (const l of this.who(A.LOVERS)) {
        this.loving = true;
        try { await this.fire(l, A.LOVERS); await this.move(l, 2); } finally { this.loving = false; }
      }
    }
    for (const x of others) {
      const here = () => !race.over && this.on(x) && this.on(r) && x.pos === p && r.pos === p;
      if (here() && this.has(r, A.BONE)) { await this.fire(r, A.BONE, { r2: x.id }); await this.trip(x); }
      if (here() && this.has(x, A.BONE)) { await this.fire(x, A.BONE, { r2: r.id }); await this.trip(r); }
      if (here() && this.has(x, A.TYCOON) && x.owner !== r.owner) {
        await this.fire(x, A.TYCOON, { r2: r.id });
        if (this.players[r.owner].pts > 0) { await this.award(r.owner, -1, 'rent'); await this.award(x.owner, 1, 'rent'); }
        else await this.trip(r);
      }
      if (here() && this.has(r, A.BLADE)) await this.duel(r, x);
      else if (here() && this.has(x, A.BLADE)) await this.duel(x, r);
    }
  }

  async duel(b, x) {
    if (!await this.yn(b.owner, 'q.duel', true, { r: x.id })) return;
    await this.fire(b, A.BLADE, { r2: x.id });
    const vb = await this.rollDie(b, 'duel'), vx = await this.rollDie(x, 'duel');
    await this.move(vb >= vx ? b : x, 2);
  }

  async trip(r) { if (this.on(r) && !r.trip) { r.trip = true; await this.emit('trip', { r: r.id }); } }
  async elim(r) {
    if (!this.on(r)) return;
    r.out = true; this.race.elimOrder.push(r);
    await this.emit('elim', { r: r.id });
    await this.checkEnd();
  }
  async place(r) {
    r.fin = this.race.finishers.push(r);
    await this.emit('finish', { r: r.id, rank: r.fin });
  }
  async finish(r) {
    const race = this.race;
    if (!race.finishers.length) {
      const d = this.who(A.DARK, r).find(x => !x.f.darkUsed);
      if (d) {
        d.f.darkUsed = true;
        await this.fire(d, A.DARK, { r2: r.id });
        const abils = [...r.abils];
        await this.elim(r);
        for (const c of abils) await this.gain(d, c);
        return;
      }
    }
    await this.place(r);
    if (r.fin === 1) {
      const s = this.live().find(x => x.f.predict === r.id && this.has(x, A.STRAT));
      if (s) { await this.fire(s, A.STRAT, { r2: r.id }); await this.place(s); }
    }
    await this.checkEnd();
  }
  async checkEnd() {
    const race = this.race;
    if (race.over) return;
    const live = this.live();
    if (race.finishers.length >= 2) race.over = true;
    else if (live.length <= 1) {
      race.over = true;
      if (live.length && !race.starting) await this.place(live[0]);
    }
  }

  // Dice roll on behalf of a runner: fixed results (T-09), Fun Destroyer, Static Warden.
  async rollDie(r, why, quiet) {
    const race = this.race;
    let v = race.fixed[r.owner], warden = false;
    if (v == null) {
      v = this.d6();
      for (let g = 0; v === 6 && g < 6; g++) {
        const fd = this.who(A.FUN);
        if (!fd.length) break;
        if (!quiet) await this.emit('roll', { r: r.id, v: 6, why, reroll: true });
        for (const f of fd) { await this.fire(f, A.FUN); await this.move(f, 1); }
        v = g < 5 ? this.d6() : 1 + this.rnd(5);
      }
    }
    if (this.who(A.WARDEN, r).some(w => Math.abs(w.pos - r.pos) <= 1) && v !== 1) { v = 1; warden = true; }
    if (!quiet) await this.emit('roll', { r: r.id, v, why, warden });
    return v;
  }

  // ---------- abilities gained / pre-race setup ----------
  async gain(r, code) {
    if (r.abils.includes(code) || !this.on(r)) return;
    r.abils.push(code);
    await this.emit('gain', { r: r.id, c: code });
    await this.setup(r, code);
  }
  async setup(r, code) {
    const race = this.race, me = r.owner;
    const cardOpts = list => list.map(c => ({ id: c, c }));
    switch (code) {
      case A.TWIN: {
        const list = [...new Set(this.winners)].filter(c => !r.abils.includes(c));
        if (!list.length) break;
        const c = await this.ask(me, 'q.twin', cardOpts(list), list[this.rnd(list.length)]);
        await this.fire(r, A.TWIN); await this.gain(r, c); break;
      }
      case A.ORB: {
        const list = this.deck.splice(0, 3);
        if (!list.length) break;
        const c = await this.ask(me, 'q.orb', cardOpts(list), list[this.rnd(list.length)]);
        await this.fire(r, A.ORB); await this.gain(r, c); break;
      }
      case A.UNDERSTUDY: {
        const x = await this.pickR(me, 'q.understudy', this.others(r).filter(x => x.owner !== me));
        if (!x) break;
        await this.fire(r, A.UNDERSTUDY, { r2: x.id });
        for (const c of [...x.abils]) await this.gain(r, c);
        break;
      }
      case A.SOULMATE: {
        const x = await this.pickR(me, 'q.soulmate', this.others(r).filter(x => x.owner !== me));
        if (x) { r.f.mate = x.id; await this.fire(r, A.SOULMATE, { r2: x.id }); }
        break;
      }
      case A.HEIR:
        if (race.starting && r.pos < race.track.c1) { await this.fire(r, A.HEIR); await this.warp(r, race.track.c1); }
        break;
      case A.DRIFTER: await this.fire(r, A.DRIFTER); await this.award(me, 4, 'drift'); break;
      case A.RIDER: r.f.mount = true; break;
    }
  }

  // ---------- game flow ----------
  async run() {
    await this.doDraft();
    for (this.raceIdx = 0; this.raceIdx < 4; this.raceIdx++) await this.doRace();
    this.phase = 'end';
    const max = Math.max(...this.players.map(p => p.pts));
    this.champs = this.players.map((p, i) => p.pts === max ? i : -1).filter(i => i >= 0);
    await this.emit('gameEnd', { champs: this.champs });
  }

  // Roll-off: every player throws a die themselves; returns players ranked high to low (ties re-roll).
  async rank(ps) {
    const rolls = {};
    let chain = Promise.resolve();
    await Promise.all(ps.map(async p => {
      await this.ask(p, 'q.rolloff', [{ id: 'roll', k: 'opt.roll' }], 'roll');
      const n = rolls[p] = this.d6();
      await (chain = chain.then(() => this.emit('droll', { p, n })));
    }));
    const out = [];
    for (let v = 6; v >= 1; v--) {
      const g = ps.filter(p => rolls[p] === v);
      if (g.length > 1) { await this.emit('msg', { k: 'log.tie', n: v, ps: g }); out.push(...await this.rank(g)); }
      else out.push(...g);
    }
    return out;
  }
  seatOrder(first) { return this.players.map((_, i) => (first + i) % this.N); }

  async doDraft() {
    this.phase = 'draft';
    const sets = this.opts.sets;
    this.deck = this.shuffle(CARDS.filter(c => sets === 'all' || c.set === sets).map(c => c.code));
    this.twistDeck = this.shuffle(TWISTS.map(t => t.code));
    this.draft = { row: [], picker: null, n: 0, order: [] };
    await this.emit('draftStart');
    // highest roll picks first and, the order snaking back, also takes the last card of each row
    const order = await this.rank(this.players.map((_, i) => i));
    this.draft.order = order;
    await this.emit('order', { ps: order });
    for (let n = 0; n < this.per * 2; n++) {
      this.draft = { row: this.deck.splice(0, 2 * this.N), picker: null, n, order };
      await this.emit('draftRow');
      for (const p of [...order, ...[...order].reverse()]) {
        const row = this.draft.row;
        this.draft.picker = p;
        await this.emit('draftTurn', { p });
        const c = await this.ask(p, 'q.draft', row.map(c => ({ id: c, c })), row[this.rnd(row.length)]);
        row.splice(row.indexOf(c), 1);
        this.players[p].hand.push(c);
        await this.emit('pick', { p, c });
      }
    }
    this.draft = null;
  }

  mk(code, owner) {
    return { id: 'r' + (++this.rid), code, owner, pos: 0, trip: false, out: false, fin: null, abils: [code], f: {}, t: {} };
  }

  async doRace() {
    const race = this.race = {
      track: this.tracks[this.raceIdx], runners: [], finishers: [], elimOrder: [], over: false, cancelled: false,
      twists: [], fixed: {}, monster: null, chips: {}, cur: null, hijack: null, starting: true,
    };
    this.phase = 'pick';
    await this.emit('raceIntro');
    const picks = await Promise.all(this.players.map(async (pl, p) => {
      const chosen = [];
      for (let k = 0; k < this.per && chosen.length < pl.hand.length; k++) {
        const left = pl.hand.filter(c => !chosen.includes(c));
        chosen.push(await this.ask(p, 'q.pick', left.map(c => ({ id: c, c })), left[this.rnd(left.length)]));
      }
      return chosen;
    }));
    let first = this.nextStart;
    if (this.raceIdx === 0) { await this.emit('rolloff'); first = (await this.rank(this.players.map((_, i) => i)))[0]; }
    await this.emit('msg', { k: 'log.first', p: first });
    for (const p of this.seatOrder(first)) {
      const pl = this.players[p];
      for (const c of picks[p]) { pl.hand.splice(pl.hand.indexOf(c), 1); pl.used.push(c); race.runners.push(this.mk(c, p)); }
      if (pl.eternal) race.runners.push(this.mk(pl.eternal, p));
      for (const c of pl.carry.splice(0)) race.runners.push(this.mk(c, p));
    }
    this.phase = 'race';
    await this.emit('reveal');
    for (const r of [...race.runners]) await this.setup(r, r.code);
    race.starting = false;

    const order = race.runners;
    // Stall rule: headway = someone finishes, is eliminated, or gets further than it has ever been this race.
    let idle = 0, mark = 0;
    const headway = () => {
      const n = race.finishers.length + race.elimOrder.length;
      let moved = n !== mark;
      mark = n;
      for (const x of race.runners) if (this.on(x) && x.pos > (x.f.best ?? 0)) { x.f.best = x.pos; moved = true; }
      return moved;
    };
    for (let i = 0, iter = 0, turns = 0; !race.over && iter < 3000; iter++, i++) {
      const r = order[i % order.length];
      if (!this.on(r)) continue;
      if (++turns > 300) { await this.stall(); break; }
      race.cur = r;
      await this.turn(r);
      if (!race.over) await this.afterTurn(r);
      if (race.over) break;
      idle = headway() ? 0 : idle + 1;
      if (idle >= 12 * Math.max(2, this.live().length)) { await this.stall(); break; } // 12 rounds of nothing: abilities/dice are deadlocked
      if (r.f.extra && this.on(r)) { r.f.extra = false; r.f.chain = (r.f.chain || 0) + 1; i--; continue; }
      r.f.extra = false; r.f.chain = 0;
      const h = race.hijack; race.hijack = null;
      if (h && this.on(h)) { i = order.indexOf(h) - 1; continue; }
      if (race.wand) { const v = this.d6(); await this.emit('msg', { k: 'log.wand', r: r.id, n: v }); i += v; }
    }
    race.over = true; race.cur = null;
    await this.endRace();
  }

  // The referee stops a deadlocked race: places already earned stand, and whoever is clearly in front takes the next one.
  async stall() {
    const race = this.race;
    race.over = true;
    await this.emit('msg', { k: 'log.stall' });
    while (race.finishers.length < 2) {
      const live = this.live().sort((a, b) => b.pos - a.pos);
      if (!live.length || (live[1] && live[1].pos === live[0].pos)) break;
      await this.place(live[0]);
    }
  }

  async afterTurn(r) {
    const race = this.race, L = race.track.L;
    if (race.monster != null) {
      const v = this.d6(), from = race.monster, to = Math.min(L, from + v);
      race.monster = to >= L ? null : to;
      await this.emit('monster', { from, to, n: v });
      for (const x of this.live()) if (x.pos > from && x.pos < to) await this.elim(x);
    }
    if (this.opts.twists && !race.twisted && !race.over) {
      const c1 = race.track.c1;
      const a = this.on(r) && r.pos > c1 ? r : this.live().filter(x => x.pos > c1).sort((x, y) => y.pos - x.pos)[0];
      if (a) { race.twisted = true; await this.drawTwist(a); }
    }
  }

  // Realm Surge: drawn when the first runner gets past corner 1. `a` is the runner who triggered it.
  async drawTwist(a) {
    const race = this.race, L = race.track.L;
    if (!this.twistDeck.length) this.twistDeck = this.shuffle(TWISTS.map(t => t.code));
    const c = this.twistDeck.pop();
    race.twists.push(c);
    await this.emit('twist', { c, r: a.id });
    switch (c) {
      case 'T-01': race.monster = 0; break;
      case 'T-02': await this.drawTwist(a); if (!race.over) await this.drawTwist(a); break;
      case 'T-03': race.infest = true; break;
      case 'T-04': {
        race.track = reverseTrack(race.track);
        for (const x of this.live()) { x.pos = Math.min(L - 1, L - x.pos); x.f.best = x.pos; }
        if (race.monster != null) race.monster = L - race.monster;
        race.chips = Object.fromEntries(Object.keys(race.chips).map(k => [L - k, 1]));
        await this.emit('reverse');
        break;
      }
      case 'T-05': race.wand = true; break;
      case 'T-06': race.mirror = true; for (const x of this.live()) await this.warp(x, 1); break;
      case 'T-07': race.scry = true; break;
      case 'T-08': for (let i = race.track.c1 + 1; i < L; i++) if (!this.at(i).length) race.chips[i] = 1; await this.emit('chips'); break;
      case 'T-09': for (let p = 0; p < this.N; p++) { race.fixed[p] = this.d6(); await this.emit('fixed', { p, n: race.fixed[p] }); } break;
      case 'T-10': if (this.on(a)) { if (this.raceIdx < 3) this.players[a.owner].carry.push(a.code); await this.elim(a); } break;
      case 'T-11': for (const x of this.live().filter(x => this.isLast(x))) await this.move(x, 7); break;
      case 'T-12': race.showdown = true; break;
      case 'T-13':
        for (let p = 0; p < this.N; p++) {
          const x = this.live().find(x => x.owner === p), nc = x && this.deck.shift();
          if (!nc) continue;
          if (await this.yn(p, 'q.swapmeet', this.rng() < 0.3, { c: nc, r: x.id })) {
            x.code = nc; x.abils = [nc]; x.f = { went: x.f.went };
            await this.emit('recard', { r: x.id, c: nc });
            await this.setup(x, nc);
          }
        }
        break;
    }
  }

  async endRace() {
    const race = this.race, idx = this.raceIdx, c2 = race.track.c2, L = race.track.L;
    this.phase = 'raceEnd';
    let [a, b] = race.cancelled ? [] : race.finishers;
    if (race.showdown && a && b) { // T-12: plain d6 duel from corner 2, runner-up moves first
      const pos = [c2, c2], pair = [b, a];
      await this.emit('msg', { k: 'log.showdown', r: a.id, r2: b.id });
      for (let k = 0; ; k ^= 1) {
        const v = this.d6(); pos[k] += v;
        await this.emit('msg', { k: 'log.showroll', r: pair[k].id, n: v, to: Math.min(L, pos[k]) });
        if (pos[k] >= L) { if (k === 0) { [a, b] = [b, a]; a.fin = 1; b.fin = 2; } break; }
      }
    }
    if (a) {
      this.winners.push(a.code);
      await this.award(a.owner, GOLD[idx], 'gold');
      for (const q of race.runners) if (!q.out && q !== a && q.abils.includes(A.PATRON) && q.owner !== a.owner && (q.owner + 1) % this.N === a.owner) await this.award(q.owner, 3, 'patron');
    }
    if (b) await this.award(b.owner, SILVER[idx], 'silver');
    if (!race.cancelled) for (const r of race.runners) if (this.on(r) && r.abils.includes(A.SLOTH) && r.pos <= c2) await this.award(r.owner, 3, 'sloth');
    for (const r of race.runners) if (r.code === A.ETERNAL && !this.players[r.owner].eternal) this.players[r.owner].eternal = r.code;
    // next race: owner of the first eliminated runner, else of the one farthest behind, goes first
    const rest = race.runners.filter(r => this.on(r));
    const minPos = Math.min(...rest.map(r => r.pos));
    const lasts = rest.filter(r => r.pos === minPos);
    const loser = race.elimOrder[0] || lasts[this.rnd(lasts.length)] || race.finishers.at(-1) || race.runners[0];
    this.nextStart = loser.owner;
    const brief = r => r && { code: r.code, owner: r.owner };
    this.results.push({ first: brief(a), second: brief(b), cancelled: race.cancelled });
    await this.emit('raceEnd', { first: a && a.id, second: b && b.id, cancelled: race.cancelled });
  }
}
Object.assign(Game.prototype, powers);
