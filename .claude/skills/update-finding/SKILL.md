---
name: update-finding
description: Apply a tip, correction, or re-check to an Open Door Index finding, or add a new public body. Use whenever a finding's status, text, source, or date changes.
---
# Update a finding

1. **Read the source yourself.** Open the body's own meeting page, agenda, or instructions. A tip, news story, or memory is a lead, not a source. If you can't open it, stop and say so.
2. **Decide the status by the rules in "How the index works":**
   - `met`: the body's own published materials document the practice.
   - `partial`: part of it is documented (shown, never counted).
   - `notfound`: not in the materials reviewed.
   - `notyet`: couldn't be checked yet; say why in the text.
   For agenda timing, use the upload time in a phila.gov `/media/YYYYMMDDHHMMSS/` address and say so in the text.
3. **Edit `data/bodies.js` only.** Add a source to `SOURCES` as `key: ["Title", "https://..."]` if it's new. Set `d: "YYYY-MM-DD"` on the finding to the date you checked it. If the whole index was re-checked, change `CHECKED_ISO` instead.
4. **Write the finding plainly:** one or two sentences, what is published, no motives, identity-first language, no em dashes.
5. **Rebuild and check:** `npm run build:data && npm test`. If the "What we found" numbers changed, update the README bullets the validator names. Then `npm run test:browser`.
6. **For a new body:** add it to `BODIES` with all nine practices, an `about` line, and sources. Update the lede, meta description, and share description counts (the validator tells you which strings).
7. **Commit** on a branch with a message naming the body, practice, old and new status, and the source, e.g. `Art Commission captions: notfound -> met (agenda, Dec 9, 2026)`.
