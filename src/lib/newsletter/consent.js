/**
 * The rules about what a subscriber has actually agreed to.
 *
 * These are pure functions on a subscriber row rather than SQL, for two
 * reasons: the decisions are the part that is easy to get wrong, and a pure
 * function is the part that can be tested without a database. `db.js` writes
 * the state; this decides what that state means.
 */

/** How long a confirmation mail suppresses the next one for the same address. */
export const CONFIRMATION_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Whether a confirmation mail was sent recently enough to skip this one.
 *
 * The signup form is public and accepts any address, so an unthrottled resend
 * lets a stranger aim mail at somebody else's inbox — from a domain whose
 * reputation is the thing that gets damaged.
 */
export function confirmationThrottled(sentAt, now = Date.now()) {
  if (!sentAt) return false;
  const at = new Date(sentAt).getTime();
  if (Number.isNaN(at)) return false;
  return now - at < CONFIRMATION_COOLDOWN_MS;
}

/** The topics a row currently receives. */
export function grantedTopics(row) {
  return [row?.blog && "blog", row?.poetry && "poetry"].filter(Boolean);
}

/**
 * Topics staged on a confirmed subscriber that they have not yet agreed to.
 *
 * Empty for a row with nothing staged, and — importantly — empty when the
 * staged set only repeats what they already get. Someone re-entering their
 * address to subscribe to what they are already subscribed to has consented to
 * nothing new and should not be mailed about it.
 */
export function unconfirmedAdditions(row) {
  if (!row) return [];
  return [
    row.pending_blog && !row.blog && "blog",
    row.pending_poetry && !row.poetry && "poetry",
  ].filter(Boolean);
}

/**
 * What, if anything, the reader has to confirm after a signup — and therefore
 * whether a confirmation mail is owed at all.
 *
 * An unconfirmed or returning address confirms its whole subscription; a
 * confirmed one confirms only the topics being added.
 */
export function topicsAwaitingConfirmation(row) {
  if (!row) return [];
  if (row.status === "pending") return grantedTopics(row);
  if (row.status === "confirmed") return unconfirmedAdditions(row);
  return [];
}
