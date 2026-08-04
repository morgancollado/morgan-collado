// One-time (but rerunnable) import of the poems from the old WordPress blog,
// A Trip to the Morg, into src/app/poetry/_content as markdown.
//
// Deliberately NOT part of `npm run build` — same reasoning as
// generate-og-images.mjs. The poems are committed to the repo; once they're in,
// the site has no runtime dependency on WordPress at all. Node 22 built-ins
// only, so there's nothing to install.
//
//   node scripts/import-poems.mjs [--force] [--dry-run] [--only=<slug>]
//
// --force    overwrite files that already exist (default: skip, so hand edits
//            made after an import are never clobbered)
// --dry-run  report only, write nothing
// --only     restrict to one slug, for re-pulling a single poem
//
// The WordPress HTML has several traps that will silently mangle a poem; see
// the comments on splitLines() and detectAlign() before changing anything.

import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src/app/poetry/_content");

const SITE = "atriptothemorg.wordpress.com";
const API = `https://public-api.wordpress.com/wp/v2/sites/${SITE}/posts`;
const POEM_CATEGORY = 1720;

// Tagged as something else on WordPress, but unambiguously poems.
const EXTRA_SLUGS = new Set(["post-the-tenth-2-or-remembering-trayvon"]);

const EXPECTED_COUNT = 48;

// Blog chatter that isn't part of the poem. Keyed by derived slug and applied
// as an explicit override rather than guessed at, because a "does this line
// look prose-y" heuristic would be a landmine for future imports.
const OVERRIDES = {
  "how-my-body-is-beautiful": { dropLeading: 1 }, // "Greetings and Salutations!..."
};

// WordPress tag names -> the small controlled vocabulary the site displays.
// Anything unmapped is dropped; the raw tag set is 273 terms across 48 poems,
// which is far too noisy to surface.
const THEME_MAP = {
  love: "love", lover: "love", romance: "love", desire: "desire",
  sex: "desire", sexuality: "desire", erotica: "desire",
  death: "grief", grief: "grief", mourning: "grief", loss: "grief",
  murder: "grief", memorial: "grief", eulogy: "grief",
  anger: "rage", rage: "rage", fury: "rage",
  body: "body", bodies: "body", "black skin": "body", "brown skin": "body",
  beauty: "body", "body positivity": "body", scars: "body",
  trans: "transness", transgender: "transness", "trans woman": "transness",
  transsexual: "transness", gender: "transness", queer: "transness",
  transmisogyny: "transness", "gender identity": "transness",
  familia: "familia", family: "familia", madre: "familia", mother: "familia",
  ancestors: "familia", children: "familia",
  racism: "race & colonization", "anti-racism": "race & colonization",
  colonialism: "race & colonization", colonization: "race & colonization",
  "anti-colonization": "race & colonization", blackness: "race & colonization",
  indigenous: "race & colonization", "white supremacy": "race & colonization",
  oppression: "race & colonization",
  home: "home", roots: "home", belonging: "home",
  survival: "survival", resistance: "survival", strength: "survival",
  hope: "survival", life: "survival",
};

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const DRY = args.includes("--dry-run");
const ONLY = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);

// ---------------------------------------------------------------- entities

// Only the entities that actually occur in this corpus, plus the numeric
// fallback. Note &nbsp; is NOT decoded here: titles and bodies need opposite
// treatment, so each caller decides (see decodeTitle / decodeBody).
const NAMED = {
  "&#8217;": "’", "&#8216;": "‘",
  "&#8220;": "“", "&#8221;": "”",
  "&#8211;": "–", "&#8212;": "—",
  "&#8230;": "…", "&hellip;": "…",
  "&amp;": "&", "&#038;": "&", "&#38;": "&",
  "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&#39;": "'",
};

function decodeEntities(s) {
  let out = s;
  for (const [k, v] of Object.entries(NAMED)) out = out.split(k).join(v);
  // Anything numeric left over (but never &#160;/&#xa0; — handled by caller).
  return out.replace(/&#(\d+);/g, (m, d) => {
    const n = Number(d);
    return n === 160 ? " " : String.fromCodePoint(n);
  });
}

// Titles: NBSP is WordPress's widow-prevention, not authorial. All 48 titles
// contain one. Collapse it to a normal space.
function decodeTitle(s) {
  return decodeEntities(s.split("&nbsp;").join(" "))
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Bodies: NBSP is load-bearing. "Whole Pieces" builds a staircase out of
// alternating U+0020 and U+00A0 runs; collapsing them silently destroys the
// composition. Preserve verbatim.
function decodeBody(s) {
  return decodeEntities(s.split("&nbsp;").join(" "));
}

// ------------------------------------------------------------------ title

function stripPostPrefix(title) {
  // Every one of the 48 is "Post the <Ordinal> or <Real Title>". The lazy
  // quantifier takes the first " or ", which is correct for all of them.
  return title.replace(/^Post the .+? or /i, "").trim();
}

function slugify(title) {
  const s = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!s) throw new Error(`Title produced an empty slug: ${title}`);
  return s;
}

// ------------------------------------------------------------------ lines

const DIVIDER_RE = /^[–—-]$/;

// Inline emphasis is carried as `**bold**` and `_italic_`.
//
// These two delimiters were chosen against the actual corpus, not by habit:
// across all 2,290 lines there are zero occurrences of `**`, `_` or `__`, and
// the single `*` in the whole body of work is the unpaired one in
// "Trans*/Brown/Queer/Woman". Because both patterns require a matched pair,
// nothing already in the poems can be mistaken for markup. Check this again
// before adding a third delimiter.
function convertEmphasis(html) {
  return html
    .replace(/<sup\b[^>]*>\s*TM\s*<\/sup>/gi, "™")
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_");
}

/**
 * Close any emphasis left hanging at the end of a line.
 *
 * WordPress wraps some emphasis around a line break — "For Cherríe" has
 * `<strong>¿Por que?<br /></strong>` — so once the line is split the opening
 * delimiter has no partner. Balance each line on its own and drop whatever is
 * left holding nothing.
 */
function balanceEmphasis(line) {
  let out = line;
  if ((out.match(/\*\*/g) || []).length % 2) out += "**";
  if ((out.match(/_/g) || []).length % 2) out += "_";
  // A line that is nothing but delimiters carried no text to begin with.
  if (!out.replace(/\*\*|_/g, "").trim()) return "";
  return out;
}

/**
 * Turn a poem's WordPress HTML into an array of lines.
 *
 * The trap: most poems put one line in each <p>, but three don't.
 * "How my Body is Beautiful" is 38 <br> inside just 2 <p> — splitting on
 * </p> alone collapses that entire poem onto one line. "I" and "For Cherrie"
 * glue a divider to its neighbour with <br> too. So we split on block ends
 * AND on <br>.
 *
 * Returns { lines, blocks } where blocks carry alignment info for detectAlign.
 */
function splitLines(html) {
  // Drop embeds entirely (only "Distance" has one — a third party's music
  // track, not a reading, so there's nothing to preserve).
  let h = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

  // Emphasis becomes delimiters before anything is split or stripped, since a
  // <strong> can wrap a <br> and would otherwise be torn in half.
  h = convertEmphasis(h);

  const blocks = [];
  // Split on the *opening* tag of each block so we keep its attributes.
  const parts = h.split(/(?=<(?:p|div)[\s>])/i);

  for (const part of parts) {
    const openTag = (part.match(/^<(?:p|div)[^>]*>/i) || [""])[0];
    const centered =
      /text-align:\s*center/i.test(openTag) ||
      /\salign=["']?center/i.test(openTag);

    const body = part.replace(/^<(?:p|div)[^>]*>/i, "");

    for (const raw of body.split(/<br\s*\/?>/i)) {
      const text = balanceEmphasis(trimLine(decodeBody(stripTags(raw))));
      if (text) blocks.push({ text, centered });
    }
  }

  return blocks;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

// Composed whitespace: three or more whitespace characters between two
// non-space characters. Only "Whole Pieces" does this (3 lines), and it does
// it with alternating U+0020 and U+00A0 — that staircase is the poem.
const COMPOSED_RE = /\S[\s\u00a0]{3,}\S/;

/**
 * Trim line edges without touching composed whitespace.
 *
 * String.trim() treats U+00A0 as whitespace, so it cleans up the 11 lines that
 * picked up a stray leading NBSP in the WordPress editor while leaving every
 * interior run alone. Measured across the corpus: 11 leading NBSP (all stray —
 * the same phrase appears elsewhere without one), 0 trailing, and every
 * composed run is interior. So a plain trim() is safe for all 48 poems.
 */
function trimLine(s) {
  return s.trim();
}

/**
 * Majority alignment, weighted by line count rather than block count.
 *
 * "How my Body is Beautiful" has one left block (the one-line prose preamble)
 * and one centered block (the whole 39-line poem). Counting blocks gives a 1:1
 * tie; counting lines gets it right.
 */
function detectAlign(blocks) {
  let centered = 0;
  for (const b of blocks) if (b.centered) centered++;
  return centered * 2 > blocks.length ? "center" : "left";
}

function normalizeDividers(lines) {
  const out = [];
  for (const line of lines) {
    const isDiv = DIVIDER_RE.test(line.trim());
    if (isDiv) {
      // Collapse runs, and never open with one.
      if (out.length === 0 || DIVIDER_RE.test(out[out.length - 1])) continue;
      out.push("–");
    } else {
      out.push(line);
    }
  }
  while (out.length && DIVIDER_RE.test(out[out.length - 1])) out.pop();
  return out;
}

// ----------------------------------------------------------------- themes

function themesFor(tagNames) {
  const seen = [];
  for (const name of tagNames) {
    const mapped = THEME_MAP[name.toLowerCase()];
    if (mapped && !seen.includes(mapped)) seen.push(mapped);
  }
  return seen.slice(0, 3);
}

// ------------------------------------------------------------------ yaml

function yamlString(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function frontmatter(poem) {
  const lines = [
    "---",
    `title: ${yamlString(poem.title)}`,
    `date: ${yamlString(poem.date)}`,
    `align: ${yamlString(poem.align)}`,
  ];
  if (poem.themes.length) {
    lines.push(`themes: [${poem.themes.map(yamlString).join(", ")}]`);
  }
  lines.push(
    "source:",
    `  url: ${yamlString(poem.url)}`,
    `  id: ${poem.id}`,
    `  originalTitle: ${yamlString(poem.originalTitle)}`,
    "---",
    ""
  );
  return lines.join("\n");
}

// ------------------------------------------------------------------- main

async function fetchAllPosts() {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const url = `${API}?per_page=50&page=${page}&_embed=wp:term`;
    const res = await fetch(url);
    if (res.status === 400) break; // past the last page
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    const batch = await res.json();
    if (!batch.length) break;
    all.push(...batch);
    const total = Number(res.headers.get("x-wp-totalpages") || 0);
    if (page >= total) break;
  }
  return all;
}

function tagNamesOf(post) {
  const groups = post._embedded?.["wp:term"] || [];
  return groups
    .flat()
    .filter((t) => t?.taxonomy === "post_tag")
    .map((t) => decodeTitle(t.name));
}

async function main() {
  console.log(`Fetching from ${SITE} ...`);
  const posts = await fetchAllPosts();
  console.log(`  ${posts.length} posts`);

  const selected = posts.filter(
    (p) => p.categories?.includes(POEM_CATEGORY) || EXTRA_SLUGS.has(p.slug)
  );

  if (selected.length !== EXPECTED_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_COUNT} poems, found ${selected.length}. ` +
        `The source blog changed — reconcile before importing.`
    );
  }
  console.log(`  ${selected.length} poems selected\n`);

  const seenSlugs = new Map();
  const poems = [];
  const flags = [];

  for (const post of selected) {
    const originalTitle = decodeTitle(post.title.rendered);
    const title = stripPostPrefix(originalTitle);
    const slug = slugify(title);

    if (seenSlugs.has(slug)) {
      throw new Error(
        `Slug collision: "${title}" and "${seenSlugs.get(slug)}" both -> ${slug}`
      );
    }
    seenSlugs.set(slug, title);

    const html = post.content.rendered;
    const blocks = splitLines(html);
    const align = detectAlign(blocks);

    let lines = blocks.map((b) => b.text);
    const override = OVERRIDES[slug];
    if (override?.dropLeading) {
      lines = lines.slice(override.dropLeading);
      flags.push([slug, `dropped ${override.dropLeading} leading prose line(s)`]);
    }
    lines = normalizeDividers(lines);

    // Flag anything a human should eyeball.
    if (/<iframe/i.test(html)) flags.push([slug, "iframe embed removed"]);
    if (/<(strong|b)[\s>]/i.test(html)) flags.push([slug, "bold -> **"]);
    if (/<(em|i)[\s>]/i.test(html)) flags.push([slug, "italics -> _"]);
    if (/<sup\b(?![^>]*>\s*TM\s*<)/i.test(html))
      flags.push([slug, "superscript other than TM — dropped"]);
    if (/text-decoration:\s*underline/i.test(html))
      flags.push([slug, "underline dropped (no delimiter for it)"]);
    if (lines.some((l) => COMPOSED_RE.test(l)))
      flags.push([slug, "composed whitespace — check it visually"]);
    // A lone asterisk that isn't part of a `**` pair — i.e. real content, like
    // the one in "Trans*/Brown/Queer/Woman".
    if (lines.some((l) => /(?<!\*)\*(?!\*)/.test(l.replace(/\*\*/g, ""))))
      flags.push([slug, "literal asterisk — must survive verbatim"]);

    poems.push({
      slug,
      title,
      originalTitle,
      date: post.date.slice(0, 10),
      align,
      themes: themesFor(tagNamesOf(post)),
      url: post.link,
      id: post.id,
      lines,
    });
  }

  const targets = ONLY ? poems.filter((p) => p.slug === ONLY) : poems;
  if (ONLY && !targets.length) throw new Error(`No poem with slug "${ONLY}"`);

  if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  let skipped = 0;
  let totalLines = 0;
  let totalDividers = 0;

  for (const poem of targets) {
    const dividers = poem.lines.filter((l) => DIVIDER_RE.test(l)).length;
    totalLines += poem.lines.length;
    totalDividers += dividers;

    const file = join(OUT_DIR, `${poem.slug}.md`);
    const exists = fs.existsSync(file);

    if (exists && !FORCE) {
      skipped++;
      continue;
    }

    const contents = frontmatter(poem) + poem.lines.join("\n") + "\n";
    if (!DRY) fs.writeFileSync(file, contents, "utf8");
    written++;
  }

  console.log(
    `${DRY ? "[dry run] " : ""}${written} written, ${skipped} skipped` +
      `${skipped && !FORCE ? " (already exist; use --force to overwrite)" : ""}`
  );
  console.log(
    `Corpus: ${totalLines} lines, ${totalDividers} dividers, ` +
      `${totalLines - totalDividers} verse lines`
  );

  const centered = targets.filter((p) => p.align === "center").length;
  console.log(`Alignment: ${centered} centered, ${targets.length - centered} left`);

  if (flags.length) {
    console.log(`\nNeeds a human pass:`);
    const grouped = new Map();
    for (const [slug, why] of flags) {
      if (!grouped.has(slug)) grouped.set(slug, []);
      grouped.get(slug).push(why);
    }
    for (const [slug, whys] of grouped) {
      console.log(`  ${slug.padEnd(34)} ${whys.join("; ")}`);
    }
  }
}

main().catch((err) => {
  console.error(`\nImport failed: ${err.message}`);
  process.exit(1);
});
