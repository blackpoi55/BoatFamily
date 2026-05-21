import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, formatTHB } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const ICON_EMOJI: Record<string, string> = {
  tv: "📺",
  internet: "🌐",
  power: "💡",
  water: "💧",
  phone: "📱",
  music: "🎵",
  gym: "🏋️",
  home: "🏠",
  car: "🚗",
  other: "💸",
};

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PARTIAL: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "จ่ายครบ",
  PARTIAL: "บางคนจ่าย",
  PENDING: "รอจ่าย",
  OVERDUE: "เลยกำหนด",
};

export default async function BillsPage() {
  const me = await requireUser();
  const t = await getTranslations("bills");
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const bills = await db.bill.findMany({
    where: {
      OR: [
        { creatorId: me.id },
        { participants: { some: { userId: me.id } } },
      ],
    },
    orderBy: [{ nextDueDate: "asc" }, { dueDate: "asc" }],
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Link
          href="/bills/new"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all active:scale-95 gradient-brand"
        >
          <Plus className="size-4" /> {t("newBill")}
        </Link>
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-stone-500">
          <Wallet className="size-12 text-stone-300" />
          <p className="text-sm">ยังไม่มีบิล — สร้างบิลแรกเลย</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bills.map((b) => {
            const dueDate = b.nextDueDate ?? b.dueDate;
            const status = b.status;
            return (
              <li key={b.id}>
                <Link
                  href={`/bills/${b.id}`}
                  className="surface lift block rounded-3xl p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 text-2xl shadow-inner dark:from-stone-800 dark:to-stone-900">
                      {ICON_EMOJI[b.iconKey ?? "other"] ?? "💸"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{b.name}</h3>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                            STATUS_BADGE[status],
                          )}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-stone-900 dark:text-stone-50">
                        {formatTHB(b.amount.toString())}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                        <span>
                          ครบ {format(dueDate, "d MMM", { locale: dateLocale })}
                        </span>
                        <span className="flex items-center gap-0.5">
                          {b.participants.slice(0, 4).map((p) => (
                            <span
                              key={p.userId}
                              title={p.user.name}
                              className={cn(
                                "ml-0.5 inline-flex",
                                p.paid && "ring-2 ring-emerald-400 rounded-full",
                              )}
                            >
                              <Avatar
                                name={p.user.name}
                                src={p.user.avatarUrl}
                                size="xs"
                              />
                            </span>
                          ))}
                          {b.participants.length > 4 && (
                            <span className="ml-1 text-stone-400">
                              +{b.participants.length - 4}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
