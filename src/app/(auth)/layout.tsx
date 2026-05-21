import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 size-80 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-80 rounded-full bg-accent-500/15 blur-3xl" />

      <header className="relative flex items-center justify-between p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-1.5 text-sm text-stone-600 backdrop-blur transition-colors hover:bg-white/90 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:bg-stone-900"
        >
          <ChevronLeft className="size-4" /> กลับ
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-8 fade-in">
        {children}
      </main>
    </div>
  );
}
