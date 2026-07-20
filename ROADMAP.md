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

## Phase 3 — Features ✅

1. [x] **Browsable blog categories** — filter chips on the Writing index, styled as
       sections of the paper, derived from post frontmatter, client-side filtering.
2. [x] **Contact page** — themed `/contact` ("Letters to the Editor") with GitHub,
       LinkedIn, and RSS links. (Deliberately no email address and no form.)
3. [x] **Related posts** — up to 3 "Continue reading" links from the same category at
       the end of each article.
4. [x] **Reading time** — word count in `blog/_lib/helpers.js`, shown in the article dateline.
5. [x] **Dynamic OG images** — `next/og` letterpress title cards at `/blog/<slug>/og`,
       used as the social image for posts without home-page card art. Existing card
       PNGs untouched; `scripts/generate-og-images.mjs` kept as legacy.

## Phase 4 — Writing queue

1. [x] **"Designing a Letterpress Broadsheet for the Web"** — published 2026-06-15.
2. [x] **"Building the Queen"** — published 2026-07-01.
3. [x] **"Accessibility Is the Baseline"** — published 2026-07-15.
4. [x] **"The Rituals, Audited"** — the "Rituals, Not Vibes" follow-up, published 2026-07-18.
5. [ ] **"From Poems to Pull Requests"** — outline with fill-in prompts at
       `src/app/blog/_drafts/from-poems-to-pull-requests.md` (the `_drafts/` folder
       never publishes); finish the personal sections and move it into `_content/`.

## Phase 5 — Later / optional

- Tests for `blog/_lib/helpers.js` (frontmatter parsing, sorting) with Vitest, wired into CI
- Blog search / pagination — revisit past ~30 posts
- TypeScript migration — not planned; plain JS is working and the site is small
