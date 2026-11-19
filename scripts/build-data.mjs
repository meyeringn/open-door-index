// Writes the downloadable copies of the data. Run after any edit to data/bodies.js:
//   npm run build:data
import { writeFileSync } from 'node:fs';
import { loadData, rows, toCSV, toJSON } from './load-data.mjs';

const ODI = loadData();
writeFileSync(new URL('../data/open-door-index.csv', import.meta.url), toCSV(rows(ODI)));
writeFileSync(new URL('../data/open-door-index.json', import.meta.url), toJSON(ODI));
console.log(`Wrote data/open-door-index.csv and .json (${ODI.BODIES.length} bodies, checked ${ODI.CHECKED_ISO}).`);
