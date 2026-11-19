// Open Door Index validator. Run with `npm test` (or `node tests/validate.mjs`).
// No dependencies. Exits 1 if any check fails, so CI and Claude can both rely on it.
import { readFileSync } from 'node:fs';
import { loadData, rows, toCSV, toJSON } from '../scripts/load-data.mjs';

const root = new URL('..', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const fails = [];
const fail = msg => fails.push(msg);
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) fail(msg); };

const ODI = loadData();
const { CHECKED_ISO, PRACTICES, LABEL, SOURCES, BODIES } = ODI;
const html = read('index.html');
const readme = read('README.md');
const a11y = read('ACCESSIBILITY.md');
const app = read('js/app.js');
const dataSrc = read('data/bodies.js');

// ---------- 1. Data shape ----------
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);
check(ISO.test(CHECKED_ISO), `CHECKED_ISO "${CHECKED_ISO}" is not YYYY-MM-DD`);
check(CHECKED_ISO <= today, `CHECKED_ISO ${CHECKED_ISO} is in the future`);
check(PRACTICES.length === 9, `Expected 9 practices, found ${PRACTICES.length}. The whole site says "of 9".`);
check(new Set(PRACTICES.map(p => p.id)).size === PRACTICES.length, 'Practice ids are not unique');
check(new Set(BODIES.map(b => b.id)).size === BODIES.length, 'Body ids are not unique');

for (const [k, v] of Object.entries(SOURCES)) {
  check(Array.isArray(v) && v.length === 2 && v[0].trim(), `Source "${k}" must be [title, url]`);
  check(/^https:\/\//.test(v[1]), `Source "${k}" must use an https URL: ${v[1]}`);
}

for (const b of BODIES) {
  check(b.name && b.about, `Body "${b.id}" needs a name and an about line`);
  const keys = Object.keys(b.p);
  for (const p of PRACTICES) check(keys.includes(p.id), `${b.id}: missing finding for "${p.id}"`);
  for (const k of keys) check(PRACTICES.some(p => p.id === k), `${b.id}: unknown practice "${k}"`);
  for (const [k, f] of Object.entries(b.p)) {
    const where = `${b.id}.${k}`;
    check(f.s in LABEL, `${where}: unknown status "${f.s}"`);
    check(typeof f.t === 'string' && f.t.trim().length > 0, `${where}: every finding needs text`);
    check(Array.isArray(f.src) && f.src.length > 0, `${where}: every finding needs at least one source`);
    for (const s of f.src || []) check(s in SOURCES, `${where}: source "${s}" is not in SOURCES`);
    if (f.d !== undefined) {
      check(ISO.test(f.d), `${where}: date "${f.d}" is not YYYY-MM-DD`);
      check(f.d <= today, `${where}: date ${f.d} is in the future`);
    }
  }
}

// ---------- 2. Downloads match the data ----------
if (fails.length === 0) { // only meaningful once the data itself is sound
  check(read('data/open-door-index.csv') === toCSV(rows(ODI)), 'data/open-door-index.csv is out of date. Run `npm run build:data`.');
  check(read('data/open-door-index.json') === toJSON(ODI), 'data/open-door-index.json is out of date. Run `npm run build:data`.');
}

// ---------- 3. Copy that repeats the data stays in sync ----------
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const [cy, cm, cd] = CHECKED_ISO.split('-').map(Number);
const longDate = `${MONTHS[cm - 1]} ${cd}, ${cy}`;
const monthYear = `${MONTHS[cm - 1]} ${cy}`;
const n = BODIES.length;
const met = id => BODIES.filter(b => b.p[id].s === 'met').length;

// README "What we found" bullets
const word = k => WORDS[k] ?? String(k);
const cap = s => s[0].toUpperCase() + s.slice(1);
check(readme.includes(`## What we found (${monthYear})`), `README "What we found" heading should say (${monthYear})`);
check(readme.includes(`**Data last verified:** ${monthYear}`), `README "Data last verified" should say ${monthYear}`);
const rm = readme.match(/^- (\w+) bod(?:y|ies) documents? live captioning\./m);
check(rm && rm[1].toLowerCase() === word(met('captions')), `README captions stat should start "${cap(word(met('captions')))}"`);
const ra = readme.match(/^- (\w+) bod(?:y|ies)[^\n]*how to get an ASL interpreter\./m);
check(ra && ra[1].toLowerCase() === word(met('asl')), `README ASL stat should start "${cap(word(met('asl')))}"`);
const rv = readme.match(/^- (\w+) bod(?:y|ies) describes? whether its meeting room/m);
check(rv && rv[1].toLowerCase() === word(met('venue')), `README venue stat should start "${cap(word(met('venue')))}"`);
const rr = readme.match(/^- (\w+) bod(?:y|ies) lets? residents speak live from home\./m);
check(rr && rr[1].toLowerCase() === word(met('remote')), `README remote stat should start "${cap(word(met('remote')))}"`);

// Every "checked <date>" written into the page or footer matches CHECKED_ISO
for (const m of html.matchAll(/[Cc]hecked (\w+ \d{1,2}, \d{4})/g)) check(m[1] === longDate, `index.html says "checked ${m[1]}" but CHECKED_ISO is ${longDate}`);
check(html.includes(`Data last verified: ${monthYear}`), `Footer should say "Data last verified: ${monthYear}"`);
check(new RegExp(`City Council and ${word(n - 1)} city boards`, 'i').test(html), `Lede should say "City Council and ${word(n - 1)} city boards"`);
check(html.includes(`${n - 1} city boards and commissions`), `Meta description should say "${n - 1} city boards and commissions"`);
check(html.includes(`${cap(word(n))} Philadelphia public bodies`), `Share description should say "${cap(word(n))} Philadelphia public bodies"`);
check(!/const (BODIES|SOURCES|PRACTICES)\s*=/.test(html + app), 'Findings data must live only in data/bodies.js');

// ---------- 4. Language ----------
const OFFICIAL = /(Mayor's )?(Commission|Office) (on|for) People with Disabilities/g;
const copy = { 'index.html': html, 'data/bodies.js': dataSrc, 'js/app.js': app, 'README.md': readme, 'ACCESSIBILITY.md': a11y };
for (const [file, text] of Object.entries(copy)) {
  const t = text.replace(OFFICIAL, '');
  for (const bad of [/people with disabilit/i, /persons? with (a )?disabilit/i, /handicapped/i, /wheelchair[- ]bound/i, /confined to a wheelchair/i, /suffers? from/i, /special needs/i, /differently[- ]abled/i])
    check(!bad.test(t), `${file}: use identity-first language (found ${bad}). Official names are allowed.`);
  check(!text.includes('—'), `${file}: avoid em dashes in copy`);
}

// ---------- 5. Design tokens: contrast and AI-default tells ----------
const tokens = Object.fromEntries([...html.match(/:root\{([^}]*)\}/)[1].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const T = k => tokens[k] || k;
// [foreground, background, minimum, what it is]
const pairs = [
  ['ink', 'wall', 4.5, 'body text'], ['ink-soft', 'wall', 4.5, 'secondary text'], ['ink-soft', 'paper', 4.5, 'card text'],
  ['door-2', 'wall', 4.5, 'links'], ['door-2', 'paper', 4.5, 'links on cards'], ['brick', 'paper', 4.5, 'link hover'],
  ['met', 'paper', 4.5, 'Met label'], ['partial', 'paper', 4.5, 'Partial label'], ['notfound', 'paper', 4.5, 'Not found label'], ['notyet', 'paper', 4.5, 'Not yet audited label'],
  ['#FFFFFF', 'door', 4.5, 'button text'], ['light', 'door', 4.5, 'brand and labels on navy'], ['light', 'ink', 4.5, 'footer links'],
  ['ink', 'light-2', 4.5, 'note text'], ['ink', 'light', 4.5, 'copy button text'], ['ink-soft', 'light-2', 4.5, 'secondary text on notes'],
  ['focus', 'wall', 3, 'focus ring'], ['focus', 'paper', 3, 'focus ring on cards'], ['door', 'wall', 3, 'door outline'], ['door', 'paper', 3, 'control borders'],
];
for (const [fg, bg, min, what] of pairs) {
  const r = ratio(T(fg), T(bg));
  check(r >= min, `Contrast ${fg} on ${bg} (${what}) is ${r.toFixed(2)}:1, needs ${min}:1`);
}
check(!/font-family[^;]*\bInter\b|family=Inter/.test(html), 'Do not use Inter (it reads as an AI default)');

// ---------- Report ----------
if (fails.length) {
  console.log(`FAIL  ${fails.length} of ${checks} checks failed:\n`);
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`PASS  ${checks} checks: ${n} bodies, ${PRACTICES.length} practices, ${Object.keys(SOURCES).length} sources, checked ${CHECKED_ISO}.`);
