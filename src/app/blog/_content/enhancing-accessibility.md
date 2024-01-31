---
title: "Enhancing Accessibility: Auditing a popular fitness app’s Next.js Front End"
description: "A blog post about making accessible digital experiences"
imgs: [{img: "/accessibility-audit.png", alt: "A screen shot of showing an example of semantic HTML with describing different sections of the page"}]
---

Creating an accessible digital environment is not just an option; it's a responsibility. One of the tasks that I took on was to audit a popular fitness app's Next.js front end application, ensuring that it adhered to accessibility best practices. This task was not only about compliance but also about embracing the ethos of inclusivity in the digital space. 

At the heart of web accessibility lies semantic HTML. The way we structure our documents using HTML tags does more than just organize content—it communicates the purpose and meaning of that content to browsers and assistive technologies. For example, properly tagged headings, lists, and buttons tell screen readers how to interpret the parts of the page, making the content more navigable and understandable for users with visual or cognitive impairments.

To begin the audit, I employed various tools designed to detect accessibility issues, with a particular focus on axe's Chrome extension. This powerful tool scans web pages to identify accessibility violations, such as missing alt text for images, improper use of ARIA attributes, and inadequate color contrast. It became an invaluable asset in pinpointing areas where our application fell short of accessibility standards.

Beyond automated tools, one of the most eye-opening aspects of the audit was testing the website using a screen reader. This experience provided firsthand insight into how users with visual impairments interact with the application. We wanted to make sure that the screen reader could read all the elements and also understand the logical flow and easily navigate the document. Understanding and experiencing the user journey through a screen reader was crucial in identifying and rectifying issues that might otherwise have been overlooked.

Accessibility is a team effort. A significant part of the audit involved educating and collaborating with other team members. By teaching them how to use screen readers and encouraging them to incorporate accessibility checks into their regular development workflow, we fostered an environment where accessibility was a shared priority. This collective effort ensured that everyone was aware and invested in making our application as accessible as possible.

The audit was not a one-time event but a starting point for ongoing improvement. Making things accessible requires constant intentional action, with standards evolving and user needs changing. It's a commitment to continuously learn, adapt, and enhance our applications to ensure everyone can use them. This project reinforced the notion that making digital tools accessible is a necessary and integral part of software development.

The accessibility audit of a popular fitness app's Next.js front end application was a profound learning experience. It highlighted the importance of semantic HTML, the effectiveness of tools like axe, and the indispensable insights gained from screen reader testing. But more than that, it underscored the importance of accessibility as a core aspect of ethical and responsible software development. As we continue to build and improve our digital landscapes, let's carry forward the lessons learned and the commitment to creating an inclusive, accessible online world for everyone.