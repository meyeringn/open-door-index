// Checks that every source and outside link on the site still opens.
//   npm run check:links             check only
//   npm run check:links -- --archive  also ask the Internet Archive to save a fresh copy of each source
// Runs weekly in GitHub Actions (.github/workflows/links.yml). A broken source fails the run,
// and GitHub emails the repo owner. No dependencies; needs Node 18 or newer for fetch.
import { existsSync, readFileSync } from 'node:fs';
import { loadData } from './load-data.mjs';

const ARCHIVE = process.argv.includes('--archive');
const { SOURCES } = loadData();
const missing = [];
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Every source, plus every https link written by hand in index.html (not archive links, not the analytics host).
const links = new Map(Object.entries(SOURCES).map(([k, [title, url]]) => [url, `source "${k}": ${title}`]));
for (const [, url] of html.matchAll(/href="(https:\/\/[^"]+)"/g)) {
  if (/web\.archive\.org|fonts\.(googleapis|gstatic)\.com|creativecommons\.org/.test(url)) continue;
  // Links to this repo's own files are checked on disk, so a new file in a pull request isn't "broken" before it merges.
  const own = url.match(/^https:\/\/github\.com\/meyeringn\/open-door-index\/blob\/main\/(.+)$/);
  if (own) { if (!existsSync(new URL(`../${own[1]}`, import.meta.url))) missing.push(`${own[1]} (linked from index.html)`); continue; }
  if (!links.has(url)) links.set(url, 'link in index.html');
}

const UA = 'Mozilla/5.0 (compatible; OpenDoorIndexLinkCheck/1.0; +https://github.com/meyeringn/open-door-index)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function status(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (res.ok || method === 'GET') return res.status;
    } catch (e) {
      if (method === 'GET') return `error: ${e.cause?.code || e.name}`;
    }
  }
}

const broken = [...missing], blocked = [];
for (const [url, what] of links) {
  let s = await status(url);
  if (typeof s !== 'number' || s >= 500) { await sleep(5000); s = await status(url); } // one retry for flaky servers
  const line = `${s}  ${url}  (${what})`;
  if (s === 401 || s === 403 || s === 429) blocked.push(line);       // the site turned away a robot; a person can usually still open it
  else if (typeof s !== 'number' || s >= 400) broken.push(line);
  console.log(line);
}

if (ARCHIVE) {
  console.log('\nAsking the Internet Archive to save each source:');
  for (const url of Object.values(SOURCES).map(v => v[1])) {
    try {
      const res = await fetch(`https://web.archive.org/save/${url}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
      console.log(`${res.status}  ${url}`);
    } catch (e) { console.log(`error  ${url}  (${e.name})`); }
    await sleep(15000); // the Archive asks anonymous savers to go slowly
  }
}

if (blocked.length) console.log(`\nWARN  ${blocked.length} link(s) refused the checker (check them by hand):\n  ${blocked.join('\n  ')}`);
if (broken.length) {
  console.log(`\nFAIL  ${broken.length} broken link(s). Find the new page, re-check the finding, and use the update-finding skill:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`\nPASS  ${links.size} links open.`);
