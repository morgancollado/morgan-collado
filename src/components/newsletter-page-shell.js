"use client";

import { Box, Container, Typography } from "@mui/material";
import { ink, muted, surfaceSx, SERIF_BODY } from "@/lib/editorial";

/**
 * The frame every /newsletter page sits in — one narrow measure of paper, a
 * Playfair heading, and serif body copy. Extracted because four pages share it
 * exactly and a fifth would otherwise copy it again.
 */
export default function NewsletterPageShell({ title, intro, children }) {
  return (
    <Box component="main" sx={{ ...surfaceSx, minHeight: "70vh", py: { xs: 8, md: 12 } }}>
      <Container maxWidth={false} sx={{ maxWidth: "40rem" }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontSize: { xs: "2rem", md: "2.6rem" },
            lineHeight: 1.15,
            color: ink,
            mb: 2,
          }}
        >
          {title}
        </Typography>
        {intro && (
          <Typography
            sx={{
              fontFamily: SERIF_BODY,
              fontSize: "1.05rem",
              lineHeight: 1.7,
              color: muted,
              mb: 4,
            }}
          >
            {intro}
          </Typography>
        )}
        {children}
      </Container>
    </Box>
  );
}
