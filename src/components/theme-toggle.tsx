"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, icon: Sun },
    { value: "system" as const, icon: Monitor },
    { value: "dark" as const, icon: Moon },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-stone-200/60 bg-white/70 p-0.5 backdrop-blur dark:border-stone-700/60 dark:bg-stone-900/70">
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={value}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-all",
            theme === value
              ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

export function ThemeToggleCompact() {
  const { resolved, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className="rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
      aria-label="toggle theme"
    >
      {resolved === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </button>
  );
}
