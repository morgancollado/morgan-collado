"use client";
import { useState } from "react";
import Button from "@mui/material/Button";
import CascadingLetters from "@/components/cascading-letters";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
export default function Home() {
  const [animate, setAnimate] = useState(false);
  const letters = "MRC".repeat(30).split("");
  const router = useRouter();

  const handleClick = () => {
    setAnimate(true);
    setTimeout(function () {
      setAnimate(false);
      router.push("/portfolio");
    }, 5000); // Reset after animation
  };

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
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        style={{ margin: "20px" }}
      >
        Welcome
      </Button>
      <CascadingLetters letters={letters} isAnimating={animate} />
    </Box>
  );
}
