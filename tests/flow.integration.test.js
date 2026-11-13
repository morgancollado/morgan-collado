import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

/**
 * The whole reader journey through the real route handlers: sign up, confirm,
 * receive a new poem, unsubscribe, stop receiving. Postgres is real (same
 * stand-in for the Neon driver as db.integration.test.js) and Resend is a
 * fetch stub that records what would have been mailed.
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

// The password gate has its own suite; here the console is either open or not.
let adminAuthorized = true;
vi.mock("@/lib/newsletter-auth", () => ({
  newsletterGate: { isAuthorized: async () => adminAuthorized },
}));

if (URL_) process.env.DATABASE_URL = URL_;

const subscribe = await import("@/app/api/newsletter/subscribe/route");
const confirm = await import("@/app/api/newsletter/confirm/route");
const unsubscribe = await import("@/app/api/newsletter/unsubscribe/route");
const send = await import("@/app/api/newsletter/admin/send/route");
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
    adminAuthorized = true;
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
    const token = tokenFrom(mail[0]);

    // Unconfirmed readers get nothing.
    let out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "Lioness" });
    expect(out.status).toBe(409);
    expect((await out.json()).error).toMatch(/Nobody is subscribed/);

    // Confirm, then send.
    out = await post(confirm, "/api/newsletter/confirm", { token });
    expect(await out.json()).toMatchObject({ ok: true, poetry: true, blog: false });

    mail = [];
    out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "Lioness" });
    expect(await out.json()).toMatchObject({ ok: true, recipients: 1, subject: "New poem: Lioness" });
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toEqual(["reader@example.com"]);
    expect(mail[0].headers["List-Unsubscribe"]).toContain(`token=${token}`);

    // The same poem cannot go out twice.
    out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "Lioness" });
    expect(out.status).toBe(409);
    expect((await out.json()).error).toMatch(/already been sent/);

    // One-click unsubscribe, then the next poem reaches nobody.
    out = await post(unsubscribe, `/api/newsletter/unsubscribe?token=${token}`);
    expect(await out.json()).toMatchObject({ ok: true, email: "reader@example.com" });

    mail = [];
    out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "doggerel" });
    expect(out.status).toBe(409);
    expect(mail).toHaveLength(0);
  });

  it("sends a poem only to poetry readers and an essay only to essay readers", async () => {
    await signUpAndConfirm("poems@example.com", { poetry: true });
    await signUpAndConfirm("essays@example.com", { blog: true });
    await signUpAndConfirm("both@example.com", { blog: true, poetry: true });

    await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "doggerel" });
    expect(mail.map((m) => m.to[0]).sort()).toEqual(["both@example.com", "poems@example.com"]);

    mail = [];
    await post(send, "/api/newsletter/admin/send", {
      kind: "blog",
      slug: "a-mind-that-only-perceives",
    });
    expect(mail.map((m) => m.to[0]).sort()).toEqual(["both@example.com", "essays@example.com"]);
  });

  it("refuses to send without the admin password, or for a post that isn't on disk", async () => {
    await signUpAndConfirm("poems@example.com", { poetry: true });

    adminAuthorized = false;
    let out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "doggerel" });
    expect(out.status).toBe(401);

    adminAuthorized = true;
    for (const slug of ["not-a-poem", "../../package"]) {
      out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug });
      expect(out.status).toBe(404);
    }
    expect(mail).toHaveLength(0);
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
    let out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "doggerel" });
    expect(out.status).toBe(500);
    expect((await out.json()).error).toMatch(`${BATCH_LIMIT} recipients have it`);
    expect(mail).toHaveLength(BATCH_LIMIT);
    const first = mail.map((m) => m.to[0]);

    stubResend();
    out = await post(send, "/api/newsletter/admin/send", { kind: "poetry", slug: "doggerel" });
    expect(await out.json()).toMatchObject({ ok: true, recipients: total, skipped: BATCH_LIMIT });
    const second = mail.map((m) => m.to[0]);

    expect(second).toHaveLength(50);
    expect(new Set([...first, ...second]).size).toBe(total);
  });
});
