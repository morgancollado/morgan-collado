---
title: "Rituals, Not Vibes"
description: "How I actually ship features with an AI coding agent — durable process over clever prompts."
date: "2026-06-01"
category: "Engineering Practice"
layout: "prose"
---

The story everyone tells about coding with an AI agent is that the AI writes the code. It is a good story. It is also not the part that ships anything. The part that ships things is unglamorous and a little tedious, and it has almost nothing to do with how good the model is at writing a function.

What actually ships features is process. A fierce review pass before every pull request, performed against the diff and not against anyone's memory of the diff. Hand-off prompts written so completely that a fresh agent with no context could execute them cold. And a version-controlled memory, committed to the repository, so that the lessons an agent learns survive the agent forgetting everything the moment the session ends.

I have come to believe the leverage in AI-assisted engineering is not the model at all. It is the scaffolding you wrap around it. An agent is a tremendously capable worker with two specific, predictable flaws, and durable process is how you build around both.

## The two failure modes you are designing against

The first is **context loss.** An agent forgets everything between sessions. Not "gets a little fuzzy" — forgets, completely, and then cheerfully re-derives decisions you already made, often deciding them differently this time. Every session starts from zero, and zero is a dangerous place to start when the codebase already contains a hundred hard-won decisions about why things are the way they are.

The second is **over-confidence.** An agent will review code from recollection instead of reading the actual diff. It will accept feedback that is plausible and wrong. It will quietly re-scope a task it found inconvenient and present you the smaller thing as if it were the thing you asked for. None of this comes from malice or stupidity. It comes from a worker who trusts its own sense of the situation a little more than the situation deserves.

Every ritual below exists to guard against one of those two failures. That is the whole framework. The rest is just the specific shapes.

## Ritual: a memory that lives in the repo

Four markdown files live in the repository and are read at the start of every task. Not in a wiki, not in a chat history that compacts itself into oblivion — in the repo, version-controlled, reviewed like code.

A *learnings* file, for the surprises and the non-obvious project knowledge. A *decisions* file, for the architectural choices that were made *and the ones that were rejected,* so that a future session does not re-propose an idea you already considered and killed. An *incidents* file, for production bugs, each one ending in a single "Prevention" line — which is the entire point of the file; an incident you cannot prevent again is just a sad anecdote. And a *glossary,* for the project's words whose meaning does not match common English — the terms a domain quietly redefines and then punishes you for misunderstanding.

The hygiene rules are what keep these files from rotting into the kind of documentation everyone ignores, and they are worth stating plainly because they are the actual content:

One lesson per entry, dated. Do not memorize what the code already shows — if a reader could learn it by opening the file, it does not belong in memory. Do not memorize ephemeral state. When a later finding contradicts an earlier entry, *edit or delete the old one* rather than appending a contradiction, because a memory full of contradictions is a memory you stop trusting. Memory is for surprises: if removing an entry would not confuse a future reader, the entry should not exist. And memory updates ride in the *same pull request* as the change that produced them, so that the lesson is reviewed alongside the code that taught it.

The payoff is concrete. A fresh session starts already knowing the project's traps. It knows that the migrations live in an unusual directory, that a particular word means something specific here, that a tempting refactor was tried and abandoned for a good reason. The agent did not learn that. The agent cannot learn that. The *repository* learned it, and the agent reads it.

## Ritual: a fierce review before every pull request

Before anything becomes a pull request, there is a review pass whose single load-bearing instruction is this: *ground yourself on the artifact, not your recollection.* Re-read the actual diff. Attack it for bugs, regressions, and parity gaps. And report what you find — do not fix it in the same breath, because fixing while reviewing is how a reviewer talks themselves out of the finding.

The reason that instruction has to be so blunt is the over-confidence failure mode in its purest form. The very session doing the review may have *written* the code under review — or had its memory of writing it compacted away — and so its recollection of what the code does is exactly the thing you cannot trust. The diff is ground truth. Recollection is a story the session tells itself about ground truth. Review the truth.

## Ritual: hand-off prompts that assume zero context

Every unit of work gets specified as one branch, one pull request, zero prior context — written so a fresh agent could pick it up and execute it cold, with nothing but the prompt and the repository.

This sounds like overhead until you notice what it forces. You cannot write a self-contained hand-off for a thing you only vaguely understand. The act of specifying the work completely enough for a context-free agent *is* the act of thinking the work through. The discipline catches your own under-specification before it becomes an agent's confident misinterpretation. The hand-off pack that produced several of these very posts was an example of the form: it embedded every fact and snippet a no-repo agent would need, precisely because a no-repo agent was going to have to act on it.

## The supporting cast

A handful of smaller rituals each guard a specific failure, and the brief tour is enough to see the pattern.

*Validate feedback before implementing it* — render a verdict first, valid or partial or wrong, against the actual code, and then implement only the part that survived the verdict. *Force a real design decision* among two or three options, and make the agent answer the two questions it most wants to skip: do we even need this, and should we change the test instead of the code. *Map the blast radius* before any data, schema, or migration change — every reader, every production-scale risk — which is the lesson of a refactor that taught it the expensive way. *Keep operational scripts idempotent, smallest-scope, and uncommitted.* *Flag anything in the working tree that is not part of the current story.* *Prove from code and git history that something is actually dead before deleting it.* And stage the diff and summarize it, but leave the commit boundary to the human — because the human owns where one change ends and the next begins.

Each of those is a checklist standing where an agent would otherwise trust itself a little too much.

## The honest limits

I am not interested in writing the hype version of this, so here is what the rituals do not do. They do not own the commit boundary — a human does. They do not make the production judgment calls. And they do not answer the only question that actually matters at the start of any work, which is whether the thing is worth building at all. The agent is a force multiplier on a disciplined process. It is not a substitute for having one, and on the days the discipline lapsed, the agent multiplied the lapse just as faithfully as it multiplies everything else. A bug shipped anyway, more than once, in exactly the place a skipped ritual would predict.

That is the credibility of the whole approach, actually. It fails where you would expect a disciplined process to fail — at the seams where the discipline was not applied — and it holds where the discipline held. That is what a real operating model looks like. The hype version never tells you where it breaks.

## The takeaway

The leverage is not the model. It is the memory and the checklists you wrap around it. An agent with a committed memory and a pre-PR review ritual ships like a careful teammate — one who remembers the project's traps and reads the diff before it speaks. An agent without either ships like an enthusiastic intern with amnesia, re-deriving your decisions every morning and trusting its own recollection of code it cannot actually remember writing.

The difference between those two is not a better prompt. It is a process you were willing to build and keep.
