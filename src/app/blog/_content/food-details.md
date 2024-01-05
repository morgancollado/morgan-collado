---
title: "Revamping MyFitnessPal's Food Details Page: A Journey from Clunky to Clean"
imgs: [{img: "/food-details.png", alt: "A screen shot of the top of the food details page showing UI of nutrition data"}, {img: "/food-details-2.png", alt: "A screen shot of the middle of the food details page showing UI of how the food meets certain goals"}, {img: "/food-details-3.png", alt: "A screen shot of the bottom of the food details page showing a table of carbs fat and protein of the food"}]
---

Let's talk about revamping the Food Details page for MyFitnessPal. It involved creating MyFitnessPal's first public instance of GraphQL to elegantly model the food data and serve it efficiently to the app. Let me walk you through the journey, from confronting initial challenges to implementing a sleek, modern solution.

When we first started peeling back the layers of the existing Food Details page, we encountered a tangle of bad coding practices that had accumulated over time. The client-side was burdened with on-the-fly calculations, leading to glaring inconsistencies and a user experience that was less than ideal. It was clear that a makeover was overdue, and not just a superficial one. We needed to fundamentally rethink the way we handled data, ensuring reliability, efficiency, and a seamless user experience.

Enter GraphQL. GraphQL is a query language for APIs, offering the flexibility to request exactly the data you need and nothing more. It was the perfect antidote to our bloated, inefficient data handling. By implementing GraphQL, we were able to model our food data more effectively and serve it up to the app in a more digestible format.

We were already using React Query to fetch, cache, and update the data in our React components from our REST APIs. Happily, React Query out of the box worked is configured to handle REST APIs or GraphQL APIs, allowing us to manage and synchronize the server state with our UI effortlessly without needing to add anything to our state manager. No extra configuration, no headaches — just smooth, efficient data processing that made our app snappier and more responsive.

One of the critical realizations during this project was the importance of adhering to the principle of separation of concerns. The original implementation had blurred the lines, with the client juggling data processing tasks that rightly belonged to the server. We rolled up our sleeves and refactored the backend, offloading the calculations and data wrangling to where it belonged. Now, the backend is a well-oiled machine, delivering just the necessary data to render on the client-side, ensuring consistency and reliability.

The result? A Food Details page that's not only faster and more reliable but also a joy to maintain and evolve. This project was a testament to the power of modern web technologies and a clean, thoughtful approach to application architecture. It's a journey from clunky to clean, and I couldn't be prouder of what we've achieved.