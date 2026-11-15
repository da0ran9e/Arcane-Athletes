// End-to-end smoke test against a running server: one human client + bots play a whole tournament at max speed.
// Usage: node tools/e2e.mjs [ws://localhost:3000/ws]
import WebSocket from 'ws';
const ws = new WebSocket(process.argv[2] || 'ws://localhost:3000/ws');
const send = m => ws.send(JSON.stringify(m));
let seat = -1, events = 0, prompts = 0, t0 = Date.now();
ws.on('open', () => send({ t: 'create', name: 'Tester' }));
ws.on('message', d => {
  const m = JSON.parse(d);
  if (m.t === 'joined') { seat = m.seat; send({ t: 'opts', opts: { speed: 3, twists: true } }); send({ t: 'bot', add: true }); send({ t: 'bot', add: true }); send({ t: 'bot', add: true }); send({ t: 'start' }); }
  if (m.t === 'err') { console.error('error', m.key); process.exit(1); }
  if (m.t === 'ev') { events++; if (m.s.players.some((p, i) => i !== seat && p.hand) || (m.e.type === 'pick' && m.e.p !== seat && m.e.c)) { console.error('LEAK: another player\'s cards were sent'); process.exit(1); } if (m.e.type === 'raceEnd') console.log('race', m.s.results.length, JSON.stringify(m.s.results.at(-1)), `${Math.round((Date.now() - t0) / 1000)}s, ${events} events so far`); if (m.e.type === 'gameEnd') { console.log(`OK: ${events} events, ${prompts} prompts, ${Math.round((Date.now() - t0) / 1000)}s, points ${m.s.players.map(p => p.pts)}`); process.exit(0); } }
  if (m.t === 'prompt') { prompts++; send({ t: 'answer', id: m.id, v: m.opts[Math.floor(Math.random() * m.opts.length)].id }); }
});
setTimeout(() => { console.error('timeout'); process.exit(1); }, 900000);
