# Theme System Documentation

## Overview

The SkillSwap application includes a comprehensive theme system that supports light and dark modes. The theme system is built with React Context API and CSS custom properties for optimal performance and maintainability.

## Architecture

### Components

1. **ThemeContext** (`src/state/ThemeContext.jsx`)
   - React Context for theme state management
   - Provides theme toggle and state access throughout the app

2. **ThemeProvider** (`src/state/ThemeContext.jsx`)
   - Context provider component
   - Wraps the entire application in `src/main.jsx`

3. **ThemeToggle** (`src/components/ThemeToggle.jsx`)
   - UI component for theme switching
   - Animated toggle button with sun/moon icons

4. **CSS Variables** (`src/styles.css`)
   - CSS custom properties for theme colors
   - Automatic application based on theme class

### Theme Structure

```css
:root {
  /* Light Theme Variables */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  /* ... more variables */
}

.dark {
  /* Dark Theme Variables */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  /* ... more variables */
}
```

## Usage

### Using Theme Context

```jsx
import { useTheme } from '../state/ThemeContext.jsx';

const MyComponent = () => {
  const { theme, toggleTheme, isDark, isLight } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
};
```

### Applying Theme Styles

```jsx
// Using CSS variables
<div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
  Themed content
</div>

// Using Tailwind classes (automatically themed)
<div className="bg-primary text-primary">
  Themed content
</div>
```

### Theme Toggle Component

```jsx
import ThemeToggle from '../components/ThemeToggle.jsx';

const Header = () => {
  return (
    <header>
      <ThemeToggle className="ml-auto" />
    </header>
  );
};
```

## Features

### ✅ Complete Features
- **Persistent Theme**: Saves user preference to localStorage
- **Smooth Transitions**: CSS transitions for theme changes
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: CSS custom properties for instant theme switching
- **SSR Safe**: Handles server-side rendering gracefully

### 🎨 Theme Variables

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--bg-primary` | #ffffff | #0f172a | Main background |
| `--bg-secondary` | #f8fafc | #1e293b | Secondary background |
| `--text-primary` | #0f172a | #f8fafc | Primary text |
| `--border-primary` | #e2e8f0 | #334155 | Border colors |

## Implementation Details

### Theme Persistence
- Theme preference saved to `localStorage` with key `skillswap-theme`
- Automatically restored on app reload
- Defaults to 'dark' theme if no preference saved

### CSS Architecture
- CSS custom properties for theme values
- `.dark` class applied to `document.documentElement`
- Smooth transitions with `transition: background-color 0.3s ease, color 0.3s ease`

### Component Integration
- ThemeProvider wraps AuthProvider in `main.jsx`
- ThemeToggle integrated in DashboardLayout header
- All components can access theme state via `useTheme()` hook

## Maintenance

### Adding New Theme Variables
1. Add variable to `:root` (light theme)
2. Add variable to `.dark` (dark theme)
3. Use `var(--variable-name)` in components

### Extending Theme Logic
- Modify `ThemeContext.jsx` for additional theme modes
- Update `ThemeToggle.jsx` for new UI interactions
- Add new CSS classes in `styles.css`

### Testing
- Test theme persistence across browser sessions
- Verify smooth transitions
- Check accessibility with screen readers
- Test on different devices and browsers

## File Structure

```
frontend/src/
├── components/
│   └── ThemeToggle.jsx          # Theme toggle UI component
├── state/
│   └── ThemeContext.jsx         # Theme context and provider
├── styles.css                   # CSS variables and theme styles
├── layouts/
│   └── DashboardLayout.jsx      # Uses ThemeToggle component
└── main.jsx                     # ThemeProvider integration
```

## Future Enhancements

- **System Theme Detection**: Auto-detect OS theme preference
- **Custom Themes**: User-defined color schemes
- **Theme Presets**: Multiple theme options beyond light/dark
- **Theme Transitions**: Animated transitions between themes