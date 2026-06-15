---
title: "The Constraint That Wasn't in Any Diagram"
description: "You can't sign a BAA with SendGrid — and we'd already shipped code against the wrong assumption."
date: "2026-04-01"
category: "Healthcare Compliance Platform"
layout: "wide"
---

We had an architecture decision record. A real one, written down, reviewed, agreed upon. It chose a popular email provider — one "with a BAA," the document said — as the transport for a new clinician inbox. The cost model was budgeted around it. There was code in the repository written against it. By every measure a team uses to tell itself a decision is settled, this decision was settled.

The premise was false. And in a regulated domain, a false premise about the law does not get caught by a code review or a load test. It sits quietly inside a document everyone trusts until someone thinks to check it against reality, and then it reorders your entire vendor shortlist in an afternoon.

This is a post about that afternoon, and about the thing that made it survivable.

## What a BAA actually is, and the question people skip

Under HIPAA, any vendor that touches protected health information on your behalf has to sign a Business Associate Agreement. A BAA. It is the contract that makes them legally responsible for handling PHI the way the law requires. No BAA, no PHI — not "shouldn't," but a reportable breach if you do it anyway.

The naive question engineers ask about a vendor is "is this provider secure?" It is the wrong question. The right one is two questions, and you have to ask both: *will they sign a BAA?* **and** *is this exact service in scope of that BAA?* A company can be perfectly willing to sign a BAA for some of its products and explicitly refuse to cover others. The signature is necessary; the scope is where the actual surprise lives.

## The false premise that shipped

Our decision record chose SendGrid, on the strength of one sentence everyone had internalized: *SendGrid signs BAAs on the Pro tier and above.* The whole thing rested on it.

It is not true. From the vendor's own documentation, which is safe to quote:

> Twilio is not able to sign Business Associate Agreements for SendGrid … customers should not use SendGrid for any purpose or in any manner involving Protected Health Information.

Read that against what a clinician inbox carries. Free-form message bodies. Replies from patients and from arbitrary third parties. PHI, routinely, by the very nature of the feature. Routing that mail through SendGrid would not be a gray area. It would be a breach, in writing, against the provider's explicit instruction not to do exactly this.

So the decision did not need tuning. It needed *reversing,* before the feature could ship at all. And the framing flipped with it: building net-new email transport stopped being the "optional cost-savings, maybe later" line item it had been filed under, and became *mandatory for compliance.* The cheapest version of the feature was now the one that did not exist.

## Redoing it honestly: eliminate, then score

The way you make a decision like this defensibly is not to pick a favorite and justify it. It is to eliminate everything that legally cannot work, and only then to score what remains. Most of the field falls at the first gate.

Eliminated because they will not sign a BAA, or cannot legally carry PHI: SendGrid, Postmark, SparkPost, Brevo, Mailjet, SMTP2GO, SocketLabs. Eliminated for a more interesting reason — a BAA exists, but the *service* can't meet a two-way inbox requirement: an outbound-only transactional service with no inbound parsing; per-seat office suites whose economics break past a few hundred clinicians and which are not a programmatic signed-webhook transport in the first place; a newer provider whose BAA is enterprise-gated and whose inbound support was immature.

What survived elimination were three genuinely viable shapes of answer, and the honest comparison is a table:

| Criterion | AWS SES | Managed specialist | Mailgun |
|---|---|---|---|
| BAA | self-serve, free | included on every plan | enterprise / negotiated |
| Inbound parsing | build it yourself | confirm before committing | mature, built in |
| Signed event webhook | signature (build) | confirm with inbound | HMAC |
| Identity isolation | separate account (strongest) | separate tenant | domain / account |
| Encryption on the wire | enforce-TLS *drops* mail to non-TLS recipients | managed, with secure-portal fallback | "your job," no fallback |
| Cost at our volume | cheapest by ~10× | mid to high | high (HIPAA enterprise) |
| Build effort | highest | net-new adapter | net-new adapter |

The tension that table is really describing is a three-way trade: build it cheap and AWS-native but own a hard encryption tradeoff yourself; or buy managed encryption and a turnkey BAA at meaningfully higher cost; or buy the fastest feature-parity but accept enterprise procurement *and* the same encryption burden.

And the discriminating risk — the one I want to name because it is the kind of thing that does not appear until it has already lost you mail — is encryption on the wire. The AWS option's strict TLS policy does not encrypt-or-fail-safe. It *drops* mail to any receiving server that cannot negotiate TLS. That is a real deliverability hole, and the entire reason the managed specialists offer a secure-portal fallback is to close it: when they cannot deliver encrypted, they hold the message behind a portal instead of dropping it on the floor. We chose the AWS option as the cost and architecture default, with eyes open about the tradeoff we were accepting rather than discovering it later.

## The lesson that outlives the pick

Here is why reversing a *shipped* decision was a bounded change instead of a rewrite, and it is the only part of this story I would offer as advice.

The provider was always behind an abstraction. The seam was built before — and independent of — the vendor behind it. A three-method adapter contract: send a message, parse an event, verify a signature. Inbound parsing was made provider-agnostic, so the adapters never touched it. Events were normalized into our own table, keyed by provider and external id. Suppression lived in our own database. The provider was chosen at runtime from an environment variable. And — the discipline that paid off — *no provider's name appeared in any load-bearing schema.* I would put my name behind that one move above any other in this post.

So when SendGrid was disqualified, only the implementation behind the seam changed. The schema held. The application held. The shape of the system did not care which vendor we had been wrong about.

I will not pretend it was free. The fully-built SendGrid adapter and its signature verification were sunk cost — the verification scheme did not even port to the replacement's mechanism, so that code was simply gone. "Design the seam" did not save every line. It saved the schema and the app, which is the part that takes a quarter to rebuild and the part you actually care about.

And then keep the record honest. Mark the old decision superseded *for provider selection only,* because the parts of it still in force — the abstraction, the exit strategy — are still in force, and deleting the document would erase the reasoning along with the mistake. The original rationale stays as history. The new matrix points forward.

## The takeaway

The contract is part of the architecture. Not an afterthought to it — a hard input to it, exactly as binding as a latency budget or a throughput target, and a good deal harder to negotiate. Put the replaceable seam in *before* you pick the vendor, because your first choice can be disqualified by a lawyer reading a sentence in someone's documentation, and no benchmark you run will ever warn you it is coming.
