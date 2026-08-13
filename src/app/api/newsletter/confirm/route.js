import { confirmByToken } from "@/lib/newsletter/db";
import { isTokenShaped } from "@/lib/newsletter/tokens";
import { json, readJson } from "@/lib/newsletter/http";

export const runtime = "edge";

export async function POST(req) {
  const body = await readJson(req);
  const token = body?.token;

  if (!isTokenShaped(token)) {
    return json({ error: "That link isn't valid." }, { status: 400 });
  }

  try {
    const subscriber = await confirmByToken(token);
    if (!subscriber) {
      return json(
        { error: "That link isn't valid, or the subscription was cancelled." },
        { status: 404 }
      );
    }
    // Idempotent: confirming twice is a no-op, not an error. People do click
    // the same link again.
    return json({
      ok: true,
      email: subscriber.email,
      blog: subscriber.blog,
      poetry: subscriber.poetry,
    });
  } catch (error) {
    console.error("newsletter/confirm failed:", error);
    return json({ error: "Couldn't confirm just now." }, { status: 500 });
  }
}
