"use client";
import { Box } from "@mui/material";
import { animateScroll } from "react-scroll";

const BackToTop = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 5,
      }}
    >
      <Box
        component="button"
        onClick={() =>
          animateScroll.scrollToTop({ duration: 500, smooth: true })
        }
        sx={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "0.95rem",
          fontVariantCaps: "small-caps",
          letterSpacing: 3,
          color: "primary.main",
          background: "none",
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
          padding: 0,
          paddingBottom: "2px",
          borderBottom: "1px solid currentColor",
          "&:hover, &:focus-visible": {
            borderBottomStyle: "dashed",
            outline: "none",
          },
        }}
      >
        ↑  to the top
      </Box>
    </Box>
  );
};

export default BackToTop;
