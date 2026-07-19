---
title: "Building the Queen"
description: "There is a page on this site you cannot find — a streaming AI chatbot with a password, a rate limit, and a philosophy about how simple a personal toy is allowed to be."
date: "2026-07-01"
category: "Collado CodeWorks"
---

There is a page on this site that does not appear in the navigation, the sitemap, or any search engine. It is a chat window with an attitude problem. Behind it sits a real streaming pipeline to a frontier language model, a password gate, and a rate limiter — and behind *that* sits the actual subject of this essay, which is not the chatbot at all. It is the question of how simple a piece of software is allowed to be.

The professional answer is: never as simple as you want. Production systems earn their complexity — distributed state, observability, retry budgets, audit trails. I spend my working days on the compliance-heavy end of that spectrum, where the simple version of anything is usually the version that gets you a finding. So I built the Queen partly as a technical Easter egg and partly as an experiment in the opposite discipline: make every component exactly as robust as a personal toy requires, and *not one line more.*

## The pipeline: streaming without the ceremony

The architecture is two edge routes and a client. The chat route accepts a message history, validates its shape, and calls the Anthropic Messages API with streaming enabled. Anthropic answers in server-sent events — a structured protocol of typed JSON envelopes — and here is the first deliberate simplification: I do not forward that protocol to the browser. The server parses the SSE stream, plucks out only the text deltas, and enqueues raw text into a plain `ReadableStream`. The client receives `text/plain` and appends chunks to the last message as they arrive.

The sophisticated version would forward the events and let the client handle tool calls, stop reasons, token counts. The Queen has no tools, one stop reason worth caring about, and no dashboard to display token counts on. Translating a rich protocol down to *just the words* at the server boundary meant the client-side consumer is a `getReader()` loop a first-year student could audit. The protocol is not dumbed down. It is *scoped* down, to exactly what the product displays.

## The gate: a password without a user table

The page can require a password. What it cannot require is everything a password usually drags in behind it — a user table, a session store, a reset flow, an email provider. The whole gate is one environment variable and one cookie. The server hashes the configured password with a prefix, and a visitor's attempt is hashed the same way and compared; on a match, the hash itself becomes an HttpOnly cookie good for thirty days. The chat route checks the cookie and answers 401 otherwise. No database row was created. Nothing secret is stored client-side that was not already derived from the secret. And if the environment variable is absent, the gate simply is not there — the feature degrades to *off*, not to *broken*.

Is this an authentication system I would ship for a healthcare product? It is not, and that is precisely the point. It is a doorman for a joke, built with the same care for its threat model — one shared secret, low stakes, no accounts — that a real system deserves for its real one. Rigor is not the same thing as machinery. You can be rigorous about being small.

## The rate limit that forgets, on purpose

The chat route allows each visitor a fixed number of requests per hour, tracked in an in-memory map keyed by IP. Any engineer who has operated serverless infrastructure has already spotted the flaw: edge functions run as many instances, each with its own memory, and every cold start resets the count. As distributed rate limiting goes, this is not distributed and barely rate limiting.

I know. It is in the code comments. And it is the correct design anyway, because the requirement was never *precisely enforce a quota* — it was *make an unattended API key not worth abusing.* A leaky per-instance limit raises the cost of abuse from free to annoying, which for an unlisted page on a personal site is the entire job. The alternative was adding a hosted key-value store — a new dependency, a new bill, a new failure mode — to a feature whose total addressable audience is people I have personally told the password. The honest engineering move was to write down the known weakness and decline to fix it. An imprecise limit I can explain beats a precise one I have to operate.

## Memory that belongs to the visitor

Conversation history persists in the browser's own storage, capped at a few dozen messages. Close the tab, come back, the Queen remembers you — but *I* do not. There is no server-side transcript, no analytics event per message, no log of what anyone said. This was the easiest architecture decision on the project, and it is worth noticing why: the simplest possible implementation and the most private possible implementation were *the same implementation.* That alignment is rarer in real products than it should be, and when a toy project hands it to you for free, taking it is not laziness. It is taste.

## What the toy taught the professional

The Queen is a persona prompt wrapped around a model, and the persona is doing the heavy lifting a system prompt always does: it sets tone, boundaries, and refusals long before any code enforces anything. Watching a character hold together across a streamed conversation teaches you more about prompt robustness than a benchmark does — you can *feel* where the instructions fray. The streaming work paid forward too; the parse-then-simplify pattern at the server boundary is exactly how I think about LLM integration at work, where the model's full output is rarely what the product needs and the translation layer is where the engineering actually lives.

But mostly the Queen taught me the discipline of the appropriate scale. Every component in it — the gate, the limiter, the storage, the stream — is the smallest honest version of its production counterpart, chosen with the trade-offs written down rather than unexamined. Simple-because-considered and simple-because-careless produce identical line counts. They are opposite engineering acts.

## The takeaway

Somewhere on this site, a chatbot is telling somebody to clean up their own mess, and every layer of it is quietly making an argument: that a personal project is not a production system that failed to grow up. It is its own genre, with its own correct answers. Build the toy with real rigor — a real threat model, real trade-offs, honest comments where the weaknesses are — and then have the nerve to *stop*, before the toy acquires an ops burden and stops being yours.

The skill is not knowing how to add the machinery. The skill is knowing, with receipts, that you should not.
