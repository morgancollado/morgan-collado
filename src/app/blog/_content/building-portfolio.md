---
title: "Crafting a Personal Space"
imgs: [{img: "/portfolio-screencap.png", alt: "A screen shot of the home page of this site"}, {img: "/portfolio-2.png", alt: "A screen shot of the portfolio page of this site"}, {img: "/portfolio-3.png", alt: "A screen shot of the contact form for this site"}]
---

Developing my personal portfolio site was not just a technical endeavor but also a deeply personal one. It was an opportunity to marry functionality with creativity, using a stack of exciting technologies. In this blog post, I'll walk you through the development process, highlighting the use of Next.js, Framer Motion, Google's reCAPTCHA v3, and more, which together made my portfolio not just a showcase of work but an interactive experience for visitors.

Next.js was an obvious choice for the framework due to its robust features and flexibility. Its ability to render on the server side, combined with its support for static site generation, makes it incredibly performance-oriented. Perhaps one of the most convenient features was the ability to set up API routes easily. This allowed me to implement a direct email feature, enabling visitors to get in touch without leaving the site.

First impressions matter. To make the landing page pop, I utilized Framer Motion for smooth, eye-catching animations. This library allowed me to add nuanced and performant animations, enhancing the user's visual journey as they navigate through the site.

To maintain the integrity of the site and protect it from spam without hampering the user experience, I integrated Google's reCAPTCHA v3. This version is particularly user-friendly, as it doesn't require any action from the user, like ticking a checkbox. It runs quietly in the background, offering protection while keeping user interaction smooth and uninterrupted.

As someone accustomed to the pages router in Next.js, adapting to the new app router convention was a welcome challenge. It allowed for more dynamic routing and made static generation of routes, particularly for the blog section, incredibly efficient. This not only improved the speed of the site but also the overall user experience.

Understanding and respecting user preferences is crucial. To this end, the portfolio can detect a user's system preference for light or dark mode and automatically adapt to it. For those who prefer to switch manually, a toggle is readily available. This feature ensures that the site is comfortable to view, regardless of the user's preferred theme or current environment.

To streamline the development of the site's UI, I utilized Material-UI. This allowed me to quickly build a comprehensive component library and theme system that supports both light and dark modes. The ready-to-use components saved development time while ensuring a consistent and modern look across the site.

Developing my personal portfolio was a journey of both personal and professional growth. It was about creating a space that not only showcases my work and skills but also provides an enjoyable experience for visitors. By leveraging the power of Next.js, Framer Motion, Google's reCAPTCHA v3, and Material-UI, I was able to build a site that is fast, secure, and beautiful. It reflects my journey as a developer and will continue to evolve with me. As technology changes and as I grow, so too will my digital portfolio, adapting and improving, always aiming to provide that perfect blend of aesthetics and functionality.