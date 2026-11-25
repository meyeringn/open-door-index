// Writes the downloadable copies of the data and fills the findings into index.html. Run after any edit to data/bodies.js:
//   npm run build:data
import { readFileSync, writeFileSync } from 'node:fs';
import { loadData, rows, toCSV, toJSON, prerender } from './load-data.mjs';

const ODI = loadData();
writeFileSync(new URL('../data/open-door-index.csv', import.meta.url), toCSV(rows(ODI)));
writeFileSync(new URL('../data/open-door-index.json', import.meta.url), toJSON(ODI));
const page = new URL('../index.html', import.meta.url);
writeFileSync(page, prerender(readFileSync(page, 'utf8'), ODI));
console.log(`Wrote index.html, data/open-door-index.csv and .json (${ODI.BODIES.length} bodies, checked ${ODI.CHECKED_ISO}).`);
