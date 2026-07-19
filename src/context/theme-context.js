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
    // A saved manual choice wins; otherwise follow the OS preference.
    const getPreferredTheme = () => {
      if (typeof window === "undefined") return "light";
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const preferredTheme = getPreferredTheme();
    setMode(preferredTheme);

    const handleChange = (e) => {
      // Only track OS changes while the user hasn't made a manual choice.
      if (localStorage.getItem("theme")) return;
      setMode(e.matches ? "dark" : "light");
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
          primary: {
            main: mode === 'light' ? '#422b65' : '#b4ecdd',
          },
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
