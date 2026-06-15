---
title: "The Constraint That Measured Ciphertext"
description: "A Rails PHI bug that passed every test for weeks, then an emoji blew it up."
date: "2026-02-01"
category: "Healthcare Compliance Platform"
layout: "prose"
---

We encrypt patient data at rest. That is not a feature we advertise; it is the floor we stand on. When the product you are building carries protected health information through every surface a clinician touches, encryption stops being a checkbox and becomes a habit of mind. You encrypt the column. You write a constraint to keep it honest. You move on.

And then, one quiet afternoon in staging, the first emoji-dense reply arrived, and the whole thing came apart.

I want to tell you about that bug, because it is not really a bug about emoji, and it is not really a bug about email. It is a bug about a mistake that is very easy to make and very hard to see: writing a database constraint that *believes* it is measuring one thing while it is actually measuring another. The database was honest the entire time. We were the ones who misunderstood what we had asked it to do.

## What we encrypt, and why

The model at the center of this story is a message in a two-way clinician inbox. Its body fields carry free-form text written by clinicians and the people who write back to them, which means they routinely carry PHI. So we encrypt them, non-deterministically, at rest.

```ruby
class EmailMessage < ApplicationRecord
  # PHI-bearing content at rest. Non-deterministic for body fields —
  # they are never queried directly, so they never need to be searchable.
  encrypts :body_text, :body_html, :body_preview, :subject

  BODY_PREVIEW_LIMIT = 256
end
```

The word *non-deterministic* is carrying a great deal of weight in that comment, and it is worth slowing down for. Deterministic encryption produces the same ciphertext for the same plaintext, which lets you query it — you can encrypt your search term and look for a match. It also leaks: identical plaintexts are visibly identical at rest. Non-deterministic encryption refuses to leak that, and the price you pay is that you can no longer query the column. There is no `where(subject:)` anymore. There is no `ILIKE` on a body.

That single fact ripples outward. We thread messages by subject, and threading is a lookup. So threading cannot use the encrypted `subject` column. It uses a separate, *unencrypted* normalized column on a separate table — a column that exists precisely because the real one has gone dark to the database. If you take one thing from this section, take that: the decision to encrypt a column is also a decision about every place that column used to be read. The encryption is the easy part. The blast radius is the work.

## The constraint that looked obviously safe

We keep a short preview of each message — the first couple of lines you see in a list before you open it. The plaintext limit is 256 characters, enforced in Ruby. Someone, reasonably, wanted the database to back that up, and added a length check with a generous cushion:

```sql
CHECK (body_preview IS NULL OR char_length(body_preview) <= 320)
```

Look at that line the way the reviewer did. A 256-character preview, with 320 characters of slack. Sixty-four characters of headroom on a limit we already enforce in the application. It is hard to imagine a constraint more obviously, boringly correct. It passed review. It passed the test suite. It passed weeks of real traffic in staging.

It was wrong from the first second it existed.

## Why Postgres disagreed with us

Here is the thing the constraint did not know, because we never told it: `body_preview` is encrypted. The string sitting in that column is not a preview of anybody's message. It is an encryption envelope — a little JSON structure that wraps the ciphertext together with the headers the decryptor needs to undo it. Roughly:

```
{"p":"<base64 ciphertext>","h":{ ...key + algorithm headers... }}
```

`char_length` is a function of perfect integrity. It counted exactly what was in the column. The problem is that what was in the column was the envelope, not the meaning. A 256-character multibyte preview, once compressed, encrypted, base64-encoded, and wrapped, lands somewhere around fifteen hundred characters of envelope. The constraint was sizing a coat for a person and measuring the shipping box.

So the honest question is not why it eventually failed. The honest question is why it didn't fail immediately.

## The good part: why it hid for weeks

This is the detail that turns a careless mistake into a genuinely interesting one. `ActiveRecord::Encryption` does not encrypt your plaintext directly. It *compresses* it first — deflate, before the cipher — because ciphertext is incompressible, so any squeezing has to happen on the way in.

And what compresses beautifully? Repetitive ASCII. Test fixtures full of `"lorem ipsum"`. The early real bodies, which were mostly plain English sentences. All of it deflated hard before it was ever encrypted, and the resulting envelope slipped in *under* 320 characters. The constraint held. Not because it was right — because the inputs happened to be compressible enough to hide that it was wrong.

> A test that passes on compressible data has not tested the constraint. It has tested the compressor.

The grace period ended the day someone replied with a wall of distinct emoji. Distinct multibyte codepoints are close to incompressible — there is no redundancy for deflate to exploit — so the envelope swelled past 320, and the `INSERT` started failing. The first genuinely *incompressible* message was the first message that told us the truth.

## The three symptoms from one bad line

If the story stopped at a failed `INSERT`, it would be a footnote. It did not stop there, because of where the failure landed. The inbound ingest path resolved and committed the *thread* row before it inserted the *message* row, and it did so with no transaction wrapping the two together.

Read that sequence again with the failure in mind. The thread commits. Then the message insert hits the constraint and raises. Now there is a thread in the database with no message in it — a ghost. The routing job, doing exactly what a good job does, retries. The same input fails the same way and commits *another* ghost thread. One per attempt. And the frontend, which had every reason to assume a thread contains messages, crashed trying to read `.from` off an empty collection.

One misjudged constraint produced three different visible symptoms in three different systems: a failing insert, a quietly multiplying pile of message-less threads, and a white screen in the client. None of them announced their shared cause. You could have debugged any one of them for a day without finding the other two.

## The fix, in three honest pieces

The repair had to address all three, because all three were real.

First, size the constraint for what the column actually stores. We widened it to 2048 — comfortably above the envelope for a 256-character multibyte preview — and *kept* the real 256-character plaintext limit in Ruby, where it can see plaintext, which is the only place that limit has ever been meaningful. The database guards storage; the application guards meaning. Asking the database to guard meaning was the original sin.

Second, wrap thread resolution and message insertion in a single transaction, so a failed message takes its thread down with it instead of orphaning it. And — this is the part that bit back during the fix — let the unique-violation propagate *out* of that block. Rescuing `RecordNotUnique` inside the transaction feels tidy and is actively harmful: once Postgres has aborted a transaction, any further query inside it fails, so the rescue runs against a poisoned connection. The duplicate path, it turned out, had been ghost-threading too.

Third, the frontend guards an empty `messages` array, because defensive rendering is cheap and the alternative is a crash on data the backend now promises never to create but once did.

## The test that would have caught it

There is a regression spec for this now, and the shape of it is the whole lesson. You cannot test an encrypted-column constraint with compressible data, because the compressor will quietly do your job for you and let a broken constraint pass:

```ruby
preview = "😀😁😂🤣😃😄😅😆..." # distinct, incompressible codepoints, 256 chars
msg = build_message(body_preview: preview)

expect(msg.ciphertext_for(:body_preview).length).to be > 320 # the regression is load-bearing
expect { msg.save! }.not_to raise_error
```

If you write that test with `"a" * 256`, deflate crushes it under the old bound and your test goes green without ever exercising the bug. The assertion that the ciphertext exceeds the *old* limit is not decoration. It is the test proving to you that it is actually standing where the failure was.

## What I keep, after all of it

The bytes leak through the edges too, by the way — a separate near-miss in the same period had a draft attachment serializing a blob's signed id, which is an unexpiring, unauthenticated bearer token pointing straight at the PHI. We replaced it with a short-lived, owner-scoped download URL. Encryption at rest does nothing if you hand someone a permanent key to the room.

But the line I want to leave you with is the one about the constraint, because it generalizes past encryption and past healthcare. A database constraint enforces a fact about the bytes in a column. When those bytes are an encryption envelope, the only facts you can enforce are facts about the envelope — its size, its presence — never facts about the meaning inside it. And compression will hide the difference from you for exactly as long as your data stays polite.

The database never lied. It measured precisely what we put in front of it. We were the ones who forgot what that was.
