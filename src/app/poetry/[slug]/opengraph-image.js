import { ImageResponse } from "next/og";
import { getAllPoemSlugs, getPoemBySlug } from "../_lib/poems";
import { formatDate } from "@/lib/format-date";
import {
  OgCard,
  OG_SIZE,
  OG_CONTENT_TYPE,
  loadFonts,
} from "../_lib/og-card";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "A poem by Morgan Collado";

// Next 14 does not prerender metadata image routes inside a dynamic segment,
// so unlike the poem pages this one is rendered on first request and then held
// by the CDN — that is what `force-static` buys, an immutable cacheable
// response rather than a re-render per hit.
//
// Which makes file tracing the thing to watch. `page.js` warns that the
// loader's `fs` reads can't be traced onto a request-time function; here they
// can, because the import graph is static. Verified against the build output:
// route.js.nft.json lists all 48 poem markdown files and all three fonts. If
// this route ever starts 500ing in production with ENOENT, check that file
// first, and pin the assets with `outputFileTracingIncludes` if they've fallen
// out.
//
// generateStaticParams is kept because it costs nothing and is what will
// prerender these on a later Next.
export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllPoemSlugs().map((slug) => ({ slug }));
}

// Four lines of the opening stanza. Enough to carry a voice, few enough that
// they can be set large — a link preview is read at thumbnail size, so
// legibility beats quantity.
const CARD_LINES = 4;

export default async function Image({ params }) {
  const poem = getPoemBySlug(params.slug);
  const opening = poem.stanzas[0] || [];
  const lines = opening.slice(0, CARD_LINES);

  return new ImageResponse(
    (
      <OgCard
        title={poem.title}
        lines={lines}
        align={poem.align}
        footer={formatDate(poem.date)}
        // Only the poems carried over from the old blog carry its imprint.
        imprint={poem.sourceUrl ? "A Trip to the Morg" : ""}
        truncated={poem.lineCount > lines.length}
      />
    ),
    { ...size, fonts: loadFonts() }
  );
}
