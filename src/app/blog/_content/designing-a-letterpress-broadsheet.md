---
title: "Designing a Letterpress Broadsheet for the Web"
description: "How this site got its drop caps, duotone plates, and a vine that draws itself — and why the constraints did most of the design work."
date: "2026-06-15"
category: "Collado CodeWorks"
---

The fastest way to make a portfolio site is to not design it at all. Pick a template, swap the name, ship it by dinner. It is a perfectly rational move. It is also how you end up with a site that says *a developer lives here* and nothing else — and I am not only a developer. I was a poet first, and a poem that looks like every other poem has already failed at its one job.

So when I redesigned this site, I started from a metaphor instead of a component library: a letterpress broadsheet. An old newspaper, set by hand, with folios and figures and a compositor who cares too much. Every design decision on this site is downstream of that one sentence, and that is the actual lesson here. The metaphor did most of the design work. I just kept saying no to things that did not belong in a newspaper.

## A dateline is a design system

The top of every page on this site is a folio dateline — a thin bar of small caps reading something like *Vol. I, No. III · The Broadsheet · June 2026 · Morgan Collado*. It is a small thing. It is also the entire design system in miniature: Playfair Display, small caps, wide letter-spacing, hairline rules, justified space-between layout. Once that bar existed, every other component had a standard to answer to. Buttons became square, because a newspaper has no rounded corners. Links became underlined with a border that goes *dashed* on hover, because that is what a compositor's correction mark would do. The category chips, the colophon, the 404 page — they are all the dateline, re-set at different sizes.

This is the cheap secret of coherent design: you do not need a hundred good decisions. You need one opinionated decision and the discipline to keep consulting it.

## Ink, not filters — well, filters pretending to be ink

Photographs are the enemy of the newspaper metaphor. A full-color screenshot dropped into a letterpress page looks like a sticker on a manuscript. The fix is duotone: every image on this site runs through an SVG `feColorMatrix` filter that crushes it to two inks — aubergine on cream in the light theme, mint on near-black in the dark one. The images stop being screenshots and become *plates*, which is what the figure captions call them, complete with a CSS counter that numbers each one — *Fig. I, Fig. II* — without me ever numbering anything by hand.

The filters are defined once, in a hidden SVG at the layout level, and applied with a one-line `filter: url(#duotone-aubergine)`. That is the whole pipeline. No image processing step, no build tooling, no pre-rendered assets to regenerate when the theme changes. The browser does the letterpress work at paint time, and the same photograph obediently changes ink when the reader flips to dark mode.

## The typography is the point, so pay for it

Body text is set in a serif stack that starts at Iowan Old Style and degrades gracefully toward Georgia. Headings and ornaments are Playfair Display — italic, tightly tracked, sized with `clamp()` so the masthead title can be enormous on a desktop and merely large on a phone. First paragraphs open with a drop cap, done in CSS with `::first-letter`, floated and oversized the way an actual compositor would set it. Section breaks are not `<hr>` lines; they are a row of aldine leaves — ❦ ❦ ❦ — because the horizontal rule is a bureaucrat and the fleuron is a flourish.

None of this required a framework. All of it is MUI's `sx` prop over a small custom theme, which sounds like heresy in the era of utility CSS, and I will defend it plainly: the site already used MUI, the theme object already owned the palette for both modes, and a redesign that swaps the styling system *and* the design language at the same time is two migrations wearing one trench coat. Change the language, keep the tools. The tools were never the problem.

## The vine, and the price of a flourish

There is one indulgence I will not pretend is typography: as you read an essay, a vine draws itself down the left margin, its growth tied to your scroll progress through the article — not the page, the *article*, so it starts growing when you reach the text and finishes as you leave it. The masthead title drifts up and fades on a parallax spring. A film-grain texture sits over everything at a few percent opacity, because paper is not flat and screens are.

Flourishes like these are where accessible design usually goes to die, so every one of them is gated behind a single hook that answers one question: does this reader want reduced motion? If the answer is yes, the vine appears fully drawn, the parallax stands still, and the hover animations resolve to their final frames. The decoration is a *layer over* the reading experience, never a toll on it. A newspaper does not require you to watch it being typeset.

## What the metaphor vetoed

The most useful thing the broadsheet conceit ever did was say no on my behalf. No carousels — newspapers do not rotate. No cards with drop shadows hovering at elevation 2 — paper does not float above paper. No skeleton loaders shimmering at me — the paper is either printed or it is not. Each of those is a pattern I might have reached for out of habit, and each one died on contact with the question *would this appear in a broadsheet?* A design metaphor is not a mood board. It is a veto power, and the vetoes are worth more than the inspiration.

## The takeaway

A personal site is the rare project with no stakeholders, no deadline, and no one to blame, which means it shows you — with slightly uncomfortable clarity — what you build when nothing is forcing your hand. I built a newspaper, gated its every animation behind a reduced-motion check, and numbered the figures with a CSS counter, and I am telling you it was the practical choice: one strong metaphor, consulted relentlessly, produced more coherence than any amount of component-by-component taste ever had.

Pick the metaphor before you pick the stack. The stack will do what it is told. The metaphor is the one making the decisions.
