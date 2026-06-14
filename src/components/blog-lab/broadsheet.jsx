"use client";

import { Box, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate } from "@/lib/format-date";

const SERIF_BODY = "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

const components = {
  h1: ({ node, ...p }) => (
    <Typography
      component="h2"
      sx={{
        fontFamily: "var(--font-playfair)",
        fontStyle: "italic",
        fontSize: "clamp(1.9rem, 4.5vw, 2.75rem)",
        lineHeight: 1.05,
        mt: 7,
        mb: 2,
        textAlign: "center",
        "&::before, &::after": {
          content: '"❦"',
          display: "block",
          fontStyle: "normal",
          fontSize: "1rem",
          color: "primary.main",
          letterSpacing: 4,
          my: 1.5,
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
        fontStyle: "italic",
        fontSize: "clamp(1.65rem, 3.5vw, 2.25rem)",
        lineHeight: 1.1,
        mt: 7,
        mb: 2,
        textAlign: "center",
        "&::before": {
          content: '""',
          display: "block",
          width: "60px",
          height: "1px",
          bgcolor: "currentColor",
          opacity: 0.4,
          mx: "auto",
          mb: 2.5,
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
        fontSize: "1.35rem",
        mt: 5,
        mb: 1.25,
      }}
      {...p}
    />
  ),
  p: ({ node, ...p }) => (
    <Typography
      component="p"
      sx={{
        fontFamily: SERIF_BODY,
        fontSize: "1.0625rem",
        lineHeight: 1.7,
        my: 2,
        textAlign: "justify",
        hyphens: "auto",
        "&:first-of-type::first-letter": {
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "5.5em",
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
        fontVariantCaps: "small-caps",
        letterSpacing: 1,
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
        fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
        lineHeight: 1.25,
        my: 6,
        mx: { xs: 0, md: -6 },
        textAlign: "center",
        color: "primary.main",
        "&::before": {
          content: '"❝"',
          display: "block",
          fontSize: "3.5rem",
          fontStyle: "normal",
          lineHeight: 0.4,
          mb: 2,
          opacity: 0.6,
        },
        "&::after": {
          content: '""',
          display: "block",
          width: "40px",
          height: "1px",
          bgcolor: "currentColor",
          mx: "auto",
          mt: 3,
        },
        "& p": { fontFamily: "inherit !important", textAlign: "center !important", my: 0 },
      }}
      {...p}
    />
  ),
  ul: ({ node, ...p }) => (
    <Box
      component="ul"
      sx={{
        fontFamily: SERIF_BODY,
        pl: 0,
        listStyle: "none",
        my: 2.5,
        "& li::before": {
          content: '"§ "',
          color: "primary.main",
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
        },
        "& li": { mb: 1, lineHeight: 1.7 },
      }}
      {...p}
    />
  ),
  ol: ({ node, ...p }) => (
    <Box
      component="ol"
      sx={{
        fontFamily: SERIF_BODY,
        pl: 3,
        my: 2.5,
        "& li::marker": { color: "primary.main", fontFamily: "var(--font-playfair)", fontStyle: "italic" },
        "& li": { mb: 1, lineHeight: 1.7, pl: 0.5 },
      }}
      {...p}
    />
  ),
  li: ({ node, checked, ordered, index, ...p }) => (
    <Box component="li" sx={{ fontFamily: SERIF_BODY }} {...p} />
  ),
  img: ({ node, src, alt, ...p }) => (
    <Box
      component="figure"
      sx={{
        m: 0,
        my: 6,
        mx: { md: -4 },
        counterIncrement: "figure",
        border: "1px solid",
        borderColor: "currentColor",
        opacity: 1,
        position: "relative",
        bgcolor: (t) => (t.palette.mode === "light" ? "#f0ebe2" : "#1a1620"),
        p: 1.5,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt || ""}
        loading="lazy"
        sx={{
          display: "block",
          width: "100%",
          height: "auto",
          filter: (t) =>
            t.palette.mode === "light" ? "url(#duotone-aubergine)" : "url(#duotone-mint)",
        }}
      />
      <Box
        component="figcaption"
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "0.875rem",
          pt: 1.5,
          pb: 0.5,
          px: 0.5,
          display: "flex",
          gap: 1.5,
          alignItems: "baseline",
          "&::before": {
            content: '"Fig. " counter(figure) " —"',
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
        {alt}
      </Box>
    </Box>
  ),
  hr: () => (
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
  ),
  a: ({ node, href, ...p }) => (
    <Box
      component="a"
      href={href}
      sx={{
        color: "primary.main",
        textDecoration: "none",
        borderBottom: "1px solid",
        borderColor: "currentColor",
        "&:hover": { borderBottomStyle: "dashed" },
      }}
      {...p}
    />
  ),
};

export default function Broadsheet({ title, content, date, category, description }) {
  return (
    <Box
      sx={{
        bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
        minHeight: "100vh",
        pb: 12,
      }}
    >
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
        <span>Vol. I, No. III</span>
        <span>{category}</span>
        <span>{formatDate(date)}</span>
        <span>Morgan Collado</span>
      </Box>

      {/* Masthead */}
      <Box
        component="header"
        sx={{
          textAlign: "center",
          px: { xs: 2, md: 4 },
          pt: { xs: 5, md: 8 },
          pb: { xs: 4, md: 6 },
          borderBottom: "1px solid",
          borderColor: "currentColor",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 6,
            color: "primary.main",
            display: "block",
            mb: 2,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
          }}
        >
          The Broadsheet
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(3rem, 11vw, 8rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            mb: 3,
            mx: "auto",
            maxWidth: "14ch",
          }}
        >
          {title}
        </Typography>
        {description && (
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
            — {description} —
          </Typography>
        )}
      </Box>

      {/* Body */}
      <Box
        component="article"
        sx={{
          maxWidth: "68ch",
          mx: "auto",
          px: { xs: 3, md: 5 },
          pt: { xs: 5, md: 7 },
          counterReset: "figure",
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </Box>

      {/* Colophon */}
      <Box
        sx={{
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
        Set in justified columns by the author, who insists on doing too much.
      </Box>
    </Box>
  );
}
