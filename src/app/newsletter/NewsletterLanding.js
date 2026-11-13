"use client";

import { Box, Typography } from "@mui/material";
import NewsletterPageShell from "@/components/newsletter-page-shell";
import NewsletterSignup from "@/components/newsletter-signup";
import { muted, SERIF_BODY } from "@/lib/editorial";

export default function NewsletterLanding() {
  return (
    <NewsletterPageShell
      title="Get new work by email"
      intro="Two kinds of thing get published here, and they don't overlap much. Take whichever you actually want."
    >
      <NewsletterSignup
        variant="card"
        defaultTopics={{ blog: true, poetry: true }}
      />

      <Box sx={{ mt: 5 }}>
        <Typography
          sx={{ fontFamily: SERIF_BODY, fontSize: "0.9rem", color: muted, lineHeight: 1.7 }}
        >
          You&rsquo;ll get one email per piece — no digests, no roundups, no
          tracking pixels. Every one carries an unsubscribe link, and confirming
          your address is required before anything is sent.
        </Typography>
      </Box>
    </NewsletterPageShell>
  );
}
