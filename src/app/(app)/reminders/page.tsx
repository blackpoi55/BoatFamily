import Link from "next/link";
import { Plus, BellRing, Clock } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReminderActions } from "@/components/reminders/reminder-actions";
import { NotificationToggle } from "@/components/notification-toggle";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const freqLabel: Record<string, string> = {
  ONCE: "ครั้งเดียว",
  DAILY: "ทุกวัน",
  WEEKLY: "ทุกอาทิตย์",
  MONTHLY: "ทุกเดือน",
  YEARLY: "ทุกปี",
  CUSTOM: "กำหนดเอง",
};

export default async function RemindersPage() {
  const me = await requireUser();
  const t = await getTranslations("reminders");
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const reminders = await db.reminder.findMany({
    where: {
      OR: [
        { creatorId: me.id },
        { recipients: { some: { userId: me.id } } },
      ],
    },
    orderBy: [{ enabled: "desc" }, { nextFireAt: "asc" }],
    include: {
      creator: { select: { id: true, name: true } },
      recipients: {
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
          href="/reminders/new"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all active:scale-95 gradient-brand"
        >
          <Plus className="size-4" /> {t("newReminder")}
        </Link>
      </div>

      <NotificationToggle vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-stone-500">
          <BellRing className="size-12 text-stone-300" />
          <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => {
            const canEdit = r.creatorId === me.id || me.role === "ADMIN";
            return (
              <li
                key={r.id}
                className={cn(
                  "rounded-2xl border bg-white p-3 transition-all dark:bg-stone-900",
                  r.enabled
                    ? "border-stone-200 dark:border-stone-800"
                    : "border-stone-100 opacity-60 dark:border-stone-800",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      r.enabled
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                        : "bg-stone-100 text-stone-400 dark:bg-stone-800",
                    )}
                  >
                    <BellRing className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{r.title}</h3>
                      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                        {freqLabel[r.frequency]}
                      </span>
                    </div>
                    {r.description && (
                      <p className="line-clamp-2 text-sm text-stone-500">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {r.nextFireAt
                          ? format(r.nextFireAt, "d MMM HH:mm", { locale: dateLocale })
                          : "ครบกำหนด"}
                      </span>
                      <span className="flex items-center gap-1">
                        ถึง:
                        {r.recipients.slice(0, 3).map((rec) => (
                          <span key={rec.userId} className="ml-1" title={rec.user.name}>
                            <Avatar
                              name={rec.user.name}
                              src={rec.user.avatarUrl}
                              size="xs"
                            />
                          </span>
                        ))}
                        {r.recipients.length > 3 && (
                          <span className="ml-1 text-stone-400">
                            +{r.recipients.length - 3}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <ReminderActions
                    reminderId={r.id}
                    enabled={r.enabled}
                    canEdit={canEdit}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
