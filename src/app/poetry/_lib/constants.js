/**
 * Poetry section constants shared across the server page and the client index.
 *
 * These live here rather than beside their use sites because several of them
 * are read in two places at once — `page.js` seeds the day's draw on the server
 * and `poetry-index.js` redraws it on the client, and if the two counts ever
 * disagreed the section would silently change size with no error anywhere.
 */

/** Poems in the "drawn today" reading. */
export const DRAW_COUNT = 3;

/** Poems in the "most recent work" section. */
export const LATEST_COUNT = 4;

/** Opening lines carried in an index preview. */
export const EXCERPT_LINES = 6;

/**
 * Verse wants a narrower column than prose. Measured across the corpus, the
 * 99th-percentile line is 58 characters, so 54ch wraps roughly one line in a
 * hundred — the blog's 68ch would let those rare long lines sprawl.
 */
export const VERSE_MEASURE = "54ch";
