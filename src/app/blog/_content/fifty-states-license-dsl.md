---
title: "Fifty States, Fifty Rulebooks"
description: "Modeling license-renewal rules for every US state without one clever abstraction collapsing under the variety."
date: "2026-05-01"
category: "Healthcare Compliance Platform"
layout: "prose"
---

Every US state has its own rules for how a clinician renews a license and how much continuing education that takes. Different cycle lengths. Different grace periods. Mandatory topics that exist in one state and are unheard of in the next. Specialty carve-outs. Licenses that only ever expire in even-numbered years, or on the last day of the licensee's birth month, because a legislature somewhere decided that was reasonable and now it is true forever.

Multiply that by the kinds of clinician — physician, osteopath, nurse practitioner, registered nurse, physician assistant, the behavioral-health roles, and on — and you have a matrix of states times user types where nearly every cell is a little bit special. This is the kind of domain that tempts an engineer toward a grand unifying abstraction, one clever class that captures the deep structure of license renewal and parameterizes away the differences.

I want to argue against that instinct. When the variation in a domain is *irreducible* — when the states really are all different, because they really are all different — the clever abstraction does not tame the chaos. It hides it, badly, and then leaks it everywhere. The thing that actually works is less impressive and far more durable: give every variant a small, readable home of its own, and pour your cleverness into the framework *underneath* them and the conventions that make them all read the same way.

## One file per rulebook

Each combination of user type and state gets a single concern file that declares a task list. Here is Virginia, trimmed:

```ruby
class Tasks::StateLicenses::CommonBase::Va < Tasks::StateLicenses::Base
  CONFIG = { license_cycle: 2.years }.freeze

  TASK_LIST = [
    { title: 'Renew State License',
      interval: 2.years, cyclic: true, cycle_lead: true,
      identifier_under_specialty: 1, even_year_deadlines: true },

    { title: 'Complete 60 Credits of CME',
      interval: 2.years, cyclic: true, identifier_under_specialty: 2,
      main_categorized_credits: 60,
      minimum_credit_required_category: { credits: 30, flags: %w[categorized_main_credits_category_1_ama_pra] } },

    { title: 'Of the 60 Credits, complete 30 Category 1 Credits',
      interval: 2.years, cyclic: true, identifier_under_specialty: 3, sub_credits: 30 },

    { title: 'Complete 1 credit on the topic of Human Trafficking',  # note: no trailing period
      interval: 2.years, cyclic: true, identifier_under_specialty: 4, sub_credits: 1 }
  ].freeze

  def validates
    @taskable.errors.add(:base, 'Date of expiration must be last day of birth month.') unless @taskable.date_of_expiry == @taskable.date_of_expiry.end_of_month
    @taskable.errors.add(:base, 'Year of expiration must be an even year') if @taskable.date_of_expiry.year.odd?
  end
end
```

Look at what that file declares rather than computes. The cycle length. Which task is the renewal itself. Whether each task recurs, and which one leads the cycle. That deadlines fall in even years. The credit minimums, broken out by category. And the two validations that are true in Virginia and nowhere else: expiration on the last day of the licensee's birth month, even years only.

You could read that file to a compliance officer over the phone and they could tell you whether it is right. That is the property I am optimizing for. Not elegance — *legibility to the person who knows the actual rule.* When the rule changes, and it will, the diff should be obvious to someone who is not a programmer.

## The framework you must not reimplement fifty times

The flip side of giving each state its own file is the discipline to keep the *machinery* out of those files. The cycle, grace, and renewal math lives in a shared layer that every state file leans on without restating. A generation service turns a task list into actual scheduled tasks. A database-driven, operations-managed configuration holds the continuing-education specifics that change often enough that they should not require a deploy.

The vocabulary is worth pinning down, because half the difficulty of a domain like this is that ordinary words mean specific things. A *cycle* is the renewal period. A *taskable* is a license or requirement that generates tasks. A task list is the declaration you just saw. *Off-cycle attachment* is what happens when a license joins partway through a cycle and has to be fitted into it. These are not casual terms. Get one of them wrong in your head and you will write a plausible method that is subtly, expensively incorrect.

## The conventions that keep fifty files uniform

Here is the practical heart of it, and every one of these reads as arbitrary fussiness until the day it saves you. A domain with fifty bespoke files does not stay maintainable because the files are individually good. It stays maintainable because they are all good *in the same way.*

Build task lists by *adding* identifiers, never by starting from the full set and filtering down. `tasks = []; ids = [1, 2, 3]; ids << 9 if first_renewal?`. An allowlist you can read top to bottom answers "what runs in this state?" at a glance; a denylist makes you hold the whole set in your head and subtract. Positive construction is legible; subtraction is a puzzle.

Let the defaults be the common case and stay silent. A flag that is true almost everywhere defaults to true, so you only ever write it when you mean *false* — when a cycle is too short and a task has to slide to the next one. Writing the default explicitly is not thoroughness. It is noise that hides the one place the value actually matters.

Gate "the Nth renewal" on the framework's own notion of the current cycle, not on a naive count of how many cycles a taskable has been through, because that count is unreliable the moment off-cycle attachment enters the picture. The thing that looks like it counts cycles does not count the cycles you think it does.

And the one I love, because it is pure hard-won domain knowledge: a spec sheet's values are *display text, not code.* When a requirements document lists a sub-category as "N/A," that does not become the literal string `'N/A'` in your data. It becomes the canonical empty-option value the rest of the system already uses — the same one, for every state and every user type. Mistake the human-readable spec sheet for the data model and you will scatter a dozen spellings of "nothing" across the system and spend a season reconciling them.

Oh — and task titles do not end with a period. Look back at the human-trafficking task. That is a convention too, and a convention nobody wrote down is a convention that drifts.

## The change that proved the design

You learn whether an architecture was right when a sweeping change arrives. Ours arrived as the nurse compact — the arrangement where a nurse with a compact home state can practice across all the other compact states, which means a license in one place suddenly has to carry obligations defined somewhere else entirely.

That is exactly the kind of cross-cutting rule that, in the grand-abstraction version of this system, would have meant editing every state file in the country. Instead it landed in the framework's prototype-merge layer — a handful of methods that let one license type merge in another's compact task set when the compact rules say it should. A continent-wide change to how nursing licenses work was a few methods in the shared substrate, not fifty file edits. *That* is the return on having invested in the framework underneath instead of in a clever surface. The variety stayed in the files where it belongs, and the cross-cutting rule went where cross-cutting rules belong.

## Testing the matrix

Two conventions earn their place in the test suite specifically. Anchor your time-travel in specs to the last day of the current calendar month, because mid-month dates produce flaky cycle math that will pass on the fifteenth and fail on the thirty-first and waste an afternoon of your life. And test *behavior* — task counts, identifiers, dates, credit math — not cosmetic metadata like display labels and category strings, which churn constantly and are not what the system is for. A test that breaks every time someone rewords a label is not protecting behavior. It is taxing it.

## The shape of the answer

Irreducible variation wants three things, and a clever abstraction is none of them. It wants many small homes, each readable by the person who knows the real rule. It wants a strong shared substrate, so the machinery is written once and the cross-cutting changes have somewhere to land. And it wants ruthless conventions, so that fifty files written over years by different hands still read as if one careful person wrote them this morning.

Do not fight the variation. The states are not secretly the same, and an abstraction that pretends they are will spend the rest of its life leaking the difference back out. Give each one a small, honest room, and invest everything else in the house they share.
