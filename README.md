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
project's environment variables. The site needs them for sign-up, confirmation
and unsubscribe mail:

| Variable | What it's for |
| --- | --- |
| `DATABASE_URL` | Neon / Vercel Postgres connection string |
| `RESEND_API_KEY` | Resend API key |
| `NEWSLETTER_FROM` | Sender, e.g. `Morgan Collado <notes@morgancollado.com>` |

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

New posts go out from the **Send newsletter** GitHub Actions workflow
(`.github/workflows/newsletter.yml`). There is no admin page on the site: only
someone with write access to this repository can start the workflow, behind
GitHub's own sign-in and two-factor.

**One-time setup** (Settings → Environments → **New environment**, name it
`newsletter`):

| Where | Name | Value |
| --- | --- | --- |
| Environment secret | `DATABASE_URL` | Same value as in Vercel |
| Environment secret | `RESEND_API_KEY` | Same value as in Vercel |
| Environment secret | `NEWSLETTER_FROM` | Same value as in Vercel |
| Environment variable | `SITE_URL` | The live site's address, starting `https://` |

Then, on the same page:

- **Deployment branches and tags** → *Selected branches and tags* → add `main`.
  This is the important one. A run can be started from any branch, and a
  branch's copy of the workflow and the send script is whatever was pushed to
  it; with this rule, only `main` ever sees the secrets.
- **Required reviewers** → yourself (optional). Every run then waits for an
  approval tap before it starts.

Two more ways to shrink what these secrets can do, both optional:

- Give GitHub a Resend key with **Sending access** only, limited to your
  domain, rather than a full-access key.
- Give GitHub its own Neon role that can only read `subscribers` and read and
  write `sends` and `send_deliveries`, rather than the database owner's
  connection string.

**To send:**

1. Actions → **Send newsletter** → **Run workflow** (on a phone: the GitHub
   app → this repository → Actions → Send newsletter → Run workflow).
2. Pick **poetry** or **technical writing**. Leave the piece blank for the
   newest one, or type its file name without `.md` (e.g. `Lioness`).
3. Leave **Dry run** ticked the first time. The run's summary says what would
   go out and to how many people, and flags any missing setup.
4. Run it again with **Dry run** unticked to send.

The piece is typed rather than picked from a list because GitHub's dropdowns
have to be written into the workflow file, which would mean editing it for
every new post. A name that doesn't match is refused and the run lists the
newest ones.

Run logs show counts, never subscriber addresses or secrets.

Things worth knowing:

- **A post must be live before it can be emailed.** The workflow reads the
  markdown on `main`, then checks the post's page loads on the live site, and
  refuses to send if it doesn't. A dry run says whether it's live yet.
- **Real sends only run from `main`.** The script refuses otherwise, and the
  environment's branch rule keeps the secrets away from other branches anyway.
- **A post can only be sent once.** A `unique (kind, slug)` constraint in the
  database enforces it, so a second run is refused. To deliberately re-send,
  delete that row from the `sends` table.
- **A send that stops partway can be resumed.** Every batch the provider
  accepts is recorded per recipient before the next one is attempted, so a
  run that hits the daily cap fails with a count of who has it. Running it
  again skips everyone already reached, so nobody is mailed twice. Each batch
  also carries a Resend idempotency key, so even a batch Resend accepted just
  as the run died isn't sent twice if it's retried within 24 hours.
- **Don't run it from your laptop while the workflow is running.** Workflow
  runs never overlap, but a local run and a workflow run on the same post at
  the same moment could both resume it.

It can also be run locally with the same variables in `.env`-style
environment:

```bash
NEWSLETTER_KIND=poetry NEWSLETTER_DRY_RUN=true npm run newsletter:send
```

### Unsubscribing

Every notification carries `List-Unsubscribe` headers, so a mail client's own
unsubscribe button works, and a footer link offers the same thing plus
`/newsletter/manage`, where a reader can keep one category and drop the other.

### Limits

Resend's free plan allows 3,000 emails a month and **100 a day**, and that
daily count includes confirmation emails from new sign-ups. A list larger
than that needs either a paid plan, or the send spread over more than one day —
run the workflow, let it stop when the cap is hit, and run it again the next
day. The delivery record is what makes that safe.

One other ceiling worth knowing before the list gets big: the send holds every
address in memory at once and makes one provider round trip per hundred
recipients, inside a job capped at 15 minutes. That is comfortable well into
the thousands.

### Tests

```bash
npm test
```

Unit tests over the parts that decide who gets mail and who gets in — consent
and confirmation throttling, token and slug shapes, the send workflow's
inputs, the password gate. No
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
