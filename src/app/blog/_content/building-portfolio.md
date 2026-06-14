---
title: "Crafting a Personal Space"
description: "A blog post about creating this website"
imgs: [{img: "/portfolio-screencap.png", alt: "A screen shot of the home page of this site"}, {img: "/portfolio-2.png", alt: "A screen shot of the portfolio page of this site"}, {img: "/portfolio-3.png", alt: "A screen shot of the contact form for this site"}]
---

A personal site is a strange thing to build. It is both a portfolio and a self-portrait, and the temptation is to over-design either half. I wanted something that felt like me: fast, accessible, a little bit playful, and easy to maintain so that I would actually update it.

I reached for Next.js because I already know it well and because the things I needed were things Next does well. Static generation for the blog. A small API route so the contact form can email me directly without standing up a separate backend. Server components where they help. Nothing exotic. The point was to ship a site, not to audition the stack.

The landing page needed a little movement. Not the kind that gets in your way, just enough to signal that something is alive here. I used Framer Motion for the animations because it lets me describe motion declaratively and stops me from writing the kind of brittle CSS transitions I always regret six months later. The animations are small on purpose. A portfolio that announces itself with confetti is a portfolio I do not trust.

The contact form is the only piece that talks to the outside world, which makes it the only piece spammers care about. I integrated Google's reCAPTCHA v3 so that protection happens in the background rather than asking visitors to prove they are not a robot. Friction at the front door of a contact form is a great way to never hear from anyone, and that defeats the purpose of having the form at all.

I had used the pages router for years, so the app router was a real adjustment. I am glad I made it. Co-locating route logic with the route, generating the blog statically from markdown files in `_content`, and being able to think in components rather than pages — all of that paid for itself quickly. The blog you are reading is built at compile time from the file system, which means publishing a post is as simple as adding a markdown file and pushing.

Theme support was non-negotiable. The site respects the system preference for light or dark and lets you override it with a toggle. I do not have strong opinions about which theme anyone should use; I have strong opinions about software that ignores the preferences you have already told your machine about.

Material UI carries the component layer. I am not precious about building every button from scratch. MUI gave me a coherent theme system that handles light and dark modes, accessible defaults, and components I do not have to think about so I can spend my time on the parts of the site that are actually mine.

The site is not finished. It is not supposed to be. It will keep changing as I do.
