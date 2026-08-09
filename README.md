This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Newsletter

Readers can subscribe at `/newsletter` (and from the footer, and from the foot
of `/blog` and `/poetry`) to be emailed when new work goes up. They choose
technical writing, poetry, or both, and can change or cancel that at any time.

Signup is **double opt-in** — nothing is ever sent to an address that hasn't
clicked its confirmation link.

### Setup

Add these to `.env.local` (see `.env.local.example`) and to the Vercel
project's environment variables:

| Variable | What it's for |
| --- | --- |
| `DATABASE_URL` | Neon / Vercel Postgres connection string |
| `RESEND_API_KEY` | Resend API key |
| `NEWSLETTER_FROM` | Sender, e.g. `Morgan Collado <notes@morgancollado.com>` |
| `NEWSLETTER_POSTAL_ADDRESS` | Physical address printed on every notification |
| `NEWSLETTER_ADMIN_PASSWORD` | Gates `/newsletter/admin` |

`NEWSLETTER_POSTAL_ADDRESS` is not optional. CAN-SPAM requires a physical
postal address on commercial bulk mail, and a send refuses to run without one
rather than quietly putting non-compliant mail in people's inboxes. The
confirmation mail is transactional and doesn't carry it.

Then verify the sending domain in Resend (Domains → Add, then publish the DKIM
and SPF records it gives you). Until that resolves, Resend only delivers to
your own account address — which is still enough to exercise the whole flow
locally.

Create the tables once with:

```bash
npm run newsletter:migrate
```

It's idempotent, so re-running it is safe.

### Sending

Go to `/newsletter/admin`, unlock it, and each post and poem is listed with
either a *sent* marker or a **Send…** button. Sending asks for a confirmation
click, then goes out immediately.

Two things worth knowing:

- **A post must be deployed before it can be emailed.** The console reads the
  content at build time, which is what guarantees you can never email a link
  that 404s.
- **A post can only be sent once.** A `unique (kind, slug)` constraint in the
  database enforces it, so a double-click or a second open tab cannot produce a
  duplicate blast. To deliberately re-send, delete that row from the `sends`
  table.
- **A send that stops partway can be resumed.** Every batch the provider
  accepts is recorded per recipient before the next one is attempted, so a send
  that hits the daily cap or a function timeout shows as *stopped after N* with
  a **Resume…** button. Resuming skips everyone already reached — it is not a
  second send, and nobody is mailed twice.

Unlike `QUEEN_PASSWORD`, leaving `NEWSLETTER_ADMIN_PASSWORD` blank **locks**
the console rather than opening it — a misconfiguration should fail towards
"nobody can send".

### Unsubscribing

Every notification carries `List-Unsubscribe` headers, so a mail client's own
unsubscribe button works, and a footer link offers the same thing plus
`/newsletter/manage`, where a reader can keep one category and drop the other.

### Limits

Resend's free plan allows 3,000 emails a month and **100 a day**. A list larger
than that needs either a paid plan, or the send spread over more than one day —
press **Send…**, let it stop when the cap is hit, and press **Resume…** the next
day. The delivery record is what makes that safe.

Two other ceilings worth knowing before the list gets big. The send runs inside
one request with `maxDuration = 60`, at roughly one provider round trip per
hundred recipients; and it holds every address in memory at once. Both are
comfortable in the low thousands and neither is the shape for a list past that,
which wants a queue rather than a button.

### Tests

```bash
npm test
```

Unit tests over the parts that decide who gets mail and who gets in — consent
and confirmation throttling, token and slug shapes, the password gate. No
component tests: the bugs this suite exists to prevent have all been in plain
functions.

There is also an integration suite that runs the real queries in `db.js`
against a real Postgres — the consent staging lives inside an `on conflict do
update`, which is not something you can verify by reading it. It skips unless
you point it at a throwaway database:

```bash
createdb newsletter_test
TEST_DATABASE_URL=postgres:///newsletter_test npm test
```

## Private chatbot route

There's a private chatbot at `/queen-9k3m7q` (a personal gift page; not linked
from anywhere on the site). The route is `noindex, nofollow` and the URL is
the only access control — **do not share it publicly**.

- Page: `src/app/queen-9k3m7q/`
- API: `src/app/api/queen/chat/route.js` (edge runtime, streaming)
- System prompt: `src/lib/queen-prompt.js` (source of truth in
  `src/lib/queen-prompt.txt`)

### Setup

Add `ANTHROPIC_API_KEY` to `.env.local` (see `.env.local.example`) and to the
Vercel project's environment variables.

### Password

Set `QUEEN_PASSWORD` to gate the page behind a single shared password (no
accounts). When set, visitors must enter it before they can chat, and the
`/api/queen/chat` endpoint rejects unauthorized requests too. A successful
unlock sets an httpOnly cookie (30-day expiry); the raw password is never
stored in the cookie or sent to the client. Leave `QUEEN_PASSWORD` blank or
unset to disable the gate entirely. To change the password, update the env var
(locally and in Vercel) — existing unlocked sessions will be invalidated.

### Rotating the API key

Generate a new key in the Anthropic console, replace the value in `.env.local`
locally and in Vercel's project env (Production / Preview / Development as
needed), and revoke the old key. No code change required.

### Rate limit

20 messages per IP per hour, enforced in-memory in the edge route. The 429
response returns a themed error message. State does **not** survive cold
starts — by design; it's a personal toy, not abuse infrastructure.

### Model

`claude-sonnet-4-6` (set as a constant at the top of the route file —
`MODEL` — so it's easy to swap).
