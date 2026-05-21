import Link from "next/link";
import { Plus, Calendar as CalIcon, MapPin, Pencil } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventDelete } from "@/components/calendar/event-delete";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const DOT_COLOR: Record<string, string> = {
  yellow: "bg-amber-400",
  blue: "bg-sky-400",
  green: "bg-emerald-400",
  pink: "bg-pink-400",
  purple: "bg-violet-400",
  stone: "bg-stone-400",
};

export default async function CalendarPage() {
  const me = await requireUser();
  const t = await getTranslations("calendar");
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const now = new Date();
  const events = await db.calendarEvent.findMany({
    where: {
      OR: [
        { endAt: null, startAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) } },
        { endAt: { gte: now } },
      ],
    },
    orderBy: { startAt: "asc" },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    take: 100,
  });

  const groups = {
    today: [] as typeof events,
    tomorrow: [] as typeof events,
    thisWeek: [] as typeof events,
    thisMonth: [] as typeof events,
    later: [] as typeof events,
  };
  for (const e of events) {
    if (isToday(e.startAt)) groups.today.push(e);
    else if (isTomorrow(e.startAt)) groups.tomorrow.push(e);
    else if (isThisWeek(e.startAt, { weekStartsOn: 1 })) groups.thisWeek.push(e);
    else if (isThisMonth(e.startAt)) groups.thisMonth.push(e);
    else groups.later.push(e);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Link
          href="/calendar/new"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all active:scale-95 gradient-brand"
        >
          <Plus className="size-4" /> {t("newEvent")}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-stone-500">
          <CalIcon className="size-12 text-stone-300" />
          <p className="text-sm">ยังไม่มีกิจกรรมในปฏิทิน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {([
            ["today", "วันนี้"],
            ["tomorrow", "พรุ่งนี้"],
            ["thisWeek", "อาทิตย์นี้"],
            ["thisMonth", "เดือนนี้"],
            ["later", "อนาคต"],
          ] as const).map(
            ([key, label]) =>
              groups[key].length > 0 && (
                <section key={key}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {label} · {groups[key].length}
                  </h2>
                  <ul className="space-y-2">
                    {groups[key].map((e) => {
                      const canEdit = e.creatorId === me.id || me.role === "ADMIN";
                      return (
                        <li
                          key={e.id}
                          className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                        >
                          <div
                            className={cn(
                              "mt-1.5 size-3 shrink-0 rounded-full",
                              DOT_COLOR[e.color ?? "blue"],
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold">{e.title}</h3>
                              {e.allDay && (
                                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                  ทั้งวัน
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-stone-500">
                              {format(e.startAt, e.allDay ? "EEE d MMM yyyy" : "EEE d MMM HH:mm", {
                                locale: dateLocale,
                              })}
                              {e.endAt && (
                                <>
                                  {" – "}
                                  {format(e.endAt, e.allDay ? "d MMM" : "HH:mm", {
                                    locale: dateLocale,
                                  })}
                                </>
                              )}
                            </div>
                            {e.location && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                                <MapPin className="size-3" /> {e.location}
                              </div>
                            )}
                            {e.participants.length > 0 && (
                              <div className="mt-1 flex items-center gap-0.5">
                                {e.participants.slice(0, 5).map((p) => (
                                  <span
                                    key={p.userId}
                                    title={p.user.name}
                                    className="ml-0.5"
                                  >
                                    <Avatar
                                      name={p.user.name}
                                      src={p.user.avatarUrl}
                                      size="xs"
                                    />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {canEdit && (
                            <div className="flex shrink-0 items-center gap-1">
                              <Link
                                href={`/calendar/${e.id}/edit`}
                                className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                                aria-label="edit"
                              >
                                <Pencil className="size-4" />
                              </Link>
                              <EventDelete eventId={e.id} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ),
          )}
        </div>
      )}
    </div>
  );
}
