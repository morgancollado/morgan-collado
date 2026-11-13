import {
  normalizeEmail,
  upsertSubscriber,
  markConfirmationSent,
} from "@/lib/newsletter/db";
import { newToken } from "@/lib/newsletter/tokens";
import { sendConfirmation } from "@/lib/newsletter/email";
import {
  confirmationThrottled,
  topicsAwaitingConfirmation,
} from "@/lib/newsletter/consent";
import {
  json,
  readJson,
  createRateLimiter,
  looksLikeEmail,
} from "@/lib/newsletter/http";

export const runtime = "edge";

const allow = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

/**
 * One response for every outcome that isn't a validation error. Saying
 * "you're already subscribed" would turn this endpoint into an oracle for
 * whether a given address is on the list.
 *
 * The wording has to be true in all of those outcomes, which is why it isn't
 * the plain "check your inbox" it used to be: an address that is already
 * confirmed for everything it asked for is owed no mail, and telling that
 * reader to watch for a link that will never arrive reads as a broken site.
 */
const ACCEPTED = {
  ok: true,
  message:
    "You're on the list. If this address is new — or you've just added something — there's a confirmation link in your inbox.",
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

    // What the reader still has to agree to: the whole subscription for a new
    // or returning address, only the newly-requested topics for a confirmed
    // one, and nothing at all when they already get everything they asked for.
    const topics = topicsAwaitingConfirmation(subscriber);

    // The per-IP limiter above resets on cold start and is trivially sidestepped
    // by changing address. This cooldown lives in the database and is keyed on
    // the *recipient*, so it holds regardless of where the request came from —
    // which is what actually stops this form being pointed at someone else's
    // inbox.
    if (topics.length && !confirmationThrottled(subscriber.confirmation_sent_at)) {
      await sendConfirmation({
        email: subscriber.email,
        token: subscriber.token,
        topics,
      });
      await markConfirmationSent(subscriber.token);
    }

    return json(ACCEPTED);
  } catch (error) {
    console.error("newsletter/subscribe failed:", error);
    return json({ error: "Couldn't sign you up just now." }, { status: 500 });
  }
}
