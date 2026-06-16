// Single source of truth for the work/essay cards shown on the home page.
// Both the home page and a blog post's social-share metadata read from here,
// so the image a reader sees on the home page is the same one that renders
// when the article is linked elsewhere.

const everlyHealth = [
  {
    id: 8,
    projectName: "AdHoc Reminders",
    projectDescription: "Sending reminders whenever we wanted.",
    projectDetail:
      "Sending reminders outside of the initial build was tedious and required engineering work. Here is how I built a tool to make sending messages delightful.",
    imageLink: "/diagnostics-reminders.svg",
    blogLink: "/blog/adhoc-reminders",
  },
  {
    id: 9,
    projectName: "Campaign Generation Tool",
    projectDescription: "Campaigns for every program.",
    projectDetail:
      "Creating campaigns was a manual process. Lets discuss the tool I built to make creating campaigns easy peezy.",
    imageLink: "/diagnostics-campaigns.svg",
    blogLink: "/blog/campaign-generation",
  },
  {
    id: 10,
    projectName: "Batch creation of result test types",
    projectDescription: "Creating test types in bulk.",
    projectDetail:
      "Creating test types one by one required repetitive use of a form. I created a service that took a spread sheet of data and created objects accordingly, saving time and lessening mistakes.",
    imageLink: "/diagnostics-tests.svg",
  },
];

const myFitnessPalProjects = [
  {
    id: 1,
    projectName: "Food Details Page",
    projectDescription: "The logged out food details page for a popular fitness app",
    projectDetail:
      "Let's talk about revamping the Food Details page for a popular fitness app.",
    imageLink: "/food-details.png",
    blogLink: "/blog/food-details",
  },
  {
    id: 2,
    projectName: "Onboarding flow for a popular fitness app",
    projectDescription:
      "A revamped onboarding flow for a popular fitness app that resulted in 80% more signups",
    projectDetail:
      "I was tasked with creating a new onboarding flow for prospective users",
    imageLink: "/onboarding.png",
    blogLink: "/blog/onboarding",
  },
  {
    id: 3,
    projectName: "Diet and fitness edit page",
    projectDescription:
      "The page customers use to edit their diet and fitness profile for a popular fitness app",
    projectDetail:
      "This included 16 different fields with their own validation logic and extending a Ruby on Rails API",
    imageLink: "/diet-fitness-profile.png",
    blogLink: "/blog/rails-api-extension",
  },
  {
    id: 4,
    projectName: "Premium landing page",
    projectDescription:
      "The premium upsell page that customers would use to begin their premium journey for a popular fitness app",
    projectDetail:
      "I had the opportunity to work on the premium landing page for a popular fitness app",
    imageLink: "/premium.png",
    blogLink: "/blog/crafting-premium",
  },
  {
    id: 5,
    projectName: "Accessibility audit",
    projectDescription:
      "A complete audit of a popular fitness app's NextJS app. The completion of this project ensured that the product was built with accessibility best practices",
    projectDetail:
      "Creating an accessible digital environment is not just an option; it's a responsibility",
    imageLink: "/accessibility-audit.png",
    blogLink: "/blog/enhancing-accessibility",
  },
];

const colladoCodeWorksProjects = [
  {
    id: 6,
    projectName: "morgancollado.com",
    projectDescription: "This very portfolio site. Projectception!",
    projectDetail:
      "Learn more about what I used to build this nifty piece of software.",
    imageLink: "/portfolio-screencap.png",
    blogLink: "/blog/building-portfolio",
  },
  {
    id: 7,
    projectName: "Trans History Quiz app",
    projectDescription: "A simple quiz game written in Swift",
    projectDetail: "Coming soon to an iOS device near you!",
    imageLink: "/trans-pride-flag.png",
  },
];

const healthcarePlatformProjects = [
  {
    id: 11,
    projectName: "The Model Reads the Mail",
    projectDescription:
      "Automating CME categorization — LLMs at the messy boundary, deterministic rules where it counts.",
    projectDetail:
      "How we automated a fully-manual categorization process: the model extracts, deterministic rules decide, and a self-mining rulebook turns every human judgment into a reusable one.",
    imageLink: "/essay-categorize.svg",
    blogLink: "/blog/auto-categorizing-cme",
  },
  {
    id: 12,
    projectName: "Rituals, Not Vibes",
    projectDescription:
      "Shipping features with an AI agent through durable process, not clever prompts.",
    projectDetail:
      "The unglamorous operating model that actually ships features with a coding agent: committed memory, a fierce pre-PR review, and self-contained hand-offs.",
    imageLink: "/essay-rituals.svg",
    blogLink: "/blog/rituals-pairing-ai-agent",
  },
  {
    id: 13,
    projectName: "The Constraint That Measured Ciphertext",
    projectDescription:
      "A length check that passed every test for weeks — until an emoji-dense reply blew it up.",
    projectDetail:
      "A three-way collision of Rails encryption, Postgres, and zlib: why a database constraint on an encrypted column measures the wrong string, and how compression hid it.",
    imageLink: "/essay-ciphertext.svg",
    blogLink: "/blog/ciphertext-check-constraint",
  },
  {
    id: 14,
    projectName: "A Core-Model Refactor Is a Graph Problem",
    projectDescription:
      "Pulling two registration types out of a god-model, and finding every reader the hard way.",
    projectDetail:
      "Untangling DEA and CSR registrations from an overloaded STI certifications table into sibling models — and chasing down every view, importer, and ops tool that quietly read the old shape.",
    imageLink: "/essay-detangle.svg",
    blogLink: "/blog/detangling-god-model",
  },
];

export const SECTIONS = [
  {
    label: "Movement 01",
    title: "At the Healthcare Compliance Platform",
    subtitle:
      "LLMs at the messy edges, encryption that bites back, and the rituals that keep an AI agent honest in a regulated domain.",
    projects: healthcarePlatformProjects,
  },
  {
    label: "Movement 02",
    title: "At the Medical Diagnostics Company",
    subtitle:
      "Patient outreach, internal tooling, and the messy edges of healthcare communication.",
    projects: everlyHealth,
  },
  {
    label: "Movement 03",
    title: "At the Popular Fitness App",
    subtitle:
      "Onboarding, accessibility, and the front-end shape of a household name.",
    projects: myFitnessPalProjects,
  },
  {
    label: "Movement 04",
    title: "At Collado CodeWorks",
    subtitle: "Independent work, in-progress experiments, and this very site.",
    projects: colladoCodeWorksProjects,
  },
];

// Find the home-page card for a blog post by its slug, e.g. "food-details".
export function getProjectBySlug(slug) {
  const target = `/blog/${slug}`;
  for (const section of SECTIONS) {
    const found = section.projects.find((p) => p.blogLink === target);
    if (found) return found;
  }
  return null;
}

// Map a card's display image to one usable as a social-share image. SVG cards
// don't render as link previews on most platforms, so point at the PNG twin
// generated into /public/og (see scripts/generate-og-images.mjs).
export function socialImageFor(imageLink) {
  if (!imageLink) return null;
  return imageLink.endsWith(".svg")
    ? `/og/${imageLink.slice(1).replace(/\.svg$/, ".png")}`
    : imageLink;
}
