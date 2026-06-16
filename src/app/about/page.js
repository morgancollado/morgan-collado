"use client";

import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { motion } from "framer-motion";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import { useReducedMotion } from "@/lib/motion";
import Grain from "@/components/grain";

const SERIF_BODY =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

const paragraphSx = {
  fontFamily: SERIF_BODY,
  fontSize: "1.0625rem",
  lineHeight: 1.75,
  my: 2,
  textAlign: "justify",
  hyphens: "auto",
};

const dropCapSx = {
  ...paragraphSx,
  "&::first-letter": {
    fontFamily: "var(--font-playfair)",
    fontStyle: "italic",
    fontSize: "5.5em",
    float: "left",
    lineHeight: 0.82,
    paddingRight: "0.08em",
    paddingTop: "0.08em",
    color: "primary.main",
  },
};

export default function AboutPage() {
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
        <span>Vol. I, No. IV</span>
        <span>About</span>
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
          pt: { xs: 6, md: 10 },
          pb: { xs: 5, md: 7 },
          borderBottom: "1px solid",
          borderColor: "currentColor",
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
            mb: 2,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
          }}
        >
          Of the author
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(3rem, 11vw, 8.5rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            mb: 2,
            mx: "auto",
            textShadow: (t) =>
              t.palette.mode === "light"
                ? "0 2px 30px rgba(66,43,101,0.12)"
                : "0 2px 30px rgba(180,236,221,0.08)",
          }}
        >
          About
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.1rem",
            fontStyle: "italic",
            color: (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d"),
            maxWidth: "52ch",
            mx: "auto",
            lineHeight: 1.5,
          }}
        >
          — A poet who learned to read documentation. —
        </Typography>
      </Box>

      {/* Body */}
      <Box
        component="article"
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: "68ch",
          mx: "auto",
          px: { xs: 3, md: 4 },
          pt: { xs: 6, md: 9 },
        }}
      >
        {/* Portrait — Fig. I */}
        <Box
          component="figure"
          sx={{
            m: 0,
            my: 4,
            mx: { md: -3 },
            counterReset: "figure",
            counterIncrement: "figure",
          }}
        >
          <Box
            component={motion.div}
            {...(reduced
              ? {}
              : {
                  initial: { scale: 0.96, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                })}
            style={{ transform: "rotate(-1.2deg)", display: "block" }}
          >
            <Box
              sx={{
                border: "1px solid",
                borderColor: "currentColor",
                p: 1.5,
                maxWidth: 360,
                mx: "auto",
                bgcolor: (t) =>
                  t.palette.mode === "light" ? "#f0ebe2" : "#1a1620",
                boxShadow: (t) =>
                  t.palette.mode === "light"
                    ? "0 24px 60px -20px rgba(66,43,101,0.35), 0 4px 12px -4px rgba(0,0,0,0.15)"
                    : "0 24px 60px -20px rgba(0,0,0,0.7), 0 4px 12px -4px rgba(180,236,221,0.08)",
              }}
            >
              <Box
                component="img"
                src="/headshot.jpeg"
                alt="Portrait of Morgan Collado"
                loading="lazy"
                sx={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  filter: (t) =>
                    t.palette.mode === "light"
                      ? "url(#duotone-aubergine)"
                      : "url(#duotone-mint)",
                }}
              />
            </Box>
          </Box>
          <Typography
            component="figcaption"
            sx={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: "0.9rem",
              mt: 2.5,
              textAlign: "center",
              display: "flex",
              gap: 1.5,
              alignItems: "baseline",
              justifyContent: "center",
              flexWrap: "wrap",
              "&::before": {
                content: '"Fig. I —"',
                fontStyle: "normal",
                fontVariantCaps: "small-caps",
                fontFamily: "var(--font-playfair)",
                letterSpacing: 1.5,
                color: "primary.main",
                whiteSpace: "nowrap",
                fontSize: "0.78rem",
              },
            }}
          >
            The author, more or less recently.
          </Typography>
        </Box>

        <Typography
          variant="overline"
          sx={{
            letterSpacing: 4,
            color: "primary.main",
            display: "block",
            mt: 6,
            mb: 1,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          A note from
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(1.7rem, 3.6vw, 2.3rem)",
            lineHeight: 1.1,
            mb: 4,
            textAlign: "center",
            "&::after": {
              content: '""',
              display: "block",
              width: "40px",
              height: "1px",
              bgcolor: "currentColor",
              opacity: 0.4,
              mx: "auto",
              mt: 2,
            },
          }}
        >
          Crafting Elegant and Purposeful Solutions
        </Typography>

        <Typography sx={dropCapSx}>
          Hello world, my name is Morgan. A poet turned software engineer with a
          rich journey that started at Apple as tech support. I discovered there
          my knack for resolving complex technical issues, which ignited a
          passion for understanding and building the products I was supporting.
          Determined to dive deeper, I enrolled in a coding bootcamp, embracing
          the challenge of self-directed learning to master the art of code.
        </Typography>

        <Typography sx={paragraphSx}>
          Post-graduation, my skills and determination led me to a role at a
          popular fitness app, a place where I have spent the past three years
          crafting user interfaces enjoyed by millions. My time here has been a
          blend of innovation, learning, and real-world impact, fueling my
          excitement for technology and its possibilities.
        </Typography>

        <Typography sx={paragraphSx}>
          As I look forward to the next phase of my career, I am eager to bring
          my strong technical foundation, problem-solving skills, and
          user-centric approach to new challenges and opportunities. Find me on
          the social networks below — I would love to build something great
          together.
        </Typography>

        <Box
          sx={{
            mt: 5,
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
            sx={{
              color: "primary.main",
              border: "1px solid",
              borderColor: "currentColor",
              borderRadius: 0,
              width: 36,
              height: 36,
            }}
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
          <IconButton
            href="https://www.linkedin.com/in/morgancollado/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn (opens in new tab)"
            sx={{
              color: "primary.main",
              border: "1px solid",
              borderColor: "currentColor",
              borderRadius: 0,
              width: 36,
              height: 36,
            }}
          >
            <LinkedInIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            my: 5,
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

      {/* Colophon */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: "68ch",
          mx: "auto",
          px: { xs: 3, md: 5 },
          mt: 10,
          pt: 4,
          borderTop: "1px solid",
          borderColor: "currentColor",
          textAlign: "center",
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "0.85rem",
          color: (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d"),
        }}
      >
        Composed in Playfair Display upon a digital press. <br />
        Edited by the author.
      </Box>
    </Box>
  );
}
