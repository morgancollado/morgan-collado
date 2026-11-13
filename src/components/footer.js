"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import { paper, ink, muted } from "@/lib/editorial";
import NewsletterSignup from "@/components/newsletter-signup";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/queen-")) return null;

  // One signup form per page. The footer offer is the fallback, and it stands
  // down wherever the page already carries a better one: the /newsletter pages
  // are about the subscription already — the landing page *is* this form, and
  // repeating it under "You're unsubscribed" is at best noise — and both
  // indexes close with the full card, which the footer would otherwise repeat
  // verbatim a few pixels further down.
  const hasOwnSignup =
    pathname?.startsWith("/newsletter") ||
    pathname === "/blog" ||
    pathname === "/poetry";

  const year = new Date().getFullYear();
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: paper,
        color: ink,
        borderTop: "1px solid",
        borderColor: "currentColor",
        py: { xs: 3, md: 4 },
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      {!hasOwnSignup && (
        <Box sx={{ width: "100%", maxWidth: "34rem", mb: 2 }}>
          <NewsletterSignup variant="compact" />
        </Box>
      )}
      <Box
        sx={{
          color: "primary.main",
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          letterSpacing: 10,
          fontSize: "0.9rem",
        }}
      >
        ❦
      </Box>
      <Typography
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "0.78rem",
          fontVariantCaps: "small-caps",
          letterSpacing: 3,
          color: muted,
        }}
      >
        © {year} Morgan Collado  ·  Set by code
      </Typography>
    </Box>
  );
};

export default Footer;
