import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isSystemPreference: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'bazaarcom_theme';

function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(themeMode: ThemeMode): ResolvedTheme {
  if (themeMode === 'system') {
    return getSystemPreference();
  }
  return themeMode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default to 'system'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => 
    resolveTheme(theme)
  );

  // Apply theme to DOM
  const applyTheme = useCallback((newResolvedTheme: ResolvedTheme) => {
    const root = document.documentElement;
    if (newResolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    const newResolvedTheme = resolveTheme(theme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
    };

    // Add listener (with backward compatibility)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy support for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme, applyTheme]);

  // Set theme with validation
  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn(`Invalid theme mode: ${newTheme}. Using 'system'.`);
      setThemeState('system');
    } else {
      setThemeState(newTheme);
    }
  }, []);

  // Toggle between light and dark (skip system for toggle)
  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      // If currently system, resolve to actual value then toggle
      const currentResolved = resolveTheme(prev);
      return currentResolved === 'light' ? 'dark' : 'light';
    });
  }, []);

  const isSystemPreference = theme === 'system';

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isSystemPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Utility hook for components that only need the resolved theme
export function useResolvedTheme(): ResolvedTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}
