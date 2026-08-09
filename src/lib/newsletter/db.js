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
 * Insert a subscriber, or widen an existing one's interests.
 *
 * Topics are OR'd rather than replaced. The signup form means "also send me
 * this" — someone already subscribed to poetry who signs up from the blog page
 * should end up with both, not have their poetry subscription silently
 * dropped. Replacing preferences wholesale is what /newsletter/manage is for.
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
      blog = subscribers.blog or excluded.blog,
      poetry = subscribers.poetry or excluded.poetry,
      status = case
        when subscribers.status = 'unsubscribed' then 'pending'
        else subscribers.status
      end,
      unsubscribed_at = case
        when subscribers.status = 'unsubscribed' then null
        else subscribers.unsubscribed_at
      end
    returning email, blog, poetry, status, token
  `;
  return rows[0];
}

export async function findByToken(token) {
  const sql = db();
  const rows = await sql`
    select email, blog, poetry, status, token
    from subscribers
    where token = ${token}
  `;
  return rows[0] || null;
}

export async function confirmByToken(token) {
  const sql = db();
  const rows = await sql`
    update subscribers
    set status = 'confirmed',
        confirmed_at = coalesce(confirmed_at, now())
    where token = ${token}
      and status <> 'unsubscribed'
    returning email, blog, poetry, status, token
  `;
  return rows[0] || null;
}

/** Wholesale preference replacement. Clearing both topics is an unsubscribe. */
export async function updateTopicsByToken(token, { blog, poetry }) {
  if (!blog && !poetry) return unsubscribeByToken(token);
  const sql = db();
  const rows = await sql`
    update subscribers
    set blog = ${blog},
        poetry = ${poetry},
        status = case when status = 'unsubscribed' then 'pending' else status end,
        unsubscribed_at = null
    where token = ${token}
    returning email, blog, poetry, status, token
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
        poetry = false
    where token = ${token}
    returning email, blog, poetry, status, token
  `;
  return rows[0] || null;
}

/**
 * Everyone who should receive a send of this kind.
 *
 * The topic column is interpolated by branch rather than by parameter — a
 * column name cannot be bound, and `kind` reaching SQL unchecked is how this
 * function would become an injection point.
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
    select kind, slug, subject, recipients, sent_at
    from sends
    order by sent_at desc
  `;
}

/**
 * Claim the right to send this post.
 *
 * Returns null when the post has already been sent — the unique (kind, slug)
 * constraint is what makes a double-click, a retry, or a second admin tab
 * unable to mail the same piece twice.
 */
export async function recordSend({ kind, slug, subject }) {
  const sql = db();
  const rows = await sql`
    insert into sends (kind, slug, subject)
    values (${kind}, ${slug}, ${subject})
    on conflict (kind, slug) do nothing
    returning id
  `;
  return rows[0]?.id || null;
}

export async function setSendRecipients(id, recipients) {
  const sql = db();
  await sql`update sends set recipients = ${recipients} where id = ${id}`;
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
