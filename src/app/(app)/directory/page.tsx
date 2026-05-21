import Link from "next/link";
import { Phone, Cake, Droplet, AlertCircle, UserCircle2 } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getInitials } from "@/lib/utils";

export default async function DirectoryPage() {
  await requireUser();
  const t = await getTranslations("directory");
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const members = await db.user.findMany({
    where: { status: "APPROVED" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      phoneNumber: true,
      birthDate: true,
      bloodType: true,
      allergies: true,
      emergencyContact: true,
    },
  });

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Link
          href="/profile"
          className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200"
        >
          แก้ไขของฉัน
        </Link>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        💡 ข้อมูลในหน้านี้ทุกคนในครอบครัวเห็นได้ — เผื่อเหตุฉุกเฉิน เก็บข้อมูลครบจะช่วยชีวิตได้
      </div>

      <ul className="space-y-3">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="flex items-start gap-3">
              {m.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700 dark:bg-brand-700/20 dark:text-brand-300">
                  {getInitials(m.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{m.name}</h2>
                <p className="text-xs text-stone-500">@{m.username}</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {m.phoneNumber && (
                    <Row icon={<Phone className="size-4" />} label={t("phone")}>
                      <a
                        href={`tel:${m.phoneNumber}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {m.phoneNumber}
                      </a>
                    </Row>
                  )}
                  {m.birthDate && (
                    <Row icon={<Cake className="size-4" />} label={t("birthDate")}>
                      {format(m.birthDate, "d MMMM yyyy", { locale: dateLocale })}
                    </Row>
                  )}
                  {m.bloodType && (
                    <Row icon={<Droplet className="size-4 text-rose-600" />} label={t("bloodType")}>
                      <span className="font-semibold text-rose-700">{m.bloodType}</span>
                    </Row>
                  )}
                  {m.allergies && (
                    <Row
                      icon={<AlertCircle className="size-4 text-amber-600" />}
                      label={t("allergies")}
                    >
                      {m.allergies}
                    </Row>
                  )}
                  {m.emergencyContact && (
                    <Row
                      icon={<UserCircle2 className="size-4" />}
                      label={t("emergencyContact")}
                    >
                      {m.emergencyContact}
                    </Row>
                  )}
                </dl>
                {!m.phoneNumber &&
                  !m.birthDate &&
                  !m.bloodType &&
                  !m.allergies &&
                  !m.emergencyContact && (
                    <p className="mt-2 text-xs text-stone-400">
                      ยังไม่ได้กรอกข้อมูล
                    </p>
                  )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-stone-400">{icon}</span>
      <div>
        <dt className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
          {label}
        </dt>
        <dd className="text-stone-700 dark:text-stone-300">{children}</dd>
      </div>
    </div>
  );
}
