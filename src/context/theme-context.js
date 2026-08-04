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
          primary: {
            main: mode === 'light' ? '#422b65' : '#b4ecdd',
          },
          // Poetry's own accent: the same hue as the aubergine above (263 vs
          // 264 degrees), just lighter and more saturated, so the section reads
          // as a sibling of the rest of the site rather than a new palette.
          // Both values clear WCAG AA on their backgrounds (7.11:1 on the cream
          // #faf6ec, 10.45:1 on the near-black #0d0a14).
          // Note: createTheme only augments the built-in palette keys, so this
          // has `.main` and nothing else — no `.light`/`.dark`/`.contrastText`,
          // and `<Button color="poetry">` won't work.
          poetry: {
            main: mode === 'light' ? '#63409b' : '#c9b3f0',
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
