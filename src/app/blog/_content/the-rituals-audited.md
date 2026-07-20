---
title: "The Rituals, Audited"
description: "I wrote an essay about disciplined AI-agent workflows. Then I let the workflow run on this site for weeks. Here is the diff between the sermon and the receipts."
date: "2026-07-18"
category: "Engineering Practice"
---

In June I published an essay arguing that the leverage in AI-assisted engineering is not the model but the scaffolding — committed memory, fierce pre-PR review, hand-off prompts written for an agent with amnesia. It was a confident essay. Confidence is easy in the genre; every post about AI workflows is written at the moment of peak enthusiasm, and almost none are followed by an audit. The claims go out, the receipts never do.

This is the audit. Since that essay, nearly everything that happened to this website — a ground-up redesign, a batch of engineering essays, an accessibility pass, RSS and sitemap plumbing, a security upgrade, the features shipped alongside the very post you are reading — was built with an AI agent, under the rituals, on this site's own repository. A portfolio site is a small stakes venue, and that is exactly what makes it a clean instrument: no deadline pressure to blame, no coworker's habits to absorb. Just the process, running honestly. Here is what held, what changed shape, and what I quietly stopped pretending.

## What held: the constitution in the repo

The June essay's central claim was that agent memory must live in the repository, version-controlled, read at the start of every session. That held so well it got promoted. This repo now carries a standing rules file — a small constitution the agent reads before anything else — and the most load-bearing rules in it are not about code at all. Plan before building anything non-trivial. Stop and re-plan when something goes sideways instead of pushing through. Never mark work complete without proving it runs. After any correction from me, *write the correction down as a rule,* so the same mistake needs to be made only once.

That last one is the self-improvement loop, and it is the ritual I would defend with the most conviction, because it is the only one that compounds. A checklist keeps quality flat. A checklist that grows a line every time reality disagrees with it makes next month's baseline out of this month's mistake. The file even encodes commit etiquette — whose name goes on the commits, how messages read — because a memory that stops at architecture leaves the agent re-asking everything else.

## What changed shape: the review found an enforcer

The fierce pre-PR review survived, but the audit's honest finding is that a ritual enforced by vigilance is a ritual that skips whenever vigilance does. The June essay knew this and shipped the bug to prove it. The structural fix was boring and overdue: continuous integration. Lint and a full production build on every pull request — a floor no lapse in attention can fall through.

The pattern generalizes, and it is the biggest thing I have learned since June: **rituals want to become infrastructure.** A practice that lives in prose is a request; a practice that lives in a pipeline is a fact. The memory files were already this — discipline compiled into the repo. CI is the same move for verification. The remaining rituals, the ones still enforced by attention alone, should be understood as a backlog of things waiting to be turned into machinery.

## What I stopped pretending: one prompt, one unit of work

The hand-off doctrine — every task specified so completely a context-free agent could execute it cold — turns out to describe *units of work*, not collaborations. The best sessions on this site were not silent executions of perfect specs. They were plan-first conversations: the agent explores the codebase, drafts an approach, and I redirect it before a line is written — *drop that feature, I have not started that project; keep the rest.* The June essay treated interaction as a failure of specification. The audited version says: specify the unit fiercely, but keep the human at the plan boundary, because the cheapest possible correction is the one made to a plan. The redesign, the essay batches, the roadmap that produced this post — every one was cheaper to steer at the plan than it would have been to repair in the diff.

The related discovery is subagents. The rules file now directs the agent to fan exploration out to disposable subordinate agents and keep its own working context clean. That is not a trick, it is the *same* insight the memory files encode — context is the scarce resource — applied to a single session instead of the space between sessions. Guard it at both scales.

## What the audit cannot show

Honesty requires the control group I do not have. I cannot show you the counterfactual site built with vibes instead of rituals; maybe it ships the same features and the essays just have more bugs in them. Small-stakes venues also flatter every process — no on-call, no compliance reviewer, no colleague inheriting my choices. I hold the June thesis with the same confidence and better evidence, but evidence from a garden is not evidence from a battlefield. The rituals earned their production keep at my day job before this site existed; what the site adds is a place to watch them run *unhurried*, where the only pressure is whether the thing is true.

## The takeaway

An engineering practice you will not audit is a belief, and beliefs about AI workflows are currently being manufactured faster than software is. The June essay holds — the leverage really is the scaffolding — but the month of receipts sharpened it into something more specific: **write the rituals down, then relentlessly promote them into infrastructure.** Prose becomes a rules file. Vigilance becomes CI. Corrections become permanent entries the moment they happen. Every promotion moves a practice from the category of things you intend to the category of things that are simply true of the repository.

The sermon was *have rituals.* The audit says: have rituals, and then measure how many of them still require you to remember them. That number should only go down.
