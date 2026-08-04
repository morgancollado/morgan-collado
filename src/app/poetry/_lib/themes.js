/**
 * Theme vocabulary helpers.
 *
 * The themes themselves are a small controlled list held in each poem's
 * frontmatter — ten terms, distilled from the 273 raw tags the poems carried
 * on WordPress. Ten is few enough to show all of them at once, so the archive
 * filter needs no "more" affordance. Adding an eleventh means editing the
 * frontmatter of the poems it applies to; nothing here needs to change.
 *
 * Deliberately free of any `fs` import so client components can use it — the
 * loader in poems.js cannot cross that line.
 */

/** "race & colonization" -> "race-colonization", for URL fragments. */
export function themeSlug(theme) {
  return theme
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Every theme in the collection, most-used first.
 *
 * Frequency order rather than alphabetical: it puts the themes the collection
 * actually dwells on at the front of the list, which is the more useful first
 * impression. Ties break alphabetically so the order is stable across builds.
 */
export function collectThemes(poems) {
  const counts = new Map();
  for (const poem of poems) {
    for (const theme of poem.themes || []) {
      counts.set(theme, (counts.get(theme) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count, slug: themeSlug(name) }));
}
