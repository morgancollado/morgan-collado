// components/NavBar.js
"use client";
import React, { useContext } from "react";
import ThemeContext from "@/context/theme-context";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Link from "next/link";

const NavBar = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);

  return (
    <AppBar position="relative">
      <Toolbar>
        <Typography
          variant="h6"
          color="inherit"
          noWrap
          sx={{ marginLeft: "auto" }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Morgan Collado
</Link>
          
        </Typography>
        <Button onClick={toggleTheme} color="inherit">
          {mode === "light" ? <Brightness7Icon /> : <Brightness4Icon />}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
