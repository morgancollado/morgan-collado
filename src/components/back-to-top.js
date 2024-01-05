"use client";
import { Button, Box } from "@mui/material";
import { animateScroll } from "react-scroll";
const BackToTop = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 2,
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={() =>
          animateScroll.scrollToTop({ duration: 500, smooth: true })
        }
      >
        Back to Top
      </Button>
    </Box>
  );
};

export default BackToTop;
