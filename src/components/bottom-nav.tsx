"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MessageCircle,
  NotebookPen,
  BellRing,
  Wallet,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/chat", key: "chat", Icon: MessageCircle },
  { href: "/notes", key: "notes", Icon: NotebookPen },
  { href: "/reminders", key: "reminders", Icon: BellRing },
  { href: "/bills", key: "bills", Icon: Wallet },
  { href: "/more", key: "more", Icon: LayoutGrid },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="sticky bottom-0 z-40 border-t border-stone-200/60 glass safe-bottom dark:border-stone-800/60">
      <ul className="mx-auto grid max-w-2xl grid-cols-5 px-1">
        {items.map(({ href, key, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all",
                  active
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
                )}
              >
                {active && (
                  <span className="absolute top-0 h-1 w-10 -translate-y-px rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
                )}
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl transition-all",
                    active && "bg-brand-50 dark:bg-brand-900/30",
                  )}
                >
                  <Icon
                    className={cn(
                      "transition-all",
                      active ? "size-[22px]" : "size-5",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
