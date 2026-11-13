import { newsletterGate } from "@/lib/newsletter-auth";
import {
  confirmedRecipients,
  claimSend,
  deliveredEmails,
  recordDeliveries,
  recordProgress,
  completeSend,
} from "@/lib/newsletter/db";
import { loadForSend } from "@/lib/newsletter/posts";
import { sendNewPost, TOPIC_LABELS } from "@/lib/newsletter/email";
import { json, readJson } from "@/lib/newsletter/http";

// Node rather than edge: this route reads the markdown off disk so the email
// body comes from the repository rather than from the browser. next.config.js
// carries the matching outputFileTracingIncludes entry.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A send is a sequence of provider round trips, one per hundred recipients, and
// the default ten seconds is enough for a small list and nothing else. Timing
// out mid-send is survivable now — the delivery table says where to pick up —
// but it is still better not to.
export const maxDuration = 60;

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

  // Tracked across the try/catch so a failure can report how far it got. The
  // difference between "nothing went out" and "four hundred of nine hundred
  // went out" is the difference between a safe retry and a duplicate blast,
  // and the operator should not have to infer it.
  let delivered = 0;
  let claimed = false;

  try {
    const recipients = await confirmedRecipients(kind);
    if (recipients.length === 0) {
      return json(
        { error: `Nobody is subscribed to ${TOPIC_LABELS[kind].toLowerCase()} yet.` },
        { status: 409 }
      );
    }

    // Claim the send before dispatching. The unique (kind, slug) constraint
    // means a double-click, a retry, or a second admin tab cannot start this
    // post twice; a send that stopped partway comes back as a resume rather
    // than a refusal, so continuing costs a click instead of a hand-edited
    // database row.
    const claim = await claimSend({ kind, slug, subject });
    if (claim.alreadySent) {
      return json({ error: "That post has already been sent." }, { status: 409 });
    }
    claimed = true;

    const already = claim.resumed ? await deliveredEmails(claim.id) : new Set();
    delivered = already.size;

    const pending = recipients.filter((person) => !already.has(person.email));
    if (pending.length === 0) {
      // Everyone on the list has it. Subscribers added since the original send
      // land here too, which is why this closes the send rather than erroring.
      await completeSend(claim.id, delivered);
      return json({ ok: true, recipients: delivered, skipped: delivered, subject });
    }

    const sent = await sendNewPost({
      recipients: pending,
      kind,
      post,
      // After each accepted batch, not at the end: whatever the provider has
      // taken is recorded before the next one is attempted, so hitting a daily
      // cap costs the remaining recipients and never a redelivery.
      onChunk: async (emails) => {
        await recordDeliveries(claim.id, emails);
        delivered += emails.length;
        await recordProgress(claim.id, delivered);
      },
    });

    await completeSend(claim.id, already.size + sent);

    return json({
      ok: true,
      recipients: already.size + sent,
      skipped: already.size,
      subject,
    });
  } catch (error) {
    console.error("newsletter/admin/send failed:", error);
    const reason = String(error.message || "unknown error").replace(/\.$/, "");
    const remedy = !claimed
      ? " Nothing was sent and nothing was recorded, so it is safe to retry."
      : delivered > 0
        ? ` ${delivered} recipient${delivered === 1 ? " has" : "s have"} it. Everyone reached is recorded, so pressing Send again resumes from there without sending anything twice.`
        : " Nobody has been reached. Pressing Send again retries from the start.";
    return json({ error: `Send failed: ${reason}.${remedy}` }, { status: 500 });
  }
}
