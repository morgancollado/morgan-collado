import { getPoemPreviews } from "./_lib/poems";
import { DRAW_COUNT } from "./_lib/constants";
import PoetryIndex from "@/components/poetry-index";
import { hashSeed, pickN, utcDayKey } from "@/lib/seeded-random";

export const metadata = {
  title: "Poetry | Morgan Collado",
  description:
    "Poems by Morgan Collado, early and new — about my life and my rage, my grief and love, and about being a trans Latina in the years these were made.",
  twitter: { card: "summary_large_image" },
};

export default function PoetryPage() {
  const poems = getPoemPreviews();

  // The draw is computed here, at build time, and handed to the client as a
  // prop. Deliberately not `Math.random()` and deliberately not a client-side
  // date read: the server HTML and the first client render have to agree, or
  // React reports a hydration mismatch.
  //
  // This page stays fully static on purpose. Adding `revalidate` would move it
  // onto a serverless function at request time, where the loader's
  // `fs.readdirSync` can't be traced into the bundle — that fails only in
  // production, with an ENOENT on the _content directory.
  const buildDayKey = utcDayKey();
  const initialDraw = pickN(
    poems.map((p) => p.slug),
    DRAW_COUNT,
    hashSeed(buildDayKey)
  );

  return (
    <PoetryIndex
      poems={poems}
      initialDraw={initialDraw}
      buildDayKey={buildDayKey}
    />
  );
}
