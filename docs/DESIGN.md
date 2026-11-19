# Open Door Index design

**Feeling:** civic, sturdy, Philadelphia. It should read like a trustworthy public record that a resident would want to pin to a fridge, not a startup landing page.

## Decisions and why

| Choice | Value | Why |
| --- | --- | --- |
| Type | Public Sans 400/600/800 | Open-source, highly legible, built for public-sector content. One family, three weights. Never Inter (it reads as an AI default). |
| Navy "door" | `--door #14324A`, `--door-2 #1E4766` | Front doors, structure, buttons, links. |
| Gold "light" | `--light #F6C453`, `--light-2 #FBE3A1` | Light coming through an open door. Shapes and backgrounds only; never text on a light background. |
| Brick | `--brick #7A2E2A` | Philadelphia rowhouse brick. Hover states and "Not found". |
| Wall | `--wall #EEF1F4` | Page background. Cards are white (`--paper`). |
| Marble | `#F7F5F0` with navy outline | The white marble stoop under every door. |
| Status colors | `--met`, `--partial`, `--notfound`, `--notyet` | Always paired with a word and a distinct symbol (filled check, half fill, empty ring, dashed ring). |

## Signature elements
- **A block of doors.** On wide screens, all eleven bodies stand in one row like a Philadelphia block. Each door opens wider for every documented practice (partial opens half as far).
- **The stoop becomes a ramp.** Each door sits on a marble step until the body documents a step-free meeting room; then the step is drawn as a ramp. The drawing repeats the "venue" finding; it never adds information that isn't also in text.
- **The Open Door standard** sits in a navy panel, so the fix stands apart from the findings.

## Rules
- No gradients except the door leaf and its light. No soft drop shadows, glassmorphism, emoji icons, or floating pill badges.
- Square-ish corners (2 to 6px). Cards have a navy top edge, like a door header.
- Body text 4.5:1 or better; shapes and focus rings 3:1 or better. `npm test` checks the token pairs.
- One animation (doors opening), off under reduced motion.
- Layouts stay conventional (top nav, single column, tables). Distinctiveness comes from the doors, color, and voice, not from unusual navigation.

## Family resemblance
Nico's tools each have their own look, but share: a plain-language headline question, an accessibility statement, the cookie-free GoatCounter note, a disclosure where relevant, and the footer line linking back to https://meyeringn.github.io/.
