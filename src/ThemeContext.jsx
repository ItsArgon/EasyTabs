// ThemeContext.jsx - Theme management system
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Load saved theme from localStorage or default to purple
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || 'purple';
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', accentColor);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const changeAccent = (color) => {
    setAccentColor(color);
  };

  return (
    <ThemeContext.Provider value={{ accentColor, changeAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};