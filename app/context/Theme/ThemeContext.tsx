"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Init depuis localStorage (ou fallback)
  useEffect(() => {
    setMounted(true);

    let initial: Theme = "light";
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") initial = stored;
      else {
        // fallback sur la classe existante (si ThemeScript l'a déjà posée)
        initial = document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
      }
    } catch {
      initial = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    }

    setTheme(initial);
    applyThemeClass(initial);
  }, []);

  // Appliquer à chaque changement
  useEffect(() => {
    if (!mounted) return;

    applyThemeClass(theme);

    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
