---
title: "Crafting MyFitnessPal's Premium Landing Page"
imgs: [{img: "/premium-1.png", alt: "A screenshot of a table comparing premium features vs free features"}, {img: "/premium-2.png", alt: "A screen shot of the premium page UI that includes a button to subscribe and highlights of premium features"}, {img: "/premium-3.png", alt: "A screen shot of the premium page UI that shows two cards with subscription options for yearly and monthly plans"}]
---

As a software engineer, there's a special kind of excitement that comes from building something that not only serves its purpose but also empowers others to iterate and innovate. I had the opportunity to work on the premium landing page for MyFitnessPal, a project that combined the need for technical precision with a flair for flexibility. One of the core requirements was the integration with Split, a feature flagging tool that allows non-technical team members to modify the UI dynamically. Here’s how we tackled this challenge and what it taught us about the collaborative nature of modern software development.

The mission was clear: create a premium landing page that could easily adapt to various designs and content, allowing the business team to experiment with different approaches to increase premium subscriptions. This meant that the React components I was to build had to be extraordinarily flexible, capable of accepting a wide array of parameters to alter their behavior and appearance.

Integrating Split into our landing page was a pivotal part of the project. Split is a powerful tool that enables product teams, marketers, and other non-technical stakeholders to make changes to the user interface without writing a single line of code. By leveraging Split's feature flagging capabilities, we could dynamically alter the layout, content, and even the behavior of the landing page based on real-time decisions.

This approach had several benefits:

Rapid Experimentation: By allowing non-technical team members to modify the UI, we could quickly iterate on different designs and messages, speeding up the experimentation process.

Decoupled Deployments: Changes to the landing page's look and feel could be made without deploying new code, reducing the risk associated with frequent deployments.

Personalized Experiences: With Split, we could tailor the landing page to different user segments, providing a more personalized and effective user experience.

To accommodate the dynamic nature of the landing page, I focused on building React components that were as flexible as possible. This meant designing components that could accept a wide range of parameters for content, styling, and functionality. Each component was like a Swiss Army knife, ready to adapt to whatever form the product team needed.

With the landing page in place and Split integration complete, the business team could start running A/B tests. These tests were invaluable, providing clear data on what changes led to increased subscriptions and user engagement. Each iteration brought us closer to a more effective landing page, driving growth and providing valuable insights into our user base.

This project was more than just a technical task; it was a lesson in collaboration and the power of software tools. By integrating Split, I not only expanded the capabilities of our landing page but also facilitated a more inclusive and agile approach to product development. It was incredibly satisfying to see non-technical team members take an active role in the page's evolution, bringing their unique perspectives and ideas to the table.

The ability to extend and enhance our work with third-party tools is one of the most exciting aspects of software engineering. It's a reminder that no one works in a vacuum; by leveraging the work of others and integrating different technologies, we can achieve far more than we could alone.