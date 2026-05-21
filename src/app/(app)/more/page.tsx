import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Calendar,
  ShoppingCart,
  Images,
  Users,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const baseItems = [
  { href: "/calendar", key: "calendar", Icon: Calendar, color: "from-sky-400 to-sky-600" },
  { href: "/shopping", key: "shopping", Icon: ShoppingCart, color: "from-emerald-400 to-emerald-600" },
  { href: "/photos", key: "photos", Icon: Images, color: "from-pink-400 to-rose-600" },
  { href: "/directory", key: "directory", Icon: Users, color: "from-amber-400 to-orange-600" },
  { href: "/profile", key: "profile", Icon: Settings, color: "from-stone-400 to-stone-600" },
] as const;

export default async function MorePage() {
  const user = await requireUser();
  const t = await getTranslations("nav");

  const items =
    user.role === "ADMIN"
      ? [...baseItems, { href: "/admin", key: "admin" as const, Icon: Shield, color: "from-violet-400 to-violet-600" }]
      : baseItems;

  return (
    <div className="space-y-5 p-4 fade-in">
      <div className="surface flex items-center gap-3 rounded-3xl p-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="size-14 rounded-full object-cover ring-2 ring-brand-500/20"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white shadow-md shadow-brand-500/30">
            {getInitials(user.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{user.name}</p>
            {user.role === "ADMIN" && (
              <span className="rounded-full bg-gradient-to-r from-violet-500 to-violet-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Admin
              </span>
            )}
          </div>
          <p className="truncate text-xs text-stone-500">@{user.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(({ href, key, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="surface lift group flex flex-col items-start gap-3 rounded-3xl p-4"
          >
            <div
              className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition-transform group-hover:scale-110`}
            >
              <Icon className="size-5" />
            </div>
            <span className="text-sm font-semibold">{t(key)}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/60 bg-white/60 p-3 backdrop-blur dark:border-stone-800/60 dark:bg-stone-900/60">
        <span className="text-sm font-medium">ธีม</span>
        <ThemeToggle />
      </div>

      <a
        href="/logout"
        className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 text-rose-700 backdrop-blur transition-all hover:bg-rose-100 active:scale-[0.98] dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
      >
        <LogOut className="size-5" />
        <span className="font-semibold">{t("logout")}</span>
      </a>
    </div>
  );
}
