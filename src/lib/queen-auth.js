const COOKIE_NAME = "queen_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function passwordRequired() {
  return Boolean(process.env.QUEEN_PASSWORD);
}

// The cookie holds a hash derived from the password, so the raw password
// never leaves the server.
async function expectedToken() {
  return sha256Hex("queen-access:" + (process.env.QUEEN_PASSWORD || ""));
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

async function isAuthorized(req) {
  if (!passwordRequired()) return true;
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return false;
  return token === (await expectedToken());
}

function buildCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE};${secure}`;
}

export {
  COOKIE_NAME,
  sha256Hex,
  passwordRequired,
  expectedToken,
  isAuthorized,
  buildCookie,
};
