"use client";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import Grain from "@/components/grain";

const editorialLinkSx = {
  fontFamily: "var(--font-playfair)",
  fontStyle: "italic",
  fontSize: "1.05rem",
  color: "primary.main",
  textDecoration: "none",
  paddingBottom: "2px",
  borderBottom: "1px solid currentColor",
  display: "inline-block",
  "&:hover": { borderBottomStyle: "dashed" },
};

export default function NotFound() {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
        minHeight: "100vh",
        pb: 12,
        overflow: "hidden",
      }}
    >
      <Grain />

      {/* Folio dateline */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          px: { xs: 3, md: 6 },
          py: 1.5,
          borderTop: "3px double",
          borderBottom: "1px solid",
          borderColor: "currentColor",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          fontVariantCaps: "small-caps",
          letterSpacing: 3,
          fontSize: "0.72rem",
          fontFamily: "var(--font-playfair)",
        }}
      >
        <span>Errata</span>
        <span>404</span>
        <span>{dateStr}</span>
        <span>Morgan Collado</span>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          px: { xs: 3, md: 6 },
          pt: { xs: 10, md: 16 },
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 8,
            color: "primary.main",
            display: "block",
            mb: 2,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
          }}
        >
          A blank page
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(4rem, 16vw, 12rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            mb: 3,
          }}
        >
          404
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "1.25rem",
            maxWidth: "44ch",
            mx: "auto",
            mb: 6,
            color: (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d"),
            lineHeight: 1.5,
          }}
        >
          — Nothing has been set in type here. The page you sought has been
          misfiled or, perhaps, was never composed. —
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: { xs: 3, md: 4 },
            flexWrap: "wrap",
          }}
        >
          <Box component={Link} href="/" sx={editorialLinkSx}>
            ← Return to the portfolio
          </Box>
          <Box component={Link} href="/blog" sx={editorialLinkSx}>
            Browse the writing →
          </Box>
        </Box>
        <Box
          sx={{
            mt: 8,
            color: "primary.main",
            fontFamily: "var(--font-playfair)",
            letterSpacing: 10,
            fontStyle: "italic",
          }}
        >
          ❦ ❦ ❦
        </Box>
      </Box>
    </Box>
  );
}
