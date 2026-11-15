// Turn flow and per-turn abilities, mixed into Game.prototype. See docs/RULES_ENGINE.md.
import { A, NUMS } from './engine.js';

export const powers = {
  async turn(r) {
    const race = this.race, me = r.owner;
    r.t = { start: r.pos };
    await this.emit('turn', { r: r.id });
    let skip = false;

    // ----- start of turn -----
    if (!r.f.went) {
      r.f.went = true;
      if (this.has(r, A.STRAT)) {
        const x = await this.pickR(me, 'q.strat', this.others(r).filter(x => x.owner !== me));
        if (x) { r.f.predict = x.id; await this.fire(r, A.STRAT, { r2: x.id }); }
      }
    }
    const others = () => this.others(r);
    if (this.has(r, A.TANTRUM) && others().every(x => x.pos - r.pos >= 5)) {
      await this.fire(r, A.TANTRUM);
      race.cancelled = race.over = true;
      await this.award(me, 3, 'tantrum');
      return;
    }
    if (this.has(r, A.TEMPEST) && others().every(x => r.pos - x.pos >= 4)) {
      await this.fire(r, A.TEMPEST); await this.elim(r); return;
    }
    if (this.has(r, A.HARE) && this.soleLead(r)) { await this.fire(r, A.HARE); skip = true; }
    if (this.has(r, A.HOPEFUL) && this.soleLast(r)) { await this.fire(r, A.HOPEFUL); await this.award(me, 1, 'hopeful'); }
    if (this.has(r, A.PRIMA) && this.isLast(r)) {
      const l = this.leaderOther(r);
      if (l && l.pos > r.pos) { await this.fire(r, A.PRIMA, { r2: l.id }); await this.swap(r, l); }
    }
    if (this.has(r, A.CHEER)) {
      const lasts = this.live().filter(x => this.isLast(x));
      if (await this.yn(me, 'q.cheer', lasts.includes(r) || this.rng() < 0.4)) {
        await this.fire(r, A.CHEER);
        for (const x of lasts) await this.move(x, 2);
        await this.move(r, 1);
      }
    }
    if (this.has(r, A.GUEST)) {
      const count = {};
      for (const x of others()) count[x.pos] = (count[x.pos] || 0) + 1;
      const spots = Object.keys(count).map(Number).filter(p => count[p] === 2 && p !== r.pos && p > 0);
      if (spots.length) {
        const best = Math.max(...spots);
        const v = await this.ask(me, 'q.guest', [...spots.map(p => ({ id: 's' + p, k: 'opt.space', n: p })), { id: 'n', k: 'opt.no' }], best > r.pos ? 's' + best : 'n');
        if (v !== 'n') { await this.fire(r, A.GUEST); await this.warp(r, +v.slice(1)); }
      }
    }
    if (this.has(r, A.MIND)) {
      const l = this.leaderOther(r);
      const x = await this.pickR(me, 'q.mind', others().filter(x => x.pos !== r.pos), l && l.pos > r.pos + 2 ? l : null, true);
      if (x) { await this.fire(r, A.MIND, { r2: x.id }); await this.warp(x, r.pos); }
    }
    if (this.has(r, A.SOVEREIGN)) {
      const l = this.leaderOther(r);
      if (l && l.pos >= r.pos && !l.trip && await this.yn(me, 'q.sovereign', true, { r: l.id })) {
        await this.fire(r, A.SOVEREIGN, { r2: l.id }); await this.trip(l);
      }
    }
    if (this.has(r, A.TAIL)) {
      const ahead = others().filter(x => x.pos > r.pos).map(x => x.pos);
      const to = Math.min(...ahead) - 1;
      if (ahead.length && to > r.pos && await this.yn(me, 'q.tail', true, { n: to })) { await this.fire(r, A.TAIL); await this.warp(r, to); }
    }
    if (this.has(r, A.LEVI) && !r.f.levi && r.pos > 0) {
      const o = others(), ahead = o.filter(x => x.pos > r.pos).length;
      if (await this.yn(me, 'q.levi', ahead >= o.length * 0.6 && this.rng() < 0.7)) {
        r.f.levi = true;
        await this.fire(r, A.LEVI);
        for (const x of o) { await this.warp(x, r.pos); await this.trip(x); }
      }
    }
    if (this.has(r, A.SOULMATE) && r.f.mate) {
      const m = this.byId(r.f.mate);
      if (m && this.on(m) && m.pos !== r.pos && Math.abs(m.pos - r.pos) <= 5) { await this.fire(r, A.SOULMATE, { r2: m.id }); await this.warp(r, m.pos); }
    }
    if (this.has(r, A.HERALD)) {
      const pull = others().filter(x => x.pos !== r.pos);
      if (pull.length) await this.fire(r, A.HERALD);
      for (const x of pull) await this.warp(x, x.pos + Math.sign(r.pos - x.pos));
      r.t.herald = this.at(r.pos, r).length;
    }
    if (race.over || !this.on(r)) return;

    // ----- tripped check -----
    let dbl = false;
    if (r.trip) {
      r.trip = false;
      await this.emit('stand', { r: r.id });
      if (this.has(r, A.PENGUIN)) { dbl = true; await this.fire(r, A.PENGUIN); } else skip = true;
    }
    if (!skip) await this.mainMove(r, dbl);
    r.t.wolf = r.t.apex6 = false;
    if (!race.over) await this.endTurn(r);
  },

  // Main-move modifiers as [source, amount] pairs.
  mods(r) {
    const race = this.race, m = [], add = (c, n) => { if (n) m.push([c, n]); };
    const has = c => this.has(r, c);
    if (has(A.HARE)) add(A.HARE, 2);
    for (const _ of this.who(A.SLIME, r)) add(A.SLIME, -1);
    if (this.at(r.pos).some(x => this.has(x, A.MENTOR))) add(A.MENTOR, 1);
    if (has(A.AERO)) add(A.AERO, r.t.start < race.track.c2 ? 3 : -1);
    if (has(A.HERALD)) add(A.HERALD, r.t.herald || 0);
    if (this.nulled(r)) add(A.VOID, -1);
    if (has(A.RIDER) && r.f.mount) add(A.RIDER, 2);
    if (has(A.SLOTH)) add(A.SLOTH, -1);
    if (has(A.AERONAUT)) add(A.AERONAUT, 3);
    for (const q of this.who(A.PATRON, r)) if (q.owner !== r.owner && (q.owner + 1) % this.N === r.owner) add(A.PATRON, 2);
    if (has(A.CHASER)) add(A.CHASER, this.others(r).filter(x => x.pos > r.pos).length);
    if (has(A.TEMPEST)) add(A.TEMPEST, this.players[r.owner].pts);
    if (race.mirror) add('T-06', 3);
    return m;
  },

  // Perform a main move of d spaces (after modifiers); Hitchers may ride along.
  async go(r, d, back) {
    const race = this.race, n = back ? -d : d, follow = [];
    for (const h of this.at(r.pos, r)) if (this.has(h, A.HITCH) && await this.yn(h.owner, 'q.hitch', !back, { r: r.id, n })) follow.push(h);
    if (race.scry && d >= 6) { await this.emit('msg', { k: 'log.scry', r: r.id }); await this.elim(r); }
    else await this.move(r, n, { main: true });
    for (const h of follow) { await this.fire(h, A.HITCH, { r2: r.id }); await this.move(h, n); }
  },

  async mainMove(r, dbl) {
    const race = this.race, me = r.owner;
    const has = c => this.has(r, c), gone = () => race.over || !this.on(r);
    const others = this.others(r);
    let v, d, back = false, tripAfter = false;

    // ----- actions instead of rolling -----
    const alt = [{ id: 'roll', k: 'opt.roll' }];
    if (has(A.STRIDER)) alt.push({ id: 'strider', k: 'opt.strider' });
    if (has(A.MOLE) && !others.some(x => Math.abs(x.pos - r.pos) <= 1)) alt.push({ id: 'mole', k: 'opt.mole' });
    if (has(A.SHIFTER) && others.some(x => x.pos !== r.pos)) alt.push({ id: 'shift', k: 'opt.shift' });
    if (has(A.CHEETAH)) alt.push({ id: 'cheat', k: 'opt.cheat' });
    let choice = 'roll';
    if (alt.length > 1) {
      const ids = alt.map(o => o.id), l = this.leaderOther(r);
      const ai = ids.includes('mole') ? 'mole' : ids.includes('cheat') ? 'cheat'
        : ids.includes('shift') && l.pos - r.pos >= 4 ? 'shift' : ids.includes('strider') && this.rng() < 0.6 ? 'strider' : 'roll';
      choice = await this.ask(me, 'q.alt', alt, ai);
    }
    if (choice === 'strider') { await this.fire(r, A.STRIDER); return this.go(r, 5); }
    if (choice === 'mole') { await this.fire(r, A.MOLE); return this.go(r, 6); }
    if (choice === 'shift') {
      const x = await this.pickR(me, 'q.shift', others.filter(x => x.pos !== r.pos), this.leaderOther(r));
      if (x) { await this.fire(r, A.SHIFTER, { r2: x.id }); await this.swap(r, x); }
      return;
    }
    if (choice === 'cheat') {
      const pick = () => String(3 + this.rnd(4));
      const n = +(await this.ask(me, 'q.cheatSet', NUMS, pick()));
      const guesser = (me + this.N - 1) % this.N;
      const g = guesser === me ? 0 : +(await this.ask(guesser, 'q.cheatGuess', NUMS, pick(), { r: r.id }));
      await this.fire(r, A.CHEETAH);
      await this.emit('cheat', { r: r.id, n, g, p: guesser });
      if (g === n) return;
      d = n;
    } else {
      // ----- roll -----
      const guess = has(A.SAGE) ? +(await this.ask(me, 'q.sage', NUMS, String(this.d6()))) : 0;
      if (guess) await this.emit('msg', { k: 'log.sage', r: r.id, n: guess });
      v = await this.rollMain(r);
      if (gone() || !v) return;
      // reactions
      for (const x of this.who(A.VANGUARD, r)) if (v === 6 && x.owner !== me) { await this.fire(x, A.VANGUARD); await this.move(x, 2); }
      for (const x of this.who(A.NEMESIS, r)) if (x.owner !== me) {
        if (await this.rollDie(x, 'nemesis') === v) { await this.fire(x, A.NEMESIS); await this.move(x, v); }
      }
      if (v === 1) { const h = this.who(A.HIJACK, r)[0]; if (h) { await this.fire(h, A.HIJACK); race.hijack = h; } }
      if (v === 3) { const t = this.who(A.TRAP, r)[0]; if (t) { await this.fire(t, A.TRAP, { r2: r.id }); back = true; } }
      if (guess === v) { await this.fire(r, A.SAGE); r.f.extra = true; }
      if (v === 1) {
        const larvas = this.who(A.LARVA, r).filter(x => x.owner !== me);
        for (const l of larvas) { await this.fire(l, A.LARVA, { r2: r.id }); await this.move(l, 1); }
        if (larvas.length) return;
      }
      if (gone()) return;
      // own roll effects
      if (v === 6 && has(A.DRIFTER)) { await this.fire(r, A.DRIFTER); await this.warp(r, 0); await this.award(me, -1, 'drift'); return; }
      if (v === 6 && has(A.AERONAUT)) { await this.fire(r, A.AERONAUT); await this.elim(r); return; }
      if (has(A.APEX)) return this.apex(r, v);
      if (v <= 2 && has(A.BIO) && this.deck.length) { await this.fire(r, A.BIO); await this.gain(r, this.deck.shift()); }
      if (v <= 2 && has(A.WOLF)) r.t.wolf = true;
      d = v;
      if (v <= 2 && has(A.ALCH) && await this.yn(me, 'q.alch', true, { n: v })) { await this.fire(r, A.ALCH); d = 4; }
      if (has(A.DARE)) {
        let prev = v;
        while (await this.yn(me, 'q.dare', prev <= 2, { n: d })) {
          await this.fire(r, A.DARE);
          const nv = await this.rollDie(r, 'dare');
          if (nv <= prev) { await this.emit('msg', { k: 'log.bust', r: r.id }); return; }
          d += nv; prev = nv;
        }
      }
      if (has(A.OVERDRIVE) && await this.yn(me, 'q.over', this.rng() < 0.45, { n: d })) { await this.fire(r, A.OVERDRIVE); d *= 2; tripAfter = true; }
      if (has(A.HOUND)) { if (this.isLast(r)) d *= 3; else back = true; }
      if (dbl) d *= 2;
    }
    if (gone()) return;
    const mods = this.mods(r);
    d = Math.max(0, d + mods.reduce((s, m) => s + m[1], 0));
    if (mods.length || back || d !== v) await this.emit('dist', { r: r.id, n: d, back, mods });
    if (d > 0) await this.go(r, d, back);
    if (tripAfter) await this.trip(r);
  },

  // Main roll including every reroll right (Illusionist, Fortune Dealer, Harsh Critic).
  async rollMain(r) {
    const race = this.race, me = r.owner, asked = new Set();
    let v = await this.roll1(r), illu = 0, fort = false;
    for (let g = 0; g < 8 && v && !race.over && this.on(r); g++) {
      let again = false;
      if (this.has(r, A.ILLU) && illu < 2 && await this.yn(me, 'q.reroll', v <= 3, { n: v })) { illu++; await this.fire(r, A.ILLU); again = true; }
      if (!again && !fort) {
        const dealers = this.who(A.FORTUNE);
        if (dealers.length && await this.yn(me, 'q.reroll', v <= 2, { n: v })) {
          fort = again = true;
          for (const dl of dealers) if (dl.owner !== me) { await this.fire(dl, A.FORTUNE); await this.move(dl, 1); }
        }
      }
      if (!again) for (const c of this.who(A.CRITIC, r)) {
        if (c.owner === me || r.pos <= c.pos || asked.has(c)) continue;
        asked.add(c);
        if (await this.yn(c.owner, 'q.critic', v >= 5, { r: r.id, n: v })) { await this.fire(c, A.CRITIC, { r2: r.id }); again = true; break; }
      }
      if (!again) break;
      v = await this.roll1(r);
    }
    return v;
  },

  // One main roll. Dice Grandmaster rolls six and keeps a number shown at least twice (0 = none).
  async roll1(r) {
    if (!this.has(r, A.DICEGM)) return this.rollDie(r, 'main');
    const dice = [];
    for (let i = 0; i < 6; i++) dice.push(await this.rollDie(r, 'main', true));
    await this.emit('roll', { r: r.id, dice, why: 'main' });
    const ok = [...new Set(dice)].filter(n => dice.filter(x => x === n).length >= 2).sort();
    if (!ok.length) { await this.emit('msg', { k: 'log.gmNone', r: r.id }); return 0; }
    return +(await this.ask(r.owner, 'q.gm', ok.map(n => ({ id: String(n), n })), String(ok.at(-1))));
  },

  async apex(r, v) {
    await this.fire(r, A.APEX, { n: v });
    const l = this.leaderOther(r);
    switch (v) {
      case 1: return this.go(r, 7);
      case 2: {
        const o = this.others(r), min = Math.min(...o.map(x => x.pos));
        for (const x of o.filter(x => x.pos === min && x.pos !== r.pos)) await this.warp(x, r.pos);
        return;
      }
      case 3: {
        const x = await this.pickR(r.owner, 'q.apex3', this.others(r), l);
        if (x) { await this.warp(r, x.pos); await this.trip(x); }
        return;
      }
      case 4: r.f.extra = true; return this.go(r, 4);
      case 5: if (l && l.pos >= r.pos) await this.move(l, -5); return;
      case 6: r.t.apex6 = true; return this.go(r, 6);
    }
  },

  async endTurn(r) {
    const me = r.owner;
    if (this.has(r, A.BLASTER)) {
      const d = await this.rollDie(r, 'blast');
      const hit = this.others(r).filter(x => x.pos > r.pos && x.pos - r.pos <= d && !x.trip);
      if (hit.length) await this.fire(r, A.BLASTER);
      for (const x of hit) await this.trip(x);
    }
    if (this.has(r, A.HOPPER) && (r.f.chain || 0) < 3 && this.at(r.pos + 1).length) { await this.fire(r, A.HOPPER); r.f.extra = true; }
    if (this.has(r, A.SWAPPER)) {
      const c = this.others(r).filter(x => x.owner !== me && Math.abs(x.pos - r.pos) <= 1);
      const x = await this.pickR(me, 'q.swapper', c, c.find(x => x.pos > r.pos) || null, true);
      if (x) {
        await this.fire(r, A.SWAPPER, { r2: x.id });
        [r.owner, x.owner] = [x.owner, r.owner];
        await this.emit('owners', { r: r.id, r2: x.id });
      }
    }
    if (this.on(r) && Math.abs(r.pos - r.t.start) <= 1) {
      for (const p of this.who(A.PROVOC, r)) if (p.owner !== me) { await this.fire(p, A.PROVOC, { r2: r.id }); await this.move(p, 2); }
    }
  },
};
