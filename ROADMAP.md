# Roadmap

A working list of what's next for the site — features, content, and upkeep.
Ordered roughly by value-per-effort.

## Phase 1 — Blog infrastructure ✅

- [x] RSS feed at `/feed.xml`, linked from the layout metadata and the Writing index
- [x] `sitemap.xml` and `robots.txt` (App Router metadata routes; `/queen-*` and `/api/` excluded)
- [x] JSON-LD structured data — `Person` site-wide, `BlogPosting` per article

## Phase 2 — Repo hygiene & platform

- [x] Upgrade Next.js 14.0.3 → 14.2.x (security advisories)
- [x] Remove dead `_app.js`, unused `googleapis`/`dotenv` deps, inert `layout` frontmatter
- [x] Fix dark-mode persistence (manual toggle now survives refresh)
- [x] CI workflow: lint + build on PRs
- [ ] Coordinated framework upgrade on its own branch: Next 15 + React 19 + MUI v6/v7 +
      `framer-motion` → `motion`. (Deferred: Next 15's App Router pairs with React 19,
      which framer-motion 10 and MUI v5 don't support — it's one move, not four.)

## Phase 3 — Features

1. [ ] **Browsable blog categories** — filter chips on the Writing index, styled as
       sections of the paper. Categories already live in every post's frontmatter;
       client-side filtering is plenty at this size.
2. [ ] **Contact page** — a themed `/contact` ("Letters to the Editor") with email and
       social links; optionally a small form posting to a route handler (e.g. Resend).
3. [ ] **Related posts** — 2–3 "Continue reading" links from the same category at the
       end of each article (reuse `getAllPostsSorted`).
4. [ ] **Reading time** — word count in `blog/_lib/helpers.js`, shown in the article dateline.
5. [ ] **Dynamic OG images** — replace the manual `scripts/generate-og-images.mjs` PNG
       pipeline with `next/og` `ImageResponse` letterpress title cards (no `sharp` needed).

## Phase 4 — Writing queue

1. **"Designing a Letterpress Broadsheet for the Web"** — the redesign write-up:
   duotone filters, drop caps, grain, the scroll-drawn spine, `prefers-reduced-motion`.
2. **"Building the Queen"** — the hidden chatbot: Edge streaming, password gating,
   in-memory rate limiting, and why a personal toy is allowed to be simple.
3. **"Rituals, Not Vibes — Six Months Later"** — follow-up on pairing with AI agents;
   this repo's own CLAUDE.md/branch workflow is the evidence base.
4. **"Accessibility Is the Baseline"** — turn the a11y pass (skip links, focus rings,
   reduced motion) into a practical audit checklist.
5. **"From Poems to Pull Requests"** — the poet → Apple tech support → bootcamp →
   engineer arc, told properly.

Plus a short colophon/changelog note once Phases 1–3 have shipped.

## Phase 5 — Later / optional

- Tests for `blog/_lib/helpers.js` (frontmatter parsing, sorting) with Vitest, wired into CI
- Blog search / pagination — revisit past ~30 posts
- TypeScript migration — not planned; plain JS is working and the site is small
