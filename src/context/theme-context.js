// context/ThemeContext.js
'use client'
import React, { createContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

// Create a context
const ThemeContext = createContext();

// Custom ThemeProvider
export const ThemeProvider = ({ children }) => {
  // State to hold the selected theme name
  const [mode, setMode] = useState('light');

  useEffect(() => {
    // Read the preferred theme from persistence
    const storedTheme = localStorage.getItem('theme') || 'light';
    setMode(storedTheme);
  }, []);

  // toggle between light and dark
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newMode);
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
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
