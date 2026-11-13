import { newsletterGate } from "@/lib/newsletter-auth";
import { listSends, subscriberCounts } from "@/lib/newsletter/db";
import { json } from "@/lib/newsletter/http";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** What the console needs on top of its build-time post list. */
export async function GET(req) {
  if (!(await newsletterGate.isAuthorized(req))) {
    return json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const [sends, counts] = await Promise.all([listSends(), subscriberCounts()]);
    return json({ sends, counts });
  } catch (error) {
    console.error("newsletter/admin/state failed:", error);
    return json({ error: "Couldn't load newsletter state." }, { status: 500 });
  }
}
