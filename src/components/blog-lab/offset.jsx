"use client";

import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { motion, useScroll, useSpring } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReducedMotion } from "@/app/blog-lab/_lib/motion";
import { formatDate } from "@/lib/format-date";

const components = {
  h1: ({ node, ...p }) => (
    <Typography
      component="h2"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontSize: "2.4rem",
        fontStyle: "italic",
        mt: 7,
        mb: 2,
        lineHeight: 1.15,
        "&::before": {
          content: '""',
          display: "block",
          width: 48,
          height: "2px",
          bgcolor: "primary.main",
          mb: 2,
        },
      }}
      {...p}
    />
  ),
  h2: ({ node, ...p }) => (
    <Typography
      component="h2"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontSize: "1.85rem",
        fontStyle: "italic",
        mt: 6,
        mb: 1.5,
        lineHeight: 1.2,
        "&::before": {
          content: '""',
          display: "block",
          width: 40,
          height: "2px",
          bgcolor: "primary.main",
          mb: 1.5,
        },
      }}
      {...p}
    />
  ),
  h3: ({ node, ...p }) => (
    <Typography
      component="h3"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontSize: "1.4rem",
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
        my: 2,
        "&:first-of-type::first-letter": {
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "3.75em",
          float: "left",
          lineHeight: 0.82,
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
        fontFamily: "var(--font-playfair)",
        fontStyle: "italic",
        fontWeight: 600,
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
        fontSize: "1.6rem",
        lineHeight: 1.4,
        my: 5,
        ml: 0,
        pl: 3,
        borderLeft: "3px solid",
        borderColor: "primary.main",
        color: "text.primary",
      }}
      {...p}
    />
  ),
  ul: ({ node, ...p }) => (
    <Box
      component="ul"
      sx={{ pl: 0, listStyle: "none", my: 2, "& li::before": { content: '"— "', color: "primary.main", fontWeight: 700 }, "& li": { mb: 1, pl: 0 } }}
      {...p}
    />
  ),
  ol: ({ node, ...p }) => (
    <Box component="ol" sx={{ pl: 3, my: 2, "& li": { mb: 1 } }} {...p} />
  ),
  li: ({ node, checked, ordered, index, ...p }) => (
    <Typography component="li" sx={{ fontSize: "1.0625rem", lineHeight: 1.7 }} {...p} />
  ),
  img: ({ node, src, alt, ...p }) => (
    <Box component="figure" sx={{ m: 0, my: 6 }}>
      <Box
        component="img"
        src={src}
        alt={alt || ""}
        loading="lazy"
        sx={{
          display: "block",
          width: "100%",
          height: "auto",
          borderRadius: 1,
        }}
      />
      {alt && (
        <Typography
          component="figcaption"
          sx={{
            mt: 1.5,
            fontSize: "0.85rem",
            fontStyle: "italic",
            fontFamily: "var(--font-playfair)",
            color: "text.secondary",
            pl: 0.5,
            borderLeft: "2px solid",
            borderColor: "primary.main",
          }}
        >
          {alt}
        </Typography>
      )}
    </Box>
  ),
  hr: () => (
    <Box sx={{ display: "flex", alignItems: "center", my: 5, gap: 2 }}>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
      <Box sx={{ color: "primary.main", fontFamily: "var(--font-playfair)" }}>§</Box>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
    </Box>
  ),
};

function MetaRail({ category, date, readMin }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <Box
      component="aside"
      sx={{
        position: { md: "sticky" },
        top: { md: 32 },
        alignSelf: "start",
        fontFamily: "var(--font-playfair)",
        pt: { md: 1 },
      }}
    >
      <Typography
        component={Link}
        href="/blog"
        sx={{
          display: "block",
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          color: "text.secondary",
          textDecoration: "none",
          fontSize: "0.95rem",
          mb: 4,
          "&:hover": { color: "primary.main" },
        }}
      >
        ← all writing
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {category && (
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2.5, color: "text.secondary", display: "block", fontSize: "0.65rem" }}
            >
              Filed under
            </Typography>
            <Typography sx={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "1.05rem" }}>
              {category}
            </Typography>
          </Box>
        )}
        {date && (
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2.5, color: "text.secondary", display: "block", fontSize: "0.65rem" }}
            >
              Published
            </Typography>
            <Typography sx={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "1.05rem" }}>
              {formatDate(date)}
            </Typography>
          </Box>
        )}
        {readMin && (
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2.5, color: "text.secondary", display: "block", fontSize: "0.65rem" }}
            >
              Read
            </Typography>
            <Typography sx={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "1.05rem" }}>
              {readMin} minutes
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 2.5, color: "text.secondary", display: "block", fontSize: "0.65rem", mb: 1 }}
          >
            Progress
          </Typography>
          <Box sx={{ width: "100%", height: "2px", bgcolor: "divider", position: "relative", overflow: "hidden" }}>
            {reduced ? (
              <Box sx={{ position: "absolute", inset: 0, bgcolor: "primary.main", width: 0 }} />
            ) : (
              <Box
                component={motion.div}
                style={{ scaleX, transformOrigin: "0 0" }}
                sx={{ position: "absolute", inset: 0, bgcolor: "primary.main" }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Offset({ title, content, date, category, readMin }) {
  return (
    <Box
      sx={{
        bgcolor: (t) => (t.palette.mode === "light" ? "#fbfaf7" : "#0f0c12"),
        color: (t) => (t.palette.mode === "light" ? "#1d1a18" : "#ece6dd"),
        minHeight: "100vh",
        px: { xs: 3, md: 6, lg: 10 },
        py: { xs: 6, md: 10 },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(180px, 220px) minmax(0, 68ch)" },
          gap: { xs: 5, md: 10 },
          maxWidth: "1100px",
          mx: "auto",
        }}
      >
        <MetaRail category={category} date={date} readMin={readMin} />

        <Box component="article">
          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
              lineHeight: 1.02,
              mb: 5,
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </Typography>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </Box>
      </Box>
    </Box>
  );
}
