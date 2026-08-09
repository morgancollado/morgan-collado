import { normalizeEmail, upsertSubscriber } from "@/lib/newsletter/db";
import { newToken } from "@/lib/newsletter/tokens";
import { sendConfirmation } from "@/lib/newsletter/email";
import {
  json,
  readJson,
  createRateLimiter,
  looksLikeEmail,
} from "@/lib/newsletter/http";

export const runtime = "edge";

const allow = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

// One response for every outcome that isn't a validation error. Saying
// "you're already subscribed" would turn this endpoint into an oracle for
// whether a given address is on the list.
const ACCEPTED = {
  ok: true,
  message: "Check your inbox for a confirmation link.",
};

export async function POST(req) {
  const body = await readJson(req);
  if (!body) return json({ error: "Bad request." }, { status: 400 });

  // Honeypot: a real person never fills a field they cannot see. Accept the
  // submission so the bot has no signal, and write nothing.
  if (body.hp) return json(ACCEPTED);

  const email = normalizeEmail(body.email);
  if (!looksLikeEmail(email)) {
    return json({ error: "That doesn't look like an email address." }, { status: 400 });
  }

  const blog = Boolean(body.blog);
  const poetry = Boolean(body.poetry);
  if (!blog && !poetry) {
    return json({ error: "Pick at least one kind of writing." }, { status: 400 });
  }

  if (!allow(req)) {
    return json(
      { error: "Too many signups from here. Try again later." },
      { status: 429 }
    );
  }

  try {
    const subscriber = await upsertSubscriber({
      email,
      blog,
      poetry,
      token: newToken(),
    });

    // Already-confirmed addresses had their topics widened by the upsert and
    // need no second confirmation. Everyone else — new, unconfirmed, or
    // returning after unsubscribing — gets the link.
    if (subscriber.status === "pending") {
      const topics = [
        subscriber.blog && "blog",
        subscriber.poetry && "poetry",
      ].filter(Boolean);
      await sendConfirmation({
        email: subscriber.email,
        token: subscriber.token,
        topics,
      });
    }

    return json(ACCEPTED);
  } catch (error) {
    console.error("newsletter/subscribe failed:", error);
    return json({ error: "Couldn't sign you up just now." }, { status: 500 });
  }
}
