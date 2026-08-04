/**
 * `**bold**` and `_italic_` — the only inline markup poems carry.
 *
 * Both require a matched pair, which is what makes them safe over this corpus:
 * it contains no `**` and no `_` of its own, and its single bare asterisk — the
 * one in the "Trans" line of "Forced Silence/Forced Speech" — is unpaired, so
 * it can never match. Anything unbalanced renders as literal text.
 *
 * This is emphatically not a markdown parser, and it must not grow into one —
 * markdown's other rules (indent-as-code-block, whitespace collapsing) would
 * destroy poems in this collection.
 *
 * Kept separate from the renderer because two very different renderers consume
 * it: the page, which builds <strong>/<em>, and the social card, which builds
 * satori nodes. Neither may drift from the other on what counts as emphasis.
 */
const EMPHASIS_RE = /\*\*([\s\S]+?)\*\*|_([\s\S]+?)_/g;

/**
 * Split a line into runs of text tagged with the emphasis that covers them.
 *
 * @param {string} line
 * @returns {Array<{ text: string, strong?: boolean, em?: boolean }>}
 */
export function tokenizeEmphasis(line) {
  const tokens = [];
  let last = 0;

  // matchAll clones the regex internally, so the module-level `g` flag's
  // lastIndex is never shared across calls. exec() would need a manual reset.
  for (const match of line.matchAll(EMPHASIS_RE)) {
    if (match.index > last) tokens.push({ text: line.slice(last, match.index) });
    tokens.push(
      match[1] !== undefined
        ? { text: match[1], strong: true }
        : { text: match[2], em: true }
    );
    last = match.index + match[0].length;
  }

  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

/** The line as the reader sees it, with the delimiters removed. */
export function plainLine(line) {
  return tokenizeEmphasis(line)
    .map((t) => t.text)
    .join("");
}
