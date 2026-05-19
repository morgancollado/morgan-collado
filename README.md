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

### Rotating the API key

Generate a new key in the Anthropic console, replace the value in `.env.local`
locally and in Vercel's project env (Production / Preview / Development as
needed), and revoke the old key. No code change required.

### Rate limit

20 messages per IP per hour, enforced in-memory in the edge route. The 429
response returns a themed error message. State does **not** survive cold
starts — by design; it's a personal toy, not abuse infrastructure.

### Model

`claude-opus-4-7` (set as a constant at the top of the route file —
`MODEL` — so it's easy to swap).
