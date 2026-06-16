"use client";

import * as React from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { Box, IconButton, Typography } from "@mui/material";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import { useReducedMotion } from "@/lib/motion";
import ProjectDetailsModal from "@/components/project-details-modal";
import BackToTop from "@/components/back-to-top";
import Grain from "@/components/grain";
import Spine from "@/components/spine";
import { SECTIONS } from "@/lib/projects";

const SERIF_BODY =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

function altHash(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const editorialLinkSx = {
  fontFamily: "var(--font-playfair)",
  fontStyle: "italic",
  fontSize: "1.05rem",
  color: "primary.main",
  textDecoration: "none",
  background: "none",
  border: "none",
  borderRadius: 0,
  cursor: "pointer",
  padding: 0,
  paddingBottom: "2px",
  borderBottom: "1px solid currentColor",
  "&:hover": { borderBottomStyle: "dashed" },
};

const captionLabelSx = {
  fontVariantCaps: "small-caps",
  fontFamily: "var(--font-playfair)",
  letterSpacing: 1.8,
  color: "primary.main",
  fontSize: "0.72rem",
  display: "block",
  mb: 1.5,
  "&::before": { content: '"Fig. " counter(figure) " —"' },
};

function ProjectPlate({ project, onOpen, reduced }) {
  const tilt = reduced ? 0 : ((altHash(project.projectName) % 24) - 12) / 12;
  const Inner = reduced ? "div" : motion.div;
  const animProps = reduced
    ? {}
    : {
        initial: { scale: 0.96, opacity: 0 },
        whileInView: { scale: 1, opacity: 1 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
      };

  const action = project.blogLink ? (
    <Box component={Link} href={project.blogLink} sx={editorialLinkSx}>
      Read the essay →
    </Box>
  ) : (
    <Box component="button" onClick={() => onOpen(project)} sx={editorialLinkSx}>
      View details →
    </Box>
  );

  return (
    <Box
      component="figure"
      sx={{ m: 0, mb: 2, counterIncrement: "figure", position: "relative", zIndex: 2 }}
    >
      <Inner
        {...animProps}
        style={{ transform: `rotate(${tilt}deg)`, display: "block" }}
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
                ? "0 18px 50px -18px rgba(66,43,101,0.3), 0 4px 12px -4px rgba(0,0,0,0.12)"
                : "0 18px 50px -18px rgba(0,0,0,0.7), 0 4px 12px -4px rgba(180,236,221,0.08)",
            position: "relative",
            aspectRatio: "16 / 10",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={project.imageLink}
            alt={project.projectName}
            loading="lazy"
            sx={{
              position: "absolute",
              inset: "12px",
              width: "calc(100% - 24px)",
              height: "calc(100% - 24px)",
              objectFit: "cover",
              display: "block",
              filter: (t) =>
                t.palette.mode === "light"
                  ? "url(#duotone-aubergine)"
                  : "url(#duotone-mint)",
            }}
          />
        </Box>
      </Inner>
      <Box sx={{ pt: 3 }}>
        <Box component="span" sx={captionLabelSx} />
        <Typography
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(1.25rem, 2.2vw, 1.55rem)",
            lineHeight: 1.2,
            mb: 1,
          }}
        >
          {project.projectName}
        </Typography>
        <Typography
          sx={{
            fontFamily: SERIF_BODY,
            fontSize: "0.97rem",
            lineHeight: 1.6,
            mb: 2,
            color: (t) => (t.palette.mode === "light" ? "#3a312b" : "#cfc6b8"),
          }}
        >
          {project.projectDescription}
        </Typography>
        {action}
      </Box>
    </Box>
  );
}

export default function Portfolio() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });
  const titleY = useTransform(smooth, [0, 0.15], ["0%", "-25%"]);
  const titleOpacity = useTransform(smooth, [0, 0.12], [1, 0.25]);

  // Article scroll — drives the vine. Starts as the article reaches the
  // viewport top (after the masthead parallaxes up) and completes as the
  // last Movement exits.
  const articleRef = useRef(null);
  const { scrollYProgress: articleProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  });
  const articleSmooth = useSpring(articleProgress, {
    stiffness: 80,
    damping: 30,
  });

  const handleOpen = (p) => {
    setSelectedProject(p);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
        minHeight: "100vh",
        overflow: "hidden",
        pb: 8,
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
        <span>Vol. I, No. I</span>
        <span>Portfolio</span>
        <span>{dateStr}</span>
        <span>Morgan Collado</span>
      </Box>

      {/* Masthead */}
      <Box
        component="header"
        sx={{
          position: "relative",
          minHeight: { xs: "80vh", md: "92vh" },
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
                ? "radial-gradient(ellipse at top, rgba(66,43,101,0.18) 0%, transparent 65%)"
                : "radial-gradient(ellipse at top, rgba(180,236,221,0.11) 0%, transparent 65%)",
            pointerEvents: "none",
          },
        }}
      >
        <motion.div style={reduced ? {} : { y: titleY, opacity: titleOpacity }}>
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
            Software, with intent
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: "clamp(3rem, 12vw, 9rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
              mb: 3,
              mx: "auto",
              maxWidth: "11ch",
              textShadow: (t) =>
                t.palette.mode === "light"
                  ? "0 2px 30px rgba(66,43,101,0.12)"
                  : "0 2px 30px rgba(180,236,221,0.08)",
            }}
          >
            Morgan Collado
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.15rem",
              fontStyle: "italic",
              color: (t) =>
                t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d",
              maxWidth: "44ch",
              mx: "auto",
              lineHeight: 1.5,
            }}
          >
            — I make accessible software that improves lives. —
          </Typography>

          <Box
            sx={{
              mt: 5,
              display: "flex",
              justifyContent: "center",
              gap: { xs: 3, md: 4 },
              flexWrap: "wrap",
            }}
          >
            <Box component={Link} href="/about" sx={editorialLinkSx}>
              About →
            </Box>
            <Box
              component="a"
              href="/resume.pdf"
              download="MorganColladoResume.pdf"
              sx={editorialLinkSx}
            >
              Résumé →
            </Box>
            <Box component={Link} href="/blog" sx={editorialLinkSx}>
              Writing →
            </Box>
          </Box>

          <Box
            sx={{
              mt: 4,
              display: "flex",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <IconButton
              href="https://github.com/morgancollado"
              target="_blank"
              aria-label="GitHub"
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
              aria-label="LinkedIn"
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
          ↓ the work
        </Box>
      </Box>

      {/* Fixed scroll spine — drawn by article scroll progress */}
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", lg: "block" },
          position: "fixed",
          top: 0,
          left: "max(24px, calc(50vw - 554px))",
          height: "100vh",
          width: 80,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Spine progress={articleSmooth} reduced={reduced} withDingbat />
      </Box>

      {/* Body — centered article (article scroll drives the vine) */}
      <Box
        ref={articleRef}
        component="article"
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: "900px",
          mx: "auto",
          px: { xs: 3, md: 4 },
          pt: { xs: 6, md: 9 },
          counterReset: "movement figure",
        }}
      >
        {SECTIONS.map((section) => (
          <Box
            key={section.label}
            component="section"
            sx={{
              mb: { xs: 10, md: 14 },
              "&:last-of-type": { mb: 0 },
            }}
          >
            {/* Section heading with ghosted numeral */}
            <Box
              sx={{
                textAlign: "center",
                mb: 7,
                position: "relative",
                counterIncrement: "movement",
                pt: { xs: 4, md: 6 },
                "&::before": {
                  content: "counter(movement, decimal-leading-zero)",
                  position: "absolute",
                  top: { xs: "-2rem", md: "-3rem" },
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
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 6,
                  color: "primary.main",
                  display: "block",
                  mb: 1,
                  fontFamily: "var(--font-playfair)",
                  fontStyle: "italic",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {section.label}
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: "var(--font-playfair)",
                  fontStyle: "italic",
                  fontSize: "clamp(1.7rem, 3.6vw, 2.3rem)",
                  lineHeight: 1.1,
                  mb: 2,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {section.title}
              </Typography>
              <Box
                sx={{
                  width: "40px",
                  height: "1px",
                  bgcolor: "currentColor",
                  opacity: 0.4,
                  mx: "auto",
                  mb: 2,
                }}
              />
              <Typography
                sx={{
                  fontFamily: "var(--font-playfair)",
                  fontStyle: "italic",
                  fontSize: "1rem",
                  color: (t) =>
                    t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d",
                  maxWidth: "44ch",
                  mx: "auto",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {section.subtitle}
              </Typography>
            </Box>

            {/* Project plates */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: { xs: 5, md: 8 },
              }}
            >
              {section.projects.map((project) => (
                <ProjectPlate
                  key={project.id}
                  project={project}
                  onOpen={handleOpen}
                  reduced={reduced}
                />
              ))}
            </Box>
          </Box>
        ))}
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
        Set in two columns and four movements by the author,
        <br />
        who insists on doing too much.
      </Box>

      <ProjectDetailsModal
        open={open}
        handleClose={handleClose}
        project={selectedProject}
      />
      <BackToTop />
    </Box>
  );
}
