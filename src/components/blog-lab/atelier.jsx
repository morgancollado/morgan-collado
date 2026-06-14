"use client";

import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReducedMotion } from "@/app/blog-lab/_lib/motion";
import { formatDate } from "@/lib/format-date";

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
          fontSize: "clamp(2rem, 5vw, 3rem)",
          mt: 8,
          mb: 2,
          lineHeight: 1.1,
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
          fontSize: "clamp(1.85rem, 4.5vw, 2.75rem)",
          mt: 10,
          mb: 3,
          lineHeight: 1.05,
          position: "relative",
          counterIncrement: "movement",
          pt: { xs: 4, md: 0 },
          "&::before": {
            content: 'counter(movement, decimal-leading-zero)',
            position: "absolute",
            top: { xs: "-2.5rem", md: "-4rem" },
            left: { xs: 0, md: "-2rem" },
            fontSize: "clamp(4rem, 10vw, 8rem)",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontWeight: 700,
            color: "primary.main",
            opacity: 0.13,
            lineHeight: 1,
            pointerEvents: "none",
            zIndex: 0,
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
          fontSize: "1.075rem",
          lineHeight: 1.75,
          my: 2,
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
          color: "primary.main",
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
          fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
          lineHeight: 1.3,
          my: 6,
          mx: 0,
          position: "relative",
          pb: 2.5,
          "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: "20%",
            bottom: 0,
            height: "14px",
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 14' preserveAspectRatio='none'><path d='M0 8 Q 25 0, 50 7 T 100 7 T 150 7 T 200 6' fill='none' stroke='%23b4ecdd' stroke-width='3' stroke-linecap='round'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
            opacity: 0.85,
          },
          "& p": { fontFamily: "inherit !important", my: 0 },
        }}
        {...p}
      />
    ),
    ul: ({ node, ...p }) => (
      <Box
        component="ul"
        sx={{
          pl: 0,
          listStyle: "none",
          my: 2.5,
          "& li::before": {
            content: '"❧ "',
            color: "primary.main",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            mr: 0.5,
          },
          "& li": { mb: 1.25, lineHeight: 1.7 },
        }}
        {...p}
      />
    ),
    ol: ({ node, ...p }) => (
      <Box component="ol" sx={{ pl: 3, my: 2.5, "& li": { mb: 1.25, lineHeight: 1.7 } }} {...p} />
    ),
    li: ({ node, checked, ordered, index, ...p }) => (
      <Box component="li" sx={{ fontSize: "1.0625rem" }} {...p} />
    ),
    img: ({ node, src, alt, ...p }) => {
      const tilt = reduced ? 0 : ((altHash(alt) % 30) - 15) / 10; // ±1.5°
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
        <Box component="figure" sx={{ m: 0, my: 7 }}>
          <Inner
            {...animProps}
            style={{
              transform: `rotate(${tilt}deg)`,
              display: "block",
              position: "relative",
            }}
          >
            <Box
              sx={{
                p: 1.25,
                bgcolor: (t) =>
                  t.palette.mode === "light" ? "#f5efe2" : "#1a1521",
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
          {alt && (
            <Typography
              component="figcaption"
              sx={{
                mt: 2.5,
                fontSize: "0.875rem",
                fontStyle: "italic",
                fontFamily: "var(--font-playfair)",
                color: (t) =>
                  t.palette.mode === "light" ? "#5a4d3f" : "#9e958a",
                textAlign: "center",
                px: 2,
              }}
            >
              {alt}
            </Typography>
          )}
        </Box>
      );
    },
    hr: () => (
      <Box
        sx={{
          my: 7,
          textAlign: "center",
          color: "primary.main",
          fontFamily: "var(--font-playfair)",
          letterSpacing: 14,
          fontSize: "1.5rem",
          opacity: 0.7,
        }}
      >
        ❧
      </Box>
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
        mixBlendMode: (t) => (t.palette.mode === "light" ? "multiply" : "overlay"),
        opacity: 0.18,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}

function Spine({ progress, reduced }) {
  const leaf1Opacity = useTransform(progress, [0, 0.1, 0.4], [0, 0, 1]);
  const leaf2Opacity = useTransform(progress, [0, 0.4, 0.7], [0, 0, 1]);
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
      }}
    >
      <svg
        viewBox="0 0 80 800"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {/* faint guide line */}
        <path
          d="M40 0 C 20 100, 60 200, 40 300 S 20 500, 40 600 S 60 720, 40 800"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.08"
        />
        {/* animated drawn line */}
        <motion.path
          d="M40 0 C 20 100, 60 200, 40 300 S 20 500, 40 600 S 60 720, 40 800"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={
            reduced
              ? { pathLength: 1, opacity: 0.5 }
              : { pathLength: progress, opacity: 0.55 }
          }
        />
        {/* flourish leaves */}
        <motion.g style={reduced ? { opacity: 1 } : { opacity: leaf1Opacity }}>
          <path
            d="M40 280 q -14 -6, -20 4 q 8 10, 20 4"
            fill="currentColor"
            opacity="0.5"
          />
        </motion.g>
        <motion.g style={reduced ? { opacity: 1 } : { opacity: leaf2Opacity }}>
          <path
            d="M40 560 q 14 -6, 20 4 q -8 10, -20 4"
            fill="currentColor"
            opacity="0.5"
          />
        </motion.g>
      </svg>
    </Box>
  );
}

export default function Atelier({ title, content, date, category, description }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });
  const titleY = useTransform(smooth, [0, 0.15], ["0%", "-30%"]);
  const titleOpacity = useTransform(smooth, [0, 0.12], [1, 0.2]);
  const components = makeComponents(reduced);

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        background: (t) =>
          t.palette.mode === "light"
            ? "linear-gradient(180deg, #f7f1e6 0%, #efe6d2 100%)"
            : "linear-gradient(180deg, #110b18 0%, #1a1228 100%)",
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ece6dd"),
        minHeight: "100vh",
        pb: 16,
        overflow: "hidden",
      }}
    >
      <Grain />

      {/* Hero / title region */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "70vh", md: "90vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, md: 6 },
          pt: { xs: 8, md: 10 },
          pb: { xs: 8, md: 10 },
          textAlign: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: (t) =>
              t.palette.mode === "light"
                ? "radial-gradient(ellipse at top, rgba(66,43,101,0.18) 0%, transparent 60%)"
                : "radial-gradient(ellipse at top, rgba(180,236,221,0.12) 0%, transparent 60%)",
            pointerEvents: "none",
          },
        }}
      >
        <motion.div
          style={
            reduced
              ? {}
              : { y: titleY, opacity: titleOpacity }
          }
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
            {category}  ·  {formatDate(date)}
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
              maxWidth: "12ch",
              mx: "auto",
              textShadow: (t) =>
                t.palette.mode === "light"
                  ? "0 2px 30px rgba(66,43,101,0.15)"
                  : "0 2px 30px rgba(180,236,221,0.1)",
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                fontSize: "1.15rem",
                maxWidth: "50ch",
                mx: "auto",
                opacity: 0.75,
                lineHeight: 1.5,
              }}
            >
              {description}
            </Typography>
          )}
        </motion.div>

        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 24, md: 40 },
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "0.85rem",
            opacity: 0.5,
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
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "80px minmax(0, 1fr) 80px" },
          maxWidth: "1100px",
          mx: "auto",
          px: { xs: 3, md: 0 },
        }}
      >
        <Box sx={{ display: { xs: "none", md: "block" }, color: "primary.main" }}>
          <Spine progress={smooth} reduced={reduced} />
        </Box>

        <Box
          component="article"
          sx={{
            maxWidth: "68ch",
            mx: "auto",
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
    </Box>
  );
}
