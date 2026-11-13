import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendBatch, BATCH_LIMIT } from "@/lib/newsletter/resend";
import { sendNewPost, sendConfirmation } from "@/lib/newsletter/email";
import { listSendable, loadForSend } from "@/lib/newsletter/posts";

/**
 * The outbound half: what actually goes to Resend when a post is sent. Resend
 * is replaced by a fetch stub that records each request, so these check the
 * messages themselves — one per reader, each with its own way out.
 */

let calls;

function stubFetch(respond = () => ({ ok: true, body: { data: [] } })) {
  calls = [];
  vi.stubGlobal("fetch", async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body, headers: init.headers });
    const { ok, body: payload, status = ok ? 200 : 422 } = respond(calls.length, body);
    return {
      ok,
      status,
      statusText: ok ? "OK" : "Unprocessable",
      json: async () => payload,
    };
  });
}

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("NEWSLETTER_FROM", "Morgan <news@example.com>");
  stubFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const readers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    email: `reader${i}@example.com`,
    token: `token-${String(i).padStart(4, "0")}`,
  }));

describe("sendBatch", () => {
  it("splits at Resend's batch cap and reports each accepted chunk", async () => {
    const seen = [];
    const messages = readers(BATCH_LIMIT * 2 + 5).map(({ email }) => ({
      to: [email],
      subject: "s",
      text: "t",
    }));

    const sent = await sendBatch(messages, {
      onChunk: (emails, total) => seen.push([emails.length, total]),
    });

    expect(sent).toBe(BATCH_LIMIT * 2 + 5);
    expect(calls.map((c) => c.body.length)).toEqual([BATCH_LIMIT, BATCH_LIMIT, 5]);
    expect(calls.every((c) => c.url === "https://api.resend.com/emails/batch")).toBe(true);
    expect(calls[0].body[0].from).toBe("Morgan <news@example.com>");
    expect(seen).toEqual([
      [BATCH_LIMIT, BATCH_LIMIT],
      [BATCH_LIMIT, BATCH_LIMIT * 2],
      [5, BATCH_LIMIT * 2 + 5],
    ]);
  });

  it("stops at a rejected chunk, having reported only what landed", async () => {
    stubFetch((n) =>
      n === 2
        ? { ok: false, body: { message: "Daily sending quota exceeded" } }
        : { ok: true, body: { data: [] } }
    );
    const reached = [];
    const messages = readers(BATCH_LIMIT * 3).map(({ email }) => ({ to: [email] }));

    await expect(
      sendBatch(messages, { onChunk: (emails) => reached.push(...emails) })
    ).rejects.toThrow("Resend: Daily sending quota exceeded");

    expect(calls).toHaveLength(2);
    expect(reached).toHaveLength(BATCH_LIMIT);
  });

  it("refuses to send without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendBatch([{ to: ["a@example.com"] }])).rejects.toThrow(
      "RESEND_API_KEY is not set."
    );
    expect(calls).toHaveLength(0);
  });
});

describe("sendNewPost", () => {
  const poem = {
    slug: "Lioness",
    title: "Lioness",
    date: "2026-09-01",
    excerpt: ["first line", "second <line>"],
  };

  it("gives every reader their own unsubscribe link and one-click header", async () => {
    await sendNewPost({ recipients: readers(2), kind: "poetry", post: poem });

    const [batch] = calls.map((c) => c.body);
    expect(batch).toHaveLength(2);

    batch.forEach((message, i) => {
      const token = `token-000${i}`;
      expect(message.to).toEqual([`reader${i}@example.com`]);
      expect(message.subject).toBe("New poem: Lioness");
      expect(message.headers["List-Unsubscribe"]).toBe(
        `<http://localhost:3000/api/newsletter/unsubscribe?token=${token}>`
      );
      expect(message.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      expect(message.html).toContain(`/newsletter/unsubscribe?token=${token}`);
      expect(message.text).toContain(`Unsubscribe: http://localhost:3000/newsletter/unsubscribe?token=${token}`);
      expect(message.html).toContain("http://localhost:3000/poetry/Lioness");
    });

    // The excerpt comes from a file, but it still gets escaped.
    expect(batch[0].html).toContain("second &lt;line&gt;");
    expect(batch[0].html).not.toContain("<line>");
    // No reader sees another reader's token.
    expect(batch[0].html).not.toContain("token-0001");
  });

  it("titles technical writing differently from a poem", async () => {
    await sendNewPost({
      recipients: readers(1),
      kind: "blog",
      post: { slug: "a-post", title: "A Post", date: "2026-09-01", description: "About it." },
    });
    expect(calls[0].body[0].subject).toBe("New writing: A Post");
    expect(calls[0].body[0].html).toContain("About it.");
  });
});

describe("sendConfirmation", () => {
  it.each([
    [["poetry"], "new poetry"],
    [["blog"], "new technical writing"],
    [["blog", "poetry"], "new technical writing and poetry"],
  ])("names what %j signed up for, in the first person", async (topics, what) => {
    await sendConfirmation({ email: "reader@example.com", token: "tok", topics });

    const [message] = calls.map((c) => c.body);
    const sentence = `Someone — hopefully you — asked to hear when I publish ${what}.`;
    expect(message.subject).toBe("Confirm your subscription");
    expect(message.text).toContain(sentence);
    expect(message.html).toContain(sentence);
    expect(message.text).not.toContain("Morgan Collado");
    expect(message.html).not.toContain("Morgan Collado");
  });
});

describe("the sendable inventory", () => {
  // The admin console lists these, and the send route reloads each one by
  // slug. A piece that lists but won't reload is a Send button that 404s,
  // which is how Lioness.md slipped past the old lowercase-only slug check.
  const { blog, poetry } = listSendable();

  it("finds both collections", () => {
    expect(blog.length).toBeGreaterThan(0);
    expect(poetry.length).toBeGreaterThan(0);
  });

  it.each([
    ...blog.map((post) => ["blog", post.slug]),
    ...poetry.map((poem) => ["poetry", poem.slug]),
  ])("can send %s/%s", (kind, slug) => {
    const post = loadForSend(kind, slug);
    expect(post?.slug).toBe(slug);
    expect(post.title).toBeTruthy();
  });
});
