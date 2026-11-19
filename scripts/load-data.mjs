// Loads data/bodies.js (a browser script that sets window.ODI) inside Node.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function loadData(root = new URL('..', import.meta.url)) {
  const code = readFileSync(new URL('data/bodies.js', root), 'utf8');
  const ctx = { window: {} };
  vm.runInNewContext(code, ctx, { filename: 'data/bodies.js' });
  return ctx.window.ODI;
}

// One row per body and practice. The CSV and JSON downloads are both built from this.
export function rows(ODI) {
  const { CHECKED_ISO, PRACTICES, LABEL, SOURCES, BODIES } = ODI;
  const out = [];
  for (const b of BODIES) for (const p of PRACTICES) {
    const f = b.p[p.id];
    out.push({
      body_id: b.id, body: b.name, practice_id: p.id, practice: p.name,
      status: LABEL[f.s], finding: f.t,
      sources: f.src.map(k => SOURCES[k][1]).join(' '),
      checked: f.d || CHECKED_ISO,
    });
  }
  return out;
}

export function toCSV(list) {
  const cols = Object.keys(list[0]);
  const cell = c => `"${String(c).replace(/"/g, '""')}"`;
  return [cols.map(cell).join(','), ...list.map(r => cols.map(c => cell(r[c])).join(','))].join('\n') + '\n';
}

export function toJSON(ODI) {
  const { CHECKED_ISO, PRACTICES, BODIES, SOURCES, LABEL } = ODI;
  return JSON.stringify({
    name: 'Open Door Index',
    url: 'https://meyeringn.github.io/open-door-index/',
    license: 'MIT',
    checked: CHECKED_ISO,
    statuses: LABEL,
    practices: PRACTICES,
    sources: Object.fromEntries(Object.entries(SOURCES).map(([k, [title, url]]) => [k, { title, url }])),
    bodies: BODIES.map(b => ({
      id: b.id, name: b.name, about: b.about, ...(b.note ? { note: b.note } : {}),
      findings: Object.fromEntries(PRACTICES.map(p => {
        const f = b.p[p.id];
        return [p.id, { status: f.s, finding: f.t, sources: f.src, checked: f.d || CHECKED_ISO }];
      })),
    })),
  }, null, 2) + '\n';
}
