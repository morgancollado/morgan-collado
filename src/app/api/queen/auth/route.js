import { passwordRequired, verify, isAuthorized, buildCookie } from "@/lib/queen-auth";

export const runtime = "edge";

function json(payload, init) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
}

export async function GET(req) {
  return json({
    required: passwordRequired(),
    authorized: await isAuthorized(req),
  });
}

export async function POST(req) {
  if (!passwordRequired()) return json({ ok: true });

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request." }, { status: 400 });
  }

  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) {
    return json({ error: "Wrong password." }, { status: 401 });
  }

  if (!(await verify(password))) {
    return json({ error: "Wrong password." }, { status: 401 });
  }

  return json({ ok: true }, { headers: { "Set-Cookie": await buildCookie() } });
}
