// Phase music streamed from /assets/audio when present, plus tiny synthesized sound effects.
// Edit MUSIC to remap tracks (file base names from the master spec; .ogg/.mp3 preferred over .wav).
const MUSIC = {
  home: 'b72fe54926cb', draft: 'ea20e830418a', pick: '52e4fee42b7d', race0: 'ec306252ee5f', race1: 'f99fca88af73',
  race2: 'a91a1fd56436', race3: '59db7703c5a3', raceEnd: '4d807db012f3', end: '4836b4f7a3a8',
};
const el = new Audio();
el.loop = true; el.volume = 0.35;
let pick = () => null, url = f => 'assets/' + f, on = true, want = null, ctx = null;
try { on = localStorage.getItem('agp.sound') !== '0'; } catch {}

export function initAudio(pickAsset, assetUrl) { pick = pickAsset; url = assetUrl; }
export const soundOn = () => on;
export function toggleSound() {
  on = !on;
  try { localStorage.setItem('agp.sound', on ? '1' : '0'); } catch {}
  music(want);
  return on;
}
export function music(key) {
  want = key;
  const file = MUSIC[key] && pick('audio/' + MUSIC[key], ['.ogg', '.mp3'], ['.wav']);
  if (!on || !file) { el.pause(); return; }
  const src = url(file);
  if (!el.src.endsWith(src)) el.src = src;
  el.play().catch(() => {}); // blocked until the first user gesture; retried on next call
}
document.addEventListener('pointerdown', () => { if (on && want && el.paused) music(want); });

const SFX = { // [frequency Hz, start s, duration s, wave]
  roll: [[220, 0, .05, 'square'], [330, .07, .05, 'square'], [262, .14, .05, 'square'], [392, .21, .08, 'square']],
  step: [[520, 0, .06, 'triangle']], warp: [[300, 0, .12, 'sine'], [900, .1, .2, 'sine']],
  trip: [[200, 0, .12, 'sawtooth'], [120, .1, .2, 'sawtooth']], pts: [[880, 0, .08, 'sine'], [1320, .08, .15, 'sine']],
  abil: [[660, 0, .1, 'triangle'], [990, .09, .14, 'triangle']], elim: [[300, 0, .15, 'sawtooth'], [180, .14, .15, 'sawtooth'], [90, .28, .3, 'sawtooth']],
  finish: [[523, 0, .12, 'square'], [659, .12, .12, 'square'], [784, .24, .12, 'square'], [1047, .36, .3, 'square']],
  twist: [[196, 0, .3, 'sawtooth'], [233, .15, .3, 'sawtooth'], [277, .3, .5, 'sawtooth']], prompt: [[740, 0, .08, 'sine'], [740, .14, .08, 'sine']],
};
export function sfx(name) {
  const notes = SFX[name];
  if (!on || !notes) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    for (const [f, at, dur, type] of notes) {
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + at;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.07, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur);
    }
  } catch {}
}
