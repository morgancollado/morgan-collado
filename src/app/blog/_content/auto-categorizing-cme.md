---
title: "The Model Reads the Mail"
description: "Automating CME categorization — LLMs at the messy boundary, deterministic rules where it matters."
date: "2026-03-01"
category: "Healthcare Compliance Platform"
layout: "prose"
---

The interesting question about putting a language model into production is not the one everybody asks. Everybody asks: *can the model do the task?* It is the wrong question, or at least it is the easy half of the right one. The question that actually decides whether you have built something trustworthy is narrower and harder. **Which part of the task should the model own, and which part must never, under any circumstances, be probabilistic?**

I spent a good while answering that question for a single unglamorous chore — categorizing continuing medical education credits — and the answer turned out to be a small philosophy with a lot of code under it. Let me start with the chore, because the chore is the whole reason any of this matters.

## The pile of paper we were replacing

A clinician keeps their licenses and board certifications alive by earning CME credits, and proving they earned them. The proof arrives as a pile of PDFs. Single certificates. Multi-course transcripts. Layouts from hundreds of providers, no two alike, some of them scanned at an angle by a fax machine that should have been retired during a previous administration.

For each course, a person had to sit down and make a series of judgments. Read it. Find the title, the provider, the credit type, the amount, the date. Decide *what kind of credit* it is — is this AMA PRA Category 1? AANP contact hours? Pharmacology? An osteopathic 1-A? Decide *which of this clinician's specialties* it counts toward, which is a different question entirely. Tick the right boxes. Publish.

It was data entry, and it scaled the worst way anything can scale: linearly with headcount. A transcript with thirty courses was thirty rounds of the same judgment calls. And here is the part that nagged at me, the part that became the whole project — *most of those judgments were not new.* The five-hundredth "ACLS Recertification" from the same provider gets filed exactly like the first. We were paying skilled people to re-derive answers we already had, over and over, because we had no place to keep the answer the first time we found it.

## A confidence ladder, not a model

The shape of the solution is the thing I most want you to take away, so let me draw it before I justify any of it.

```
PDF
 │  [LLM / OCR]  ── probabilistic extraction
 ▼
{ courses: [{ title, credits: [{type, amount}], issue_date, content_provider }] }
 │  [deterministic pipeline]
 ▼
 ├─ approved-provider gate + provider-name normalization
 ├─ duplicate detection
 ├─ credit-type → flags   (ordered rules, no model)
 │
 ▼  Has a HUMAN already categorized this exact course?
 ├─ YES → copy the verified categorization, re-derive specialty → AUTO-PUBLISH
 └─ NO  → categorize, save as DRAFT → a human confirms
                                       │
                                       ▼ every confirmation is written back as a rule
```

Notice what that diagram refuses to do. It refuses to be all-manual, and it refuses to trust the model blindly. Automation is *tiered by confidence.* A high-confidence match against work a human already blessed publishes itself. A first-time course lands softly as a draft for a person to confirm. The system always knows how sure it is, and it acts accordingly. That is the whole design, and everything below is just the layers of it.

## Layer one: let the model do what only the model can

The job at the top of the ladder is to turn an arbitrary PDF into structured fields. This is the one place a deterministic parser is hopeless — there is no schema to the world's CME certificates, no grammar, no standard, nothing to parse against. Reading messy documents into clean fields is precisely what language models are extraordinary at, and a wrong reading is cheap to catch.

So I let the model do exactly that, and nothing more. It returns *fields, not decisions.* Title. Credit-type string. Amount. Provider. Date. It is never asked "what category is this" or "what specialty does this belong to," because those are not extraction — those are judgment, and judgment is going somewhere else.

The moment the fields come back, the deterministic guardrails take over. An approved-provider gate, so only providers we have explicitly enabled flow through; everything else is recorded as a failed parse with a reason, which bounds the blast radius of any bad extraction. Provider-name normalization, because the real world spells one provider a dozen ways — "Medscape," "Medscape, LLC," "Medscape Education" — and a variation map collapses them before any matching happens. Duplicate detection, before anything is created.

And every parse writes a provenance row: was it a success, what did it extract, which certificate did it become. That row is the audit trail. It is also, as we will see at the end, the only honest way to measure whether any of this worked.

## Layer two: the model is not allowed to categorize

Here is the first decision the model does not get to make: which credit bucket a course belongs to.

That is a compliance fact, not an opinion, so it lives in an ordered list of rules. First match wins.

```ruby
CREDIT_TYPE_PATTERNS = [
  { pattern: ->(ct, ut, prov) { DEFAULT_AMA_CREDIT_PROVIDERS.include?(prov) },
    flags:   ->(amt) { { category_1_ama_pra: true, categorized_main_credits_category_1_ama_pra: amt } } },
  { pattern: ->(ct, ut, prov) { ct&.downcase&.include?('ama pra category 2') },
    flags:   ->(amt) { { category_2_ama_pra: true, categorized_main_credits_category_2_ama_pra: amt } } },
  { pattern: ->(ct, ut, prov) { ct&.downcase&.include?('aanp') && ut.in?(%w[NursePractitioner RegisteredNurse]) },
    flags:   ->(amt) { { category_aanp_contact_hours: true, aanp_contact_hours_credits: amt } } },
  { pattern: ->(ct, ut, prov) { ct&.downcase&.include?('pharmacology') },
    flags:   ->(amt) { { category_pharmacology_credits: true, pharmacology_credits: amt } } },
  # ...and twenty-odd more: osteopathic 1-A/1-B/2-A/2-B, NCCPA, PI vs SA, MOC, and so on
].freeze
```

I know how unfashionable that block is. There is no model in it. There is no embedding, no prompt, no eval harness. It is a list of `if` statements a careful reader can audit in an afternoon. And that is exactly why it is in the codebase instead of in a prompt. Categorization is a fact a regulator might one day ask us to defend. When that day comes I would like to point at a code-reviewed diff with a date and an author on it, not at a model that felt strongly about "pharmacology" on a Tuesday. A new credit type is a new rule in a pull request — readable, reviewable, identical every single time. This is the unglamorous eighty percent that a lot of "AI features" skip on their way to the demo, and skipping it is why so many of them cannot be trusted with anything that counts.

## Layer three: reuse the judgments you already have

Now back to the chore that started all this — the five-hundredth identical course. The same course, from the same provider, for the same kind of user, should be categorized the same way every time. The first time a human verifies and publishes one, that record stops being just a record. It becomes a *reference* — a cached, human-blessed answer to a question we will be asked again.

So when a new course is parsed, before we categorize it from scratch, we ask: has a person already done this one?

```ruby
REFERENCE_CUTOFF_DATE = Date.new(2025, 11, 1) # the date we judged the corpus trustworthy

Certification
  .reference_lookup_candidates_since(REFERENCE_CUTOFF_DATE)
  .for_user_type(@user.type)
  .with_case_insensitive_title(@certification.title)
  .matching_provider_info(@certification.content_provider_id, @certification.provider_name)
  .order(updated_at: :desc).first
```

If we find one, we copy its verified categorization and publish automatically, with a pointer back to the reference so the provenance is intact. No human touches it. And it runs in both directions: when a reference is created or corrected, we propagate its categorization out to every matching draft, so fixing one record fixes its entire equivalence class at once.

Two details in there are doing quiet, important work.

The first is that cutoff date. Old data is not all trustworthy, and reference matching is only ever as good as the corpus it trusts. The cutoff is the dial that says *trust judgments from here forward* — a single, auditable line that draws the boundary between the historical mess and the corpus we are willing to stake auto-publishing on.

The second is subtler, and it is my favorite correctness point in the whole system. When we copy a reference's flags, we copy everything *except* the practicing-specialty flags, which we strip and re-derive for the new owner. Why? Because the reference belonged to a *different clinician,* with *different* specialties. What kind of credit a course is — that is universal, true for everyone. Whether it counts toward *your* radiology requirement — that is personal, true only for you. Credit type is a fact about the course. Specialty relevance is a fact about the person. Conflating them would let one clinician's specialties leak into another's record, and in a compliance product that is not a bug, it is a liability. So the system keeps the universal and re-derives the personal, every time.

## The heart of it: a rulebook that teaches itself

Reference data answers "what kind of credit is this." It cannot answer "does this count toward *this* clinician's specialty requirements," because that depends on the user, not on whoever happened to be the reference. For that we needed a rulebook mapping course titles to practicing specialties — owned, again, by the domain and not by the model.

It is a table of pattern rules. A pattern matches a title by exact string, by substring, by regex, or by a conjunction of terms. The common cases — exact and contains — are resolved inside Postgres against a trigram index in a single query; the expressive cases fall back to Ruby only when the fast path finds nothing. Fast where it can be, expressive where it must be. And there is a scoping invariant I would defend with my life: a user is only ever matched against rules belonging to *their own* specialties. Safety by construction, not by remembering to filter.

Then comes the part people actually remember, which is what happens *after* a match.

```ruby
def auto_update_specialty_mappings(specialties, mappings)
  mappings_by_specialty = mappings.to_a.group_by(&:mappable)
  specialties.each do |specialty|
    next unless mappings_by_specialty.fetch(specialty, []).any? { |m| m.matches?(title) }
    PatternMapping.find_or_create_by!(mappable: specialty, pattern: title) do |m|
      m.match_type = 'exact'; m.source = 'mined'   # the corpus learns; the model does not
    end
  end
end
```

When a title matches some fuzzy keyword rule, we write back a new *exact* rule for that exact title. The next time that title appears, it matches instantly and precisely, no fuzziness required. Fuzzy matches harden into fast exact ones over time. The system gets *faster and more confident as volume grows,* and nobody authors a single rule by hand. Every successful categorization makes the next one cheaper. That is the flywheel, and it is the closest thing to magic in the project — except it is not magic, it is just bookkeeping that compounds.

There is a war story folded into the seeding side of that loop, and it is the kind of bug that only exists in systems that learn. When we seed a brand-new rule on a miss, the obvious code is `find_or_create_by!`. The obvious code is wrong. If an operations admin had previously *disabled* a bad rule, `find_or_create_by!` would find that disabled row and silently return it — quietly reviving a rule a human had deliberately killed. In a learning system, "off" has to survive the learning. So the seeder checks for both active and disabled rows and only creates when nothing exists at all:

```ruby
existing = PatternMapping.unscoped.where(mappable: specialty)
                         .find_by('LOWER(pattern) = ?', normalized_title)
return nil if existing
PatternMapping.create!(mappable: specialty, pattern: normalized_title,
                       match_type: 'exact', source: source)
```

Which is the same idea as the disable mechanism itself: rules are soft-disabled, never deleted — given a `disabled_at` and a `disabled_by`, kept for history, forbidden from ever matching or being resurrected by the mining loop. Because an automated system that operations cannot correct is not an asset. It is a fast, confident way to be wrong at scale. The disable path is how a human overrules the machine cheaply, and a learning system that cannot be overruled is the one you should be afraid of.

## Did it actually work?

You should be suspicious of anyone who builds something like this and then measures it generously, so let me tell you how the first measurement lied to me.

"Auto-resolution rate across all certs" read about eight percent. Eight percent. It looked like a failure. It was a failure of arithmetic, not of the feature: the create endpoint force-publishes every self-uploaded, manually-entered certificate, none of which ever touch the AI pipeline at all. They were sitting in the denominator dragging it to the floor. Scope the cohort to certs that actually came *through* the pipeline — provenance rows with a real linked certificate — and the true auto-resolution rate was around forty-five percent. Same system. The only thing that changed was that the denominator stopped lying.

And even forty-five percent is the wrong number to lead with, because auto-resolution is structurally zero before you turn the feature on, so any before-and-after table just proves you flipped a flag. The honest measurement is the *slope* — the week-over-week climb as the reference corpus fills in and the mined rules accumulate. That curve going up and to the right is the flywheel made visible. The snapshot tells you where you are. The slope tells you whether you built something that compounds.

## The general shape

Strip away the CME and the healthcare and here is the rule of thumb, good for any feature you are tempted to hang on a language model:

Use the model only at the boundary where structure breaks down — unstructured in, typed out — and keep its output as data, never as decisions. Make the decisions deterministic, auditable, correctable: rules in version control, not sentences in a prompt. Capture every human judgment as data, so the deterministic layer compounds instead of evaporating. And tier your automation by confidence — act on the sure thing, queue the rest for a person, and feed those confirmations back into the layer that learns.

We did not build an AI that categorizes CME. We built a system that remembers every time a human did it correctly — and an LLM that just reads the mail.
