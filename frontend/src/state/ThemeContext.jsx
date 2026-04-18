import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme Context for managing light/dark mode throughout the application
 * Provides theme state, toggle functionality, and persistence
 */
const ThemeContext = createContext();

/**
 * Hook to access theme context
 * @returns {Object} Theme context with theme state and controls
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Provider component that wraps the application
 * Manages theme state, persistence, and applies theme classes to document
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('skillswap-theme');
      return savedTheme || 'dark';
    }
    return 'dark';
  });

  // Apply theme to document root and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(theme);

    // Persist to localStorage
    localStorage.setItem('skillswap-theme', theme);
  }, [theme]);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Set a specific theme mode
   * @param {string} newTheme - 'light' or 'dark'
   */
  const setThemeMode = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  // Context value object
  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};