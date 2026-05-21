"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { setThemeCookie } from "@/app/actions/theme";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const next = resolve(theme);
  document.documentElement.classList.toggle("dark", next === "dark");
}

export function ThemeProvider({
  initialTheme = "system",
  children,
}: {
  initialTheme?: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(
    initialTheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    setResolved(resolve(theme));
    applyTheme(theme);

    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setResolved(resolve("system"));
      applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    setResolved(resolve(next));
    applyTheme(next);
    void setThemeCookie(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
