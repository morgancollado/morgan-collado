import { unsubscribeByToken } from "@/lib/newsletter/db";
import { isTokenShaped } from "@/lib/newsletter/tokens";
import { json } from "@/lib/newsletter/http";

export const runtime = "edge";

/**
 * The target of the List-Unsubscribe header, and of the unsubscribe page.
 *
 * POST-only on purpose. RFC 8058 one-click sends a POST, and keeping GET off
 * this route means a mail client or security scanner that prefetches links
 * cannot unsubscribe someone who never asked to leave. The human-facing
 * `/newsletter/unsubscribe` page posts here too.
 */
export async function POST(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (!isTokenShaped(token)) {
    return json({ error: "That link isn't valid." }, { status: 400 });
  }

  try {
    const subscriber = await unsubscribeByToken(token);
    if (!subscriber) return json({ error: "That link isn't valid." }, { status: 404 });
    return json({ ok: true, email: subscriber.email });
  } catch (error) {
    console.error("newsletter/unsubscribe failed:", error);
    return json({ error: "Couldn't unsubscribe just now." }, { status: 500 });
  }
}
