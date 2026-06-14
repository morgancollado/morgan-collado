---
title: "Crafting a popular fitness app's Premium Landing Page"
description: "A blog post about creating the premium landing page for a popular fitness app"
imgs: [{img: "/premium-1.png", alt: "A screenshot of a table comparing premium features vs free features"}, {img: "/premium-2.png", alt: "A screen shot of the premium page UI that includes a button to subscribe and highlights of premium features"}, {img: "/premium-3.png", alt: "A screen shot of the premium page UI that shows two cards with subscription options for yearly and monthly plans"}]
---

A premium landing page is, in the end, a page that asks for money. That is a hard thing to get right. The design needs to change often. The copy needs to change more often. And every change costs you something if it has to go through an engineer first. The brief I was handed was simple to state and harder to deliver: build the page so that the marketing team can keep iterating on it without me.

The lever for that was Split, our feature flagging tool. Split is what lets a non-engineer move a paragraph, swap a hero image, or run an A/B test without filing a ticket. It only works, though, if the React components on the other side are built to be moved around. A component that hard-codes its copy or its layout is a component that someone has to come back and edit by hand every time the business has a new idea. So I built the page out of components that accept their copy, their imagery, their CTA targets, and their variant selection as parameters. The component does not know what it is selling. The flag tells it.

That sounds abstract until you watch it happen. The product team would decide overnight that the comparison table needed a new row, or that the yearly plan should be highlighted differently for users in a particular segment. By morning the change was live. No deploy required. The data started rolling in within hours. That feedback loop is the whole game on a landing page. The faster the loop, the better the page gets.

A few things became obvious once we were running real experiments.

The first was that decoupling deploys from content changes lowered the temperature on the team. Marketing stopped feeling like they were begging engineering for time. Engineering stopped context-switching to push trivial copy edits. Everyone got their work back.

The second was that the components I had built for flexibility were not infinitely flexible, and I am glad of it. There is a strong pull, when you are building something configurable, to make every property a parameter. That way lies madness and a configuration surface no one can reason about. The components I shipped were flexible in the dimensions the business actually wanted to vary and rigid everywhere else. When the team wanted to vary something the components did not support, we talked about whether the request belonged in a flag or in a code change. Most of the time the answer was a code change. And that was fine.

The third was that A/B testing is only as good as the question you are asking. Split made it cheap to run experiments, which meant we had to get disciplined about running ones that were worth running. A test without a hypothesis is just noise with a control group.

What I liked most about this project is the part I did not own. The page kept evolving after I stopped working on it, and it evolved in directions I would not have predicted. That is the right outcome. A landing page is not a thing I should be a bottleneck for.
