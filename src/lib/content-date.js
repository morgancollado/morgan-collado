/**
 * Front-matter dates, made comparable.
 *
 * Dates are written by hand and aren't always zero-padded ("2026-11-9").
 * Compared as text, that puts the 9th after the 10th; parsed by `new Date()`,
 * it isn't ISO, so it lands at local midnight instead of UTC; and in a
 * `<time dateTime>` attribute it isn't a valid date at all. Every content date
 * goes through here once, at load, so the rest of the site only ever sees
 * `YYYY-MM-DD`.
 */

const LOOSE_DAY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * A content date as zero-padded `YYYY-MM-DD`.
 *
 * Unquoted dates in YAML arrive as Date objects (midnight UTC), so those are
 * read in UTC. Anything that isn't a plain year-month-day is returned as it
 * was rather than guessed at.
 */
export function normalizeDate(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  if (value === null || value === undefined) return "";

  const text = String(value).trim();
  const match = LOOSE_DAY.exec(text);
  if (!match) return text;

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * A number that orders dates by day: 2026-11-9 becomes 20261109. Missing or
 * unreadable dates become 0, so they sort after every dated item.
 */
export function dateKey(date) {
  const match = LOOSE_DAY.exec(normalizeDate(date));
  if (!match) return 0;
  const [, year, month, day] = match.map(Number);
  return year * 10000 + month * 100 + day;
}

/** Sort comparator for items with a `date`: newest first. */
export function newestFirst(a, b) {
  return dateKey(b.date) - dateKey(a.date);
}
