import { newsletterGate } from "@/lib/newsletter-auth";
import { json, readJson } from "@/lib/newsletter/http";

export const runtime = "edge";

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

  const body = await readJson(req);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return json({ error: "Wrong password." }, { status: 401 });

  const submitted = await newsletterGate.tokenFor(password);
  const expected = await newsletterGate.expectedToken();
  if (submitted !== expected) {
    return json({ error: "Wrong password." }, { status: 401 });
  }

  return json(
    { ok: true },
    { headers: { "Set-Cookie": newsletterGate.buildCookie(expected) } }
  );
}
