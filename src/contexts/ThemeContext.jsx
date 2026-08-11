import React, { createContext, useContext, useEffect } from 'react';

const ThemeProviderContext = createContext({
  theme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    try {
      localStorage.removeItem('vite-ui-theme');
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeProviderContext);