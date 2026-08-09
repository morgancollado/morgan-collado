/**
 * Shared-password gate.
 *
 * The queen page and the newsletter admin console both want the same thing: no
 * accounts, one password, an httpOnly cookie holding a hash so the raw password
 * never leaves the server. This is that mechanism, parameterised — the two
 * callers differ only in cookie name, env var, and what an *unset* password
 * means.
 *
 * That last difference is the reason `failOpen` is an explicit argument rather
 * than a default. A blank QUEEN_PASSWORD means "I don't want a gate on my
 * personal toy". A blank NEWSLETTER_ADMIN_PASSWORD must mean the opposite —
 * that console can email real people, so an unset password locks it rather
 * than opening it. Getting this backwards is a one-character mistake with a
 * very bad blast radius, so neither caller gets to rely on a default.
 */

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readCookie(req, name) {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/**
 * @param {object} options
 * @param {string} options.cookieName name of the httpOnly cookie
 * @param {string} options.envVar env var holding the shared password
 * @param {string} options.salt prefix hashed with the password; changing it
 *   invalidates every already-issued cookie for this gate
 * @param {boolean} options.failOpen whether a blank password means open
 *   access (true) or a locked door (false)
 * @param {number} [options.maxAge] cookie lifetime in seconds
 */
export function createPasswordGate({
  cookieName,
  envVar,
  salt,
  failOpen,
  maxAge = DEFAULT_MAX_AGE,
}) {
  const isConfigured = () => Boolean(process.env[envVar]);

  /** Whether the caller should be shown a password prompt at all. */
  const passwordRequired = () => (failOpen ? isConfigured() : true);

  /** The hash a correct password produces. */
  const tokenFor = (password) => sha256Hex(salt + password);

  const expectedToken = () => tokenFor(process.env[envVar] || "");

  async function isAuthorized(req) {
    if (!passwordRequired()) return true;
    // Locked rather than open: no password set on a fail-closed gate means
    // nobody gets in, including whoever forgot to set it.
    if (!isConfigured()) return false;
    const token = readCookie(req, cookieName);
    if (!token) return false;
    return token === (await expectedToken());
  }

  function buildCookie(token) {
    const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
    return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${secure}`;
  }

  return {
    COOKIE_NAME: cookieName,
    isConfigured,
    passwordRequired,
    tokenFor,
    expectedToken,
    isAuthorized,
    buildCookie,
  };
}
