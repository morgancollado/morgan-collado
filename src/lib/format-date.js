/**
 * Every date on this site is pinned to UTC.
 *
 * Content dates are bare `YYYY-MM-DD` strings, which `new Date()` parses as
 * midnight UTC. Formatting one in the reader's own zone would render a
 * January 1st poem as December 31st for everybody west of Greenwich.
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** The year alone, for indexes and datelines. */
export function yearOf(date) {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.getUTCFullYear();
}

/**
 * The month and year in the folio dateline at the top of every page.
 *
 * UTC here is not cosmetic. These pages are static, so the string is baked into
 * the HTML at build time and then compared against whatever the browser
 * computes during hydration — and a reader whose local date has not yet rolled
 * over to the build's month would compute a different one. Pinning both sides
 * to UTC makes them agree.
 */
export function folioDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
