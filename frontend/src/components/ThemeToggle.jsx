import React from 'react';
import { useTheme } from '../state/ThemeContext.jsx';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-10 w-18 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      style={{
        backgroundColor: isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        border: `1px solid var(--border-primary)`,
        boxShadow: '0 2px 4px var(--shadow-secondary)'
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-sm ${
          isDark ? 'translate-x-9 bg-slate-700 text-yellow-300' : 'translate-x-1 bg-yellow-400 text-gray-800'
        }`}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default ThemeToggle;