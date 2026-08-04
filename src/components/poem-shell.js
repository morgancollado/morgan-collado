"use client";

import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { formatDate } from "@/lib/format-date";
import PoemBody, { StanzaRule } from "@/components/poem-body";
import BackToTop from "@/components/back-to-top";
import Spine from "@/components/spine";
import { SERIF_BODY, muted, dim, surfaceSx, focusRingSx } from "@/lib/editorial";

// Verse wants a narrower column than prose. Measured across the corpus, the
// 99th-percentile line is 58 characters, so 54ch wraps roughly one line in a
// hundred — the blog's 68ch would let those rare long lines sprawl.
const VERSE_MEASURE = "54ch";

// Below this the scroll-drawn spine never gets enough travel to render, so it
// just reads as a stray mark next to a short poem.
const SPINE_MIN_LINES = 40;

export default function PoemShell({ poem, neighbors }) {
  const reduced = useReducedMotion();

  // Masthead scroll — drives the title parallax only.
  const mastheadRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: mastheadRef,
    offset: ["start start", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  // Poem scroll — draws the vine, same arrangement the blog uses.
  const articleRef = useRef(null);
  const { scrollYProgress: articleProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  });
  const articleSmooth = useSpring(articleProgress, {
    stiffness: 80,
    damping: 30,
  });

  const showSpine = poem.lineCount >= SPINE_MIN_LINES;

  return (
    <Box sx={{ ...surfaceSx, minHeight: "100vh", pb: 12 }}>
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
        <span>Vol. I, No. VI</span>
        <span>Poetry</span>
        {poem.date ? (
          <Box component="time" dateTime={poem.date}>
            {formatDate(poem.date)}
          </Box>
        ) : (
          <span />
        )}
        <span>Morgan Collado</span>
      </Box>

      {/* Scroll spine, in poetry's lavender. Skipped on short poems, where
          there isn't enough scroll travel for the vine to draw. */}
      {showSpine && (
        <Box
          aria-hidden
          sx={{
            display: { xs: "none", md: "block" },
            position: "fixed",
            top: 0,
            left: "max(24px, calc(50vw - 400px))",
            height: "100vh",
            width: 80,
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <Spine progress={articleSmooth} reduced={reduced} color="poetry.main" />
        </Box>
      )}

      {/* Masthead — kept short deliberately. The blog's near-full-viewport
          masthead would push a fifteen-line poem entirely below the fold. */}
      <Box
        ref={mastheadRef}
        sx={{
          minHeight: { xs: "auto", md: "44vh" },
          display: "flex",
          alignItems: "center",
          px: { xs: 3, md: 6 },
          pt: { xs: 7, md: 10 },
          pb: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 0 } }}>
          <Typography
            component="p"
            sx={{
              letterSpacing: 6,
              fontSize: "0.72rem",
              fontVariantCaps: "small-caps",
              color: "poetry.main",
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              mb: 2,
            }}
          >
            The Chapbook
          </Typography>

          <Box component={motion.div} style={reduced ? undefined : { y: titleY }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                fontSize: "clamp(2.25rem, 7vw, 4.5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.015em",
                maxWidth: "16ch",
              }}
            >
              {poem.title}
            </Typography>
          </Box>

          {poem.dedication && (
            <Typography
              sx={{
                mt: 2,
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                fontSize: "1rem",
                color: muted,
              }}
            >
              {poem.dedication}
            </Typography>
          )}

          {poem.themes?.length > 0 && (
            <Box
              component="ul"
              aria-label="Themes"
              sx={{
                listStyle: "none",
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                p: 0,
                mt: 3,
                mb: 0,
                fontVariantCaps: "small-caps",
                letterSpacing: 2,
                fontSize: "0.72rem",
                color: dim,
                fontFamily: "var(--font-playfair)",
              }}
            >
              {poem.themes.map((theme) => (
                <Box component="li" key={theme}>
                  {theme}
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <StanzaRule sx={{ mb: { xs: 5, md: 7 } }} />

      {/* The poem */}
      <Container maxWidth={false} sx={{ px: { xs: 3, md: 6 } }}>
        <Box
          ref={articleRef}
          component="article"
          sx={{
            position: "relative",
            zIndex: 2,
            maxWidth: poem.measure || VERSE_MEASURE,
            mx: "auto",
          }}
        >
          {poem.note && (
            <Typography
              sx={{
                mb: 5,
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                fontSize: "0.95rem",
                color: muted,
                borderLeft: "2px solid",
                borderColor: "poetry.main",
                pl: 2,
              }}
            >
              {poem.note}
            </Typography>
          )}

          <PoemBody stanzas={poem.stanzas} align={poem.align} />
        </Box>
      </Container>

      {/* Colophon + sequence navigation */}
      <Container maxWidth={false} sx={{ px: { xs: 3, md: 6 }, mt: { xs: 10, md: 14 } }}>
        <Box sx={{ maxWidth: VERSE_MEASURE, mx: "auto" }}>
          <StanzaRule sx={{ mb: 5 }} />

          <Typography
            sx={{
              fontFamily: SERIF_BODY,
              fontSize: "0.85rem",
              lineHeight: 1.7,
              color: dim,
              textAlign: "center",
              mb: 6,
            }}
          >
            First published on <i>A Trip to the Morg</i>
            {poem.date ? (
              <>
                {" in "}
                <Box component="time" dateTime={poem.date}>
                  {new Date(poem.date).getUTCFullYear()}
                </Box>
              </>
            ) : null}
            .
          </Typography>

          <Box
            component="nav"
            aria-label="More poems"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 3,
              flexWrap: "wrap",
              borderTop: "1px solid",
              borderColor: "currentColor",
              pt: 3,
            }}
          >
            {neighbors.previous ? (
              <Box
                component={Link}
                href={`/poetry/${neighbors.previous.slug}`}
                sx={poemLinkSx}
              >
                <Box component="span" sx={navLabelSx}>
                  Earlier
                </Box>
                {neighbors.previous.title}
              </Box>
            ) : (
              <span />
            )}

            {neighbors.next ? (
              <Box
                component={Link}
                href={`/poetry/${neighbors.next.slug}`}
                sx={{ ...poemLinkSx, textAlign: "right", ml: "auto" }}
              >
                <Box component="span" sx={navLabelSx}>
                  Later
                </Box>
                {neighbors.next.title}
              </Box>
            ) : (
              <span />
            )}
          </Box>

          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Box component={Link} href="/poetry" sx={{ ...poemLinkSx, ...focusRingSx }}>
              <Box component="span" sx={navLabelSx}>
                All poems
              </Box>
              The Chapbook
            </Box>
          </Box>
        </Box>
      </Container>

      <BackToTop />
    </Box>
  );
}

const navLabelSx = {
  display: "block",
  fontVariantCaps: "small-caps",
  letterSpacing: 3,
  fontSize: "0.68rem",
  color: dim,
  mb: 0.5,
};

const poemLinkSx = {
  fontFamily: "var(--font-playfair)",
  fontStyle: "italic",
  fontSize: "1.05rem",
  color: "inherit",
  textDecoration: "none",
  maxWidth: "22ch",
  borderBottom: "1px solid transparent",
  transition: "color .2s, border-color .2s",
  "&:hover, &:focus-visible": {
    color: "poetry.main",
    borderBottomColor: "currentColor",
  },
  "&:focus-visible": {
    outline: "2px solid",
    outlineColor: "poetry.main",
    outlineOffset: "3px",
  },
};
