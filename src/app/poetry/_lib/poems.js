import { createContentLoader } from "@/lib/content";
import { EXCERPT_LINES } from "./constants";

const poetry = createContentLoader("src/app/poetry/_content");

const FIELDS = ["slug", "title", "date", "align", "themes", "source", "content"];

/** A line that stands alone as a dash is the author's own stanza break. */
const DIVIDER_RE = /^[ \t]*[–—-][ \t]*$/;

/**
 * A line carrying nothing but ordinary spaces.
 *
 * Deliberately `[ \t]` rather than `\s`: JavaScript counts U+00A0 as
 * whitespace, and a non-breaking space is *content* in this corpus — it is what
 * "Whole Pieces" builds its staircase from. Using `\s` here (or `.trim()`)
 * would silently delete an all-NBSP line and split the stanza around the hole.
 */
const BLANK_RE = /^[ \t]*$/;

/**
 * An alignment tag at the start of a line: `{right}`, `{center}`, `{left}`.
 *
 * Any brace pair at the start of a line is taken as a tag, recognized or not,
 * so a typo like `{rigth}` fails the build instead of publishing itself. That
 * is safe only because no poem in the corpus opens a line with `{`. One
 * ordinary space after the tag is separator; anything beyond it is kept as
 * composed whitespace.
 */
const TAG_RE = /^\{([^}]*)\} ?/;
const ALIGNMENTS = ["left", "center", "right"];

/**
 * Split a poem body into stanzas of `{ text, align }` lines.
 *
 * Blank lines count as breaks too, so a hand-written poem can use either
 * convention. Note this deliberately does not trim the lines: "Whole Pieces"
 * composes with interior whitespace and the renderer preserves it.
 *
 * Alignment resolves nearest-wins, and never crosses a stanza break:
 *
 *  - the poem's `align` is the default for every line;
 *  - a tag alone on its line sets every line after it, to the end of the
 *    stanza;
 *  - a tag opening a line of verse sets that line only.
 *
 * Tags are removed here, so nothing downstream ever sees one.
 */
export function parseStanzas(body, defaultAlign = "left") {
  const stanzas = [];
  let current = [];
  let stanzaAlign = defaultAlign;

  body.split("\n").forEach((line, i) => {
    if (DIVIDER_RE.test(line) || BLANK_RE.test(line)) {
      if (current.length) {
        stanzas.push(current);
        current = [];
      }
      stanzaAlign = defaultAlign;
      return;
    }

    const tag = line.match(TAG_RE);
    if (!tag) {
      current.push({ text: line, align: stanzaAlign });
      return;
    }

    if (!ALIGNMENTS.includes(tag[1])) {
      throw new Error(
        `Unknown alignment tag {${tag[1]}} on line ${i + 1} of the poem body: ` +
          `"${line}". Use {${ALIGNMENTS.join("}, {")}}.`
      );
    }

    const text = line.slice(tag[0].length);
    if (BLANK_RE.test(text)) stanzaAlign = tag[1];
    else current.push({ text, align: tag[1] });
  });
  if (current.length) stanzas.push(current);

  return stanzas;
}

function shape(raw) {
  const align = raw.align === "center" ? "center" : "left";
  let stanzas;
  try {
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
