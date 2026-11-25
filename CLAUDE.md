# Open Door Index

Nonpartisan, evidence-based scorecard of whether Disabled Philadelphians can take part in public meetings of City Council and ten city boards. Static GitHub Pages site: plain HTML/CSS/JS, no build step, no backend. Opening `index.html` straight from disk must keep working.

## Commands
- `npm test`: validates data, sources, dates, README stats, language, and color contrast. Must PASS before any commit.
- `npm run build:data`: rewrites `data/open-door-index.csv` and `.json` from `data/bodies.js`, and writes the findings into `index.html` between `<!-- build:name -->` markers. Run after every data or `js/render.js` edit; `npm test` fails if any of them are stale. Never hand-edit inside the markers.
- `npm run check:links`: checks every source still opens (needs network; runs weekly in Actions with `--archive` to save Internet Archive copies).
- `npm run test:browser`: offline Playwright smoke test, axe-core scan, and no-JavaScript check at 1280px, 390px, and 320px (needs `pip install playwright && python -m playwright install chromium`, plus `npm install --no-save axe-core` for the axe scan). Add `SCREENSHOTS=shots` to save full-page screenshots, then look at them.

## Where things live
- `data/bodies.js`: every finding, source, and the `CHECKED_ISO` date. A plain script that sets `window.ODI`, NOT JSON, because `fetch()` fails on `file://`.
- `js/render.js`: the page's markup as pure functions, used by both the browser and the build. `js/app.js`: controls and animation only. Never put a finding, source, or date in either.
- `CORRECTIONS.md`: add a row for every change to a finding, score, or method.
- `index.html`: markup and CSS. Design tokens are in `:root` at the top. Read `docs/DESIGN.md` before visual changes. Libre Caslon is for large headlines and numbers only; reading text stays in Public Sans. Dark bands carry the `on-dark` class so focus rings turn gold. Text never sits on the brick pattern.

## Rules
- IMPORTANT: Never invent, upgrade, or reword a finding without a source you have actually read. A practice is "met" only when the body's own published materials document it. Partial findings are shown but never counted. Use the `update-finding` skill for any correction.
- The Mayor's Commission on People with Disabilities stays first in list order with its disclosure note. Nico chairs it; it is scored by the same rules.
- Scores are counts ("5 of 9"). No letter grades, rankings language, or "worst/best" framing. Nonpartisan tone: describe what is published, never motives.
- Identity-first language ("Disabled residents"). Official names like "Mayor's Commission on People with Disabilities" stay verbatim. No em dashes in copy.
- Copy that repeats numbers (README "What we found", lede, meta tags, "checked" dates) must match the data. `npm test` checks this.
- Accessibility is a requirement: WCAG 2.2 AA, visible focus, status by text and symbol (never color alone), `role="status"` for messages (no `alert()`), no sideways scrolling at 390px, reduced motion respected.
- No new frameworks, build tools, trackers, or CDNs without asking. GoatCounter (cookie-free) and Google Fonts are the only outside hosts.
- English only for now. Spanish is planned and needs a native-speaker review of "Your rights" before launch.

## Workflow
- Small, targeted edits. Don't regenerate whole files; that silently undoes earlier fixes.
- After UI changes: `npm test`, `SCREENSHOTS=shots npm run test:browser`, look at both widths, then ask the `a11y-reviewer` agent to review the diff.
- Ship through a branch and pull request. A push to `main` goes live on GitHub Pages.
