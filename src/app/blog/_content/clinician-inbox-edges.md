---
title: "The Lies Your Staging Environment Tells You"
description: "Six edge-case bugs from a two-way clinician inbox — none of them are really about email."
date: "2026-03-15"
category: "Healthcare Compliance Platform"
layout: "prose"
---

Building an email feature looks like CRUD. You receive a message, you store it, you show it, you send a reply. Four verbs, all of them familiar, none of them frightening. If you scoped the work off that description you would budget a week and feel generous about it.

The trouble is that none of the real engineering lives in the four verbs. It lives in the places where the system stops looking like CRUD and starts looking like what it actually is: a distributed system that happens to be wearing an email costume. Signature verification. Transaction boundaries. Audit durability. Environment parity. What to do when Redis blinks halfway through a send. The incidents come from there, every time, and not one of them shows up in the demo.

Here are six that bit us. I have kept them because each one is a lesson that outlives email entirely.

## Don't hand-roll the inbound stack

The first cut reinvented half of a framework that already shipped in the box. There was a custom webhook controller, a hand-rolled state machine for inbound payloads, a per-provider multipart parser, a separate job to run it. It worked, mostly, in the way that a thing you wrote yourself always works until it meets an email a real human composed.

Then we deleted almost all of it and adopted `ActionMailbox` — one mailbox handler class, parsing against a `Mail::Message` instead of against our own bespoke understanding of MIME. That removed something like a hundred lines of recreated plumbing, and in exchange it handed us the framework's incineration policy for sensitive content, its blob lifecycle, and a development tool for replaying inbound mail, all for free. We had been busy rebuilding, slightly worse, a thing the framework's authors had already gotten right.

*When the framework already models your problem, reinventing it is not the work. It is the bug.*

## A signature is not authentication

This is the one I most want people to internalize, because it is a threat-model bug, and threat-model bugs are invisible to every test you would think to write.

We receive events through Amazon's notification service, and each one arrives signed. The naive read — the read I have watched smart people make — is that a valid signature means the message is trustworthy. It does not. A valid signature proves only that *AWS* signed it. And *any* AWS customer can produce validly-signed messages from their own topic. Without pinning the specific topic we expect, an attacker can point their topic at our endpoint and feed us forged-but-perfectly-signed events all day long.

So verification is two checks, and the order of importance is the opposite of what intuition suggests:

```ruby
def verify_signature(body:, headers: {})
  envelope = parse_envelope(body)
  return false unless envelope
  return false unless pinned_topic?(envelope['TopicArn'])  # the load-bearing line
  return false unless %w[Signature SigningCertURL].all? { |k| envelope[k].is_a?(String) }

  self.class.sns_message_verifier.authentic?(body)
end
```

The cryptographic check is the famous one. The topic pin is the one that actually keeps strangers out. And a missing pin fails closed — no pin configured means nothing is trusted, rather than everything. No signature test on earth catches a missing topic pin, because the signatures are all genuine. The forgery is in *whose* genuine message you agreed to believe.

*Signed is not the same as trusted. Pin the source, and fail closed when the pin is unset.*

## A webhook must answer 4xx to garbage, never 5xx

The verifier from the box is not as boolean-safe as it looks. It rescues its own verification error and nothing else, which means a body missing its `Signature` field escapes as a `TypeError`, and a body that is valid JSON but not an *object* — `[]`, `null`, `"x"`, `123` — throws a `NoMethodError` the instant you index into it expecting a hash.

Think about who controls that input. Anyone who can reach the endpoint. So a stranger can hand you junk that crashes your handler into a `500`, and a `500` to a notification service is not a dead end — it is an invitation to *retry*. You have built a machine that turns attacker-controlled garbage into a retry storm against your own infrastructure.

The fix is a parser that fails closed by returning nil for anything that is not a JSON object, used by every boolean path that would otherwise raise:

```ruby
def parse_envelope(body)
  parsed = JSON.parse(body.to_s)
  parsed.is_a?(Hash) ? parsed : nil
rescue JSON::ParserError
  nil
end
```

*A 5xx on attacker input is not a bug, it is a vulnerability — and a retry storm besides. Validate the shape, then return 400.*

## An audit log that vanishes exactly when you need it

This one is beautiful, in the way that only a bug can be when it is technically working as designed.

We audit sensitive writes. The first implementation wrote the audit row *after* the write it documented. Reasonable, until you put it next to idempotent retries and watch what happens. The write commits. The audit `create!` raises — say the database hiccups. That raises a `500`. The client, being well-behaved, retries with the same idempotency key. The replay branch sees the work is already done and *correctly* skips redoing it — and in skipping the work, it skips the audit too. The write happened. The record of the write is gone. Not by accident. By design. The idempotency that protects the write is the very thing that swallows its audit.

The fix is to write the audit row *inside the same transaction* as the thing it audits, so that a failed audit rolls the write back and releases the idempotency claim. Now the retry performs the work *and* records it, together or not at all. An audit that is not in the same transaction as the action it describes is not an audit. It is a hope.

A reviewer surfaced the corollary, which is sharper than the original: an audit control that covers only one of two equivalent write paths is not a control. We had justified an unaudited direct-send path by pointing at the audited draft path, as if the existence of an audit *somewhere* covered the write *everywhere*. It does not. Every path that produces the effect has to be the path you audit.

*Audit in the same transaction as the thing it documents, and check every sibling path that produces the same effect — or you do not have a control, you have a story you tell yourself.*

## The guard that never runs where you need it most

I have written `if Rails.env.production?` more times than I can count, with complete confidence, and this bug taught me to distrust every one of them.

Our staging environment configuration is, in its entirety, this:

```ruby
require_relative 'production'   # config/environments/staging.rb

Rails.application.configure do
  # ...a handful of host and SMTP overrides
end
```

Staging *runs production's config.* It loads all of it — including, say, the line that wires up the production mail ingress. But `Rails.env` on that machine returns `"staging"`. So every `if Rails.env.production?` guard sprinkled through the initializers *silently skips the first environment that actually runs the production configuration.* Which is precisely the environment you stand up first, to catch exactly the problems those guards exist to catch. The guard is absent from the dress rehearsal and present only at opening night.

The fix is to stop guarding on the *name* of the environment and start guarding on the *configuration* — is the mail ingress actually set to the production value, is the provider env var actually the one we mean — excluding only genuinely local environments. Gate on what is true, not on what the environment happens to be called.

*Guard on the config, not the env name. The name lies; the config cannot.*

## Decide, per dependency, whether a blip is allowed to fail the user

The last one is a design decision masquerading as an outage. Intermittent Redis connection errors were failing legitimate sends, because the send-rate limiter — a Redis-backed account cap — raised straight through the send path when Redis stumbled. A clinician hit "send," Redis dropped an SSL connection somewhere in the pool, and the message did not go.

But think about what that limiter *is.* It is advisory account protection. It exists to stop runaway volume, not to be load-bearing on any individual legitimate message. So a transient Redis outage must not block a real send. It now fails *open:*

```ruby
def check!
  redis_pool.with { |conn| buckets.each { |spec| enforce_bucket!(conn, spec) } }
  true
rescue Redis::BaseConnectionError, ConnectionPool::TimeoutError => e
  # Fail OPEN, not closed. This limiter is advisory account-cap protection,
  # so a transient Redis outage must not block a legitimate send. We allow
  # it through and surface the degraded window. RateLimited — the real
  # business cap — is a plain StandardError and is intentionally NOT caught.
  fail_open!(e, action: 'check')
  true
end
```

The move that matters is the discrimination: a *transient infrastructure* failure fails open and lets the message through, while the *actual business cap* is a different exception that is deliberately not rescued and still stops the send cold. You decide, for each dependency, whether its bad day is allowed to ruin the user's. For a best-effort side channel, the answer is no. For the send itself, the answer is yes.

*Classify every dependency as fail-open or fail-closed on purpose. Don't let a side channel's outage take down the main event.*

## The through-line

Read the six titles again and notice what is missing from all of them. Authentication. Idempotency. Transactions. Environment parity. Dependency-failure policy. Not one of these is an email problem. Email is just the room they happened to be standing in when they introduced themselves.

That is the real reason building the inbox took longer than the four verbs suggested. The four verbs were never the work. The work was every place the email costume slipped and the distributed system underneath looked back at us.
