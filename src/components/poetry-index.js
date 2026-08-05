"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import PoemBody, { StanzaRule } from "@/components/poem-body";
import { hashSeed, pickN, utcDayKey } from "@/lib/seeded-random";
import { yearOf, folioDate } from "@/lib/format-date";
import { DRAW_COUNT, LATEST_COUNT } from "@/app/poetry/_lib/constants";
import { collectThemes } from "@/app/poetry/_lib/themes";
import {
  SERIF_BODY,
  muted,
  dim,
  surfaceSx,
  visuallyHiddenSx,
  focusRing,
  paper,
} from "@/lib/editorial";

const cardLinkSx = {
  fontFamily: "var(--font-playfair)",
  fontStyle: "italic",
  fontSize: "1.35rem",
  color: "inherit",
  textDecoration: "none",
  // Stretched-link pattern: one link, named by the poem's title, whose hit area
  // covers the whole card. Keeps the card clickable without nesting
  // interactive elements or duplicating the link for assistive tech.
  //
  // The overlay sits *under* the verse rather than over it (see `verseSx`).
  // Covering the poem would make it unselectable, and on a page whose whole
  // purpose is text people copy lines out of it.
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: 0,
  },
  "&:hover, &:focus-visible": { color: "poetry.main" },
  "&:focus-visible": { outline: "none" },
};

// Lifted above the stretched link so the verse stays selectable. Clicking the
// title, the date, or any of the card's whitespace still follows the link.
const verseSx = { position: "relative", zIndex: 1 };

const cardSx = {
  position: "relative",
  borderTop: "1px solid",
  borderColor: "currentColor",
  pt: 3,
  // The focus ring goes on the card, since the link's hit area is the card.
  "&:has(a:focus-visible)": {
    outline: "2px solid",
    outlineColor: "poetry.main",
    outlineOffset: "6px",
  },
};

function PoemCard({ poem }) {
  return (
    <Box component="article" sx={cardSx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Typography component="h3" sx={{ m: 0 }}>
          <Box component={Link} href={`/poetry/${poem.slug}`} sx={cardLinkSx}>
            {poem.title}
          </Box>
        </Typography>
        {poem.date && (
          <Box
            component="time"
            dateTime={poem.date}
            sx={{
              fontVariantCaps: "small-caps",
              letterSpacing: 2,
              fontSize: "0.72rem",
              color: dim,
              fontFamily: "var(--font-playfair)",
              flexShrink: 0,
            }}
          >
            {yearOf(poem.date)}
          </Box>
        )}
      </Box>

      <Box sx={verseSx}>
        <PoemBody stanzas={[poem.excerpt]} align={poem.align} size="excerpt" />
      </Box>

      {poem.truncated && (
        <Box
          sx={{
            mt: 1.5,
            color: dim,
            fontFamily: "var(--font-playfair)",
            fontSize: "1rem",
            letterSpacing: 4,
            textAlign: poem.align === "center" ? "center" : "left",
          }}
        >
          {/* The ellipsis is a visual mark; a screen reader would read it as
              "dot dot dot" or skip it, so the fact it stands for is spelled
              out alongside it. */}
          <Box component="span" aria-hidden>
            …
          </Box>
          <Box component="span" sx={visuallyHiddenSx}>
            This poem continues.
          </Box>
        </Box>
      )}
    </Box>
  );
}

/**
 * One theme in the archive filter.
 *
 * A button rather than a link: the filtering is client-side and the page never
 * navigates. `aria-pressed` is what carries the on/off state — the colour
 * change alone would leave a screen reader unable to tell which is active.
 */
function ThemeChip({ label, count, active, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        fontFamily: "var(--font-playfair)",
        fontStyle: "italic",
        fontSize: "0.95rem",
        letterSpacing: 1,
        px: 2,
        py: 0.75,
        cursor: "pointer",
        borderRadius: 0,
        border: "1px solid",
        borderColor: "poetry.main",
        transition: "background-color .2s, color .2s",
        color: active ? paper : "poetry.main",
        bgcolor: active ? "poetry.main" : "transparent",
        "&:hover": {
          bgcolor: active ? "poetry.main" : "rgba(99,64,155,0.08)",
        },
        ...focusRing(),
      }}
    >
      {label}{" "}
      <Box component="span" aria-hidden sx={{ opacity: 0.65 }}>
        {count}
      </Box>
      <Box component="span" sx={visuallyHiddenSx}>
        {`, ${count} ${count === 1 ? "poem" : "poems"}`}
      </Box>
    </Box>
  );
}

function SectionHeading({ eyebrow, title, children, id }) {
  return (
    <Box sx={{ mb: { xs: 5, md: 7 } }}>
      <Typography
        component="p"
        sx={{
          letterSpacing: 6,
          fontSize: "0.72rem",
          fontVariantCaps: "small-caps",
          color: "poetry.main",
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          mb: 1.5,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        component="h2"
        id={id}
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
          lineHeight: 1.1,
          m: 0,
        }}
      >
        {title}
      </Typography>
      {children && (
        <Typography
          sx={{
            mt: 2,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "1rem",
            color: muted,
            maxWidth: "46ch",
            lineHeight: 1.6,
          }}
        >
          {children}
        </Typography>
      )}
    </Box>
  );
}

export default function PoetryIndex({ poems, initialDraw, buildDayKey }) {
  const reduced = useReducedMotion();
  const [draw, setDraw] = useState(initialDraw);
  const [announcement, setAnnouncement] = useState("");

  const bySlug = useMemo(
    () => Object.fromEntries(poems.map((p) => [p.slug, p])),
    [poems]
  );

  const drawn = draw.map((slug) => bySlug[slug]).filter(Boolean);

  // The server rendered the draw for the day it was built. If a reader arrives
  // later, catch up — after paint, so the first client render still matches the
  // server HTML exactly and hydration stays clean.
  useEffect(() => {
    const today = utcDayKey();
    if (today === buildDayKey) return;
    setDraw(pickN(poems.map((p) => p.slug), DRAW_COUNT, hashSeed(today)));
  }, [buildDayKey, poems]);

  const drawAgain = useCallback(() => {
    // Randomness lives in the event handler, never in render.
    const seed = (Math.random() * 0xffffffff) >>> 0;
    const next = pickN(poems.map((p) => p.slug), DRAW_COUNT, seed);
    setDraw(next);
    setAnnouncement(
      `Now showing: ${next.map((s) => bySlug[s]?.title).filter(Boolean).join(", ")}.`
    );
  }, [poems, bySlug]);

  const latest = poems.slice(0, LATEST_COUNT);

  const themes = useMemo(() => collectThemes(poems), [poems]);

  const [activeTheme, setActiveTheme] = useState(null);
  const [filterAnnouncement, setFilterAnnouncement] = useState("");

  // A poem page links its themes here as `/poetry#theme-<slug>`. Read after
  // mount, never during render: the server has no location, and reading one
  // during the first client render is exactly the hydration mismatch the day
  // draw above goes to such lengths to avoid.
  useEffect(() => {
    const fragment = /^#theme-(.+)$/.exec(window.location.hash);
    if (!fragment) return;
    const match = themes.find((t) => t.slug === fragment[1]);
    if (match) setActiveTheme(match.name);
  }, [themes]);

  const selectTheme = useCallback(
    (name) => {
      setActiveTheme(name);
      const count = name
        ? poems.filter((p) => p.themes?.includes(name)).length
        : poems.length;
      setFilterAnnouncement(
        name
          ? `Showing ${count} ${count === 1 ? "poem" : "poems"} about ${name}.`
          : `Showing all ${count} poems.`
      );
    },
    [poems]
  );

  const filtered = useMemo(
    () =>
      activeTheme
        ? poems.filter((p) => p.themes?.includes(activeTheme))
        : poems,
    [poems, activeTheme]
  );

  const byYear = useMemo(() => {
    const groups = new Map();
    for (const poem of filtered) {
      const year = yearOf(poem.date) || "Undated";
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(poem);
    }
    return [...groups.entries()];
  }, [filtered]);

  const dateStr = folioDate();

  return (
    <Box sx={{ ...surfaceSx, minHeight: "100vh", pb: 14 }}>
      {/* Folio dateline */}
      <Box
        sx={{
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
        <span>Poetry</span>
        <span>{dateStr}</span>
        <span>Morgan Collado</span>
      </Box>

      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 } }}>
        {/* Masthead */}
        <Typography
          component="p"
          sx={{
            letterSpacing: 6,
            fontSize: "0.75rem",
            fontVariantCaps: "small-caps",
            color: "poetry.main",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            mb: 2,
          }}
        >
          The Chapbook
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
            maxWidth: "12ch",
          }}
        >
          Poems,
          <Box component="span" sx={{ fontStyle: "normal" }}>
            {" "}unbound
          </Box>
        </Typography>

        <Typography
          sx={{
            fontFamily: SERIF_BODY,
            fontSize: "1.0625rem",
            color: muted,
            maxWidth: "58ch",
            mb: 3,
            lineHeight: 1.75,
          }}
        >
          my collected works early and new gathered here. About me, my life and
          my rage, my grief and love, about being a trans Latina in the years
          these were made.
        </Typography>

        <StanzaRule sx={{ my: { xs: 7, md: 10 } }} />

        {/* Drawn today */}
        <Box component="section" aria-labelledby="drawn-heading">
          <SectionHeading
            id="drawn-heading"
            eyebrow="Drawn today"
            title="A reading"
          >
            Three poems, drawn today. Come back tomorrow for three more — or
            draw again now.
          </SectionHeading>

          <AnimatePresence mode="wait" initial={false}>
            <Box
              component={reduced ? "div" : motion.div}
              key={draw.join("|")}
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    transition: { duration: 0.35 },
                  })}
              sx={{
                display: "grid",
                gap: { xs: 6, md: 5 },
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, minmax(0, 1fr))",
                },
              }}
            >
              {drawn.map((poem) => (
                <PoemCard key={poem.slug} poem={poem} />
              ))}
            </Box>
          </AnimatePresence>

          <Box sx={{ display: "flex", justifyContent: "center", mt: { xs: 6, md: 8 } }}>
            <Box
              component="button"
              type="button"
              onClick={drawAgain}
              // The dashes are a printer's flourish. Left in the accessible
              // name they'd be read out as punctuation before the verb.
              aria-label={`Draw ${DRAW_COUNT} more poems`}
              sx={{
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                fontSize: "1rem",
                letterSpacing: 2,
                color: "poetry.main",
                background: "none",
                border: "1px solid currentColor",
                borderRadius: 0,
                px: 3,
                py: 1.25,
                cursor: "pointer",
                transition: "background-color .2s, color .2s",
                "&:hover": {
                  bgcolor: "poetry.main",
                  color: paper,
                },
                ...focusRing(),
              }}
            >
              – draw again –
            </Box>
          </Box>

          {/* Announces the new selection to screen readers; the cards
              themselves are far too much text to put in a live region. */}
          <Box role="status" aria-live="polite" sx={visuallyHiddenSx}>
            {announcement}
          </Box>
        </Box>

        <StanzaRule sx={{ my: { xs: 8, md: 12 } }} />

        {/* Latest */}
        <Box component="section" aria-labelledby="latest-heading">
          <SectionHeading
            id="latest-heading"
            eyebrow="Latest"
            title="Most recent work"
          >
            The newest poems in the collection, most recent first.
          </SectionHeading>

          <Box
            sx={{
              display: "grid",
              gap: { xs: 6, md: 5 },
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {latest.map((poem) => (
              <PoemCard key={poem.slug} poem={poem} />
            ))}
          </Box>
        </Box>

        <StanzaRule sx={{ my: { xs: 8, md: 12 } }} />

        {/* Full archive */}
        <Box component="section" aria-labelledby="archive-heading">
          <SectionHeading
            id="archive-heading"
            eyebrow="Everything"
            title="The complete works"
          >
            {activeTheme
              ? `${filtered.length} ${
                  filtered.length === 1 ? "poem" : "poems"
                } about ${activeTheme}, by the year they were written.`
              : `All ${poems.length} poems, by the year they were written.`}
            {themes.length > 0 && " Filter them by what they are about."}
          </SectionHeading>

          {themes.length > 0 && (
            <Box
              component="ul"
              role="list"
              aria-label="Filter by theme"
              sx={{
                listStyle: "none",
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                p: 0,
                mb: { xs: 4, md: 6 },
              }}
            >
              <Box component="li">
                <ThemeChip
                  label="All"
                  count={poems.length}
                  active={activeTheme === null}
                  onClick={() => selectTheme(null)}
                />
              </Box>
              {themes.map((theme) => (
                <Box component="li" key={theme.slug}>
                  <ThemeChip
                    label={theme.name}
                    count={theme.count}
                    active={activeTheme === theme.name}
                    onClick={() => selectTheme(theme.name)}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* The filtered result is announced rather than left to be
              discovered — the list it changes is below the fold on most
              screens. */}
          <Box role="status" aria-live="polite" sx={visuallyHiddenSx}>
            {filterAnnouncement}
          </Box>

          {byYear.map(([year, group]) => (
            <Box key={year} sx={{ mb: { xs: 6, md: 8 } }}>
              <Typography
                component="h3"
                sx={{
                  fontFamily: "var(--font-playfair)",
                  fontVariantCaps: "small-caps",
                  letterSpacing: 4,
                  fontSize: "0.85rem",
                  color: dim,
                  m: 0,
                  mb: 1.5,
                }}
              >
                {year}
              </Typography>

              <Box
                component="ol"
                // Safari drops list semantics from a list styled `list-style:
                // none`, and VoiceOver stops announcing "list, N items" with
                // it. Restating the role puts them back.
                role="list"
                aria-label={`Poems from ${year}`}
                sx={{
                  listStyle: "none",
                  p: 0,
                  m: 0,
                  borderTop: "1px solid",
                  borderColor: "currentColor",
                }}
              >
                {group.map((poem) => (
                  <Box
                    key={poem.slug}
                    component="li"
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "currentColor",
                      "&:hover .reveal, &:focus-within .reveal": { opacity: 1 },
                      "&:hover, &:focus-within": {
                        bgcolor: (t) =>
                          t.palette.mode === "light"
                            ? "rgba(99,64,155,0.05)"
                            : "rgba(201,179,240,0.06)",
                      },
                    }}
                  >
                    <Box
                      component={Link}
                      href={`/poetry/${poem.slug}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
                        alignItems: "baseline",
                        gap: { xs: 0.5, md: 3 },
                        px: { xs: 1, md: 2 },
                        py: 1.75,
                        color: "inherit",
                        textDecoration: "none",
                        transition: "color .2s",
                        "&:hover": { color: "poetry.main" },
                        // Inset, because a full-width row's ring would
                        // otherwise be clipped by the list's own border.
                        ...focusRing("-2px"),
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontFamily: "var(--font-playfair)",
                          fontStyle: "italic",
                          fontSize: "1.15rem",
                        }}
                      >
                        {poem.title}
                      </Box>

                      {/* The corpus has no images, so the blog index's hover
                          thumbnail becomes the poem's opening line instead.
                          Revealed on focus as well as hover, so it's reachable
                          from the keyboard. */}
                      <Box
                        aria-hidden
                        className="reveal"
                        sx={{
                          opacity: 0,
                          transition: "opacity .25s",
                          fontFamily: SERIF_BODY,
                          fontSize: "0.92rem",
                          color: muted,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {poem.excerpt[0]}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
