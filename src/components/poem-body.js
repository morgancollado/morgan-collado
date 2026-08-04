import { Box } from "@mui/material";
import { SERIF_BODY } from "@/lib/editorial";

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
 */
const EMPHASIS_RE = /\*\*([\s\S]+?)\*\*|_([\s\S]+?)_/g;

function renderLine(line) {
  const parts = [];
  let last = 0;
  let key = 0;
  let match;

  EMPHASIS_RE.lastIndex = 0;
  while ((match = EMPHASIS_RE.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    // <strong>/<em> rather than styled spans, so the emphasis is announced by
    // screen readers and not merely visual.
    parts.push(
      match[1] !== undefined ? (
        <Box component="strong" key={key++} sx={{ fontWeight: 700 }}>
          {match[1]}
        </Box>
      ) : (
        <Box component="em" key={key++} sx={{ fontStyle: "italic" }}>
          {match[2]}
        </Box>
      )
    );
    last = match.index + match[0].length;
  }

  if (!parts.length) return line;
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

/**
 * Renders verse.
 *
 * Structure: one <p> per stanza, one block <span> per line. Stanzas are real
 * paragraphs so assistive tech pauses between them, and lines are block-level
 * so the accessibility tree keeps the lineation instead of running the poem
 * together as prose.
 *
 * Two rules here are load-bearing and should not be "tidied":
 *
 *  - `whiteSpace: "pre-wrap"` preserves the composed whitespace in
 *    "Whole Pieces", which builds a staircase out of alternating spaces and
 *    non-breaking spaces. Collapsing it destroys the poem.
 *  - Spanish is never marked up. Several poems code-switch mid-line; that is
 *    the voice, not a quotation, so there is no `lang` attribute and no italic.
 *
 * Poem bodies are stored as plain text, not markdown. Markdown would eat the
 * asterisk in the line beginning "Trans" in "Forced Silence/Forced Speech",
 * and would turn indented lines into code blocks. Do not run this content
 * through a markdown renderer.
 *
 * There is deliberately no entrance animation here. A framer-motion
 * `initial={{ opacity: 0 }}` is serialized into the static HTML as
 * `style="opacity:0"`, which means the poem stays invisible for anyone whose
 * JavaScript hasn't run or never runs. Motion elsewhere on these pages only
 * ever enhances content that is already visible.
 */
export default function PoemBody({ stanzas, align = "left", size = "full" }) {
  const centered = align === "center";
  const isExcerpt = size === "excerpt";

  const lineSx = {
    display: "block",
    whiteSpace: "pre-wrap",
    fontFamily: SERIF_BODY,
    fontSize: isExcerpt
      ? { xs: "1rem", md: "1.0625rem" }
      : { xs: "1.0625rem", md: "1.1875rem" },
    lineHeight: isExcerpt ? 1.75 : 1.9,
    // A long line that wraps should read as a continuation of the line above,
    // not as a new line of verse. Centering fights a hanging indent, so
    // centered poems go without.
    ...(centered
      ? {}
      : { textIndent: "-1.5em", paddingLeft: "1.5em" }),
  };

  const stanzaSx = {
    m: 0,
    mb: isExcerpt ? 0 : { xs: 3.5, md: 4.5 },
    textAlign: centered ? "center" : "left",
    "&:last-of-type": { mb: 0 },
  };

  return (
    <Box sx={{ "& > p + p": { mt: 0 } }}>
      {stanzas.map((lines, i) => (
        <Box component="p" key={i} className="poem-stanza" sx={stanzaSx}>
          {lines.map((line, j) => (
            <Box component="span" key={j} className="poem-line" sx={lineSx}>
              {renderLine(line)}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

/**
 * The stanza divider, drawn from the author's own mark: across the whole
 * corpus a lone en dash is what separates sections. Decorative only — the
 * paragraph break already conveys the structure to assistive tech.
 */
export function StanzaRule({ sx }) {
  return (
    <Box
      aria-hidden
      sx={{
        textAlign: "center",
        color: "poetry.main",
        fontFamily: "var(--font-playfair)",
        fontSize: "1.1rem",
        letterSpacing: 8,
        opacity: 0.7,
        userSelect: "none",
        ...sx,
      }}
    >
      –
    </Box>
  );
}
