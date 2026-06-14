"use client";

import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReducedMotion } from "@/app/blog-lab/_lib/motion";
import { formatDate } from "@/lib/format-date";

const SERIF_BODY =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

function altHash(alt = "") {
  let h = 0;
  for (let i = 0; i < alt.length; i++) h = (h * 31 + alt.charCodeAt(i)) | 0;
  return h;
}

function makeComponents(reduced) {
  return {
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
      <Box
        component="h2"
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "clamp(1.7rem, 3.6vw, 2.3rem)",
          lineHeight: 1.1,
          mt: 9,
          mb: 2.5,
          textAlign: "center",
          position: "relative",
          counterIncrement: "movement",
          "&::before": {
            content: "counter(movement, decimal-leading-zero)",
            position: "absolute",
            top: { xs: "-3rem", md: "-4.5rem" },
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "clamp(5rem, 11vw, 9rem)",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontWeight: 700,
            color: "primary.main",
            opacity: 0.1,
            lineHeight: 1,
            pointerEvents: "none",
            zIndex: 0,
          },
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
          color: "primary.main",
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
      <Box
        component="em"
        sx={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }}
        {...p}
      />
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
          position: "relative",
          pb: 2.5,
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
            position: "absolute",
            left: "15%",
            right: "15%",
            bottom: 0,
            height: "16px",
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 14' preserveAspectRatio='none'><path d='M0 8 Q 25 0, 50 7 T 100 7 T 150 7 T 200 6' fill='none' stroke='%23b4ecdd' stroke-width='3' stroke-linecap='round'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
            opacity: 0.85,
          },
          "& p": {
            fontFamily: "inherit !important",
            textAlign: "center !important",
            my: 0,
          },
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
          "& li::marker": {
            color: "primary.main",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
          },
          "& li": { mb: 1, lineHeight: 1.7, pl: 0.5 },
        }}
        {...p}
      />
    ),
    li: ({ node, checked, ordered, index, ...p }) => (
      <Box component="li" sx={{ fontFamily: SERIF_BODY }} {...p} />
    ),
    img: ({ node, src, alt, ...p }) => {
      const tilt = reduced ? 0 : ((altHash(alt) % 30) - 15) / 10;
      const Inner = reduced ? "div" : motion.div;
      const animProps = reduced
        ? {}
        : {
            initial: { scale: 0.96, opacity: 0 },
            whileInView: { scale: 1, opacity: 1 },
            viewport: { once: true, margin: "-80px" },
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          };
      return (
        <Box
          component="figure"
          sx={{
            m: 0,
            my: 7,
            mx: { md: -3 },
            counterIncrement: "figure",
          }}
        >
          <Inner
            {...animProps}
            style={{
              transform: `rotate(${tilt}deg)`,
              display: "block",
            }}
          >
            <Box
              sx={{
                border: "1px solid",
                borderColor: "currentColor",
                p: 1.5,
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
                src={src}
                alt={alt || ""}
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
          </Inner>
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
          </Typography>
        </Box>
      );
    },
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
}

function Grain() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        mixBlendMode: (t) =>
          t.palette.mode === "light" ? "multiply" : "overlay",
        opacity: 0.15,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}

function Spine({ progress, reduced }) {
  const leaf1Opacity = useTransform(progress, [0, 0.1, 0.4], [0, 0, 1]);
  const leaf2Opacity = useTransform(progress, [0, 0.4, 0.7], [0, 0, 1]);
  const leaf3Opacity = useTransform(progress, [0, 0.7, 0.95], [0, 0, 1]);

  return (
    <Box
      aria-hidden
      sx={{
        position: { md: "sticky" },
        top: 0,
        height: { xs: 60, md: "100vh" },
        width: { xs: "100%", md: 80 },
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        pointerEvents: "none",
        color: "primary.main",
      }}
    >
      <svg
        viewBox="0 0 80 800"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        <path
          d="M40 0 C 20 100, 60 200, 40 300 S 20 500, 40 600 S 60 720, 40 800"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.08"
        />
        <motion.path
          d="M40 0 C 20 100, 60 200, 40 300 S 20 500, 40 600 S 60 720, 40 800"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={
            reduced
              ? { pathLength: 1, opacity: 0.55 }
              : { pathLength: progress, opacity: 0.6 }
          }
        />
        <motion.g style={reduced ? { opacity: 1 } : { opacity: leaf1Opacity }}>
          <path
            d="M40 220 q -16 -6, -22 4 q 9 11, 22 4"
            fill="currentColor"
            opacity="0.55"
          />
        </motion.g>
        <motion.g style={reduced ? { opacity: 1 } : { opacity: leaf2Opacity }}>
          <path
            d="M40 480 q 16 -6, 22 4 q -9 11, -22 4"
            fill="currentColor"
            opacity="0.55"
          />
        </motion.g>
        <motion.g style={reduced ? { opacity: 1 } : { opacity: leaf3Opacity }}>
          <text
            x="40"
            y="765"
            textAnchor="middle"
            fontFamily="var(--font-playfair)"
            fontStyle="italic"
            fontSize="22"
            fill="currentColor"
            opacity="0.7"
          >
            ❦
          </text>
        </motion.g>
      </svg>
    </Box>
  );
}

export default function AtelierBroadsheet({
  title,
  content,
  date,
  category,
  description,
}) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });
  const titleY = useTransform(smooth, [0, 0.15], ["0%", "-25%"]);
  const titleOpacity = useTransform(smooth, [0, 0.12], [1, 0.25]);
  const components = makeComponents(reduced);

  return (
    <Box
      ref={ref}
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

      {/* Folio dateline (broadsheet) */}
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
        <span>Vol. I, No. III</span>
        <span>{category}</span>
        <span>{formatDate(date)}</span>
        <span>Morgan Collado</span>
      </Box>

      {/* Masthead — broadsheet content + atelier parallax + radial gradient */}
      <Box
        component="header"
        sx={{
          position: "relative",
          minHeight: { xs: "75vh", md: "90vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          px: { xs: 3, md: 6 },
          pt: { xs: 4, md: 6 },
          pb: { xs: 6, md: 8 },
          borderBottom: "1px solid",
          borderColor: "currentColor",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: (t) =>
              t.palette.mode === "light"
                ? "radial-gradient(ellipse at top, rgba(66,43,101,0.16) 0%, transparent 65%)"
                : "radial-gradient(ellipse at top, rgba(180,236,221,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
          },
        }}
      >
        <motion.div
          style={reduced ? {} : { y: titleY, opacity: titleOpacity }}
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
            The Broadsheet
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: "clamp(3rem, 11vw, 8.5rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              mb: 3,
              mx: "auto",
              maxWidth: "14ch",
              textShadow: (t) =>
                t.palette.mode === "light"
                  ? "0 2px 30px rgba(66,43,101,0.12)"
                  : "0 2px 30px rgba(180,236,221,0.08)",
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
                color: (t) =>
                  t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d",
                maxWidth: "52ch",
                mx: "auto",
                lineHeight: 1.5,
              }}
            >
              — {description} —
            </Typography>
          )}
        </motion.div>

        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 20, md: 36 },
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "0.85rem",
            opacity: 0.55,
            letterSpacing: 3,
          }}
        >
          ↓ descend
        </Box>
      </Box>

      {/* Body with spine */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "80px minmax(0, 68ch) 80px",
          },
          maxWidth: "1100px",
          mx: "auto",
          px: { xs: 3, md: 0 },
          pt: { xs: 6, md: 9 },
        }}
      >
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Spine progress={smooth} reduced={reduced} />
        </Box>

        <Box
          component="article"
          sx={{
            counterReset: "movement figure",
            position: "relative",
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </Box>

        <Box />
      </Box>

      {/* Colophon (broadsheet) */}
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
        Set in justified columns by the author, who insists on doing too much.
      </Box>
    </Box>
  );
}
