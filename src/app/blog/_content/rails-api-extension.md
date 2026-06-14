---
title: "Rails API Extension: Adaptability and Internationalization"
description: "A blog post about writing ruby on rails code"
date: "2023-02-01"
category: "Popular Fitness App"
layout: "wide"
imgs: [{img: "/diet-fitness-profile.png", alt: "A screen shot showing form UI for the diet and fitness profile page"}, {img: "/rails-2.png", alt: "A screen shot showing from UI with an error state under the goal weight indicating that it is too low"}, {img: "/rails-3.png", alt: "A screen shot of the bottom of the food details page showing a table of carbs fat and protein of the food"}]
---

Extending an existing API is one of those jobs that sounds dull until you are inside it. I was asked to extend our Ruby on Rails API so that a new Next.js front end could read and write user diet and fitness profiles, and so that the system could finally treat international users like full citizens of the product. That second part is what I want to spend most of this post on, because it is the part the brief did not say out loud.

The first piece was a new serializer. Serializers are unglamorous and important. They decide what the outside world sees when it asks our API a question. They are the right place to draw the line between what our database happens to store and what our consumers are allowed to depend on. I wrote a serializer that exposed exactly the fields the new front end needed, in the shape the front end wanted to consume them, and nothing else. If a future consumer wants more, that is a conversation. It is not a default.

![A screen shot showing form UI for the diet and fitness profile page](/diet-fitness-profile.png)

The second piece was exposing the profile update logic through the API. This sounds straightforward. It is not. The moment you accept profile updates from a new client, you are inviting a new set of authentication and authorization questions, and you are also inviting the possibility that your changes will ripple out to surfaces you did not know depended on them. I spent more time than I would like to admit walking the codebase, finding the existing consumers, and making sure that the new endpoint did not quietly change the contract for anyone else. The interesting engineering happens in those audits, not in the endpoint itself.

The third piece is the one I keep thinking about.

Our users weigh themselves in stones, in pounds, and in kilograms, depending on where they live. The old system pretended otherwise. It had grown up around pounds because the team that wrote it lived somewhere that uses pounds, and every other unit was bolted on later as an afterthought. If you have ever wondered why a product feels subtly hostile to users in another country, this is usually why. The defaults reflect the engineers, not the users.

![A screen shot showing form UI with an error state under the goal weight indicating that it is too low](/rails-2.png)

So I built a conversion layer at the API boundary. Incoming requests declare their unit or inherit it from the user’s preference. The data is converted to a canonical internal unit at the door, stored that way, and converted back on the way out. The internal representation is one thing. The presentation is whatever the user told us they want. The application stopped being a translator and went back to being an application.

Tests carried me through all of this. Unit tests on the conversion math, because off-by-a-decimal errors in a fitness app are not academic — they show up on a user’s screen as the wrong weight. Integration tests on the endpoints, because a serializer is only as good as the round-trip it survives. Acceptance tests on a handful of journeys, because at some point you have to ask the boring question of whether the product still works.

A few things I want to remember from this work.

APIs are interfaces between strangers. They should be designed that way: deliberately, explicitly, and with sympathy for the consumer you have not met yet.

Internationalization is not a feature you add at the end. It is a question about whose comfort the defaults are optimized for.

And the most useful thing you can do when you extend an old system is to figure out what assumptions it was quietly making, and decide whether you are willing to keep making them.
