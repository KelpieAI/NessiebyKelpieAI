import { useEffect, useState } from 'react';

export type Theme = 'kelpie' | 'dark' | 'light';

const STORAGE_KEY = 'nessie-theme';
const DEFAULT_THEME: Theme = 'kelpie';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? DEFAULT_THEME;
  });

  // Apply theme to <html> on mount and whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return { theme, setTheme };
};