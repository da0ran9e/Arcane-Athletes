// Fuzz test: full tournaments with random players/options/answers must always finish cleanly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, GOLD } from '../shared/engine.js';
import { CARDS } from '../shared/cards.js';
import { TRACKS, trackPoints, reverseTrack } from '../shared/tracks.js';
import { loadTracks } from '../server/tracks.js';
const FILE_TRACKS = loadTracks();

function rng32(seed) { // mulberry32
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

async function play(seed, force) {
  const rng = rng32(seed), N = 3 + Math.floor(rng() * 4);
  const opts = { twists: rng() < 0.6, double: N === 3 && rng() < 0.4, sets: ['all', 'all', 'base', 'exp'][Math.floor(rng() * 4)], ...force };
  const seen = new Set(), stats = { events: 0, asks: 0 };
  const io = {
    emit: async (e, s) => { stats.events++; if (e.type === 'move') assert.notEqual(e.from, e.to); seen.add(e.type); JSON.stringify(s); if (e.type === 'abil') seen.add(e.c); },
    ask: async (p, q) => { stats.asks++; assert.ok(q.opts.some(o => o.id === q.ai), `ai option valid for ${q.key}`); return rng() < 0.5 ? q.ai : q.opts[Math.floor(rng() * q.opts.length)].id; },
  };
  const g = new Game({ players: Array.from({ length: N }, (_, i) => ({ name: 'P' + i })), opts, io, rng, tracks: seed % 3 ? FILE_TRACKS : TRACKS });
  await g.run();
  assert.equal(g.phase, 'end');
  assert.equal(g.results.length, 4);
  assert.ok(g.champs.length >= 1);
  for (const p of g.players) { assert.ok(p.pts >= 0); assert.equal(p.hand.length, 0); assert.equal(p.used.length, 4 * g.per); }
  return { seen, stats, g };
}

test('tracks are well formed', () => {
  for (const t of [...TRACKS, ...FILE_TRACKS]) {
    const pts = trackPoints(t);
    assert.equal(pts.length, t.L + 1);
    for (const [i, s] of Object.entries(t.sp)) if (typeof s === 'number') assert.ok(+i + s > 0 && +i + s < t.L);
    assert.deepEqual(reverseTrack(reverseTrack(t)).sp, t.sp);
  }
  assert.equal(GOLD.length, 4);
});

test('600 random tournaments finish', async () => {
  const fired = new Set(); let events = 0;
  for (let seed = 1; seed <= 600; seed++) {
    let res;
    try { res = await Promise.race([play(seed), new Promise((_, rej) => setTimeout(() => rej(new Error('hang')), 5000))]); }
    catch (e) { e.message = `seed ${seed}: ${e.message}`; throw e; }
    res.seen.forEach(x => fired.add(x)); events += res.stats.events;
  }
  // Abilities that never announce themselves via fire() (pure modifiers / setup flags).
  const silent = ['R-02', 'E-11', 'R-14', 'R-03', 'R-25', 'R-06', 'E-02', 'E-05', 'E-06', 'E-15', 'E-19', 'E-28', 'E-33', 'E-03'];
  const missing = CARDS.map(c => c.code).filter(c => !fired.has(c) && !silent.includes(c));
  console.log(`avg events/game ${Math.round(events / 600)}; abilities never fired: ${missing.join(' ') || 'none'}`);
  assert.deepEqual(missing, []);
});

test('a deadlocked race is stopped by the stall rule', async () => {
  // spaces 1..12 all send the runner back to Start: almost nobody can ever get anywhere
  const loop = { id: 'plains', L: 30, c1: 10, c2: 20, sp: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, -(i + 1)])) };
  let stalls = 0, worst = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const rng = rng32(seed);
    let turns = 0;
    const io = {
      emit: async e => { if (e.type === 'turn') turns++; if (e.type === 'raceIntro') turns = 0; if (e.type === 'raceEnd') worst = Math.max(worst, turns); if (e.k === 'log.stall') stalls++; },
      ask: async (p, q) => q.ai,
    };
    const g = new Game({ players: [0, 1, 2, 3].map(i => ({ name: 'P' + i })), io, rng, tracks: [loop, loop, loop, loop] });
    await g.run();
    assert.equal(g.results.length, 4);
  }
  assert.ok(stalls > 40, `stall rule fired ${stalls} times`);
  assert.ok(worst < 300, `longest race took ${worst} turns`);
});
