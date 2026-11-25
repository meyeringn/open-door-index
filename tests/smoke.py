"""Browser smoke test for Open Door Index. Opens index.html from disk, offline.

Setup once:  pip install playwright && python -m playwright install chromium
Run:         npm run test:browser      (or: python3 tests/smoke.py)
Screenshots: SCREENSHOTS=shots npm run test:browser   (1280px, 390px, and 320px, full page)
Axe:         npm install --no-save axe-core   (once), then the same command also runs axe-core
             against WCAG 2.0, 2.1, and 2.2 A and AA rules. In CI (CI=true) axe is required.
"""
import os, pathlib, re, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
SHOTS = os.environ.get("SCREENSHOTS")
AXE = ROOT / "node_modules" / "axe-core" / "axe.min.js"
AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
problems = []
if not AXE.exists():
    if os.environ.get("CI"):
        problems.append("axe-core is missing: run `npm install --no-save axe-core` before the browser test")
    else:
        print("note: axe-core not installed, skipping the axe scan (npm install --no-save axe-core)")

def expect(ok, msg):
    if not ok:
        problems.append(msg)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (1280, 390, 320):
        page = browser.new_page(viewport={"width": width, "height": 900}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        # Offline on purpose: fonts and GoatCounter are outside the page's control.
        page.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file:") else r.abort())
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(300)
        errors = [e for e in errors if "ERR_FAILED" not in e and "net::" not in e]
        expect(not errors, f"{width}px: page errors {errors}")

        n = page.evaluate("window.ODI.BODIES.length")
        expect(page.locator("#doors li").count() == n, f"{width}px: expected {n} doors")
        expect(page.locator("#bodies article.body").count() == n, f"{width}px: expected {n} scorecards")
        expect(page.locator("#compareTable tbody tr").count() == n, f"{width}px: expected {n} compare rows")
        name = page.locator("#doors a").first.inner_text()
        expect("practices met" in name, f"{width}px: door link text should include 'practices met', got {name!r}")
        expect(page.locator("#bodies[aria-live]").count() == 0, "The scorecard list must not be a live region")

        # Sorting and filtering announce a short summary.
        page.select_option("#sort", "az")
        expect("sorted from A to Z" in page.inner_text("#sortMsg"), "Sort should update the status message")
        page.select_option("#filter", "asl")
        rows = page.locator("#bodies table.practices tbody tr").count()
        expect(rows == n, f"Filter to one practice should leave {n} rows, found {rows}")
        page.select_option("#filter", "")
        page.select_option("#sort", "list")

        # Keyboard: first Tab lands on the skip link.
        page.keyboard.press("Tab")
        expect(page.evaluate("document.activeElement.className") == "skip", "First Tab should focus the skip link")

        # Door names never break in the middle of a word.
        split = page.evaluate("""[...document.querySelectorAll('#doors .door-name')].flatMap(el => {
          const t = el.firstChild, out = [];
          for (const m of t.textContent.matchAll(/\\S+/g)) {
            const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
            const lines = new Set([...r.getClientRects()].map(x => Math.round(x.top)));
            if (lines.size > 1) out.push(m[0]);
          }
          return out; })""")
        expect(not split, f"{width}px: door names break mid-word: {split}")

        # Nothing wider than the screen (except the compare table, which scrolls in its own frame).
        over = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        expect(over <= 1, f"{width}px: page scrolls sideways by {over}px")

        # Drawings stay out of the accessibility tree; the text says the same thing.
        visible_art = page.evaluate("[...document.querySelectorAll('.house,.doorway')].filter(e => e.getAttribute('aria-hidden') !== 'true').length")
        expect(visible_art == 0, f"{width}px: {visible_art} door drawings are not aria-hidden")

        # A shared link to one body opens its findings and lands on its card.
        page.goto(URL + "#body-council", wait_until="load")
        page.wait_for_timeout(300)
        expect(page.evaluate("document.querySelector('#body-council details').open"), f"{width}px: #body-council should open that body's findings")
        top = page.evaluate("document.getElementById('body-council').getBoundingClientRect().top")
        expect(-5 <= top < 200, f"{width}px: #body-council should scroll to the card on load (top at {top:.0f}px)")
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(200)

        # Automated WCAG scan. Machines catch only some barriers; people still need to test.
        if AXE.exists():
            page.add_script_tag(path=str(AXE))
            result = page.evaluate("tags => axe.run(document, {runOnly: {type: 'tag', values: tags}})", AXE_TAGS)
            for v in result["violations"]:
                where = "; ".join(n["target"][0] if isinstance(n["target"][0], str) else str(n["target"][0]) for n in v["nodes"][:3])
                problems.append(f"{width}px axe {v['id']} ({v['impact']}): {v['help']} at {where}")

        if SHOTS:
            pathlib.Path(SHOTS).mkdir(parents=True, exist_ok=True)
            page.screenshot(path=f"{SHOTS}/open-door-{width}.png", full_page=True)
        page.close()

    # Without JavaScript every finding is still in the page, and controls that need it are hidden.
    ctx = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 900})
    page = ctx.new_page()
    page.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file:") else r.abort())
    page.goto(URL, wait_until="load")
    n = len(re.findall(r'<article class="body"', (ROOT / "index.html").read_text()))
    expect(n > 0 and page.locator("#bodies article.body").count() == n, f"No JavaScript: expected {n} scorecards in the page")
    expect(page.locator("#compareTable tbody tr").count() == n, "No JavaScript: the compare table should be in the page")
    expect(page.locator("#sourceList li").count() > 0, "No JavaScript: the source list should be in the page")
    expect(not page.locator("#tipForm").is_visible(), "No JavaScript: the tip form should be hidden")
    expect(not page.locator("#sort").is_visible(), "No JavaScript: the sort control should be hidden")
    ctx.close()
    browser.close()

if problems:
    print("FAIL\n" + "\n".join(f"  - {m}" for m in problems))
    sys.exit(1)
print("PASS  browser smoke test at 1280px, 390px, and 320px")
