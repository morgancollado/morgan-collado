"use client";

import { useEffect, useRef } from "react";
import { Box, Container, Typography } from "@mui/material";
import { ink, muted, surfaceSx, SERIF_BODY, focusRing } from "@/lib/editorial";

/**
 * The frame every /newsletter page sits in — one narrow measure of paper, a
 * Playfair heading, and serif body copy. Extracted because four pages share it
 * exactly and a fifth would otherwise copy it again.
 *
 * These pages work by replacing themselves: "Confirming…" becomes "You're in",
 * "Unsubscribe?" becomes "You're unsubscribed". A swapped heading is silent to
 * a screen reader and invisible to anyone who was tabbing rather than looking,
 * and focus lands on `<body>` when the button that was focused unmounts. So the
 * heading takes focus whenever the title changes — never on first render, where
 * it would steal focus from a reader arriving normally.
 */
export default function NewsletterPageShell({ title, intro, children }) {
  const heading = useRef(null);
  const previous = useRef(title);

  useEffect(() => {
    if (previous.current === title) return;
    previous.current = title;
    heading.current?.focus();
  }, [title]);

  return (
    <Box component="main" sx={{ ...surfaceSx, minHeight: "70vh", py: { xs: 8, md: 12 } }}>
      <Container maxWidth={false} sx={{ maxWidth: "40rem" }}>
        <Typography
          component="h1"
          ref={heading}
          tabIndex={-1}
          sx={{
            fontFamily: "var(--font-playfair)",
            fontSize: { xs: "2rem", md: "2.6rem" },
            lineHeight: 1.15,
            color: ink,
            mb: 2,
            ...focusRing(),
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
