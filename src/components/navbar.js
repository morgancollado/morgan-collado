"use client";
import React, { useContext } from "react";
import ThemeContext from "@/context/theme-context";
import { AppBar, Box, IconButton, Toolbar } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkSx = {
  fontFamily: "var(--font-playfair)",
  fontStyle: "italic",
  fontSize: { xs: "0.95rem", md: "1.05rem" },
  color: "inherit",
  textDecoration: "none",
  letterSpacing: 0.5,
  px: 1.25,
  py: 0.5,
  borderBottom: "1px solid transparent",
  transition: "color .2s, border-color .2s",
  "&:hover, &:focus-visible": {
    borderBottomColor: "currentColor",
    color: "primary.main",
    outline: "none",
  },
};

const NavBar = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const pathname = usePathname();

  // The Queen Easter egg has its own deliberate dark aesthetic.
  if (pathname?.startsWith("/queen-")) return null;

  return (
    <AppBar
      position="relative"
      elevation={0}
      sx={{
        bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
        color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
        borderBottom: "1px solid",
        borderColor: "currentColor",
        backgroundImage: "none",
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: 48,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box
          component={Link}
          href="/"
          aria-label="Home"
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "1.25rem",
            color: "inherit",
            textDecoration: "none",
            letterSpacing: 2,
            "&:hover": { color: "primary.main" },
          }}
        >
          M · C
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box component={Link} href="/blog" sx={navLinkSx}>
            Writing
          </Box>
          <Box component={Link} href="/about" sx={navLinkSx}>
            About
          </Box>
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            size="small"
            aria-label="toggle theme"
            sx={{ ml: 1 }}
          >
            {mode === "light" ? (
              <Brightness7Icon fontSize="small" />
            ) : (
              <Brightness4Icon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
