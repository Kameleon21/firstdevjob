"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Start with a default theme that matches our blocking script's fallback
  const [theme, setTheme] = useState<Theme>('dark');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This only runs on the client after hydration
    setIsHydrated(true);
    
    // Read the theme that was set by our blocking script
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
    if (currentTheme === 'light' || currentTheme === 'dark') {
      setTheme(currentTheme);
    }

    // Listen for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if the user has NOT set a preference manually
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        setTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Cleanup the listener when the component unmounts
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Only update DOM and localStorage after hydration and when theme changes
    if (isHydrated) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, isHydrated]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isHydrated }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 