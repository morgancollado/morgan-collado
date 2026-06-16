---
title: "A Core-Model Refactor Is a Graph Problem"
description: "Pulling two registration types out of a god-model, and finding every reader the hard way."
date: "2026-04-15"
category: "Healthcare Compliance Platform"
layout: "prose"
---

There is a particular kind of model in every aging codebase that started life with a clear, honest name and slowly became a junk drawer. Ours was called `certifications`. It began as the thing it said it was — a record of credits a clinician earned. Then, somewhere along the way, two things that were not certifications at all got crammed into it because the table was *right there* and the deadline was *right then.*

The two intruders were a clinician's drug-enforcement registration and their controlled-substance registration. Call them the DEA and the CSR. The thing about those two is that they are not certifications in any meaningful sense. You do not earn credits on a DEA. You do not complete coursework against a CSR. They are *trackers* — things you watch expire and renew, full stop. But they had been wedged into the certifications table as a tracker-certification hybrid, which forced a tracker-or-certification branch into what felt like every method in the application, and entangled two simple expiry-watchers with the entire credit-and-task machinery they had no business touching.

The job was to pull them out into models of their own. And the lesson of the job — the one I would write on the wall — is that the table was never the hard part. A core-model refactor is a graph problem. The migration is hours of work. Finding everyone who *reads* the data is the week.

## The target shape

After the detangle, the two intruders became siblings of state licenses under a shared tracker base — trackers, all of them, sitting on the `state_licenses` table where trackers belong:

```ruby
class LicenseTracker < ApplicationRecord; end           # table: state_licenses
class StateLicense                    < LicenseTracker; end
class Dea                             < LicenseTracker; end
class ControlledSubstanceRegistration < LicenseTracker; end
```

The migration left a breadcrumb behind on purpose — an `old_certification_id` column on each row, recording where it came from, so nobody six months later would have to wonder. And each tracker carries its own rules, the way a real domain object should:

```ruby
class ControlledSubstanceRegistration < LicenseTracker
  validates_presence_of :date_of_expiry, :license_number, :state
  ENABLED_STATES = {
    physician:          %w[AL CT DC DE HI IA ID IL IN LA MA MD MI MO NJ NM NV OK RI SC SD UT WY],
    nurse_practitioner: %w[AL CA CT DC DE HI IA ID IL IN LA MA MD MO NJ NM NV OK RI SC SD UT WY],
    # ...per user-type state lists
  }
end
```

Clean. Readable. The kind of diff that looks, in isolation, like a quiet afternoon's work.

## Why single-table inheritance made the failures sharp

Rails single-table inheritance keys everything off a `type` column. That is its convenience and its knife-edge: the class a row deserializes into is decided by a string, and when that string changes meaning under code that assumed the old hierarchy, nothing complains at *write* time. It complains at *read* time, somewhere far away, in a voice like this:

```
ActionView::Template::Error (Invalid single-table inheritance type:
ControlledSubstanceRegistration is not a subclass of StateLicense)
```

That one took down the login page. Read the error closely, because it is precise: some code path — a view eager-loading a subtree — expected everything under it to be a `StateLicense`. But the `type` column now held `ControlledSubstanceRegistration`, which is a *sibling* of `StateLicense`, not a subclass. STI is delightful right up until the hierarchy shifts beneath code that hard-coded the old shape, and then it fails at the worst possible distance from the change that caused it.

## The blast radius, as it actually unfolded

This is the heart of it, and the reason I keep insisting the migration was the easy part. Every regression we hit was a *different kind of reader* of the data, and not one of them appeared in the migration diff.

The **login page** threw the STI error above — a view eager-loading the wrong subtree, miles from anything I had touched.

The **admin user page** silently dropped its DEA and CSR links. No error. They had been associated through the certifications path, which no longer pointed at them, so they simply stopped appearing. The page rendered fine. It was just quietly missing two things, and only someone who knew to look for them would notice.

The **CSV importer** for registrations started failing with `User must exist`, despite a perfectly valid user id sitting right there in the row — because the importer built the record on the old certifications association, which no longer connected to a user the way it used to.

And then the worst one. **"Save and continue" on a CSR returned HTTP 200 and did nothing.** No error. No exception to grep for. No failed request in the logs. The renewal-and-attestation flow still routed through certification logic that the standalone tracker no longer hit, so the controller succeeded — and the part that should have advanced the cycle was gated behind certification code that never ran. Success status. Zero effect. The hardest failure to find is the one that does not fail loudly; it just declines to do anything and reports that it did.

An **operations expiry tool** threw a URL-generation error with a nil id — a route helper that had memorized the old record's shape.

Five bullets, five entirely different classes of reader: a view, an admin UI, an importer, the renewal path, an ops tool. Each one read the data through an assumption about what shape it had. None of those assumptions lived anywhere near the schema.

## Re-wiring renewal for things that stand on their own

The trackers needed to attest as renewed and push themselves to the next cycle without leaning on the certifications path. The silent 200-no-op was exactly this gap: the controller did its job, but the branch that advances the cycle had been written to fire only for certifications, so for a standalone tracker it simply never fired.

How do you find a bug whose entire signature is *the absence of a thing happening?* You instrument the flow and watch for the step that should occur and doesn't. The missing log line was the clue. There was no error to chase, because nothing had gone wrong, in the sense the machine understood "wrong." It had just quietly skipped the only part that mattered.

## The discipline that would have front-run all of it

I want to be honest that the pain here was avoidable, and the way to avoid it is unglamorous: before you change a model the whole app reads, *enumerate the readers.* Not the writers — the readers. Sit down and list them. The views. The admin pages. The serializers and decorators. Any API types. The importer. The renewal and task-attachment paths. The search services. Every operations tool somebody wrote once and forgot. Map them first, migrate second.

The schema change took hours. Chasing the readers took the week, and it took the week precisely because we let the migration's tidiness convince us the work was nearly done when it had barely started. The migration is what the change looks like. The readers are where the change actually lands.

A core-model refactor is a graph problem. The nodes are everyone who touches the data, and the edges are the assumptions they each made about its shape. List the nodes before you touch the schema, because the app is the only thing that guards its own data, and it will only guard the shape it already believes in.
