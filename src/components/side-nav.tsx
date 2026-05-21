"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MessageCircle,
  NotebookPen,
  BellRing,
  Wallet,
  Calendar,
  ShoppingCart,
  Images,
  Users,
  Settings,
  Shield,
  Bell,
  Heart,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

type Props = {
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    role: "ADMIN" | "MEMBER";
  };
  unreadCount: number;
};

const PRIMARY = [
  { href: "/chat", key: "chat", Icon: MessageCircle },
  { href: "/notes", key: "notes", Icon: NotebookPen },
  { href: "/reminders", key: "reminders", Icon: BellRing },
  { href: "/bills", key: "bills", Icon: Wallet },
  { href: "/notifications", key: "notifications", Icon: Bell, badge: true },
] as const;

const SECONDARY = [
  { href: "/calendar", key: "calendar", Icon: Calendar },
  { href: "/shopping", key: "shopping", Icon: ShoppingCart },
  { href: "/photos", key: "photos", Icon: Images },
  { href: "/directory", key: "directory", Icon: Users },
  { href: "/profile", key: "profile", Icon: Settings },
] as const;

export function SideNav({ user, unreadCount }: Props) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-stone-200/60 glass safe-top safe-bottom lg:flex dark:border-stone-800/60">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
          <Heart className="size-4 fill-white" strokeWidth={0} />
        </div>
        <h1 className="text-lg font-bold gradient-text">ครอบครัว</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <NavSection items={PRIMARY} isActive={isActive} t={t} unread={unreadCount} />
        <div className="my-3 border-t border-stone-200/60 dark:border-stone-800/60" />
        <NavSection items={SECONDARY} isActive={isActive} t={t} unread={0} />
        {user.role === "ADMIN" && (
          <>
            <div className="my-3 border-t border-stone-200/60 dark:border-stone-800/60" />
            <NavItem
              href="/admin"
              Icon={Shield}
              label={t("admin")}
              active={isActive("/admin")}
            />
          </>
        )}
      </nav>

      <div className="border-t border-stone-200/60 p-3 dark:border-stone-800/60">
        <Link
          href="/more"
          className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              {user.role === "ADMIN" && (
                <span className="rounded-full bg-gradient-to-r from-violet-500 to-violet-700 px-1.5 py-0 text-[9px] font-bold uppercase text-white">
                  Admin
                </span>
              )}
            </div>
            <p className="truncate text-xs text-stone-500">@{user.username}</p>
          </div>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-1 px-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <a
          href="/logout"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/70 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <LogOut className="size-4" /> ออกจากระบบ
        </a>
      </div>
    </aside>
  );
}

function NavSection({
  items,
  isActive,
  t,
  unread,
}: {
  items: ReadonlyArray<{ href: string; key: string; Icon: typeof Heart; badge?: boolean }>;
  isActive: (href: string) => boolean;
  t: (key: string) => string;
  unread: number;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.href}>
          <NavItem
            href={item.href}
            Icon={item.Icon}
            label={t(item.key)}
            active={isActive(item.href)}
            badge={item.badge ? unread : 0}
          />
        </li>
      ))}
    </ul>
  );
}

function NavItem({
  href,
  Icon,
  label,
  active,
  badge,
}: {
  href: string;
  Icon: typeof Heart;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-brand-500/10 to-brand-500/0 text-brand-700 dark:from-brand-500/15 dark:text-brand-300"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100",
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          active && "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-500/30",
        )}
      >
        <Icon className="size-4" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span className="flex min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
