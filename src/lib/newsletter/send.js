import {
  confirmedRecipients,
  claimSend,
  findSend,
  deliveredEmails,
  recordDeliveries,
  recordProgress,
  completeSend,
} from "@/lib/newsletter/db";
import { listSendable, loadForSend } from "@/lib/newsletter/posts";
import { sendNewPost, TOPIC_LABELS } from "@/lib/newsletter/email";

/**
 * Sending one post to its subscribers, with no web route in front of it.
 *
 * This used to live behind /newsletter/admin and a shared password. It now runs
 * from a GitHub Actions workflow that only someone with write access to the
 * repository can start, so the site carries no code that can mail the list.
 *
 * Every refusal is a SendRefused with a message written for whoever started
 * the run. Nothing here logs an address: the caller prints the result, and the
 * result holds counts, never emails.
 */

export class SendRefused extends Error {
  constructor(message) {
    super(message);
    this.name = "SendRefused";
  }
}

export function subjectFor(kind, post) {
  return kind === "poetry" ? `New poem: ${post.title}` : `New writing: ${post.title}`;
}

/**
 * Which post a run means. A blank slug means the newest piece of that kind,
 * which is nearly always what "send the newsletter" is for and is the easiest
 * thing to start from a phone.
 */
export function resolvePost(kind, slug) {
  if (!(kind in TOPIC_LABELS)) {
    throw new SendRefused(`Unknown kind "${kind}". Use "poetry" or "blog".`);
  }

  const wanted = (slug || "").trim();
  if (!wanted) {
    const newest = listSendable()[kind][0];
    if (!newest) throw new SendRefused(`There is no ${TOPIC_LABELS[kind].toLowerCase()} to send.`);
    return { slug: newest.slug, post: loadForSend(kind, newest.slug) };
  }

  const post = loadForSend(kind, wanted);
  if (!post) {
    const known = listSendable()[kind].slice(0, 10).map((item) => item.slug);
    throw new SendRefused(
      `No ${TOPIC_LABELS[kind].toLowerCase()} called "${wanted}". The newest are: ${known.join(", ")}.`
    );
  }
  return { slug: wanted, post };
}

/**
 * Send (or, with dryRun, describe) one post.
 *
 * Duplicate protection is the database's: a finished send is refused, and one
 * that stopped partway (Resend's daily cap, a cancelled run) resumes from the
 * recorded deliveries, so running it again the next day never mails anyone
 * twice.
 */
export async function sendPost({ kind, slug, dryRun = false }) {
  const { slug: resolved, post } = resolvePost(kind, slug);
  const subject = subjectFor(kind, post);
  const base = { kind, slug: resolved, title: post.title, subject, dryRun };

  const recipients = await confirmedRecipients(kind);

  if (dryRun) {
    const existing = await findSend(kind, resolved);
    if (existing?.completed_at) {
      return { ...base, status: "already-sent", recipients: recipients.length };
    }
    const already = existing ? await deliveredEmails(existing.id) : new Set();
    const pending = recipients.filter((person) => !already.has(person.email));
    return {
      ...base,
      status: "would-send",
      recipients: recipients.length,
      alreadyDelivered: already.size,
      wouldSend: pending.length,
    };
  }

  if (recipients.length === 0) {
    throw new SendRefused(`Nobody is subscribed to ${TOPIC_LABELS[kind].toLowerCase()} yet.`);
  }

  let delivered = 0;
  let claimed = false;

  try {
    const claim = await claimSend({ kind, slug: resolved, subject });
    if (claim.alreadySent) {
      throw new SendRefused(`"${post.title}" has already been sent.`);
    }
    claimed = true;

    const already = claim.resumed ? await deliveredEmails(claim.id) : new Set();
    delivered = already.size;

    const pending = recipients.filter((person) => !already.has(person.email));
    if (pending.length === 0) {
      // Everyone on the list has it, including anyone who signed up since a
      // send that stopped partway, so close it rather than erroring.
      await completeSend(claim.id, delivered);
      return { ...base, status: "sent", sent: 0, skipped: delivered, recipients: delivered };
    }

    const sent = await sendNewPost({
      recipients: pending,
      kind,
      post,
      // Recorded after each accepted batch, so hitting the daily cap costs the
      // remaining recipients and never a redelivery.
      onChunk: async (emails) => {
        await recordDeliveries(claim.id, emails);
        delivered += emails.length;
        await recordProgress(claim.id, delivered);
      },
    });

    await completeSend(claim.id, already.size + sent);
    return {
      ...base,
      status: "sent",
      sent,
      skipped: already.size,
      recipients: already.size + sent,
    };
  } catch (error) {
    if (error instanceof SendRefused) throw error;
    const reason = String(error.message || "unknown error").replace(/\.$/, "");
    const remedy = !claimed
      ? " Nothing was sent and nothing was recorded, so it is safe to run again."
      : delivered > 0
        ? ` ${delivered} recipient${delivered === 1 ? " has" : "s have"} it. Everyone reached is recorded, so running it again resumes from there without sending anything twice.`
        : " Nobody has been reached. Running it again retries from the start.";
    throw new SendRefused(`Send failed: ${reason}.${remedy}`);
  }
}

/** One line per fact, for the run log and the job summary. No addresses. */
export function describeResult(result) {
  const lines = [
    `${result.dryRun ? "Dry run" : "Send"}: ${result.subject} (${result.kind}/${result.slug})`,
  ];
  if (result.status === "already-sent") {
    lines.push("Already sent. Running it for real would be refused.");
  } else if (result.status === "would-send") {
    lines.push(`Confirmed ${TOPIC_LABELS[result.kind].toLowerCase()} subscribers: ${result.recipients}`);
    if (result.alreadyDelivered) {
      lines.push(`Already reached by an earlier, unfinished send: ${result.alreadyDelivered}`);
    }
    lines.push(`Would send now: ${result.wouldSend}`);
    lines.push("Nothing was sent. Run again with dry run unticked to send.");
  } else {
    lines.push(`Sent now: ${result.sent}`);
    if (result.skipped) lines.push(`Skipped, already had it: ${result.skipped}`);
    lines.push(`Total who have it: ${result.recipients}`);
  }
  return lines;
}
