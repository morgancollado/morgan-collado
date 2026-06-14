"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { formatDate } from "@/lib/format-date";

function yearOf(date) {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.getUTCFullYear();
}

function HoverThumb({ active, reduced }) {
  if (!active) return null;
  const thumbSx = {
    position: "fixed",
    top: { xs: 90, md: "50%" },
    right: { xs: 16, md: 48 },
    width: { xs: 140, md: 280 },
    aspectRatio: "4 / 5",
    pointerEvents: "none",
    zIndex: 50,
    transform: { md: "translateY(-50%)" },
    border: "1px solid",
    borderColor: "currentColor",
    p: 1,
    bgcolor: (t) => (t.palette.mode === "light" ? "#f5efe2" : "#1a1521"),
    boxShadow: (t) =>
      t.palette.mode === "light"
        ? "0 24px 60px -20px rgba(66,43,101,0.4)"
        : "0 24px 60px -20px rgba(0,0,0,0.7)",
  };
  const inner = (
    <Box
      component="img"
      key={active.img}
      src={active.img}
      alt=""
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: (t) =>
          t.palette.mode === "light"
            ? "url(#duotone-aubergine)"
            : "url(#duotone-mint)",
      }}
    />
  );

  if (reduced) {
    return (
      <Box aria-hidden sx={thumbSx}>
        {inner}
      </Box>
    );
  }
  return (
    <Box
      aria-hidden
      component={motion.div}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      sx={thumbSx}
    >
      {inner}
    </Box>
  );
}

export default function BlogIndex({ posts }) {
  const [active, setActive] = useState(null);
  const reduced = useReducedMotion();

  const handleEnter = (post) => () => {
    const img = post.imgs?.[0];
    if (img?.img) setActive({ img: img.img, slug: post.slug });
  };
  const handleLeave = () => setActive(null);

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <Box
      sx={{
        bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
        minHeight: "100vh",
        pb: 14,
      }}
    >
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
        <span>Vol. I, No. II</span>
        <span>Writing</span>
        <span>{dateStr}</span>
        <span>Morgan Collado</span>
      </Box>

      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 } }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 6,
            display: "block",
            color: "primary.main",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            mb: 2,
          }}
        >
          The Index
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem, 8vw, 6rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.015em",
            mb: 2,
            maxWidth: "12ch",
          }}
        >
          Writing,
          <Box component="span" sx={{ fontStyle: "normal" }}>
            {" "}collected
          </Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.05rem",
            color: (t) =>
              t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d",
            maxWidth: "52ch",
            mb: 8,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          — Every essay, by the year it was made. Hover a title to glimpse
          its subject. —
        </Typography>

        <Box
          component="ol"
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            borderTop: "1px solid",
            borderColor: "currentColor",
          }}
          onMouseLeave={handleLeave}
        >
          {posts.map((post, i) => (
            <Box
              key={post.slug}
              component="li"
              sx={{
                borderBottom: "1px solid",
                borderColor: "currentColor",
              }}
              onMouseEnter={handleEnter(post)}
              onFocus={handleEnter(post)}
              onBlur={handleLeave}
            >
              <Box
                component={Link}
                href={`/blog/${post.slug}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "44px 1fr auto",
                    md: "72px 1fr auto",
                  },
                  gap: { xs: 2, md: 4 },
                  alignItems: "baseline",
                  py: { xs: 2.5, md: 3.5 },
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background-color .3s ease, padding-left .3s ease",
                  "&:hover, &:focus-visible": {
                    bgcolor: (t) =>
                      t.palette.mode === "light"
                        ? "rgba(66,43,101,0.04)"
                        : "rgba(180,236,221,0.04)",
                    pl: { md: 2 },
                    "& .idx-title": {
                      color: "primary.main",
                      fontStyle: "italic",
                    },
                    "& .idx-num": {
                      color: "primary.main",
                    },
                  },
                  outline: "none",
                }}
              >
                <Typography
                  className="idx-num"
                  sx={{
                    fontFamily: "var(--font-playfair)",
                    fontStyle: "italic",
                    fontSize: { xs: "1.1rem", md: "1.5rem" },
                    color: (t) =>
                      t.palette.mode === "light" ? "#7a6c5e" : "#9e958a",
                    transition: "color .3s",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Typography>
                <Box>
                  <Typography
                    className="idx-title"
                    sx={{
                      fontFamily: "var(--font-playfair)",
                      fontSize: { xs: "1.4rem", md: "2.25rem" },
                      lineHeight: 1.1,
                      transition: "color .3s, font-style .3s",
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.75,
                      fontSize: "0.7rem",
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      fontFamily: "var(--font-playfair)",
                      color: (t) =>
                        t.palette.mode === "light" ? "#7a6c5e" : "#9e958a",
                    }}
                  >
                    {[post.category, yearOf(post.date)]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    display: { xs: "none", md: "block" },
                    fontFamily: "var(--font-playfair)",
                    fontStyle: "italic",
                    fontSize: "1.1rem",
                    color: (t) =>
                      t.palette.mode === "light" ? "#7a6c5e" : "#9e958a",
                    whiteSpace: "nowrap",
                  }}
                >
                  read ⟶
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      <AnimatePresence>
        <HoverThumb active={active} reduced={reduced} />
      </AnimatePresence>
    </Box>
  );
}
