import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'deep-dark';

const THEME_STORAGE_KEY = 'voltchat-theme';

const DEFAULT_THEME = (import.meta.env.VITE_DEFAULT_THEME as Theme) || 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'deep-dark');
    
    if (theme === 'deep-dark') {
      root.classList.add('dark', 'deep-dark');
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'dark') return 'light';
      if (prevTheme === 'light') return 'deep-dark';
      return 'dark';
    });
  };

  return { theme, toggleTheme };
}
