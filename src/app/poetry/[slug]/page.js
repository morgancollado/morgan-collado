import {
  getAllPoemSlugs,
  getPoemBySlug,
  getPoemNeighbors,
} from "../_lib/poems";
import PoemShell from "@/components/poem-shell";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPoemSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const poem = getPoemBySlug(params.slug);

  // Describe the poem in its own words. Whitespace is normalized here — and
  // only here — because the composed spacing in some poems would otherwise
  // leak into a meta tag.
  const opening = (poem.stanzas[0] || []).slice(0, 2).join(" / ");
  const description = opening.replace(/\s+/g, " ").trim();

  return {
    title: `${poem.title} | Poetry | Morgan Collado`,
    description: description || `${poem.title}, a poem by Morgan Collado.`,
    // The image itself comes from opengraph-image.js in this segment — Next
    // fills in its URL, dimensions and alt text. This only asks the platforms
    // for the full-width treatment rather than a thumbnail.
    twitter: { card: "summary_large_image" },
  };
}

export default function PoemPage({ params }) {
  const poem = getPoemBySlug(params.slug);
  const neighbors = getPoemNeighbors(params.slug);

  return <PoemShell poem={poem} neighbors={neighbors} />;
}
