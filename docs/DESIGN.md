# Open Door Index design

**Feeling:** a public notice posted on a Philadelphia block. It should read like a trustworthy public record a resident would pin to the fridge, with the city's own materials (brick, white marble, Caslon type) doing the talking. Not a startup landing page, and not a generic dashboard.

**Version 2 (November 2026):** the cool gray "civic sans" page became a block at dusk and a printed broadside. Every finding, source, date, count, and status symbol is unchanged; only the presentation moved.

## The two ideas

1. **A block of rowhouses.** The eleven bodies stand side by side as doorways in one brick facade, under a dentil cornice, on a poured sidewalk. Each door opens wider for every documented practice (partial opens half as far). Each door sits on a white marble stoop until the body documents a step-free meeting room; then the stoop is drawn as a ramp. Every scorecard repeats its own doorway, already open to its score.
2. **A broadside.** Public meetings start with a public notice, and Philadelphia printed the most famous ones (the Declaration's first broadside was set in Caslon here in 1776). Headlines use Libre Caslon Display, section heads sit under a double rule like a printed notice, and the Open Door standard is a framed notice anyone can post.

The drawings never add information that isn't also in text: door links announce the body, its count, and whether step-free access is described.

## Decisions and why

| Choice | Value | Why |
| --- | --- | --- |
| Display type | Libre Caslon Display 400 (h1, h2, big numerals); Libre Caslon Text 700 (h3) | Philadelphia printing history; the face of public notices. Used only at large sizes, where a high-contrast serif stays legible. |
| Text type | Public Sans 400/600/800 | Open-source, highly legible, built for public-sector content. All body text, labels, tables, and controls. Never Inter. |
| Navy "door" | `--door #14324A`, `--door-2 #1E4766` | Front doors, the hero at dusk, buttons, links. |
| Ink | `--ink #13202B` | Text, the top bar, the footer, double rules. |
| Gold "light" | `--light #F6C453`, `--light-2 #FBE3A1` | Light through an open door; accents on dark bands, and the focus ring on dark bands. Never text on a light background. |
| Brick | `--brick #7A2E2A` plus a running-bond pattern (`--bricks`) | Philadelphia rowhouse brick. The facade, card doorways, the footer strip, "Not found", hover states. |
| Marble | `--marble #F7F5F0` | Door trim and the stoop. |
| Wall and paper | `--wall #F4EFE6` page, `--paper #FFFDF8` cards, `--stone #EDE6D8` control panel | Warm newsprint instead of cool gray, so the page reads as paper. |
| Mist | `--mist #D5DEE7` | Secondary text on the navy hero. |
| Sidewalk | `--walk #C9C2B6` plus `--sidewalk` pattern | Concrete under the stoops. Decoration only. |
| Status colors | `--met`, `--partial`, `--notfound`, `--notyet` | Always paired with a word and a distinct symbol (filled check, half fill, empty ring, dashed ring). |
| Focus | `--focus #0B5FFF` on light; `--focus-dark #F6C453` on dark bands (`.on-dark`) | Blue is only 2.6:1 on navy, so dark bands switch to gold (8:1). |

`npm test` checks every token pair the page uses for text (4.5:1) and shapes and focus rings (3:1). Add a pair there whenever you put a color on a new background.

## Rules
- Patterns (brick, dentils, sidewalk) are flat SVG tiles, not gradients. The only gradients are the door leaf, its light, and the partial-status fill.
- No soft drop shadows, glassmorphism, emoji icons, or floating pill badges.
- Square corners (0 to 4px). Cards have a 2px ink top edge, like a notice's top rule.
- Text never sits on brick. Door names and counts sit below the sidewalk, on navy.
- One animation (doors opening), off under reduced motion. Card doorways are drawn already open.
- Forced-colors mode (Windows High Contrast) keeps every door's outline.
- Print drops the drawings, dark bands, and controls: black on white report cards.
- Layouts stay conventional (top nav, single column, tables). Distinctiveness comes from the block, the type, the color, and the voice, not from unusual navigation.

## Family resemblance
Nico's tools each have their own look, but share: a plain-language headline question, an accessibility statement, the cookie-free GoatCounter note, a disclosure where relevant, and the footer line linking back to https://meyeringn.github.io/.
