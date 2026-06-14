"use client";

import { Box } from "@mui/material";
import { motion, useTransform } from "framer-motion";

export default function Spine({ progress, reduced, withDingbat = false }) {
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
        {withDingbat && (
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
        )}
      </svg>
    </Box>
  );
}
