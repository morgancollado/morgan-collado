"use client";

import { Box, Typography } from "@mui/material";
import { motion, useScroll, useSpring } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReducedMotion } from "@/app/blog-lab/_lib/motion";
import { formatDate } from "@/lib/format-date";

const paper = (mode) => (mode === "light" ? "#faf7f2" : "#100c14");
const ink = (mode) => (mode === "light" ? "#1a1614" : "#ece6dd");
const muted = (mode) => (mode === "light" ? "#6b5e54" : "#9e958a");

const components = {
  h1: ({ node, ...p }) => (
    <Typography
      component="h2"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontSize: "2.1rem",
        fontStyle: "italic",
        mt: 7,
        mb: 2,
        lineHeight: 1.15,
      }}
      {...p}
    />
  ),
  h2: ({ node, ...p }) => (
    <Typography
      component="h2"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontSize: "1.75rem",
        fontStyle: "italic",
        mt: 6,
        mb: 1.5,
        lineHeight: 1.2,
      }}
      {...p}
    />
  ),
  h3: ({ node, ...p }) => (
    <Typography
      component="h3"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontSize: "1.35rem",
        mt: 5,
        mb: 1,
      }}
      {...p}
    />
  ),
  p: ({ node, ...p }) => (
    <Typography
      component="p"
      sx={{
        fontSize: "1.0625rem",
        lineHeight: 1.75,
        my: 2.25,
        "&:first-of-type::first-letter": {
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "3.25em",
          float: "left",
          lineHeight: 0.85,
          paddingRight: "0.08em",
          paddingTop: "0.08em",
          color: "primary.main",
        },
      }}
      {...p}
    />
  ),
  strong: ({ node, ...p }) => (
    <Box
      component="strong"
      sx={{
        fontWeight: 600,
        fontFamily: "var(--font-playfair)",
        fontStyle: "italic",
      }}
      {...p}
    />
  ),
  em: ({ node, ...p }) => (
    <Box component="em" sx={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }} {...p} />
  ),
  blockquote: ({ node, ...p }) => (
    <Box
      component="blockquote"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontStyle: "italic",
        fontSize: "1.5rem",
        lineHeight: 1.4,
        my: 5,
        ml: 0,
        pl: 2.5,
        borderLeft: "2px solid",
        borderColor: "primary.main",
      }}
      {...p}
    />
  ),
  ul: ({ node, ...p }) => (
    <Box component="ul" sx={{ pl: 3, my: 2, "& li": { mb: 1 } }} {...p} />
  ),
  ol: ({ node, ...p }) => (
    <Box component="ol" sx={{ pl: 3, my: 2, "& li": { mb: 1 } }} {...p} />
  ),
  li: ({ node, checked, ordered, index, ...p }) => (
    <Typography component="li" sx={{ fontSize: "1.0625rem", lineHeight: 1.7 }} {...p} />
  ),
  img: ({ node, src, alt, ...p }) => (
    <Box component="figure" sx={{ m: 0, my: 5 }}>
      <Box
        component="img"
        src={src}
        alt={alt || ""}
        loading="lazy"
        sx={{ display: "block", width: "100%", height: "auto" }}
      />
      {alt && (
        <Typography
          component="figcaption"
          sx={{
            mt: 1.5,
            fontSize: "0.875rem",
            fontStyle: "italic",
            fontFamily: "var(--font-playfair)",
            color: (t) => muted(t.palette.mode),
            textAlign: "center",
          }}
        >
          {alt}
        </Typography>
      )}
    </Box>
  ),
  hr: () => (
    <Box
      sx={{
        my: 6,
        textAlign: "center",
        color: (t) => muted(t.palette.mode),
        fontFamily: "var(--font-playfair)",
        letterSpacing: 8,
      }}
    >
      ❦
    </Box>
  ),
};

function ProgressLine() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });

  if (reduced) return null;

  return (
    <Box
      component={motion.div}
      style={{ scaleX, transformOrigin: "0 0" }}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        bgcolor: "primary.main",
        zIndex: 1300,
      }}
    />
  );
}

export default function ReadingRoom({ title, content, date, category, readMin }) {
  return (
    <Box
      sx={{
        bgcolor: (t) => paper(t.palette.mode),
        color: (t) => ink(t.palette.mode),
        minHeight: "100vh",
        pb: 12,
      }}
    >
      <ProgressLine />
      <Box
        sx={{
          maxWidth: "62ch",
          mx: "auto",
          px: { xs: 3, md: 4 },
          pt: { xs: 8, md: 14 },
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 3,
            color: (t) => muted(t.palette.mode),
            display: "block",
            mb: 5,
          }}
        >
          {[category, formatDate(date), readMin ? `${readMin} min` : null]
            .filter(Boolean)
            .join("  ·  ")}
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
            lineHeight: 1.1,
            mb: 6,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>

        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>

        <Box
          sx={{
            mt: 10,
            textAlign: "center",
            color: (t) => muted(t.palette.mode),
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            letterSpacing: 4,
          }}
        >
          —    finis    —
        </Box>
      </Box>
    </Box>
  );
}
