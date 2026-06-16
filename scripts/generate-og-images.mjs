// Rasterize the SVG card art in /public into PNGs for social link previews.
// Most platforms (iMessage, X, Facebook, LinkedIn, Slack) won't render an SVG
// as an og:image, so each SVG card gets a PNG twin written to /public/og.
//
// The generated PNGs are committed to the repo, so this is a one-off dev tool —
// it is intentionally NOT part of `build`. (sharp's native @img packages make
// Next's build-trace globber overflow on Vercel, so sharp is not a project
// dependency.) After editing an SVG card, regenerate with:
//
//   npm i -D sharp && node scripts/generate-og-images.mjs && npm rm sharp
//
// then commit the updated /public/og PNGs.

import { readdir, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const outDir = join(publicDir, "og");

// 2x the 640x400 card viewBox — crisp on retina, well within platform limits.
const WIDTH = 1280;
const HEIGHT = 800;

async function main() {
  await mkdir(outDir, { recursive: true });

  const svgs = (await readdir(publicDir)).filter((f) => f.endsWith(".svg"));

  await Promise.all(
    svgs.map(async (file) => {
      const out = join(outDir, file.replace(/\.svg$/, ".png"));
      await sharp(join(publicDir, file))
        .resize(WIDTH, HEIGHT, { fit: "contain", background: "#efe9dd" })
        .png()
        .toFile(out);
    })
  );

  console.log(`Generated ${svgs.length} OG image(s) in public/og`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
