"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import PortfolioButton from "./portfolio-button";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/queen-")) return null;

  const year = new Date().getFullYear();
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
        borderTop: "1px solid",
        borderColor: "currentColor",
        py: { xs: 4, md: 6 },
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2.5,
      }}
    >
      <PortfolioButton />
      <Typography
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "0.78rem",
          fontVariantCaps: "small-caps",
          letterSpacing: 3,
          color: (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d"),
        }}
      >
        © {year} Morgan Collado  ·  Set by hand, type and code
      </Typography>
    </Box>
  );
};

export default Footer;
