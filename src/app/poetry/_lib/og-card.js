import fs from "fs";
import { join } from "path";
import { tokenizeEmphasis } from "./emphasis";

/**
 * The shared social card for the poetry section.
 *
 * A poem's link preview shows the poem, set. That is the whole point: the
 * corpus has no images, so a generic site card would say nothing about the work
 * being shared. The card reproduces the page's own typography — Playfair
 * italic for the title, a Baskerville for the verse, on the same cream paper.
 *
 * Rendered by satori (via next/og), which is not a browser: it supports a
 * subset of flexbox and no CSS at all beyond inline styles. Two rules to know
 * before editing:
 *
 *  - Every element with more than one child needs an explicit `display: flex`.
 *  - `font-variant-caps` does not exist here, so the small caps elsewhere on
 *    the site are approximated with uppercase plus letter-spacing.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The light palette from src/lib/editorial.js. Hard-coded rather than imported
// because those are MUI theme callbacks and there is no theme here — a social
// card has no dark mode, it is one fixed image.
const PAPER = "#faf6ec";
const INK = "#1c1614";
const ACCENT = "#63409b";
const DIM = "#7a6c5e";

const FONT_DIR = join(process.cwd(), "src/app/poetry/_fonts");

/**
 * Font data for `ImageResponse`.
 *
 * Read from disk rather than fetched from Google at build time, so a build
 * never depends on the network — the same reasoning that keeps the poems
 * themselves committed to the repo.
 */
export function loadFonts() {
  const read = (file) => fs.readFileSync(join(FONT_DIR, file));
  return [
    {
      name: "Playfair Display",
      data: read("playfair-italic.woff"),
      weight: 400,
      style: "italic",
    },
    {
      name: "Playfair Display",
      data: read("playfair-regular.woff"),
      weight: 400,
      style: "normal",
    },
    {
      name: "Libre Baskerville",
      data: read("baskerville-regular.woff"),
      weight: 400,
      style: "normal",
    },
  ];
}

/** Small-caps-ish rule, reused by the header and footer bands. */
const bandTextStyle = {
  fontFamily: "Playfair Display",
  fontSize: 20,
  letterSpacing: 5,
  textTransform: "uppercase",
  color: DIM,
};

/**
 * Fit the title to the plate.
 *
 * Satori has no `clamp()` and cannot measure text for us, so the size is
 * stepped off the character count. The thresholds were picked against the
 * longest titles in the corpus ("Forced Silence/Forced Speech", "A poem for
 * New Orleans") so none of them wraps past two lines.
 */
function titleSize(title) {
  if (title.length > 42) return 44;
  if (title.length > 28) return 54;
  if (title.length > 18) return 64;
  return 72;
}

/**
 * Fit the verse to the plate.
 *
 * Driven by the longest line rather than the average: one long line is what
 * overflows the card, and the staircase lines in "Whole Pieces" are long
 * because of their interior spacing, which must not be collapsed to make them
 * fit.
 */
function verseSize(lines) {
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  if (longest > 52) return 22;
  if (longest > 40) return 26;
  return 30;
}

function VerseLine({ line, size }) {
  const tokens = tokenizeEmphasis(line);
  return (
    <div
      style={{
        display: "flex",
        // The composed whitespace in "Whole Pieces" is the poem. `pre` keeps
        // it; the card never wraps, so `pre-wrap` would buy nothing.
        whiteSpace: "pre",
        fontFamily: "Libre Baskerville",
        fontSize: size,
        lineHeight: 1.65,
        color: INK,
      }}
    >
      {tokens.map((token, i) => (
        <span
          key={i}
          style={{
            fontWeight: token.strong ? 700 : 400,
            fontStyle: token.em ? "italic" : "normal",
            // Only Playfair ships an italic here, so an emphasized run borrows
            // it. Bold has no cut at all and satori will not synthesize one,
            // so bold is carried by the display face instead.
            ...(token.strong || token.em
              ? { fontFamily: "Playfair Display" }
              : null),
          }}
        >
          {token.text}
        </span>
      ))}
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.title      poem title, or the section title
 * @param {string[]} props.lines    the verse to set, already truncated
 * @param {string} props.align      "center" | "left"
 * @param {string} props.footer     right-hand footer text (a date, or a count)
 * @param {boolean} props.truncated whether more of the poem follows
 */
export function OgCard({ title, lines, align, footer, truncated }) {
  const centered = align === "center";
  const size = verseSize(lines);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAPER,
        color: INK,
        padding: "48px 64px",
      }}
    >
      {/* Folio dateline, as on the page. The page's `3px double` rule is drawn
          here as two strokes: satori implements only `solid` borders. */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", height: 3, backgroundColor: INK }} />
        <div
          style={{
            display: "flex",
            height: 3,
            marginTop: 4,
            backgroundColor: INK,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `2px solid ${INK}`,
            padding: "14px 0",
            ...bandTextStyle,
          }}
        >
          <span>The Chapbook</span>
          <span>Poetry</span>
          <span>Morgan Collado</span>
        </div>
      </div>

      {/* Every child here carries `flexShrink: 0`. Satori's default is to
          shrink, and a shrunk block does not reflow — it overlaps the one
          below it, which silently prints the title through the first line of
          the poem. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          alignItems: centered ? "center" : "flex-start",
          padding: "28px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            fontFamily: "Playfair Display",
            fontStyle: "italic",
            fontSize: titleSize(title),
            lineHeight: 1.08,
            letterSpacing: -1,
            color: INK,
            maxWidth: 1000,
            textAlign: centered ? "center" : "left",
          }}
        >
          {title}
        </div>

        {/* The author's own stanza mark, standing in for a rule. */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            fontFamily: "Playfair Display",
            fontSize: 32,
            letterSpacing: 10,
            color: ACCENT,
            margin: "18px 0",
          }}
        >
          –
        </div>

        <div
          style={{
            display: "flex",
            flexShrink: 0,
            flexDirection: "column",
            alignItems: centered ? "center" : "flex-start",
          }}
        >
          {lines.map((line, i) => (
            <VerseLine key={i} line={line} size={size} />
          ))}
          {truncated && (
            <div
              style={{
                display: "flex",
                flexShrink: 0,
                fontFamily: "Playfair Display",
                fontSize: 28,
                letterSpacing: 8,
                color: DIM,
                marginTop: 8,
              }}
            >
              …
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${INK}`,
          paddingTop: 14,
          ...bandTextStyle,
        }}
      >
        <span>A Trip to the Morg</span>
        <span style={{ color: ACCENT }}>{footer}</span>
      </div>
    </div>
  );
}
