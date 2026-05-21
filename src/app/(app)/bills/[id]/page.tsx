import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Wallet, Repeat, BellRing, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { signedUrls } from "@/lib/signed-url";
import { BillActions } from "@/components/bills/bill-actions";
import { SlipUpload } from "@/components/bills/slip-upload";
import { PaidToggle } from "@/components/bills/paid-toggle";
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

const FREQ_LABEL: Record<string, string> = {
  ONCE: "ครั้งเดียว",
  DAILY: "ทุกวัน",
  WEEKLY: "ทุกอาทิตย์",
  MONTHLY: "ทุกเดือน",
  YEARLY: "ทุกปี",
};

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-sky-100 text-sky-700",
  PENDING: "bg-amber-100 text-amber-800",
  OVERDUE: "bg-rose-100 text-rose-700",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "จ่ายครบ",
  PARTIAL: "บางคนจ่าย",
  PENDING: "รอจ่าย",
  OVERDUE: "เลยกำหนด",
};

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const bill = await db.bill.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      slips: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!bill) notFound();

  const canView =
    bill.creatorId === me.id ||
    bill.participants.some((p) => p.userId === me.id) ||
    me.role === "ADMIN";
  if (!canView) notFound();

  const canEdit = bill.creatorId === me.id || me.role === "ADMIN";
  const dueDate = bill.nextDueDate ?? bill.dueDate;

  const slipUrls = await signedUrls(
    "payment-slips",
    bill.slips.map((s) => s.imageUrl),
    60 * 60,
  );

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Link
            href="/bills"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <ChevronLeft className="size-4" /> กลับ
          </Link>
          <BillActions billId={bill.id} canEdit={canEdit} />
        </div>

        <header className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-start gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-3xl dark:bg-stone-800">
              {ICON_EMOJI[bill.iconKey ?? "other"] ?? "💸"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{bill.name}</h1>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_BADGE[bill.status],
                  )}
                >
                  {STATUS_LABEL[bill.status]}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">
                {formatTHB(bill.amount.toString())}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Wallet className="size-3" /> ครบ:{" "}
                  {format(dueDate, "d MMM yyyy HH:mm", { locale: dateLocale })}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat className="size-3" /> {FREQ_LABEL[bill.frequency]}
                </span>
                <span className="flex items-center gap-1">
                  <BellRing className="size-3" /> แจ้ง {bill.notifyDaysBefore} วันก่อน
                </span>
              </div>
            </div>
          </div>
          {bill.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-stone-600 dark:text-stone-300">
              {bill.description}
            </p>
          )}
        </header>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
            ผู้ร่วมจ่าย ({bill.participants.length})
          </h2>
          <ul className="space-y-2">
            {bill.participants.map((p) => {
              const canToggle =
                p.userId === me.id || bill.creatorId === me.id || me.role === "ADMIN";
              return (
                <li
                  key={p.userId}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                >
                  <Avatar name={p.user.name} src={p.user.avatarUrl} size="md" />
                  <div className="flex-1">
                    <div className="font-medium">{p.user.name}</div>
                    {p.paidAt && (
                      <div className="text-xs text-stone-500">
                        จ่ายเมื่อ {format(p.paidAt, "d MMM HH:mm", { locale: dateLocale })}
                      </div>
                    )}
                  </div>
                  <PaidToggle
                    billId={bill.id}
                    userId={p.userId}
                    paid={p.paid}
                    canToggle={canToggle}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
            อัพสลิป
          </h2>
          <SlipUpload billId={bill.id} />
        </section>

        {bill.slips.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
              สลิปทั้งหมด ({bill.slips.length})
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {bill.slips.map((s) => (
                <SlipCard
                  key={s.id}
                  slip={{ ...s, signedUrl: slipUrls[s.imageUrl] ?? null }}
                  dateLocale={dateLocale}
                  canDelete={s.userId === me.id || me.role === "ADMIN"}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SlipCard({
  slip,
  dateLocale,
}: {
  slip: {
    id: string;
    signedUrl: string | null;
    note: string | null;
    amount: { toString: () => string } | null;
    paidAt: Date;
    user: { name: string };
  };
  dateLocale: typeof th;
  canDelete: boolean;
}) {
  return (
    <a
      href={slip.signedUrl ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
    >
      {slip.signedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slip.signedUrl}
          alt=""
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center bg-stone-100 text-stone-400 dark:bg-stone-800">
          <Trash2 className="size-6" />
        </div>
      )}
      <div className="p-2 text-xs">
        <div className="font-medium text-stone-700 dark:text-stone-200">
          {slip.user.name}
        </div>
        <div className="text-stone-400">
          {format(slip.paidAt, "d MMM HH:mm", { locale: dateLocale })}
        </div>
        {slip.amount && (
          <div className="mt-0.5 font-semibold text-emerald-700">
            {formatTHB(slip.amount.toString())}
          </div>
        )}
        {slip.note && (
          <div className="mt-0.5 line-clamp-2 text-stone-500">{slip.note}</div>
        )}
      </div>
    </a>
  );
}
