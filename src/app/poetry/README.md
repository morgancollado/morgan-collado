# Adding a poem

Drop one markdown file into `_content/`. Nothing else — no index to update, no
route to register.

> This file lives here rather than in `_content/` on purpose: the loader treats
> **every** `.md` in that directory as a poem, so a README inside it would
> publish itself at `/poetry/README`.

## The file

The filename is the slug. `for-cherrie.md` is served at `/poetry/for-cherrie`,
so name it in lower-case kebab-case.

```markdown
---
title: "For Cherríe"
date: "2012-08-13"
align: "left"
themes: ["familia", "transness"]
source:
  url: "https://atriptothemorg.wordpress.com/2012/08/13/post-the-eighty-forth/"
  id: 550
  originalTitle: "Post the Eighty-Forth or For Cherríe"
---
First line of the poem
Second line
–
First line after the stanza break
```

Only `title` and `date` are required. A file carrying just those two builds and
renders correctly.

## Frontmatter

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Falls back to the slug if missing, which you don't want. |
| `date` | yes | **Must be `"YYYY-MM-DD"`.** See the trap below. |
| `align` | no | `"center"` or `"left"`. Anything else, including absent, means left. |
| `themes` | no | See the vocabulary below. Eight of the poems have none. |
| `source` | no | Only `url` is displayed. `id` and `originalTitle` are provenance and are never rendered. |

### The date trap

Dates are sorted as **strings**, not parsed as dates
(`(b.date || "").localeCompare(a.date || "")` in `src/lib/content.js`). Only
`YYYY-MM-DD` sorts correctly. Any other format — `"2012/8/13"`, `"Aug 13 2012"` —
silently sorts wrong and never raises an error.

Everywhere a date is read or displayed it is pinned to UTC, so a January 1st
poem doesn't show as December 31st for readers west of Greenwich.

### Themes

The vocabulary is a convention, not a constraint — the filter chips on
`/poetry` are built from whatever the files actually contain, so a new term
just appears. That is also why it should stay small: the filter is only useful
because terms recur.

Currently in use, by frequency:

```
love, race & colonization, body, rage, grief,
survival, familia, transness, home, desire
```

A theme becomes a chip on the index and a link on the poem page pointing at
`/poetry#theme-<slug>`, which opens the archive already filtered.

## The body

Plain text with exactly two delimiters. **It is not markdown and must not be
run through a markdown renderer** — markdown would turn indented lines into
code blocks and would eat the bare asterisk in "Trans\*/Brown/Queer/Woman".

- **Stanza break** — a blank line, or a lone `–` on its own line.
- **Emphasis** — `**bold**` and `_italic_`, nothing else. Both require a
  matched pair; anything unbalanced prints literally. Before adding a third
  delimiter, check it does not already occur in the corpus.
- **Composed whitespace** — non-breaking spaces are preserved verbatim. This is
  load-bearing: "Whole Pieces" builds a staircase out of alternating ordinary
  and non-breaking spaces. A line of *ordinary* spaces reads as a stanza break;
  a line containing a non-breaking space is content and is kept.
- **Spanish is never marked up.** Several poems code-switch mid-line. That is
  the voice, not a quotation — no `lang` attribute, no italics.

## What happens on its own

Adding the file gives you, with no further edits:

- the poem page at `/poetry/<slug>`, statically generated
- a typeset social card at `/poetry/<slug>/opengraph-image`, showing the title
  and the first **4** lines
- a `/sitemap.xml` entry
- placement in the archive under its year
- the "most recent work" section if it is among the newest **4**
- eligibility for the daily draw of **3**
- previous/next links on the two poems adjacent to it by date
- a new theme chip, if it introduces a term

Two thresholds worth knowing: the index preview shows the first **6** lines,
and the scroll-drawn vine on a poem page only appears at **40** lines or more,
below which there isn't enough travel for it to draw.

## Verifying

```
npm run build && npm start
```

Then check the poem page, its card at `/poetry/<slug>/opengraph-image`, and
that it appears on `/poetry` in the archive and under any theme you gave it.

Worth a look on the card specifically if the opening lines carry emphasis or
composed whitespace — the card renders through satori, not a browser, and its
constraints are documented in `_lib/og-card.js`.

## Where the poems came from

All 48 were imported from the archived *A Trip to the Morg* WordPress blog. The
one-time importer has been removed now that its output is committed; recover it
from history if you ever need to re-pull:

```
git show e6e060e:scripts/import-poems.mjs
```
