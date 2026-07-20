---
title: "Accessibility Is the Baseline"
description: "The a11y pass I ran on this ornamental site, turned into the checklist I actually use — because decoration is not an exemption."
date: "2026-07-15"
category: "Engineering Practice"
---

The most dangerous sentence in front-end work is *it's just a personal site.* It is the exemption that swallows the discipline. Nobody says it about their employer's checkout flow; everybody says it about their own portfolio, and then the portfolio — the one artifact that is supposed to demonstrate how you build — quietly demonstrates that you build without keyboard users, screen readers, or vestibular disorders in mind.

This site is an ornamental object on purpose. Drop caps, parallax mastheads, a vine that draws itself down the margin as you scroll. Years ago I ran a professional accessibility audit on a Next.js app used by millions, and the lesson that outlived that project was not any individual fix. It was that decoration and accessibility are not opponents — *unaudited* decoration and accessibility are. So I audited my own decorations, the same way I would anyone else's. This essay is that pass, written up as the checklist I actually ran.

## Start where the keyboard starts

The first tab press on any page tells you whether the author has ever used one. Here it reveals a skip link — visually hidden until focused, then a small banner offering to jump past the masthead and navigation to `#main-content`, which is a real `<main>` landmark and not a div with ambitions. That pair costs perhaps ten lines. It is also the difference between a keyboard user reaching an essay in one keystroke or twelve, and between a screen reader having a document structure or having soup.

Then keep tabbing, and make every stop *visible.* Every interactive element on this site — nav links, category chips, the theme toggle, each essay row in the index — declares a `:focus-visible` outline in the accent color, offset so it reads against both themes. The browser default would technically pass. Technically passing is how focus indicators end up one pixel of faint blue on a cream background. The outline is part of the design system here, styled with the same care as the hover state, because to a keyboard user the focus ring *is* the hover state.

## Name the things that are pictures of things

An icon button is a picture of an intention. The intention needs a name. The GitHub and LinkedIn buttons say where they go *and that they open a new tab* — the surprise navigation is the part `aria-label` authors forget. The theme toggle's label states what it will do, not what it is: "Switch to dark mode," not "theme button." The decorative layer — the grain overlay, the vine, the duotone plates' filter plumbing, the hover-preview thumbnail on the essay index — carries `aria-hidden`, because a screen reader reciting the scenery is not inclusion. It is noise wearing inclusion's badge.

The test I use is blunt: read the accessibility tree, not the pixels. If a control's name would not tell a stranger what happens next, the name is wrong. If a decoration appears in the tree at all, the decoration is leaking.

## Motion is a preference, and the preference is not yours

The showiest things on this site are animations, and every one of them is gated behind a single hook that reads `prefers-reduced-motion`. The gating strategy matters more than the gate: reduced motion does not mean *broken* or *lesser*. The vine does not vanish for a reduced-motion reader — it appears fully drawn, a finished illustration instead of a performance. The parallax masthead stands still at full opacity. The hover thumbnail still appears; it just declines to animate its entrance. Every flourish has a *resolved state*, designed with the same intent as its animated one, so that opting out of motion never means opting out of content.

This is the item I have seen skipped most often in professional codebases, and it is the one with the least excuse. The media query is one line. The discipline is deciding, flourish by flourish, what the still version *is* — and if a flourish has no acceptable still version, that is the strongest possible sign it should not exist.

## Contrast survives the theme, or the theme is wrong

Two full palettes run this site — aubergine ink on cream, mint on near-black — and both were chosen with contrast checked, not eyeballed. The muted editorial grays that make datelines and captions feel like newsprint sit above the readability line in both modes. The duotone image filters were tuned the same way: the whole point of crushing an image to two inks is aesthetic, but the *choice* of inks is an accessibility decision, because a duotone with insufficient range turns every screenshot into fog.

Dark mode also respects the reader twice over: it follows the operating system's preference by default, and it honors a manual override that persists. Preference detection without a persistent override is a coin flip pretending to be a feature.

## The audit you can run before lunch

The full pass, in the order I run it: **Tab through every page** — skip link first, visible focus everywhere, no traps, no unreachable controls. **Read the landmarks** — one `main`, a real `nav`, headings that descend without skipping levels. **Interrogate every icon and image** — accurate labels on controls, `aria-hidden` on decoration, alt text that describes intent rather than pixels. **Flip on reduced motion** — every animation resolves to a designed still state. **Check contrast in every theme** — body text, muted text, focus rings, filtered images. **Then use the site with the screen reader on**, which is the step that converts the other five from compliance into empathy.

None of this requires a specialist. It requires an afternoon and the willingness to find out.

## The takeaway

Accessibility is not a feature of this site. It is the baseline the features had to clear to ship — the drop caps, the vine, the grain, all of it admitted only after answering for its keyboard, screen-reader, and reduced-motion behavior. That framing is the entire discipline. A feature list treats access as a line item that can slip to next sprint. A baseline treats it as the floor, and nobody negotiates with the floor.

*It's just a personal site* is exactly backwards. The personal site is the one place no deadline, no stakeholder, and no legacy code can excuse you. If accessibility is not baseline *here*, it was never going to be baseline anywhere.
