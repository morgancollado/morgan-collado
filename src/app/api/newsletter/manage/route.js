import {
  findByToken,
  updateTopicsByToken,
  markConfirmationSent,
} from "@/lib/newsletter/db";
import { isTokenShaped } from "@/lib/newsletter/tokens";
import {
  confirmationThrottled,
  grantedTopics,
} from "@/lib/newsletter/consent";
import { sendConfirmation } from "@/lib/newsletter/email";
import { json, readJson } from "@/lib/newsletter/http";

export const runtime = "edge";

function present(subscriber) {
  return {
    email: subscriber.email,
    blog: subscriber.blog,
    poetry: subscriber.poetry,
    status: subscriber.status,
  };
}

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (!isTokenShaped(token)) {
    return json({ error: "That link isn't valid." }, { status: 400 });
  }

  try {
    const subscriber = await findByToken(token);
    if (!subscriber) return json({ error: "That link isn't valid." }, { status: 404 });
    return json(present(subscriber));
  } catch (error) {
    console.error("newsletter/manage GET failed:", error);
    return json({ error: "Couldn't load your preferences." }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await readJson(req);
  const token = body?.token;
  if (!isTokenShaped(token)) {
    return json({ error: "That link isn't valid." }, { status: 400 });
  }

  try {
    // Unlike signup, this replaces preferences outright — the page shows the
    // reader exactly what they have, so what comes back is what they want.
    // Clearing both boxes is an unsubscribe, handled inside the query.
    const subscriber = await updateTopicsByToken(token, {
      blog: Boolean(body.blog),
      poetry: Boolean(body.poetry),
    });
    if (!subscriber) return json({ error: "That link isn't valid." }, { status: 404 });

    // Someone who had unsubscribed and is picking topics again comes back as
    // `pending`, and re-joining costs a confirmation click like any other
    // signup. Sending that mail is this route's job: without it the reader is
    // parked in a state that receives nothing, having been told they're back.
    if (subscriber.status === "pending") {
      if (!confirmationThrottled(subscriber.confirmation_sent_at)) {
        await sendConfirmation({
          email: subscriber.email,
          token: subscriber.token,
          topics: grantedTopics(subscriber),
        });
        await markConfirmationSent(subscriber.token);
      }
    }

    return json({ ok: true, ...present(subscriber) });
  } catch (error) {
    console.error("newsletter/manage POST failed:", error);
    return json({ error: "Couldn't save your preferences." }, { status: 500 });
  }
}
