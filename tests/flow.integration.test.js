import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

/**
 * The whole reader journey: sign up, confirm, receive a new poem, unsubscribe,
 * stop receiving. The reader's side goes through the real route handlers; the
 * sending side goes through what the "Send newsletter" workflow runs. Postgres
 * is real (same stand-in for the Neon driver as db.integration.test.js) and
 * Resend is a fetch stub that records what would have been mailed.
 *
 * Runs in its own schema so it can share TEST_DATABASE_URL with the db suite
 * while vitest runs the two files in parallel.
 *
 *   TEST_DATABASE_URL=postgres://localhost/newsletter_test npm test
 */

const URL_ = process.env.TEST_DATABASE_URL;
const SCHEMA = "newsletter_flow_test";
const pool = URL_
  ? new pg.Pool({ connectionString: URL_, options: `-c search_path=${SCHEMA}` })
  : null;

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

if (URL_) process.env.DATABASE_URL = URL_;

const subscribe = await import("@/app/api/newsletter/subscribe/route");
const confirm = await import("@/app/api/newsletter/confirm/route");
const unsubscribe = await import("@/app/api/newsletter/unsubscribe/route");
const { sendPost, SendRefused } = await import("@/lib/newsletter/send");
const { runFromEnv } = await import("@/lib/newsletter/send-cli");
const { BATCH_LIMIT } = await import("@/lib/newsletter/resend");

const here = dirname(fileURLToPath(import.meta.url));

let mail;
let failBatch;

function stubResend() {
  mail = [];
  failBatch = null;
  let batches = 0;
  vi.stubGlobal("fetch", async (url, init) => {
    const body = JSON.parse(init.body);
    if (url.endsWith("/emails/batch")) {
      batches += 1;
      if (failBatch === batches) {
        return {
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          json: async () => ({ message: "Daily sending quota exceeded" }),
        };
      }
      mail.push(...body);
    } else {
      mail.push(body);
    }
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  });
}

let ip = 0;
const post = (handler, path, body) =>
  handler.POST(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );

const tokenFrom = (message) => message.text.match(/token=([A-Za-z0-9_-]+)/)[1];

async function signUpAndConfirm(email, topics) {
  mail = [];
  const res = await post(subscribe, "/api/newsletter/subscribe", { email, ...topics });
  expect(res.status).toBe(200);
  const token = tokenFrom(mail[0]);
  expect((await post(confirm, "/api/newsletter/confirm", { token })).status).toBe(200);
  mail = [];
  return token;
}

describe.skipIf(!URL_)("the reader journey, through the routes", () => {
  beforeAll(async () => {
    const admin = new pg.Pool({ connectionString: URL_ });
    await admin.query(`drop schema if exists ${SCHEMA} cascade`);
    await admin.query(`create schema ${SCHEMA}`);
    await admin.end();
    await pool.query(
      readFileSync(join(here, "..", "scripts", "newsletter-schema.sql"), "utf8")
    );
  });

  beforeEach(async () => {
    await pool.query("truncate send_deliveries, sends, subscribers");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NEWSLETTER_FROM", "Morgan <news@example.com>");
    stubResend();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await pool?.query(`drop schema if exists ${SCHEMA} cascade`);
    await pool?.end();
  });

  it("signs up, confirms, gets the poem, unsubscribes, and stops getting poems", async () => {
    // Sign up: one confirmation email, nothing else.
    const res = await post(subscribe, "/api/newsletter/subscribe", {
      email: "  Reader@Example.com ",
      poetry: true,
    });
    expect(res.status).toBe(200);
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toEqual(["reader@example.com"]);
    expect(mail[0].subject).toBe("Confirm your subscription");
    expect(mail[0].text).toMatch(/asked to hear when I publish new /);
    expect(mail[0].html).toMatch(/asked to hear when I publish new /);
    const token = tokenFrom(mail[0]);

    // Unconfirmed readers get nothing.
    await expect(sendPost({ kind: "poetry", slug: "Lioness" })).rejects.toThrow(
      /Nobody is subscribed/
    );

    // Confirm, then send.
    let out = await post(confirm, "/api/newsletter/confirm", { token });
    expect(await out.json()).toMatchObject({ ok: true, poetry: true, blog: false });

    mail = [];
    expect(await sendPost({ kind: "poetry", slug: "Lioness" })).toMatchObject({
      status: "sent",
      sent: 1,
      recipients: 1,
      subject: "New poem: Lioness",
    });
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toEqual(["reader@example.com"]);
    expect(mail[0].headers["List-Unsubscribe"]).toContain(`token=${token}`);

    // The same poem cannot go out twice.
    await expect(sendPost({ kind: "poetry", slug: "Lioness" })).rejects.toThrow(
      /already been sent/
    );

    // One-click unsubscribe, then the next poem reaches nobody.
    out = await post(unsubscribe, `/api/newsletter/unsubscribe?token=${token}`);
    expect(await out.json()).toMatchObject({ ok: true, email: "reader@example.com" });

    mail = [];
    await expect(sendPost({ kind: "poetry", slug: "doggerel" })).rejects.toThrow(SendRefused);
    expect(mail).toHaveLength(0);
  });

  it("sends a poem only to poetry readers and an essay only to essay readers", async () => {
    await signUpAndConfirm("poems@example.com", { poetry: true });
    await signUpAndConfirm("essays@example.com", { blog: true });
    await signUpAndConfirm("both@example.com", { blog: true, poetry: true });

    await sendPost({ kind: "poetry", slug: "doggerel" });
    expect(mail.map((m) => m.to[0]).sort()).toEqual(["both@example.com", "poems@example.com"]);

    mail = [];
    await sendPost({ kind: "blog", slug: "a-mind-that-only-perceives" });
    expect(mail.map((m) => m.to[0]).sort()).toEqual(["both@example.com", "essays@example.com"]);
  });

  it("refuses a post that isn't on disk, and names the newest instead", async () => {
    await signUpAndConfirm("poems@example.com", { poetry: true });

    for (const slug of ["not-a-poem", "../../package"]) {
      await expect(sendPost({ kind: "poetry", slug })).rejects.toThrow(/The newest are: /);
    }
    expect(mail).toHaveLength(0);
  });

  it("sends the newest piece of that kind when no slug is given", async () => {
    await signUpAndConfirm("poems@example.com", { poetry: true });
    const { listSendable } = await import("@/lib/newsletter/posts");
    const newest = listSendable().poetry[0];

    const result = await sendPost({ kind: "poetry", slug: "  " });
    expect(result).toMatchObject({ status: "sent", slug: newest.slug, sent: 1 });
    expect(mail).toHaveLength(1);
  });

  it("dry run counts recipients and sends and records nothing", async () => {
    await signUpAndConfirm("poems@example.com", { poetry: true });
    await signUpAndConfirm("both@example.com", { blog: true, poetry: true });

    const result = await sendPost({ kind: "poetry", slug: "doggerel", dryRun: true });
    expect(result).toMatchObject({ status: "would-send", recipients: 2, wouldSend: 2 });
    expect(mail).toHaveLength(0);
    expect((await pool.query("select count(*)::int as n from sends")).rows[0].n).toBe(0);

    // A real send afterwards is unaffected, and a dry run after it says so.
    await sendPost({ kind: "poetry", slug: "doggerel" });
    expect(mail).toHaveLength(2);
    mail = [];
    expect(await sendPost({ kind: "poetry", slug: "doggerel", dryRun: true })).toMatchObject({
      status: "already-sent",
    });
    expect(mail).toHaveLength(0);
  });

  it("runs from the workflow's environment without printing addresses or secrets", async () => {
    await signUpAndConfirm("secret-reader@example.com", { poetry: true });
    const env = {
      NEWSLETTER_KIND: "poetry",
      NEWSLETTER_SLUG: "doggerel",
      DATABASE_URL: "postgres://user:hunter2@db.example/newsletter",
      RESEND_API_KEY: "re_supersecret",
      NEWSLETTER_FROM: "Morgan <news@example.com>",
      NEXT_PUBLIC_BASE_URL: "https://example.com",
    };
    const logged = [];
    const log = (line) => logged.push(line);

    // Dry run is the default when the box isn't explicitly unticked.
    expect(await runFromEnv(env, { log })).toBe(0);
    expect(mail).toHaveLength(0);
    expect(logged.join("\n")).toMatch(/Would send now: 1/);

    expect(await runFromEnv({ ...env, NEWSLETTER_DRY_RUN: "false" }, { log })).toBe(0);
    expect(mail).toHaveLength(1);
    expect(logged.join("\n")).toMatch(/Sent now: 1/);

    // A second real run is refused with a non-zero exit, so the run shows red.
    expect(await runFromEnv({ ...env, NEWSLETTER_DRY_RUN: "false" }, { log })).toBe(1);
    expect(mail).toHaveLength(1);

    const output = logged.join("\n");
    for (const secret of ["secret-reader@example.com", "hunter2", "re_supersecret"]) {
      expect(output).not.toContain(secret);
    }
  });

  it("resumes a send that hit the daily cap without mailing anyone twice", async () => {
    const total = BATCH_LIMIT + 50;
    await pool.query(
      `insert into subscribers (email, poetry, status, token, confirmed_at)
       select 'r' || i || '@example.com', true, 'confirmed', 'tok-resume-' || lpad(i::text, 4, '0'), now()
       from generate_series(1, $1) as i`,
      [total]
    );

    failBatch = 2;
    await expect(sendPost({ kind: "poetry", slug: "doggerel" })).rejects.toThrow(
      `${BATCH_LIMIT} recipients have it`
    );
    expect(mail).toHaveLength(BATCH_LIMIT);
    const first = mail.map((m) => m.to[0]);

    // A dry run in between reports the resume honestly.
    expect(await sendPost({ kind: "poetry", slug: "doggerel", dryRun: true })).toMatchObject({
      status: "would-send",
      alreadyDelivered: BATCH_LIMIT,
      wouldSend: 50,
    });

    stubResend();
    expect(await sendPost({ kind: "poetry", slug: "doggerel" })).toMatchObject({
      status: "sent",
      recipients: total,
      skipped: BATCH_LIMIT,
    });
    const second = mail.map((m) => m.to[0]);

    expect(second).toHaveLength(50);
    expect(new Set([...first, ...second]).size).toBe(total);
  });
});
