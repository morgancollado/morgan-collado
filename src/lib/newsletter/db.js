import { neon } from "@neondatabase/serverless";

/**
 * Every query the newsletter runs. No SQL lives in a route handler.
 *
 * The driver speaks HTTP rather than the Postgres wire protocol, so this works
 * on the edge runtime alongside the rest of the public API routes.
 */

let client;

function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    // Lazy: the module gets imported during `next build`, where the connection
    // string is usually absent and no query is ever run.
    client = neon(url);
  }
  return client;
}

export const TOPICS = ["blog", "poetry"];

export function isTopic(kind) {
  return TOPICS.includes(kind);
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Insert a subscriber, or record that an existing one wants more.
 *
 * Topics are OR'd rather than replaced. The signup form means "also send me
 * this" — someone already subscribed to poetry who signs up from the blog page
 * should end up with both, not have their poetry subscription silently
 * dropped. Replacing preferences wholesale is what /newsletter/manage is for.
 *
 * Where a *confirmed* subscriber is concerned that widening is staged in
 * `pending_blog`/`pending_poetry` rather than applied. The form is public and
 * takes any address, so applying it directly would let a stranger add someone
 * to a topic they never asked for — with no email sent, because a confirmed
 * address is not asked to confirm again. Staging keeps the promise that every
 * topic anyone receives was opted into. Rows that are not confirmed widen in
 * place: nothing is ever delivered to them before they confirm, so the
 * confirmation click covers the whole subscription anyway.
 *
 * A previously unsubscribed address returns to `pending`, so re-joining always
 * costs a fresh confirmation. The original token is deliberately kept on
 * conflict, so unsubscribe links in already-delivered mail keep working.
 */
export async function upsertSubscriber({ email, blog, poetry, token }) {
  const sql = db();
  const rows = await sql`
    insert into subscribers (email, blog, poetry, token)
    values (${email}, ${blog}, ${poetry}, ${token})
    on conflict (email) do update set
      blog = case
        when subscribers.status = 'confirmed' then subscribers.blog
        else subscribers.blog or excluded.blog
      end,
      poetry = case
        when subscribers.status = 'confirmed' then subscribers.poetry
        else subscribers.poetry or excluded.poetry
      end,
      -- coalesce against the staged value, not the granted one, so a second
      -- signup naming a different topic cannot drop a still-unconfirmed first.
      pending_blog = case
        when subscribers.status = 'confirmed'
          then coalesce(subscribers.pending_blog, subscribers.blog) or excluded.blog
      end,
      pending_poetry = case
        when subscribers.status = 'confirmed'
          then coalesce(subscribers.pending_poetry, subscribers.poetry) or excluded.poetry
      end,
      status = case
        when subscribers.status = 'unsubscribed' then 'pending'
        else subscribers.status
      end,
      unsubscribed_at = case
        when subscribers.status = 'unsubscribed' then null
        else subscribers.unsubscribed_at
      end
    returning email, blog, poetry, pending_blog, pending_poetry,
             status, token, confirmation_sent_at
  `;
  return rows[0];
}

export async function findByToken(token) {
  const sql = db();
  const rows = await sql`
    select email, blog, poetry, pending_blog, pending_poetry,
           status, token, confirmation_sent_at
    from subscribers
    where token = ${token}
  `;
  return rows[0] || null;
}

/** Stamped after a confirmation mail goes out, so the next one can be refused. */
export async function markConfirmationSent(token) {
  const sql = db();
  await sql`
    update subscribers set confirmation_sent_at = now() where token = ${token}
  `;
}

/**
 * Grant everything the reader has agreed to.
 *
 * Staged topics land here: this is the click that turns "asked for poetry too"
 * into "receives poetry". `confirmed_at` records the *most recent* consent
 * rather than the first, which is the timestamp that answers "when did this
 * person agree to what they are currently getting".
 */
export async function confirmByToken(token) {
  const sql = db();
  const rows = await sql`
    update subscribers
    set status = 'confirmed',
        blog = coalesce(pending_blog, blog),
        poetry = coalesce(pending_poetry, poetry),
        pending_blog = null,
        pending_poetry = null,
        confirmed_at = now()
    where token = ${token}
      and status <> 'unsubscribed'
    returning email, blog, poetry, pending_blog, pending_poetry,
             status, token, confirmation_sent_at
  `;
  return rows[0] || null;
}

/**
 * Wholesale preference replacement. Clearing both topics is an unsubscribe.
 *
 * This page is reached from a link in the reader's own mail, so what comes back
 * from it is consent by definition and nothing needs staging. A row that was
 * unsubscribed returns to `pending`, and the caller owes it a fresh
 * confirmation mail — re-joining always costs a click.
 */
export async function updateTopicsByToken(token, { blog, poetry }) {
  if (!blog && !poetry) return unsubscribeByToken(token);
  const sql = db();
  const rows = await sql`
    update subscribers
    set blog = ${blog},
        poetry = ${poetry},
        pending_blog = null,
        pending_poetry = null,
        status = case when status = 'unsubscribed' then 'pending' else status end,
        unsubscribed_at = case
          when status = 'unsubscribed' then null
          else unsubscribed_at
        end
    where token = ${token}
    returning email, blog, poetry, pending_blog, pending_poetry,
             status, token, confirmation_sent_at
  `;
  return rows[0] || null;
}

export async function unsubscribeByToken(token) {
  const sql = db();
  const rows = await sql`
    update subscribers
    set status = 'unsubscribed',
        unsubscribed_at = now(),
        blog = false,
        poetry = false,
        pending_blog = null,
        pending_poetry = null
    where token = ${token}
    returning email, blog, poetry, pending_blog, pending_poetry,
             status, token, confirmation_sent_at
  `;
  return rows[0] || null;
}

/**
 * Everyone who should receive a send of this kind.
 *
 * The topic column is interpolated by branch rather than by parameter — a
 * column name cannot be bound, and `kind` reaching SQL unchecked is how this
 * function would become an injection point.
 *
 * The whole list is materialised in memory. That is fine at this site's scale
 * and is the first thing that stops being fine: a list in the tens of thousands
 * wants a cursor and a queue, not one request holding every address at once.
 */
export async function confirmedRecipients(kind) {
  if (!isTopic(kind)) throw new Error(`Unknown topic: ${kind}`);
  const sql = db();
  return kind === "blog"
    ? sql`select email, token from subscribers where status = 'confirmed' and blog`
    : sql`select email, token from subscribers where status = 'confirmed' and poetry`;
}

export async function listSends() {
  const sql = db();
  return sql`
    select kind, slug, subject, recipients, sent_at, completed_at
    from sends
    order by sent_at desc
  `;
}

/**
 * Claim the right to send this post, or pick up one that stopped partway.
 *
 * The unique (kind, slug) constraint is what makes a double-click, a retry, or
 * a second admin tab unable to start the same post twice. What it deliberately
 * does *not* do is block a resume: a send that hit the provider's daily cap or
 * a function timeout has a row but no `completed_at`, and the honest thing is
 * to let it continue rather than to make the operator delete the row and mail
 * the first hundred people again.
 *
 * Returns `{ alreadySent: true }` for a finished send, or `{ id, resumed }`.
 */
export async function claimSend({ kind, slug, subject }) {
  const sql = db();
  const inserted = await sql`
    insert into sends (kind, slug, subject)
    values (${kind}, ${slug}, ${subject})
    on conflict (kind, slug) do nothing
    returning id
  `;
  if (inserted[0]) return { id: inserted[0].id, resumed: false };

  const existing = await sql`
    select id, completed_at from sends where kind = ${kind} and slug = ${slug}
  `;
  const row = existing[0];
  if (!row) throw new Error("Could not claim the send.");
  if (row.completed_at) return { alreadySent: true };
  return { id: row.id, resumed: true };
}

/** Addresses this send has already reached, so a resume can skip them. */
export async function deliveredEmails(sendId) {
  const sql = db();
  const rows = await sql`
    select email from send_deliveries where send_id = ${sendId}
  `;
  return new Set(rows.map((row) => row.email));
}

/**
 * Written after each provider batch rather than at the end, so a failure
 * halfway through a large send loses at most the batch that failed.
 */
export async function recordDeliveries(sendId, emails) {
  if (!emails.length) return;
  const sql = db();
  await sql`
    insert into send_deliveries (send_id, email)
    select ${sendId}::uuid, unnest(${emails}::text[])
    on conflict do nothing
  `;
}

export async function recordProgress(id, recipients) {
  const sql = db();
  await sql`update sends set recipients = ${recipients} where id = ${id}`;
}

export async function completeSend(id, recipients) {
  const sql = db();
  await sql`
    update sends
    set recipients = ${recipients}, completed_at = now()
    where id = ${id}
  `;
}

export async function subscriberCounts() {
  const sql = db();
  const rows = await sql`
    select
      count(*) filter (where status = 'confirmed' and blog)   as blog,
      count(*) filter (where status = 'confirmed' and poetry) as poetry,
      count(*) filter (where status = 'pending')              as pending
    from subscribers
  `;
  const row = rows[0] || {};
  return {
    blog: Number(row.blog || 0),
    poetry: Number(row.poetry || 0),
    pending: Number(row.pending || 0),
  };
}
