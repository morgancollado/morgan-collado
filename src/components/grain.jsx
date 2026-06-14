"use client";
import { Box } from "@mui/material";

export default function Grain() {
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
