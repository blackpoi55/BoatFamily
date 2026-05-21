"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-stone-200/60 bg-white/70 p-0.5 backdrop-blur dark:border-stone-700/60 dark:bg-stone-900/70">
      <Languages className="ml-1.5 size-3.5 text-stone-500" />
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setLocale(loc))}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
            current === loc
              ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
          )}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
