"use client";
import React from "react";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";

const SERIF_BODY =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

function ProjectDetailsModal({ open, handleClose, project }) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="project-details-title"
      aria-describedby="project-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "calc(100% - 32px)", sm: 460 },
          maxHeight: "90vh",
          overflow: "auto",
          bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
          color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
          border: "1px solid",
          borderColor: "currentColor",
          boxShadow: (t) =>
            t.palette.mode === "light"
              ? "0 30px 80px -20px rgba(66,43,101,0.4)"
              : "0 30px 80px -20px rgba(0,0,0,0.8)",
          p: { xs: 3, sm: 4 },
          outline: "none",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "inherit",
          }}
        >
          <CloseIcon />
        </IconButton>

        {project && (
          <>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: 4,
                color: "primary.main",
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                display: "block",
                mb: 1,
              }}
            >
              On the work
            </Typography>
            <Typography
              id="project-details-title"
              component="h2"
              sx={{
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                fontSize: "1.65rem",
                lineHeight: 1.15,
                mb: 2,
                pr: 3,
              }}
            >
              {project.projectName}
            </Typography>
            <Box
              sx={{
                width: "40px",
                height: "1px",
                bgcolor: "currentColor",
                opacity: 0.4,
                mb: 3,
              }}
            />
            <Box
              sx={{
                border: "1px solid",
                borderColor: "currentColor",
                p: 1,
                mb: 3,
                bgcolor: (t) =>
                  t.palette.mode === "light" ? "#f0ebe2" : "#1a1620",
                aspectRatio: "16 / 10",
                position: "relative",
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
                  inset: "8px",
                  width: "calc(100% - 16px)",
                  height: "calc(100% - 16px)",
                  objectFit: "cover",
                  display: "block",
                  filter: (t) =>
                    t.palette.mode === "light"
                      ? "url(#duotone-aubergine)"
                      : "url(#duotone-mint)",
                }}
              />
            </Box>
            <Typography
              id="project-description"
              sx={{
                fontFamily: SERIF_BODY,
                fontSize: "1rem",
                lineHeight: 1.65,
                mb: project.blogLink ? 3 : 0,
              }}
            >
              {project.projectDetail}
            </Typography>
            {project.blogLink && (
              <Box
                component={Link}
                href={project.blogLink}
                sx={{
                  fontFamily: "var(--font-playfair)",
                  fontStyle: "italic",
                  fontSize: "1.05rem",
                  color: "primary.main",
                  textDecoration: "none",
                  paddingBottom: "2px",
                  borderBottom: "1px solid currentColor",
                  display: "inline-block",
                  "&:hover": { borderBottomStyle: "dashed" },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: "3px",
                  },
                }}
              >
                Read the essay →
              </Box>
            )}
          </>
        )}
      </Box>
    </Modal>
  );
}

export default ProjectDetailsModal;
