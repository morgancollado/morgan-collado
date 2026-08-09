import { newsletterGate } from "@/lib/newsletter-auth";
import {
  confirmedRecipients,
  recordSend,
  setSendRecipients,
} from "@/lib/newsletter/db";
import { loadForSend } from "@/lib/newsletter/posts";
import { sendNewPost, TOPIC_LABELS } from "@/lib/newsletter/email";
import { json, readJson } from "@/lib/newsletter/http";

// Node rather than edge: this route reads the markdown off disk so the email
// body comes from the repository rather than from the browser. next.config.js
// carries the matching outputFileTracingIncludes entry.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!(await newsletterGate.isAuthorized(req))) {
    return json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await readJson(req);
  const kind = body?.kind;
  const slug = body?.slug;

  const post = loadForSend(kind, slug);
  if (!post) {
    return json({ error: "No such post." }, { status: 404 });
  }

  const subject =
    kind === "poetry" ? `New poem: ${post.title}` : `New writing: ${post.title}`;

  // Declared out here so the error handler can tell an operator whether the
  // send was actually claimed. "Retry freely" and "clear the row first" are
  // opposite instructions, and guessing wrong either blocks a legitimate
  // resend or causes a double delivery.
  let sendId = null;

  try {
    const recipients = await confirmedRecipients(kind);
    if (recipients.length === 0) {
      return json(
        { error: `Nobody is subscribed to ${TOPIC_LABELS[kind].toLowerCase()} yet.` },
        { status: 409 }
      );
    }

    // Claim the send before dispatching. If the unique (kind, slug) constraint
    // rejects this, the post has already gone out and nothing more happens.
    // Ordering it this way means the failure mode is "logged but not
    // delivered" — visible, and fixable by hand — rather than "delivered
    // twice", which cannot be taken back.
    sendId = await recordSend({ kind, slug, subject });
    if (!sendId) {
      return json({ error: "That post has already been sent." }, { status: 409 });
    }

    const sent = await sendNewPost({ recipients, kind, post });
    await setSendRecipients(sendId, sent);

    return json({ ok: true, recipients: sent, subject });
  } catch (error) {
    console.error("newsletter/admin/send failed:", error);
    const remedy = sendId
      ? " Some mail may already have gone out. The post is marked as sent — clear its row in the sends table before retrying."
      : " Nothing was sent and nothing was recorded, so it is safe to retry.";
    const reason = String(error.message || "unknown error").replace(/\.$/, "");
    return json({ error: `Send failed: ${reason}.${remedy}` }, { status: 500 });
  }
}
