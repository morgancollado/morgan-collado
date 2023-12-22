// context/ThemeContext.js
"use client";
import React, { createContext, useState, useEffect } from "react";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";

// Create a context
const ThemeContext = createContext();

// Custom ThemeProvider
export const ThemeProvider = ({ children }) => {
  // State to hold the selected theme name
  const [mode, setMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  // toggle between light and dark
  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    localStorage.setItem("theme", newMode);
    setMode(newMode);
  };

  // Create a theme instance
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode, // Switching the dark mode on and off
          // other theme customizations
        },
        // ... other options like typography, breakpoints etc.
      }),
    [mode]
  );

  useEffect(() => {
    const handleChange = (e) => {
      const newMode = e.matches ? "dark" : "light";
      setMode(newMode);
      localStorage.setItem("theme", newMode);
    };

    // Define the media query list
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Add the event listener using addEventListener
    mediaQuery.addEventListener("change", handleChange);

    // Set the initial theme
    handleChange(mediaQuery);

    // Cleanup function to remove the event listener
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
