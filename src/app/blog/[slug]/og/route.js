import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "../../_lib/helpers";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllPosts(["slug"]).map((post) => ({ slug: post.slug }));
}

// Letterpress title card in the house style: cream stock, ink keyline,
// small-caps section overline, italic Playfair title, dingbat colophon.
export async function GET(request, { params }) {
  const { title, description, category } = getPostBySlug(params.slug, [
    "title",
    "description",
    "category",
  ]);

  const playfair = await readFile(
    join(process.cwd(), "src/assets/fonts/PlayfairDisplay-Italic.ttf")
  );

  const titleSize = title.length > 34 ? 58 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#efe9dd",
          padding: 36,
          fontFamily: "Playfair Display",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            border: "2px solid rgba(42,32,48,0.5)",
            padding: "44px 64px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#6b5b7a",
            }}
          >
            {category}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: titleSize,
                fontStyle: "italic",
                lineHeight: 1.05,
                color: "#2a2030",
                maxWidth: 980,
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  display: "flex",
                  marginTop: 28,
                  fontSize: 28,
                  fontStyle: "italic",
                  lineHeight: 1.35,
                  color: "#6b5b7a",
                  maxWidth: 900,
                }}
              >
                — {description} —
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "#2a2030",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 30,
                letterSpacing: 14,
                color: "#6b5b7a",
              }}
            >
              · · ·
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: 22,
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              Morgan Collado · The Broadsheet
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Playfair Display",
          data: playfair,
          style: "italic",
          weight: 700,
        },
      ],
    }
  );
}
