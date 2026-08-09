import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createPasswordGate, timingSafeEqual } from "@/lib/password-gate";

/**
 * The gate's whole job is to be closed. These cover the two ways it has been
 * asked to fail — an unset password, and a cookie that should no longer work —
 * and the property that makes a leaked cookie less than a leaked password.
 */

const ENV = "TEST_GATE_PASSWORD";

// 600k PBKDF2 rounds, several times per test.
const SLOW = 30_000;

function gate(over = {}) {
  return createPasswordGate({
    cookieName: "test_gate",
    envVar: ENV,
    salt: "test-gate:",
    failOpen: false,
    ...over,
  });
}

const withCookie = (value) =>
  new Request("https://example.com/", {
    headers: { cookie: `test_gate=${encodeURIComponent(value)}` },
  });

const cookieValue = (header) =>
  decodeURIComponent(header.slice(header.indexOf("=") + 1, header.indexOf(";")));

beforeEach(() => {
  process.env[ENV] = "correct horse battery staple";
});

afterEach(() => {
  delete process.env[ENV];
  vi.useRealTimers();
});

describe("timingSafeEqual", () => {
  it("compares equal strings as equal", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  it("rejects differences anywhere in the string", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("abc123", "zbc123")).toBe(false);
  });

  it("rejects different lengths and non-strings", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual(null, "abc")).toBe(false);
    expect(timingSafeEqual("abc", undefined)).toBe(false);
  });
});

describe("a fail-closed gate", () => {
  it("always requires a password", () => {
    expect(gate().passwordRequired()).toBe(true);
    delete process.env[ENV];
    expect(gate().passwordRequired()).toBe(true);
  });

  it("locks rather than opens when no password is set", async () => {
    delete process.env[ENV];
    const g = gate();
    expect(g.isConfigured()).toBe(false);
    expect(await g.isAuthorized(new Request("https://example.com/"))).toBe(false);
    // The blast radius of getting this backwards is a mail blast, so an unset
    // password must not authenticate — including against an empty submission.
    expect(await g.verify("")).toBe(false);
    expect(await g.verify("anything")).toBe(false);
  }, SLOW);
});

describe("a fail-open gate", () => {
  it("stops asking when no password is set", async () => {
    delete process.env[ENV];
    const g = gate({ failOpen: true });
    expect(g.passwordRequired()).toBe(false);
    expect(await g.isAuthorized(new Request("https://example.com/"))).toBe(true);
  });

  it("still gates when a password is set", async () => {
    const g = gate({ failOpen: true });
    expect(g.passwordRequired()).toBe(true);
    expect(await g.isAuthorized(new Request("https://example.com/"))).toBe(false);
  });
});

describe("verify", () => {
  it("accepts the configured password and nothing else", async () => {
    const g = gate();
    expect(await g.verify("correct horse battery staple")).toBe(true);
    expect(await g.verify("Correct horse battery staple")).toBe(false);
    expect(await g.verify("correct horse battery stapl")).toBe(false);
    expect(await g.verify("")).toBe(false);
    expect(await g.verify(null)).toBe(false);
  }, SLOW);
});

describe("the session cookie", () => {
  it("authorizes the request it was issued for", async () => {
    const g = gate();
    const value = cookieValue(await g.buildCookie());
    expect(await g.isAuthorized(withCookie(value))).toBe(true);
  }, SLOW);

  it("is not the password verifier", async () => {
    // It carries an expiry and a signature over it, so what leaks with the
    // cookie is time-boxed access rather than a digest of the password.
    const g = gate();
    const value = cookieValue(await g.buildCookie());
    const [expiry, signature] = value.split(".");
    expect(Number(expiry)).toBeGreaterThan(Date.now());
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(value).not.toContain("correct horse");
  }, SLOW);

  it("stops working once its stamped expiry passes", async () => {
    const g = gate({ maxAge: 60 });
    const value = cookieValue(await g.buildCookie());
    expect(await g.isAuthorized(withCookie(value))).toBe(true);

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);
    expect(await g.isAuthorized(withCookie(value))).toBe(false);
  }, SLOW);

  it("cannot have its expiry extended without the signature following", async () => {
    const g = gate({ maxAge: 60 });
    const value = cookieValue(await g.buildCookie());
    const [, signature] = value.split(".");
    const forged = `${Date.now() + 10_000_000}.${signature}`;
    expect(await g.isAuthorized(withCookie(forged))).toBe(false);
  }, SLOW);

  it("rejects a cookie signed under a different password", async () => {
    const issued = cookieValue(await gate().buildCookie());
    process.env[ENV] = "a completely different password";
    expect(await gate().isAuthorized(withCookie(issued))).toBe(false);
  }, SLOW);

  it("rejects malformed cookies and requests carrying none", async () => {
    const g = gate();
    for (const bad of ["", "nonsense", "abc.def", ".", "123456"]) {
      expect(await g.isAuthorized(withCookie(bad))).toBe(false);
    }
    expect(await g.isAuthorized(new Request("https://example.com/"))).toBe(false);
  }, SLOW);

  it("is httpOnly, same-site, and scoped to the whole site", async () => {
    const header = await gate().buildCookie();
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(header).toContain("Max-Age=");
  }, SLOW);

  it("does not leak between two gates sharing a password", async () => {
    // Different salts, so an unlocked queen page is not an unlocked console.
    const a = gate({ cookieName: "test_gate", salt: "gate-a:" });
    const b = gate({ cookieName: "test_gate", salt: "gate-b:" });
    const fromA = cookieValue(await a.buildCookie());
    expect(await a.isAuthorized(withCookie(fromA))).toBe(true);
    expect(await b.isAuthorized(withCookie(fromA))).toBe(false);
  }, SLOW);
});
