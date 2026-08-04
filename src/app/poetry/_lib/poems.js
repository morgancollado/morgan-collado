import { createContentLoader } from "@/lib/content";

const poetry = createContentLoader("src/app/poetry/_content");

const FIELDS = ["slug", "title", "date", "align", "themes", "note", "dedication", "measure", "content"];

/** A line that stands alone as a dash is the author's own stanza break. */
const DIVIDER_RE = /^\s*[–—-]\s*$/;

/**
 * Split a poem body into stanzas of lines.
 *
 * Blank lines count as breaks too, so a hand-written poem can use either
 * convention. Note this deliberately does not trim the lines: "Whole Pieces"
 * composes with interior whitespace and the renderer preserves it.
 */
export function parseStanzas(body) {
  const stanzas = [];
  let current = [];

  for (const line of body.split("\n")) {
    if (DIVIDER_RE.test(line) || line.trim() === "") {
      if (current.length) {
        stanzas.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length) stanzas.push(current);

  return stanzas;
}

function shape(raw) {
  const stanzas = parseStanzas(raw.content || "");
  return {
    slug: raw.slug,
    title: raw.title || raw.slug,
    date: raw.date || "",
    align: raw.align === "center" ? "center" : "left",
    themes: raw.themes || [],
    note: raw.note || "",
    dedication: raw.dedication || "",
    measure: raw.measure || "",
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

/** Newest first. */
export function getAllPoems() {
  return poetry.getAllSorted(FIELDS).map(shape);
}

/**
 * Everything the index needs, with bodies reduced to an opening excerpt.
 *
 * The whole corpus ships to the client so the shuffle control can redraw
 * without a round trip; capping the excerpt is what keeps that payload small.
 */
export function getPoemPreviews(excerptLines = 6) {
  return getAllPoems().map((poem) => {
    const opening = poem.stanzas[0] || [];
    return {
      slug: poem.slug,
      title: poem.title,
      date: poem.date,
      align: poem.align,
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
