import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

/**
 * The queries in db.js, run against a real Postgres.
 *
 * These are the statements that decide what a subscriber is signed up for and
 * whether a post can go out twice, and they are the part of the newsletter
 * that unit tests cannot reach: the consent staging lives in an `on conflict do
 * update`, and reading that SQL and believing it is exactly how the widening
 * bug got in. So `@neondatabase/serverless` is swapped for a tagged template
 * that speaks to a real server, and the module under test is the real one —
 * every SQL string here is the one that ships.
 *
 * Point TEST_DATABASE_URL at a throwaway database to run them:
 *
 *   TEST_DATABASE_URL=postgres://localhost/newsletter_test npm test
 *
 * Skipped, not failed, when it is absent — the unit suite stands alone.
 */

const URL_ = process.env.TEST_DATABASE_URL;
const pool = URL_ ? new pg.Pool({ connectionString: URL_ }) : null;

// Turn sql`select ${a}` into a parameterised query, exactly as the real driver
// does: values are bound, never interpolated.
function tagged(strings, ...values) {
  const text = strings.reduce(
    (acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""),
    ""
  );
  return pool.query(text, values).then((result) => result.rows);
}

vi.mock("@neondatabase/serverless", () => ({
  neon: () => (...args) => tagged(...args),
}));

// db.js still guards on this before handing out its (here mocked) client, and
// the guard is worth keeping — the real module must not silently connect to
// nothing during a build.
if (URL_) process.env.DATABASE_URL = URL_;

const db = await import("@/lib/newsletter/db");
const {
  upsertSubscriber,
  findByToken,
  confirmByToken,
  updateTopicsByToken,
  unsubscribeByToken,
  markConfirmationSent,
  confirmedRecipients,
  claimSend,
  deliveredEmails,
  recordDeliveries,
  recordProgress,
  completeSend,
  listSends,
  subscriberCounts,
} = db;

const here = dirname(fileURLToPath(import.meta.url));

const signup = (over = {}) =>
  upsertSubscriber({
    email: "reader@example.com",
    blog: false,
    poetry: false,
    token: "tok-reader",
    ...over,
  });

describe.skipIf(!URL_)("db.js against Postgres", () => {
  beforeAll(async () => {
    const schema = readFileSync(
      join(here, "..", "scripts", "newsletter-schema.sql"),
      "utf8"
    );
    await pool.query(schema);
  });

  beforeEach(async () => {
    await pool.query("truncate send_deliveries, sends, subscribers");
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe("signing up", () => {
    it("creates a pending subscriber with nothing staged", async () => {
      const row = await signup({ poetry: true });
      expect(row).toMatchObject({
        email: "reader@example.com",
        blog: false,
        poetry: true,
        status: "pending",
        pending_blog: null,
        pending_poetry: null,
      });
      expect(row.confirmation_sent_at).toBeNull();
    });

    it("widens an unconfirmed subscriber in place", async () => {
      await signup({ poetry: true });
      const row = await signup({ blog: true, token: "tok-ignored" });
      // Nothing is delivered before confirmation, so the single confirmation
      // click covers both topics and there is nothing to stage.
      expect(row).toMatchObject({ blog: true, poetry: true, status: "pending" });
      expect(row.pending_blog).toBeNull();
    });

    it("keeps the original token, so links in delivered mail keep working", async () => {
      await signup({ poetry: true });
      const row = await signup({ blog: true, token: "tok-different" });
      expect(row.token).toBe("tok-reader");
    });

    it("never drops a topic somebody already had", async () => {
      await signup({ blog: true, poetry: true });
      const row = await signup({ blog: true, poetry: false });
      expect(row).toMatchObject({ blog: true, poetry: true });
    });
  });

  describe("signing up an address that is already confirmed", () => {
    beforeEach(async () => {
      await signup({ poetry: true });
      await confirmByToken("tok-reader");
    });

    it("stages the new topic instead of granting it", async () => {
      // The form is public and takes any address. Granting here is what let a
      // stranger sign someone else up for mail they never asked for — with no
      // confirmation mail, because a confirmed address is not asked again.
      const row = await signup({ blog: true });
      expect(row).toMatchObject({
        blog: false,
        poetry: true,
        pending_blog: true,
        pending_poetry: true,
        status: "confirmed",
      });
    });

    it("grants the staged topic only once the link is clicked", async () => {
      await signup({ blog: true });
      const row = await confirmByToken("tok-reader");
      expect(row).toMatchObject({
        blog: true,
        poetry: true,
        pending_blog: null,
        pending_poetry: null,
      });
    });

    it("does not let a second signup drop a still-unconfirmed first", async () => {
      await signup({ blog: true });
      await signup({ poetry: true });
      const row = await findByToken("tok-reader");
      expect(row.pending_blog).toBe(true);
    });

    it("leaves the granted columns untouched no matter how often it is posted", async () => {
      for (let i = 0; i < 5; i += 1) await signup({ blog: true, poetry: true });
      const row = await findByToken("tok-reader");
      expect(row).toMatchObject({ blog: false, poetry: true });
    });
  });

  describe("confirming", () => {
    it("records the most recent consent, not the first", async () => {
      await signup({ poetry: true });
      await confirmByToken("tok-reader");
      const [first] = (
        await pool.query("select confirmed_at from subscribers")
      ).rows;

      await new Promise((r) => setTimeout(r, 10));
      await signup({ blog: true });
      await confirmByToken("tok-reader");
      const [second] = (
        await pool.query("select confirmed_at from subscribers")
      ).rows;

      expect(second.confirmed_at.getTime()).toBeGreaterThan(
        first.confirmed_at.getTime()
      );
    });

    it("is idempotent", async () => {
      await signup({ blog: true });
      await confirmByToken("tok-reader");
      const again = await confirmByToken("tok-reader");
      expect(again).toMatchObject({ status: "confirmed", blog: true });
    });

    it("refuses a token belonging to nobody", async () => {
      expect(await confirmByToken("tok-nobody")).toBeNull();
    });

    it("refuses to resurrect an unsubscribed row", async () => {
      await signup({ blog: true });
      await unsubscribeByToken("tok-reader");
      expect(await confirmByToken("tok-reader")).toBeNull();
    });
  });

  describe("managing preferences", () => {
    beforeEach(async () => {
      await signup({ blog: true, poetry: true });
      await confirmByToken("tok-reader");
    });

    it("replaces outright rather than widening", async () => {
      const row = await updateTopicsByToken("tok-reader", {
        blog: false,
        poetry: true,
      });
      expect(row).toMatchObject({ blog: false, poetry: true, status: "confirmed" });
    });

    it("treats clearing both topics as an unsubscribe", async () => {
      const row = await updateTopicsByToken("tok-reader", {
        blog: false,
        poetry: false,
      });
      expect(row).toMatchObject({
        status: "unsubscribed",
        blog: false,
        poetry: false,
      });
    });

    it("sends a re-joining reader back to pending, so re-joining costs a click", async () => {
      await unsubscribeByToken("tok-reader");
      const row = await updateTopicsByToken("tok-reader", {
        blog: false,
        poetry: true,
      });
      expect(row.status).toBe("pending");
      // …and the caller owes them a confirmation mail. Without one this is the
      // dead end where the page said "Saved." and nothing was ever delivered.
      expect(await confirmByToken("tok-reader")).toMatchObject({
        status: "confirmed",
        poetry: true,
      });
    });

    it("leaves unsubscribed_at alone for a row that was never unsubscribed", async () => {
      await updateTopicsByToken("tok-reader", { blog: true, poetry: false });
      const [row] = (
        await pool.query("select unsubscribed_at from subscribers")
      ).rows;
      expect(row.unsubscribed_at).toBeNull();
    });

    it("clears anything staged, since this page is consent by definition", async () => {
      await signup({ blog: true, poetry: true });
      await updateTopicsByToken("tok-reader", { blog: true, poetry: false });
      const row = await findByToken("tok-reader");
      expect(row.pending_blog).toBeNull();
      expect(row.pending_poetry).toBeNull();
    });
  });

  describe("who receives a send", () => {
    beforeEach(async () => {
      await upsertSubscriber({ email: "a@x.com", blog: true, poetry: false, token: "t-a" });
      await confirmByToken("t-a");
      await upsertSubscriber({ email: "b@x.com", blog: false, poetry: true, token: "t-b" });
      await confirmByToken("t-b");
      await upsertSubscriber({ email: "c@x.com", blog: true, poetry: true, token: "t-c" });
      // c never confirms.
      await upsertSubscriber({ email: "d@x.com", blog: true, poetry: true, token: "t-d" });
      await confirmByToken("t-d");
      await unsubscribeByToken("t-d");
    });

    it("includes only confirmed subscribers to that topic", async () => {
      const blog = await confirmedRecipients("blog");
      expect(blog.map((r) => r.email)).toEqual(["a@x.com"]);
      const poetry = await confirmedRecipients("poetry");
      expect(poetry.map((r) => r.email)).toEqual(["b@x.com"]);
    });

    it("excludes a topic that is only staged", async () => {
      await upsertSubscriber({ email: "a@x.com", blog: false, poetry: true, token: "t-x" });
      const poetry = await confirmedRecipients("poetry");
      expect(poetry.map((r) => r.email)).not.toContain("a@x.com");
    });

    it("refuses an unknown topic rather than building a query from it", async () => {
      await expect(confirmedRecipients("blog; drop table subscribers")).rejects.toThrow(
        /Unknown topic/
      );
      const [{ count }] = (
        await pool.query("select count(*) from subscribers")
      ).rows;
      expect(Number(count)).toBe(4);
    });

    it("counts subscribers by topic and pending state", async () => {
      expect(await subscriberCounts()).toEqual({ blog: 1, poetry: 1, pending: 1 });
    });
  });

  describe("claiming a send", () => {
    const post = { kind: "poetry", slug: "barren", subject: "New poem: Barren" };

    it("claims a fresh post", async () => {
      const claim = await claimSend(post);
      expect(claim).toMatchObject({ resumed: false });
      expect(claim.id).toBeTruthy();
    });

    it("refuses a second claim once the send is finished", async () => {
      const { id } = await claimSend(post);
      await completeSend(id, 12);
      expect(await claimSend(post)).toEqual({ alreadySent: true });
    });

    it("offers a resume for a send that stopped partway", async () => {
      const first = await claimSend(post);
      await recordDeliveries(first.id, ["a@x.com", "b@x.com"]);
      const second = await claimSend(post);
      expect(second).toMatchObject({ id: first.id, resumed: true });
    });

    it("keeps the two topics independent", async () => {
      const a = await claimSend(post);
      await completeSend(a.id, 1);
      const b = await claimSend({ ...post, kind: "blog" });
      expect(b.alreadySent).toBeUndefined();
    });
  });

  describe("recording deliveries", () => {
    it("remembers who has been reached, so a resume can skip them", async () => {
      const { id } = await claimSend({ kind: "blog", slug: "baa-wall", subject: "s" });
      await recordDeliveries(id, ["a@x.com", "b@x.com"]);
      await recordDeliveries(id, ["c@x.com"]);
      expect(await deliveredEmails(id)).toEqual(
        new Set(["a@x.com", "b@x.com", "c@x.com"])
      );
    });

    it("is safe to replay, so a retried batch cannot double-count", async () => {
      const { id } = await claimSend({ kind: "blog", slug: "baa-wall", subject: "s" });
      await recordDeliveries(id, ["a@x.com", "b@x.com"]);
      await recordDeliveries(id, ["b@x.com", "c@x.com"]);
      expect((await deliveredEmails(id)).size).toBe(3);
    });

    it("handles an empty batch without touching the database", async () => {
      const { id } = await claimSend({ kind: "blog", slug: "baa-wall", subject: "s" });
      await recordDeliveries(id, []);
      expect((await deliveredEmails(id)).size).toBe(0);
    });

    it("keeps a running count while the send is still going", async () => {
      const { id } = await claimSend({ kind: "blog", slug: "baa-wall", subject: "s" });
      await recordProgress(id, 100);
      const [mid] = await listSends();
      expect(mid.recipients).toBe(100);
      // Not finished: the console shows this as resumable rather than sent.
      expect(mid.completed_at).toBeNull();

      await completeSend(id, 250);
      const [done] = await listSends();
      expect(done.recipients).toBe(250);
      expect(done.completed_at).not.toBeNull();
    });

    it("drops delivery rows with the send they belong to", async () => {
      const { id } = await claimSend({ kind: "blog", slug: "baa-wall", subject: "s" });
      await recordDeliveries(id, ["a@x.com"]);
      await pool.query("delete from sends where id = $1", [id]);
      const [{ count }] = (
        await pool.query("select count(*) from send_deliveries")
      ).rows;
      expect(Number(count)).toBe(0);
    });
  });

  describe("the confirmation cooldown stamp", () => {
    it("is set on demand and survives a later signup", async () => {
      await signup({ blog: true });
      expect((await findByToken("tok-reader")).confirmation_sent_at).toBeNull();

      await markConfirmationSent("tok-reader");
      const stamped = await findByToken("tok-reader");
      expect(stamped.confirmation_sent_at).toBeInstanceOf(Date);

      const after = await signup({ poetry: true });
      expect(after.confirmation_sent_at).toEqual(stamped.confirmation_sent_at);
    });
  });

  describe("the migration's backfill", () => {
    it("closes legacy sends but leaves a genuinely partial one open", async () => {
      const { id: legacy } = await claimSend({ kind: "blog", slug: "old", subject: "s" });
      const { id: partial } = await claimSend({ kind: "blog", slug: "new", subject: "s" });
      await recordDeliveries(partial, ["a@x.com"]);

      const schema = readFileSync(
        join(here, "..", "scripts", "newsletter-schema.sql"),
        "utf8"
      );
      await pool.query(schema);

      const rows = Object.fromEntries(
        (await pool.query("select id, completed_at from sends")).rows.map((r) => [
          r.id,
          r.completed_at,
        ])
      );
      expect(rows[legacy]).not.toBeNull();
      expect(rows[partial]).toBeNull();
    });
  });
});
