"use client";
import { Box } from "@mui/material";
import PortfolioButton from "@/components/portfolio-button";

export default function Home() {

  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        component: "main",
      }}
    >
      <PortfolioButton />
    </Box>
  );
}

