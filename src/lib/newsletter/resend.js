/**
 * The only module that knows Resend exists.
 *
 * Raw fetch rather than the `resend` SDK: it costs about forty lines, adds no
 * dependency, and runs on the edge runtime alongside the other public API
 * routes. Swapping providers means rewriting this file and nothing else.
 */

const API = "https://api.resend.com";

/** Resend rejects a batch larger than this. */
export const BATCH_LIMIT = 100;

function apiKey() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  return key;
}

export function sender() {
  const from = process.env.NEWSLETTER_FROM;
  if (!from) throw new Error("NEWSLETTER_FROM is not set.");
  return from;
}

async function post(path, body, { idempotencyKey } = {}) {
  const headers = {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Resend's error body names the actual problem — unverified domain, bad
    // key, daily quota — which is far more useful than the status code.
    let detail = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      if (payload?.message) detail = payload.message;
    } catch {
      // Non-JSON error body; the status line stands.
    }
    throw new Error(`Resend: ${detail}`);
  }

  return response.json();
}

/** One message. Used for confirmation mail. */
export function sendOne(message) {
  return post("/emails", { from: sender(), ...message });
}

/**
 * Many messages, each addressed and personalised individually so every
 * recipient gets their own unsubscribe link. Chunked at Resend's cap.
 *
 * Chunks are sent in sequence rather than in parallel: a partial failure
 * halfway through a large send is recoverable, but tripping the provider's
 * rate limit and having it reject everything is not.
 *
 * `onChunk` is awaited after each accepted chunk and is how a caller records
 * what has actually landed. Without it a send that stops on the provider's
 * daily cap — the documented, expected failure for a list over a hundred —
 * leaves no record of who was reached, and resuming means guessing.
 */
export async function sendBatch(messages, { onChunk, idempotencyPrefix } = {}) {
  let sent = 0;
  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    const chunk = messages
      .slice(i, i + BATCH_LIMIT)
      .map((message) => ({ from: sender(), ...message }));
    const idempotencyKey = idempotencyPrefix
      ? await chunkKey(idempotencyPrefix, chunk)
      : undefined;
    await post("/emails/batch", chunk, { idempotencyKey });
    sent += chunk.length;
    if (onChunk) await onChunk(chunk.map((message) => message.to[0]), sent);
  }
  return sent;
}

/**
 * The one gap the delivery table can't close: Resend accepts a batch and the
 * run dies before `onChunk` records it. A resume would then mail that batch
 * again. Keying each batch on the send and on exactly who is in it lets Resend
 * recognise the retry (for 24 hours) and return the original result instead
 * of sending twice. Recipients are fetched in a fixed order, so the batch that
 * was cut off is the same batch on the retry.
 */
export async function chunkKey(prefix, chunk) {
  const who = chunk.map((message) => message.to[0]).join("\n");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(who));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}/${hex}`;
}
