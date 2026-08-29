/**
 * Shared-password gate.
 *
 * The queen page and the newsletter admin console both want the same thing: no
 * accounts, one password, an httpOnly cookie so the raw password never leaves
 * the server. This is that mechanism, parameterised — the two callers differ
 * only in cookie name, env var, and what an *unset* password means.
 *
 * That last difference is the reason `failOpen` is an explicit argument rather
 * than a default. A blank QUEEN_PASSWORD means "I don't want a gate on my
 * personal toy". A blank NEWSLETTER_ADMIN_PASSWORD must mean the opposite —
 * that console can email real people, so an unset password locks it rather
 * than opening it. Getting this backwards is a one-character mistake with a
 * very bad blast radius, so neither caller gets to rely on a default.
 *
 * The cookie is not the password verifier. An earlier version stored
 * `sha256(salt + password)` and compared the cookie against it, which made the
 * cookie password-equivalent twice over: it never expired, and one SHA-256 pass
 * over a human-chosen password is seconds of offline work, so a leaked cookie
 * gave up the password itself. Now the password is stretched with PBKDF2 and
 * the cookie carries `expiry.HMAC(key, expiry)` — it grants access until the
 * stamped expiry and nothing else, and recovering the password from it costs
 * the full PBKDF2 work factor per guess.
 */

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * PBKDF2 rounds. High enough to make offline guessing expensive, and paid at
 * most once per instance because the derived key is memoised below — the
 * password cannot change without a redeploy.
 */
const ITERATIONS = 600_000;

const encoder = new TextEncoder();

export async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return hex(new Uint8Array(digest));
}

function hex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Length-independent, content-constant-time comparison.
 *
 * Both arguments here are fixed-length hex, so the length check leaks nothing
 * an attacker doesn't already know.
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
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
 * @param {string} options.salt PBKDF2 salt; changing it invalidates every
 *   already-issued cookie for this gate
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

  /** Stretch a password into an HMAC key. Deliberately slow. */
  async function deriveKey(password) {
    const material = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      material,
      { name: "HMAC", hash: "SHA-256", length: 256 },
      false,
      ["sign"]
    );
  }

  let cached = null; // { password, key }

  /**
   * The signing key for this gate's cookies.
   *
   * Memoised on the password it was derived from: 600k rounds is deliberately
   * slow, and paying it on every authorization check would make the console
   * unusable while protecting nothing extra. The password cannot change
   * without a redeploy, which discards the memo along with the instance.
   */
  async function signingKey() {
    const password = process.env[envVar] || "";
    if (cached?.password === password) return cached.key;
    const key = await deriveKey(password);
    cached = { password, key };
    return key;
  }

  async function signUnder(key, message) {
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    return hex(new Uint8Array(mac));
  }

  async function sign(message) {
    return signUnder(await signingKey(), message);
  }

  /** The cookie value granting access until `expiresAt` (epoch ms). */
  async function sessionToken(expiresAt) {
    return `${expiresAt}.${await sign(String(expiresAt))}`;
  }

  /** Whether a submitted password is the configured one. */
  async function verify(password) {
    if (!isConfigured()) return false;
    if (typeof password !== "string" || !password) return false;
    // Signing the same probe under both keys turns a password comparison into
    // a fixed-length digest comparison, so nothing about the real password's
    // length or content is observable from how long this takes.
    const expected = await sign("probe");
    const submitted = await signUnder(await deriveKey(password), "probe");
    return timingSafeEqual(expected, submitted);
  }

  async function isAuthorized(req) {
    if (!passwordRequired()) return true;
    // Locked rather than open: no password set on a fail-closed gate means
    // nobody gets in, including whoever forgot to set it.
    if (!isConfigured()) return false;

    const cookie = readCookie(req, cookieName);
    if (!cookie) return false;

    const idx = cookie.indexOf(".");
    if (idx === -1) return false;
    const expiresAt = Number(cookie.slice(0, idx));
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

    return timingSafeEqual(cookie, await sessionToken(expiresAt));
  }

  async function buildCookie() {
    const expiresAt = Date.now() + maxAge * 1000;
    const value = await sessionToken(expiresAt);
    const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
    return `${cookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${secure}`;
  }

  return {
    COOKIE_NAME: cookieName,
    isConfigured,
    passwordRequired,
    verify,
    isAuthorized,
    buildCookie,
  };
}
