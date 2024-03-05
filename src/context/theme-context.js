// context/ThemeContext.js
"use client";
import React, { createContext, useState, useEffect } from "react";
import { createTheme, ThemeProvider as MUIThemeProvider } from "@mui/material/styles";


// Create a context
const ThemeContext = createContext();

// Custom hook to abstract theme detection logic
function usePreferredTheme() {
  const [mode, setMode] = useState("light"); // default to light

  useEffect(() => {
    // Abstracting the theme detection and avoiding direct window reference
    const getPreferredTheme = () => {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      // Return default theme or from other sources if window is not available
      return "light"; // or return saved theme from localStorage or other storage
    };

    const preferredTheme = getPreferredTheme();
    setMode(preferredTheme);

    const handleChange = (e) => {
      const newMode = e.matches ? "dark" : "light";
      setMode(newMode);
      localStorage.setItem("theme", newMode);
    };

    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  return [mode, setMode];
}

// Custom ThemeProvider
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = usePreferredTheme();

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    localStorage.setItem("theme", newMode);
    setMode(newMode);
  };

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode, // Switching the dark mode on and off
          // other theme customizations
        },
        typography: {
          fontFamily: '"Playfair Display", serif',
        },
        // ... other options
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
