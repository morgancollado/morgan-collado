/**
 * Front-matter dates, made comparable.
 *
 * Dates are written by hand and aren't always zero-padded ("2026-11-9").
 * Compared as text, that puts the 9th after the 10th; parsed by `new Date()`,
 * it isn't ISO, so it lands at local midnight instead of UTC; and in a
 * `<time dateTime>` attribute it isn't a valid date at all. Every content date
 * goes through here once, at load, so the rest of the site only ever sees
 * `YYYY-MM-DD` or no date. Anything that isn't a real calendar day fails the
 * build rather than sorting somewhere surprising.
 */

// A day, optionally followed by a time ("2026-11-9", "2026-11-09T10:00:00Z").
const WRITTEN_DAY = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ]\S.*)?$/;

export class ContentDateError extends Error {
  constructor(value) {
    super(`date ${JSON.stringify(String(value))} isn't a real day. Write it as "YYYY-MM-DD".`);
    this.name = "ContentDateError";
  }
}

function isRealDay(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * A content date as zero-padded `YYYY-MM-DD`, or "" when there is none.
 *
 * Unquoted dates in YAML arrive as Date objects, so those are read in UTC, the
 * way every date on the site is displayed. A written time is ignored: the day
 * is the day as written. Throws ContentDateError for anything else.
 */
export function normalizeDate(value) {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date) {
    if (isNaN(value.getTime())) throw new ContentDateError(value);
    return value.toISOString().slice(0, 10);
  }

  const match = typeof value === "string" ? WRITTEN_DAY.exec(value.trim()) : null;
  if (!match) throw new ContentDateError(value);

  const [year, month, day] = match.slice(1, 4).map(Number);
  if (!isRealDay(year, month, day)) throw new ContentDateError(value);

  return `${match[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * A number that orders dates by day: 2026-11-9 becomes 20261109. Missing or
 * unreadable dates become 0, so they sort after every dated item.
 */
export function dateKey(date) {
  try {
    const day = normalizeDate(date);
    return day ? Number(day.replaceAll("-", "")) : 0;
  } catch {
    return 0;
  }
}

/** Sort comparator for items with a `date`: newest first. */
export function newestFirst(a, b) {
  return dateKey(b.date) - dateKey(a.date);
}
