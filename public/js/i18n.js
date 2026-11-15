// Language files live in /locales: <lang>.json (UI strings) and <lang>.cards.json (cards, twists, tracks).
// To add a language: copy the two en files, translate, and add the code here.
export const LANGS = { en: 'English', vi: 'Tiếng Việt' };
const FALLBACK = 'en';
const data = {};
let cur = FALLBACK;

async function load(l) {
  if (!data[l]) {
    const [ui, cards] = await Promise.all([`locales/${l}.json`, `locales/${l}.cards.json`].map(u => fetch(u).then(r => r.json())));
    data[l] = { ui, ...cards };
  }
  return data[l];
}
export async function setLang(l) {
  if (!LANGS[l]) l = FALLBACK;
  await Promise.all([load(FALLBACK), load(l)]);
  cur = l;
  try { localStorage.setItem('agp.lang', l); } catch {}
  document.documentElement.lang = l;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}
export function initialLang() {
  let l = null;
  try { l = localStorage.getItem('agp.lang'); } catch {}
  return l || (navigator.language || '').slice(0, 2);
}
export const lang = () => cur;
// Translate a UI key, filling {param} placeholders.
export function t(key, p) {
  const s = data[cur]?.ui[key] ?? data[FALLBACK]?.ui[key] ?? key;
  return p ? s.replace(/\{(\w+)\}/g, (m, k) => p[k] ?? '') : s;
}
// Text of a runner card (R-xx / E-xx) or twist card (T-xx): { name, cat, desc }.
export function card(code) {
  const sec = code[0] === 'T' ? 'twists' : 'cards';
  return data[cur]?.[sec]?.[code] ?? data[FALLBACK]?.[sec]?.[code] ?? { name: code, cat: '', desc: '' };
}
export const track = id => data[cur]?.tracks?.[id] ?? data[FALLBACK]?.tracks?.[id] ?? { name: id, desc: '' };
