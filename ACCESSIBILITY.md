# Accessibility Statement: Open Door Index

I'm a Disabled civic technologist, and I build Open Door Index with Disabled people as the primary user, not an afterthought. This page says what has been tested, what I know still needs work, and how to tell me about a barrier.

**Live tool:** https://meyeringn.github.io/open-door-index/

## Target

Open Door Index aims to meet the **Web Content Accessibility Guidelines (WCAG) 2.2, Level AA**.

## How it's tested

- **Automated:** scanned with axe-core against WCAG 2.1 A and AA rules before launch, with zero issues, and weekly from then on. [See the latest results](https://github.com/meyeringn/meyeringn.github.io/actions/workflows/accessibility-check.yml).
- **Reduced motion:** the tool's single animation turns off when your device asks for reduced motion.
- **Built in:** Public Sans typeface, a high-contrast palette, status shown by words and symbols, never color alone, and printable report cards.
- **Manual review:** not yet completed. Planned: keyboard-only use, NVDA and VoiceOver screen readers, and 200% zoom on a phone-width screen.

Automated tools catch only some barriers. Until the manual review is done, please treat this tool as tested by machine, not yet by people.

## Known issues

| Issue | Who it affects | Workaround | Status |
| --- | --- | --- | --- |
| The door illustrations are visual only. | Blind and low vision users | Each door is a link announcing the body's name and score, and every score also appears as text. | By design |
| The comparison table is wide. | Screen magnifier and phone users | It scrolls sideways inside its frame; each body's own scorecard shows the same findings in a single column. | By design |
| The tip form opens your own email app rather than sending directly. | People without a mail app set up | Email meyeringn@gmail.com directly, or open a GitHub issue. | By design: no data is collected by the site |

## Report a barrier

If something in Open Door Index doesn't work for you, I want to know.

- [Open an issue](https://github.com/meyeringn/open-door-index/issues/new?title=Accessibility%20barrier) (requires a free GitHub account), or
- Email meyeringn@gmail.com with "Accessibility" in the subject line.

Please describe what you were trying to do, what happened, and what device, browser, or assistive technology you use. I aim to reply within 5 business days.

**Last updated:** November 2026
