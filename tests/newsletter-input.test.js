import { describe, it, expect } from "vitest";
import { newToken, isTokenShaped } from "@/lib/newsletter/tokens";
import { isSlugShaped } from "@/lib/newsletter/posts";
import { looksLikeEmail, createRateLimiter, json } from "@/lib/newsletter/http";
import { normalizeEmail, isTopic } from "@/lib/newsletter/db";
import { escapeHtml } from "@/lib/newsletter/email";

const request = (ip) => new Request("https://example.com/", {
  headers: ip ? { "x-forwarded-for": ip } : {},
});

describe("newToken", () => {
  it("produces a token its own shape check accepts", () => {
    for (let i = 0; i < 25; i += 1) expect(isTokenShaped(newToken())).toBe(true);
  });

  it("is URL-safe, so it survives being a query parameter", () => {
    for (let i = 0; i < 25; i += 1) {
      const token = newToken();
      expect(encodeURIComponent(token)).toBe(token);
    }
  });

  it("does not repeat", () => {
    const seen = new Set(Array.from({ length: 200 }, () => newToken()));
    expect(seen.size).toBe(200);
  });
});

describe("isTokenShaped", () => {
  it("rejects anything that isn't a plausible token", () => {
    for (const bad of [null, undefined, 42, "", "short", "a".repeat(65), "has space", "semi;colon", "quote'"]) {
      expect(isTokenShaped(bad)).toBe(false);
    }
  });
});

describe("isSlugShaped", () => {
  it("accepts the slugs the content directory actually uses", () => {
    for (const slug of ["barren", "a-poem-for-new-orleans", "baa-wall", "i"]) {
      expect(isSlugShaped(slug)).toBe(true);
    }
  });

  it("rejects path traversal", () => {
    // The loader behind this does join(dir, slug + ".md") with no guard of its
    // own, so this regex is the only thing standing between a request body and
    // an arbitrary file read.
    for (const bad of [
      "../../../../etc/passwd",
      "..",
      "./secret",
      "a/b",
      "a\\b",
      "nested/../../escape",
      "%2e%2e%2fetc",
    ]) {
      expect(isSlugShaped(bad)).toBe(false);
    }
  });

  it("rejects non-strings, uppercase, and a leading dash", () => {
    for (const bad of [null, undefined, 7, "", "-leading", "Upper", "a".repeat(122)]) {
      expect(isSlugShaped(bad)).toBe(false);
    }
  });
});

describe("looksLikeEmail", () => {
  it("accepts ordinary addresses", () => {
    for (const good of ["a@b.co", "morgan+news@example.com", "x.y@sub.domain.org"]) {
      expect(looksLikeEmail(good)).toBe(true);
    }
  });

  it("rejects what is obviously not one", () => {
    for (const bad of [null, 12, "", "no-at-sign", "two@@at.com", "spaces in@it.com", "trailing@dot"]) {
      expect(looksLikeEmail(bad)).toBe(false);
    }
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims, so one person is one row", () => {
    expect(normalizeEmail("  Morgan@Example.COM ")).toBe("morgan@example.com");
  });

  it("survives absent input", () => {
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(null)).toBe("");
  });
});

describe("isTopic", () => {
  it("accepts only the two real topics", () => {
    expect(isTopic("blog")).toBe(true);
    expect(isTopic("poetry")).toBe(true);
    for (const bad of ["", "BLOG", "blog; drop table", null, undefined]) {
      expect(isTopic(bad)).toBe(false);
    }
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit and then refuses", () => {
    const allow = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const req = request("1.2.3.4");
    expect([allow(req), allow(req), allow(req), allow(req)]).toEqual([
      true, true, true, false,
    ]);
  });

  it("counts each address separately", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(allow(request("1.1.1.1"))).toBe(true);
    expect(allow(request("1.1.1.1"))).toBe(false);
    expect(allow(request("2.2.2.2"))).toBe(true);
  });

  it("takes the first hop of a forwarded-for chain", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(allow(request("9.9.9.9, 10.0.0.1"))).toBe(true);
    expect(allow(request("9.9.9.9, 10.0.0.2"))).toBe(false);
  });

  it("lets the window lapse", async () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 5 });
    const req = request("3.3.3.3");
    expect(allow(req)).toBe(true);
    expect(allow(req)).toBe(false);
    await new Promise((r) => setTimeout(r, 12));
    expect(allow(req)).toBe(true);
  });

  it("does not grow without bound", () => {
    // An unswept Map is a memory leak on a long-lived edge instance: every
    // address that ever posts the form stays resident for ever.
    const allow = createRateLimiter({ limit: 5, windowMs: 60_000, maxEntries: 50 });
    for (let i = 0; i < 500; i += 1) allow(request(`10.0.${i >> 8}.${i & 255}`));
    // Still enforcing after the cap is reached, rather than falling open.
    const req = request("10.0.0.1");
    const verdicts = Array.from({ length: 6 }, () => allow(req));
    expect(verdicts.slice(0, 5)).toEqual([true, true, true, true, true]);
    expect(verdicts[5]).toBe(false);
  });

  it("falls back to a single bucket when there is no address header", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(allow(request(null))).toBe(true);
    expect(allow(request(null))).toBe(false);
  });
});

describe("json", () => {
  it("never lets a response with personal data into a shared cache", async () => {
    const response = json({ email: "a@b.co" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toEqual({ email: "a@b.co" });
  });

  it("keeps the caller's status and extra headers", () => {
    const response = json({ ok: true }, { status: 201, headers: { "Set-Cookie": "a=b" } });
    expect(response.status).toBe(201);
    expect(response.headers.get("Set-Cookie")).toBe("a=b");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("escapeHtml", () => {
  it("neutralises markup, since post titles reach email bodies unrendered", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });

  it("escapes the ampersand first, so entities are not double-decoded", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("renders absent values as empty rather than 'undefined'", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
