"use client";

import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { motion } from "framer-motion";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import RssFeedIcon from "@mui/icons-material/RssFeed";

import { useReducedMotion } from "@/lib/motion";
import Grain from "@/components/grain";

const socialButtonSx = {
  color: "primary.main",
  border: "1px solid",
  borderColor: "currentColor",
  borderRadius: 0,
  width: 36,
  height: 36,
};

export default function ContactPage() {
  const reduced = useReducedMotion();

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const fadeIn = reduced
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.8 },
      };

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
        <span>Vol. I, No. V</span>
        <span>Correspondence</span>
        <span>{dateStr}</span>
        <span>Morgan Collado</span>
      </Box>

      {/* Masthead */}
      <Box
        component={motion.header}
        {...fadeIn}
        sx={{
          position: "relative",
          textAlign: "center",
          px: { xs: 3, md: 6 },
          pt: { xs: 8, md: 14 },
          pb: { xs: 6, md: 8 },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: (t) =>
              t.palette.mode === "light"
                ? "radial-gradient(ellipse at top, rgba(66,43,101,0.14) 0%, transparent 60%)"
                : "radial-gradient(ellipse at top, rgba(180,236,221,0.09) 0%, transparent 60%)",
            pointerEvents: "none",
          },
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 8,
            color: "primary.main",
            display: "block",
            mb: 3,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
          }}
        >
          Correspondence
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem, 8vw, 6rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.015em",
            mb: 3,
            mx: "auto",
            maxWidth: "14ch",
          }}
        >
          Letters to the editor
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.1rem",
            fontStyle: "italic",
            color: (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d"),
            maxWidth: "52ch",
            mx: "auto",
            lineHeight: 1.6,
          }}
        >
          — The editor receives correspondence through the networks below, and
          would love to build something great together. —
        </Typography>

        <Box
          sx={{
            mt: 6,
            display: "flex",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <IconButton
            href="https://github.com/morgancollado"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub (opens in new tab)"
            sx={socialButtonSx}
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
          <IconButton
            href="https://www.linkedin.com/in/morgancollado/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn (opens in new tab)"
            sx={socialButtonSx}
          >
            <LinkedInIcon fontSize="small" />
          </IconButton>
          <IconButton
            href="/feed.xml"
            aria-label="RSS feed"
            sx={socialButtonSx}
          >
            <RssFeedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            mt: 6,
            textAlign: "center",
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
