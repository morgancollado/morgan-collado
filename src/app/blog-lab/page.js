import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";

const PROTOTYPES = [
  {
    num: "I",
    name: "The Broadsheet",
    href: "/blog-lab/broadsheet",
    tagline: "Maximalist editorial print. Drop caps, numbered plates, hairline rules, italic masthead.",
    tier: "Tier 1 — Maximalist",
  },
  {
    num: "II",
    name: "Atelier",
    href: "/blog-lab/atelier",
    tagline: "Layered depth and texture. Grain, parallax title, ornamental scroll spine, tilted figures.",
    tier: "Tier 1 — Maximalist",
  },
  {
    num: "III",
    name: "Offset Editorial",
    href: "/blog-lab/offset",
    tagline: "Asymmetric. Sticky meta-rail with reading progress, offset 68ch column, drop cap.",
    tier: "Tier 2 — Middle ground",
  },
  {
    num: "IV",
    name: "Reading Room",
    href: "/blog-lab/reading-room",
    tagline: "Restraint as the design. Narrow measure, tuned Playfair, one hairline progress line.",
    tier: "Tier 3 — Refined",
  },
  {
    num: "V",
    name: "The Index",
    href: "/blog-lab/the-index",
    tagline: "Replaces the /blog card grid. Typographic list of every post. Thumbnails on hover.",
    tier: "Listing page",
  },
];

export default function LabIndex() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, fontFamily: "var(--font-playfair)" }}>
      <Typography
        variant="overline"
        sx={{ letterSpacing: 4, color: "text.secondary", display: "block", mb: 2 }}
      >
        Five directions, loudest to quietest
      </Typography>
      <Typography
        component="h1"
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "clamp(2.5rem, 7vw, 5rem)",
          lineHeight: 1,
          mb: 1.5,
        }}
      >
        Blog{" "}
        <Box component="span" sx={{ fontStyle: "normal" }}>
          Lab
        </Box>
      </Typography>
      <Typography
        sx={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.1rem",
          color: "text.secondary",
          maxWidth: "52ch",
          mb: 6,
          lineHeight: 1.6,
        }}
      >
        Each route below renders the real <em>Onboarding Evolution</em> post (or, for V, the
        real post list) in a different visual treatment. Toggle light/dark in the navbar, and
        try emulating <code>prefers-reduced-motion: reduce</code> on the maximalist ones.
      </Typography>

      <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {PROTOTYPES.map((p, i) => (
          <Box
            key={p.href}
            component="li"
            sx={{
              borderTop: i === 0 ? "1px solid" : "none",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              component={Link}
              href={p.href}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "auto 1fr", md: "80px 1fr auto" },
                gap: { xs: 2, md: 4 },
                alignItems: "baseline",
                py: { xs: 3, md: 4 },
                textDecoration: "none",
                color: "inherit",
                transition: "background-color .2s, padding .2s",
                "&:hover": {
                  bgcolor: "action.hover",
                  pl: { md: 2 },
                  "& .name": { fontStyle: "italic", color: "primary.main" },
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                {p.num}.
              </Typography>
              <Box sx={{ gridColumn: { xs: "2", md: "2" } }}>
                <Typography
                  className="name"
                  sx={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: { xs: "1.75rem", md: "2.25rem" },
                    lineHeight: 1.1,
                    transition: "color .2s, font-style .2s",
                  }}
                >
                  {p.name}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: "text.secondary",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    fontFamily: "var(--font-playfair)",
                  }}
                >
                  {p.tagline}
                </Typography>
              </Box>
              <Typography
                variant="overline"
                sx={{
                  display: { xs: "none", md: "block" },
                  letterSpacing: 2,
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                }}
              >
                {p.tier}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
