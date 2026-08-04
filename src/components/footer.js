"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import { paper, ink, muted } from "@/lib/editorial";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/queen-")) return null;

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
