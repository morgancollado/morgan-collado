---
title: "A Mind That Only Perceives"
description: "LLMs as the senses of a deterministic system: perception at scale, and judgment kept nowhere near the model."
date: "2026-09-22"
category: "Healthcare Compliance Platform"
layout: "prose"
---

Our software needs structured data like so:

```json
{ "title": "...", "provider": "...", "credits": 1.25,
  "format": "...", "issued_at": "2026-03-14" }
```

Here is what the world sends: a photo of a certificate. Coffee ring. Bad angle. Half a thumb in the corner. Or a forty-page transcript from a professional body, or a screenshot of a screenshot, or a PDF that a fax machine had opinions about on its way through.

Between that photograph and that JSON is the whole story. The world refuses to provide structure. Deterministic software refuses to run without it. For most of the product's life the thing in that gap was a person keying fields in by hand, or a regex, and neither worked.

The claim I want to make about what changed is narrower than the one you usually hear. Language models did not give us intelligence. They gave us perception at scale. That is an enormous gift, and the discipline of building with them has been deciding what else they would be allowed to touch at runtime. Our answer so far: nothing. The model perceives. Code decides. Humans judge. The hard part was never reading the certificate. It was deciding which mind gets to do which part of the thinking.

## Three minds, one of which replays

Every system that carries consequences has three kinds of mind in it, whether or not anyone drew them on a diagram.

The human is the source of all judgment. A person can look at a weird document and simply know. But you cannot hire your way through the upload volume, and you cannot re-run a reviewer's Tuesday to check their work. Accountable, not replayable.

The model is a probabilistic pattern-matcher, and for the first time we have one that can look at anything and propose structure. Same input, maybe a different reading. You cannot diff its judgment or write a regression test against it.

The code is not a mind at all, which is exactly why it is the only one you can audit. Readable, diffable, testable, revocable. It replays every decision exactly, and it perceives nothing it was not told to expect.

Auditors audit humans every day, so human involvement is not the blocker. Audit in the strong sense means re-running the decision and getting the same answer, and only one of the three minds can do that. So the rule the whole architecture hangs on is this: any decision that must be defended later belongs to the replayable mind. The model feeds it perception. The human feeds it judgment, written down as rules the code replays forever.

## Before: our entire perception layer

For years, the code at the boundary looked like this, for the one provider it handled. It is still in the repo and still routed. Nothing calls it anymore:

```ruby
def parse
  {
    credits:   file_text.match(/Category\s\d+\sCredit/).to_s.scan(/\d+/).first,
    issued_at: file_text.match(/\(.{12}\)/).to_s.gsub('(', '').gsub(')', '').to_date
  }
end
```

Read the first line slowly. It finds the phrase "Category N Credit" and scans it for a digit. The digit it finds is the category, not the credit count. Every certificate came back with the category number as its credit count, which was correct exactly when the two happened to coincide. And I can prove that by reading it, which is the entire point about code: a wrong rule you can read beats a right guess you cannot.

The second line grabs anything twelve characters wide inside parentheses and calls it a date. Provider one was also provider last. The generic parser beside it was a stub and a TODO. Deterministic software cannot get structure out of chaos, and no amount of regex was going to change that.

## Perception, with no field for a verdict

The model can read anything. That is not the same as being dependable, and the architecture is what turns the first into the second.

The first move is a schema at the boundary. Structured output is enforced, so the model cannot return prose, a fence, or a half-parsed object. Values are treated as evidence, not truth. Here is the shape of a course row as a provider skill returns it, trimmed:

```ruby
title:            string   # exactly as printed
content_provider: string
cat:              string   # the raw column value
cme_type:         string
credits:          [{ type: string, amount: number }]
issue_date:       string
```

Look for what is not there. There is no field for a verdict. The model is never asked whether this course is compliant, whether it should publish, or what it counts toward. It returns fields. The classifier in front of it does return a document type and a confidence number, and code thresholds both to route the document, but those are evidence the code decides with, not conclusions about the clinician.

The fix that stopped rows quietly losing data was not prompt wordsmithing. It was the schema. The model we use omits optional fields sample by sample, so a field that is merely described in the prompt gets dropped some of the time. Marking the raw columns required, with an instruction to emit an empty string when a cell is blank, is what stopped it. Reliability lives in the contract, not the prose.

You cannot refactor a stochastic component without a scoreboard, because you cannot tell "my change made it worse" from "the model had a bad afternoon." So before we touched the parser we built the corpus and the harness, and only weeks later did we build the provider-skills path we actually wanted.

Three properties of the harness are worth stealing.

Verified before active. Expected data for a corpus document is seeded from the parser's own output to save typing, so an unverified document would make the parser's bugs the scoring target. The rule is a model validation: a document cannot be active until someone has marked it verified. Now the honest part. Early on, the corpus was bulk-activated by setting the verified timestamp with nobody's name beside it, expected data still raw parser output. The validation held; the verification did not happen. Code stops the accident, not the shortcut, and the only way back is a human comparing expected rows against the PDFs. We built a row-by-row correction tool for exactly that, and until a document has been through it, its score is a number about the parser grading itself.

A defensible score, stamped with its inputs. Total matching fields over total expected fields, never a mean of per-document percentages, where a two-field receipt outvotes a forty-row transcript and can invert which pipeline looks better. Every run carries a digest of exactly which documents at which revision were active. Same digest, different scores: the model changed. Different digests: it was not the same test.

Honest about its own path. The provider-skills path fails open to the general prompt by design, so a "skills" run could quietly be a general run wearing a skills label. Every result row records which path actually ran and why it fell back, in the same vocabulary as live traffic. A measurement system needs guards against flattering itself.

Unit tests still exist, and they stub the model. They prove the wiring, never the perception. The harness is what told us, in one run, that a real failure (blank cells filled with values bled in from neighbouring rows) was a model limit rather than a skill regression, because the general prompt reproduced it on the same document. Telling those two apart quickly is what a harness is for.

## Judgment, where the model leaves the room

The JSON lands, and the model is done. Everything from here is code and humans.

Every record is born a draft. Exactly two paths publish without a human looking, and each has its own named switch: a match against a twin that a human already published, and a rule hit whose evidence is strong enough. I covered the reference lookup and the rule flywheel in [an earlier post](/blog/auto-categorizing-cme). What follows is how the deterministic side checks the model, how it grades trust, how it learned to say no, and where it hurt us.

### Make the model produce two things that must agree

The prompt asks for the grand total printed on the document, never a computed one. Code then sums the extracted rows in exact decimal, because hundreds of quarter-credit rows have to add up precisely and floats drift. A dropped page shows up as a mismatch without anyone opening the file.

The direction decides what happens next:

```ruby
def status_for(delta)
  return :matched if delta.abs <= EPSILON

  delta.positive? ? :undercount : :overcount
end
```

An undercount means missed rows, so code re-chunks and retries once, keeps whichever parse carries the smaller error (inflation is the dangerous direction, for reasons I will get to), and blocks if the document still comes up short. An overcount never blocks or retries. It usually means the document's own printed total understates its own itemized list, so code creates the records and raises an alarm. Code decides, per direction, and a human can read both numbers.

Now the honest beat. Version one of that gate treated both directions the same: one retry, then fail, deterministically, forever, on documents whose printed total would never agree with their own rows. Operations staff kept pressing a retry button that could not succeed. Our own deterministic rule hurt us worse than the model ever did. It was still a good failure: it reproduced, you could read both numbers, and the fix was a code change with a spec. Try debugging that inside a prompt.

### Grade the evidence, not the model's self-report

The confidence that gates publishing is the rule's evidence grade, not the model's opinion of itself. The classifier's confidence routes a document to a parser; it never publishes anything. We grade where the evidence came from (trimmed):

```ruby
BASE_TIER = {
  'reference_match'         => 'high',   # a human published the twin
  'subject_exact'           => 'high',   # exact rule; source decides
  'confirmed_uncategorized' => 'high',   # a reviewer said "no subject"
  'provider_match'          => 'medium', # broadest brush in the system
  'subject_fuzzy'           => 'medium',
  'no_match'                => 'low'
}.freeze
```

Every rule carries its source: hand-authored, mined, provider-inferred, or reviewer-confirmed. On a mandated, high-stakes topic, machine evidence caps at medium and the record stays a draft. Human evidence publishes. Was this rule minted by a reviewer, or by a script? That question is what "confidence" means here.

We tried the shortcut once, bulk-minting rules from historical data without review. The overwhelming majority never fired. Reviewers naturally sample the head of the input distribution; mining mints rules for a tail that never recurs. The rulebook learns from reviews and from nothing else.

### The rulebook can say no

Most keyword systems can only say yes. A false positive is then unfixable except by deleting the rule that caused it, which breaks every case where that rule was right.

We reserve a topic whose only job is to record a negative decision. When a reviewer publishes a document the engine could not categorize and adds no subject flags, that judgment becomes a rule, and from then on it suppresses fuzzy matches on that exact text for everyone. Two guards, because this is the dangerous direction. Only a reviewer can mint one. And the rule is stamped with a digest of the document's text, so it lapses the moment someone edits the title:

```ruby
def engine_found_nothing?
  provenance = certification.categorization_provenance
  return false if provenance['engine_version'].blank?
  return false unless provenance['subject_digest'] == SubjectDigest.for(certification)

  provenance['reason'] == 'no_match'
end
```

Correct a title from "Certificate of Completion" to "Safe Opioid Prescribing" and publish, and the old verdict does not follow it onto a mandated topic. Every human review leaves the code side a little bigger.

### From published to compliant: zero model calls

The compliance engine is the densest part of the codebase: a rule module per state per profession, and a test suite to match. The audit of whether a model is anywhere in it takes seconds:

```
$ grep -rilE 'gemini|llm|bedrock' app/models/concerns/tasks/ \
    app/services/credit_calculation_service/

tasks/state_licenses/physician/tn.rb
# ...the string "Number of years of enroLLMent". That's the hit.
```

## Where we refuse the model

A statistically likely answer is not a correct one, and in healthcare there is no margin for the difference. When a correct answer is required, it comes from knowledge and expertise, and we encode that knowledge as deterministic software so it can be applied beyond us. So the list of places we refuse a model call is not caution. It is architecture. Compliance math, because "am I compliant this cycle" is not a question you answer with a probability. Task generation and deadlines, because that is law transcribed, and it changes by amendment. Duplicate detection, because it is a SQL predicate you can explain in one sentence. Publish criteria, because they are a handful of readable rules in one place. Even the one user-facing assistant, which can call exactly the tools a human put in a list:

```ruby
# There is no dynamic discovery on purpose. The list of tools
# the LLM can see is code-reviewed.
TOOL_CLASSES = [
  Chat::Tools::GetMyTasksTool,
  Chat::Tools::GetMyStateLicensesTool,
  # ...read-only, every one
].freeze
```

It can read your compliance state. It cannot compute it or change it.

None of this is distrust of the model. At build time the same model writes rule modules, specs, and migrations for us, and it is extraordinary at it, because the output is deterministic code that a human reviews and a test suite replays. When we replaced our legacy categorization engine this summer, the plan of record said in writing that nothing in the pull request may call a model, and the model helped write the replacement. Determinism, where you can have it, is strictly better, and we can have it everywhere except perception.

## The reveal, and the asterisk

In the talk I asked the room to count six stages and vote on how many they would hand to the model.

1. Read the document into fields.
2. Check the reading against the document.
3. Resolve what the credit type means.
4. Decide whether this already exists.
5. Decide published or draft.
6. Compute: compliant this cycle?

The instinct is to hand over three or four. The answer is one. Stage one is the model. Stages two through six are code, with stage five carrying two named switches. The gap between the room's number and that one orange box was the whole talk.

Now the asterisk, because it is what makes the rest believable. Unreviewed model output does reach stage six. Drafts count toward a clinician's credit, by a decision the team made deliberately, so a parse that no human has looked at can move a compliance number. That path is named, measured, and switchable.

And "one" is not a permanent number. The residue the rulebook cannot touch is titles that never repeat, and the plan of record for that residue is a model suggesting a subject: under its own named reason, behind its own switch, every high-stakes result marked for audit, and never allowed to mint a rule. When it ships, the model's suggestion will become one more graded source of evidence feeding stage five, and it will be graded like the machine evidence it is. I am not claiming the model never touches a consequence. I am claiming that every place it does is written down, has a gauge, and has an off switch. That standard applies to us too.

## Yours

Every deterministic system has a perceptual boundary: the surface where it demands structured input and the world refuses to provide it. Software's answer was always to push the structuring work outward, onto forms, integrations, and data-entry humans. The form was the system confessing that it cannot see.

Our boundary was certificate uploads. Yours is wherever a person sits today re-typing what a document already says: prior-authorization letters, explanations of benefits, faxed lab results, invoices, permit applications, intake packets.

Four questions before any model call:

1. Is the input already structured? Then a model adds variance, not capability.
2. Must the answer replay? Then the model may not own it.
3. Would the guardrails outweigh the logic? A probabilistic component needs schemas, gates, corpora, switches. Spend that only where perception is the bottleneck.
4. Is a table lookup sufficient? Then a model call is a slower, costlier table.

Where the answer is perception, point the model at the boundary and wrap it: a schema with no field for a verdict, a corpus a human actually verified, a draft by default, rules minted from reviews. Then keep moving rules out of the prompt and into code. Our general prompt still carries a list telling the model how to spell each credit type. The provider skills that are replacing it do not: they extract the string verbatim, and a table with a unit test does the renaming. When the last provider migrates, that paragraph of prompt retires with the path that needed it. Most LLM systems get less deterministic every week. Ours gets more, one paragraph at a time.

You cannot audit a mind. You audit the system around it. The human is where judgment comes from, the model is how software finally sees, and the code is the only one of the three you can replay. Give each mind the only seat it belongs in, and let the one that reads only read.
