---
title: "Revamping a popular fitness app's Food Details Page"
description: "A blog post about creating the food details page for a popular fitness app"
date: "2022-08-01"
category: "Popular Fitness App"
layout: "gallery"
imgs: [{img: "/food-details.png", alt: "A screen shot of the top of the food details page showing UI of nutrition data"}, {img: "/food-details-2.png", alt: "A screen shot of the middle of the food details page showing UI of how the food meets certain goals"}, {img: "/food-details-3.png", alt: "A screen shot of the bottom of the food details page showing a table of carbs fat and protein of the food"}]
---

The Food Details page is the page a user lands on when they want to know what they are about to eat. It needs to be fast. It needs to be accurate. And it needs to be quiet. The version we had was none of those things. Numbers drifted depending on which screen you arrived from. The client was doing arithmetic it had no business doing. Caching was inconsistent. The page worked, in the sense that it rendered, but you could feel it not trusting itself.

I want to be honest about how this kind of code accumulates. Nobody sat down one afternoon and decided to put the nutrition math on the client. It happened the way these things always happen: a deadline, a quick fix, a follow-up that never came, another quick fix on top of the first one. By the time I was looking at it, the page was a small archeological dig. The job was to figure out what should have been there all along and put that there instead.

The first decision was to move the math back to the server. The numbers on a food details page are not user preferences. They are facts about food. They should be computed once, in one place, by the system that owns the data, and the client should render what it is told. That is separation of concerns at its most boring and most useful. The client got smaller. The server got a little bigger. The numbers stopped drifting.

The second decision was to introduce GraphQL. This was the app’s first public GraphQL endpoint, which is a sentence I do not type lightly. GraphQL is not a free upgrade. It comes with a real cost in schema design, caching strategy, and operational tooling. We chose it here because the shape of food data is the kind of thing GraphQL is genuinely good at: a small number of entities with deep, optional relationships that different surfaces want to slice differently. The mobile app wanted one view. A future web surface might want another. We did not want to ship a REST endpoint per consumer and then a second one when somebody changed their mind.

React Query stayed where it was. The team was already using it for our REST endpoints, and it handles GraphQL out of the box. I mention this because part of building well is knowing when not to swap a tool out. React Query was working. The state layer was working. The problem was on the boundary between client and server, and that is where the change belonged.

What came out the other side is a page I am proud of. It is fast, because the server sends exactly the data the client needs to render and nothing more. It is consistent, because there is one place that knows what a calorie is. It is easier to evolve, because the schema makes the contract explicit, and the next person who needs to add a field can do so without breaking three other surfaces.

The lesson I keep coming back to from this project is one I already knew and apparently needed to learn again. When a page feels wrong, the answer is usually not at the surface. It is one layer down, in the place where responsibilities were quietly assigned to the wrong owner. Move them back. Most of the bugs go with them.
