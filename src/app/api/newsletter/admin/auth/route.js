import { newsletterGate } from "@/lib/newsletter-auth";
import { json, readJson, createRateLimiter } from "@/lib/newsletter/http";

export const runtime = "edge";

/**
 * The door this guards opens onto "email everyone on the list", and behind it
 * is a single shared password with no account to lock. Unlimited guessing is
 * the one thing that turns a good password into a bad one, so attempts are
 * capped well below what a guessing run needs and far above what a person who
 * has forgotten which password they used will ever hit.
 *
 * PBKDF2 in the gate already makes each attempt cost real work; this makes the
 * number of attempts finite as well.
 */
const allow = createRateLimiter({ limit: 8, windowMs: 15 * 60 * 1000 });

export async function GET(req) {
  return json({
    // `configured` is what lets the console say "the password isn't set"
    // rather than silently rejecting a correct-looking attempt forever.
    configured: newsletterGate.isConfigured(),
    authorized: await newsletterGate.isAuthorized(req),
  });
}

export async function POST(req) {
  if (!newsletterGate.isConfigured()) {
    return json(
      { error: "NEWSLETTER_ADMIN_PASSWORD is not set, so this console is locked." },
      { status: 503 }
    );
  }

  if (!allow(req)) {
    return json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await readJson(req);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return json({ error: "Wrong password." }, { status: 401 });

  if (!(await newsletterGate.verify(password))) {
    return json({ error: "Wrong password." }, { status: 401 });
  }

  return json(
    { ok: true },
    { headers: { "Set-Cookie": await newsletterGate.buildCookie() } }
  );
}
