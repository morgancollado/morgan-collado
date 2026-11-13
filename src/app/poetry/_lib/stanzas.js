/**
 * The poem body's structure: stanza breaks and alignment.
 *
 * Kept free of imports so it can be tested directly with `node --test`.
 */

export const ALIGNMENTS = ["left", "center", "right"];

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
 * Any single word in braces opening a line is taken as a tag, recognized or
 * not, so a typo like `{rigth}` fails the build instead of publishing itself.
 * Braces around anything else, such as `{a whisper}`, are verse. One ordinary
 * space after the tag is separator; anything beyond it is kept as composed
 * whitespace.
 */
const TAG_RE = /^\{(\w+)\} ?/;

/**
 * The poem's own alignment, from its frontmatter. Absent means left; anything
 * unrecognized fails the build, as an unknown tag does.
 */
export function poemAlign(align) {
  const value = align ?? "left";
  if (!ALIGNMENTS.includes(value)) {
    throw new Error(
      `Unknown align "${value}" in the frontmatter. ` +
        `Use "${ALIGNMENTS.join('", "')}".`
    );
  }
  return value;
}

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
 * A tag alone on its line that ends up setting nothing fails the build, since
 * it is almost certainly misplaced. Tags are removed here, so nothing
 * downstream ever sees one.
 */
export function parseStanzas(body, defaultAlign = "left") {
  const lines = body.split("\n");
  const stanzas = [];
  let current = [];
  let stanzaAlign = defaultAlign;
  // The index of a stanza tag that has not yet set a line, or -1.
  let idleTag = -1;

  const fail = (i, problem) => {
    throw new Error(
      `${problem} on line ${i + 1} of the poem body: "${lines[i]}".`
    );
  };
  const checkIdleTag = () => {
    if (idleTag !== -1) fail(idleTag, "Alignment tag sets no lines");
  };

  lines.forEach((line, i) => {
    if (DIVIDER_RE.test(line) || BLANK_RE.test(line)) {
      checkIdleTag();
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
      idleTag = -1;
      return;
    }

    if (!ALIGNMENTS.includes(tag[1])) {
      fail(
        i,
        `Unknown alignment tag {${tag[1]}}. Use {${ALIGNMENTS.join("}, {")}}`
      );
    }

    const text = line.slice(tag[0].length);
    if (BLANK_RE.test(text)) {
      checkIdleTag();
      stanzaAlign = tag[1];
      idleTag = i;
    } else {
      current.push({ text, align: tag[1] });
    }
  });
  checkIdleTag();
  if (current.length) stanzas.push(current);

  return stanzas;
}
