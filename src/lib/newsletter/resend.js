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

async function post(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
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
 */
export async function sendBatch(messages) {
  let sent = 0;
  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    const chunk = messages
      .slice(i, i + BATCH_LIMIT)
      .map((message) => ({ from: sender(), ...message }));
    await post("/emails/batch", chunk);
    sent += chunk.length;
  }
  return sent;
}
