/** Shared helpers for the newsletter route handlers. */

export function json(payload, init) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Per-IP throttle, same shape as the one in api/queen/chat/route.js: an
 * in-memory Map that resets on cold start. That is a real limitation and an
 * accepted one — this is a personal site, not abuse infrastructure, and a
 * durable counter would mean a database round trip on every keystroke-fast
 * form post.
 */
export function createRateLimiter({ limit, windowMs }) {
  const hits = new Map();

  return function allow(req) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now > record.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (record.count >= limit) return false;
    record.count += 1;
    return true;
  };
}

/** Deliberately permissive; the confirmation email is the real validator. */
export function looksLikeEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
