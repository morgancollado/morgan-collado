"use client";

import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { formatDate, yearOf } from "@/lib/format-date";
import PoemBody, { StanzaRule } from "@/components/poem-body";
import BackToTop from "@/components/back-to-top";
import Spine from "@/components/spine";
import {
  SERIF_BODY,
  dim,
  surfaceSx,
  focusRing,
  visuallyHiddenSx,
} from "@/lib/editorial";
import { VERSE_MEASURE } from "@/app/poetry/_lib/constants";
import { themeSlug } from "@/app/poetry/_lib/themes";

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

          {poem.themes?.length > 0 && (
            <Box
              component="ul"
              aria-label="Themes"
              // Safari drops list semantics from a list styled `list-style:
              // none`, and VoiceOver stops announcing "list, N items" with it.
              // Restating the role puts them back.
              role="list"
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
              {/* Each theme opens the archive already filtered to it. The
                  fragment is read on the index after mount, so this stays a
                  plain link and both pages stay static. */}
              {poem.themes.map((theme) => (
                <Box component="li" key={theme}>
                  <Box
                    component={Link}
                    href={`/poetry#theme-${themeSlug(theme)}`}
                    sx={themeLinkSx}
                  >
                    {theme}
                  </Box>
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
            maxWidth: VERSE_MEASURE,
            mx: "auto",
          }}
        >
          <PoemBody stanzas={poem.stanzas} align={poem.align} />
        </Box>
      </Container>

      {/* Colophon + sequence navigation */}
      <Container maxWidth={false} sx={{ px: { xs: 3, md: 6 }, mt: { xs: 10, md: 14 } }}>
        <Box sx={{ maxWidth: VERSE_MEASURE, mx: "auto" }}>
          <StanzaRule sx={{ mb: 5 }} />

          {/* The colophon is a provenance note, so it appears only for poems
              that have a provenance — the ones carried over from the old blog,
              which is what `source` in the frontmatter records. A poem written
              for this site has none, and printing "First published on A Trip to
              the Morg" over it would assert something untrue. The condition is
              on the whole claim, not just on whether the title can be linked.

              The heading is inside the condition too: with no note beneath it,
              it would announce a section that isn't there. */}
          {poem.sourceUrl && (
            <>
              <Typography component="h2" sx={visuallyHiddenSx}>
                About this poem
              </Typography>

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
                First published on{" "}
                <Box component="a" href={poem.sourceUrl} sx={colophonLinkSx}>
                  <i>A Trip to the Morg</i>
                </Box>
                {poem.date ? (
                  <>
                    {" in "}
                    <Box component="time" dateTime={poem.date}>
                      {yearOf(poem.date)}
                    </Box>
                  </>
                ) : null}
                .
              </Typography>
            </>
          )}

          <Typography component="h2" sx={visuallyHiddenSx}>
            More poems
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
            <Box component={Link} href="/poetry" sx={poemLinkSx}>
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
  ...focusRing(),
};

// Themes read as quiet metadata until pointed at, so the link is undecorated
// until hover or focus.
const themeLinkSx = {
  color: "inherit",
  textDecoration: "none",
  borderBottom: "1px solid transparent",
  transition: "color .2s, border-color .2s",
  "&:hover, &:focus-visible": {
    color: "poetry.main",
    borderBottomColor: "currentColor",
  },
  ...focusRing("2px"),
};

// The colophon's one outbound link, back to where the poem first appeared.
const colophonLinkSx = {
  color: "inherit",
  textDecorationColor: "currentColor",
  textUnderlineOffset: "3px",
  "&:hover": { color: "poetry.main" },
  ...focusRing("2px"),
};
