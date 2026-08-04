import { ImageResponse } from "next/og";
import { getPoemPreviews } from "./_lib/poems";
import {
  OgCard,
  OG_SIZE,
  OG_CONTENT_TYPE,
  loadFonts,
} from "./_lib/og-card";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "The Chapbook — poems by Morgan Collado";

// A contents strip rather than a single poem: the index isn't any one poem, and
// three titles say more about the collection than an arbitrary excerpt would.
const CARD_TITLES = 3;

export default async function Image() {
  const poems = getPoemPreviews();
  const years = poems
    .map((p) => (p.date ? new Date(p.date).getUTCFullYear() : null))
    .filter(Boolean);

  const span = years.length
    ? `${Math.min(...years)}–${Math.max(...years)}`
    : "";

  return new ImageResponse(
    (
      <OgCard
        title="Poems, unbound"
        lines={poems.slice(0, CARD_TITLES).map((p) => p.title)}
        align="left"
        footer={[`${poems.length} poems`, span].filter(Boolean).join(" · ")}
        truncated={poems.length > CARD_TITLES}
      />
    ),
    { ...size, fonts: loadFonts() }
  );
}
