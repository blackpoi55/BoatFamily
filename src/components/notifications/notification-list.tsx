"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { BellRing, Wallet, NotebookPen, MessageCircle, Calendar, Check, Trash2, CheckCheck } from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from "@/app/actions/notifications";
import { confirm as swalConfirm } from "@/lib/swal";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  category: string;
  read: boolean;
  createdAt: Date;
};

const CATEGORY_ICON: Record<string, typeof BellRing> = {
  reminder: BellRing,
  bill: Wallet,
  note: NotebookPen,
  chat: MessageCircle,
  calendar: Calendar,
};

const CATEGORY_COLOR: Record<string, string> = {
  reminder: "from-amber-400 to-amber-600",
  bill: "from-rose-400 to-rose-600",
  note: "from-emerald-400 to-emerald-600",
  chat: "from-sky-400 to-sky-600",
  calendar: "from-violet-400 to-violet-600",
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const locale = useLocale();
  const dateLocale = locale === "th" ? th : enUS;
  const [isPending, startTransition] = useTransition();

  const hasUnread = notifications.some((n) => !n.read);

  const onMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      toast.success("อ่านทั้งหมดแล้ว");
    });
  };

  const onClear = async () => {
    const ok = await swalConfirm({
      title: "ล้างทั้งหมด?",
      text: "การแจ้งเตือนทั้งหมดจะถูกลบ",
      confirmText: "ล้าง",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await clearAllNotifications();
      toast.success("ล้างแล้ว");
    });
  };

  const onItemClick = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
    }
    if (n.url) {
      router.push(n.url);
    }
  };

  return (
    <>
      {notifications.length > 0 && (
        <div className="flex gap-2">
          {hasUnread && (
            <button
              type="button"
              onClick={onMarkAll}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200 disabled:opacity-60 dark:bg-stone-800 dark:text-stone-200"
            >
              <CheckCheck className="size-3.5" /> อ่านทั้งหมด
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <Trash2 className="size-3.5" /> ล้างทั้งหมด
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {notifications.map((n) => {
          const Icon = CATEGORY_ICON[n.category] ?? BellRing;
          const colorClass = CATEGORY_COLOR[n.category] ?? "from-stone-400 to-stone-600";
          const Wrapper = n.url ? "button" : "div";
          return (
            <li key={n.id}>
              <Wrapper
                {...(n.url
                  ? { type: "button" as const, onClick: () => onItemClick(n) }
                  : {})}
                className={cn(
                  "surface flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all",
                  !n.read && "ring-2 ring-brand-500/30",
                  n.url && "lift cursor-pointer",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    colorClass,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="line-clamp-1 flex-1 text-sm font-semibold">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="size-2 shrink-0 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-stone-600 dark:text-stone-300">
                    {n.body.split("\n[")[0]}
                  </p>
                  <p className="mt-0.5 text-[10px] text-stone-400">
                    {formatDistanceToNow(n.createdAt, {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </div>
                {!n.read && (
                  <Check className="size-4 shrink-0 text-stone-400" />
                )}
              </Wrapper>
            </li>
          );
        })}
      </ul>
    </>
  );
}
