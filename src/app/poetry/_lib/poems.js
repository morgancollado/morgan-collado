import { createContentLoader } from "@/lib/content";
import { EXCERPT_LINES } from "./constants";
import { parseStanzas, poemAlign } from "./stanzas";

const poetry = createContentLoader("src/app/poetry/_content");

const FIELDS = ["slug", "title", "date", "align", "themes", "source", "content"];

function shape(raw) {
  let align, stanzas;
  try {
    align = poemAlign(raw.align);
    stanzas = parseStanzas(raw.content || "", align);
  } catch (error) {
    throw new Error(`poetry/_content/${raw.slug}.md: ${error.message}`);
  }
  return {
    slug: raw.slug,
    title: raw.title || raw.slug,
    date: raw.date || "",
    align,
    themes: raw.themes || [],
    // Where the poem first appeared. Only the URL is surfaced — the WordPress
    // post id and the original "Post the Eighty-Seventh" title sit alongside it
    // in the frontmatter as provenance, and are deliberately not displayed.
    sourceUrl: raw.source?.url || "",
    stanzas,
    lineCount: stanzas.reduce((n, s) => n + s.length, 0),
  };
}

export function getAllPoemSlugs() {
  return poetry.getSlugs().map((f) => f.replace(/\.md$/, ""));
}

export function getPoemBySlug(slug) {
  return shape(poetry.getBySlug(slug, FIELDS));
}

/**
 * Newest first.
 *
 * Memoized because every poem page asks for the whole corpus just to find its
 * two neighbours — without this, building 48 pages re-reads and re-parses 48
 * files apiece. The cache lives only for the build; nothing mutates the poems
 * at runtime.
 */
let allPoemsCache = null;

export function getAllPoems() {
  if (!allPoemsCache) allPoemsCache = poetry.getAllSorted(FIELDS).map(shape);
  return allPoemsCache;
}

/**
 * Everything the index needs, with bodies reduced to an opening excerpt.
 *
 * The whole corpus ships to the client so the shuffle control can redraw
 * without a round trip; capping the excerpt is what keeps that payload small.
 */
export function getPoemPreviews(excerptLines = EXCERPT_LINES) {
  return getAllPoems().map((poem) => {
    const opening = poem.stanzas[0] || [];
    return {
      slug: poem.slug,
      title: poem.title,
      date: poem.date,
      align: poem.align,
      themes: poem.themes,
      lineCount: poem.lineCount,
      excerpt: opening.slice(0, excerptLines),
      truncated: poem.lineCount > Math.min(opening.length, excerptLines),
    };
  });
}

/** Adjacent poems in date order, for reading straight through. */
export function getPoemNeighbors(slug) {
  const all = getAllPoems();
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1) return { previous: null, next: null };
  const brief = (p) => (p ? { slug: p.slug, title: p.title } : null);
  // getAllPoems is newest-first, so the "previous" poem chronologically is the
  // next entry in the array.
  return {
    previous: brief(all[i + 1]),
    next: brief(all[i - 1]),
  };
}
