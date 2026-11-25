"""Browser smoke test for Open Door Index. Opens index.html from disk, offline.

Setup once:  pip install playwright && python -m playwright install chromium
Run:         npm run test:browser      (or: python3 tests/smoke.py)
Screenshots: SCREENSHOTS=shots npm run test:browser   (1280px and 390px, full page)
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
SHOTS = os.environ.get("SCREENSHOTS")
problems = []

def expect(ok, msg):
    if not ok:
        problems.append(msg)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (1280, 390):
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
        page.select_option("#sort", "most")
        expect("sorted by most practices met" in page.inner_text("#sortMsg"), "Sort should update the status message")
        page.select_option("#filter", "asl")
        rows = page.locator("#bodies table.practices tbody tr").count()
        expect(rows == n, f"Filter to one practice should leave {n} rows, found {rows}")
        page.select_option("#filter", "")
        page.select_option("#sort", "list")

        # Keyboard: first Tab lands on the skip link.
        page.keyboard.press("Tab")
        expect(page.evaluate("document.activeElement.className") == "skip", "First Tab should focus the skip link")

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

        if SHOTS:
            pathlib.Path(SHOTS).mkdir(parents=True, exist_ok=True)
            page.screenshot(path=f"{SHOTS}/open-door-{width}.png", full_page=True)
        page.close()
    browser.close()

if problems:
    print("FAIL\n" + "\n".join(f"  - {m}" for m in problems))
    sys.exit(1)
print("PASS  browser smoke test at 1280px and 390px")
