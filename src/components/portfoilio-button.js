"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Box } from "@mui/material";

export default function PortfolioButton() {
  const [isAnimating, setAnimating] = useState(false);

  const router = useRouter();

  const scaleUpAndFadeOut = {
    initial: {
      scale: 1,
      opacity: 1,
    },
    animate: {
      scale: 20,
      opacity: 0,
      transition: {
        scale: {
          duration: 0.75,
          ease: "easeIn",
        },
        opacity: {
          delay: 0.5,
          duration: 0.25,
        },
      },
    },
  };

  const handleAnimationStart = () => {
    setAnimating(true);
  };

  const handleAnimationComplete = () => {
    router.push("/portfolio");
  };

  const buttonSize = 100;

  return (
    <Box >
      <motion.button
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: `${buttonSize / 2}px`,
          border: "none",
          background: "none",
          cursor: "pointer",
          outline: "none",
          position: "absolute",
          top: "50%",
          left: "50%",
          translateX: "-50%",
          translateY: "-50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        initial="initial"
        animate={isAnimating ? "animate" : "initial"}
        variants={scaleUpAndFadeOut}
        onClick={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        <Image
          src="/MC-logo.png"
          alt="MC Logo"
          layout="fill"
          objectFit="cover"
        />
      </motion.button>
    </Box>
  );
}
