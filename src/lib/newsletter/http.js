/** Shared helpers for the newsletter route handlers. */

/**
 * Every response here is either personal (an address, a preference set) or
 * addressed by a secret in the URL, and none of it should sit in a shared
 * cache. `no-store` on the helper means no individual route can forget.
 */
export function json(payload, init) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
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
 * form post. What it is *not* allowed to be is a leak: expired records are
 * swept as they are encountered, and the map is capped, so a spray of
 * one-shot addresses cannot grow an instance's memory without bound.
 *
 * Where the consequence of getting past this is somebody else's inbox filling
 * up, this is the second line rather than the only one — see the confirmation
 * cooldown in consent.js, which is durable because it lives in the database.
 */
export function createRateLimiter({ limit, windowMs, maxEntries = 10_000 }) {
  const hits = new Map();

  function sweep(now) {
    for (const [key, record] of hits) {
      if (now > record.resetAt) hits.delete(key);
    }
  }

  return function allow(req) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now > record.resetAt) {
      if (hits.size >= maxEntries) {
        sweep(now);
        // Still full of live records: drop the oldest insertion rather than
        // grow. Map preserves insertion order, so this is the least recently
        // started window.
        if (hits.size >= maxEntries) hits.delete(hits.keys().next().value);
      }
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
