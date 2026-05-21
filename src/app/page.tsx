import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Heart, MessageCircle, NotebookPen, BellRing, Wallet, Calendar, Images } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LandingPage() {
  const t = await getTranslations();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 size-80 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-80 rounded-full bg-accent-500/15 blur-3xl" />

      <header className="relative flex items-center justify-end gap-2 p-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </header>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-10 px-6 text-center fade-in">
        <div className="space-y-4">
          <div className="relative mx-auto">
            <div className="absolute inset-0 size-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-400 to-accent-500 blur-2xl opacity-60" />
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/30">
              <Heart className="size-9 fill-white" strokeWidth={0} />
            </div>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight gradient-text">
            {t("app.name")}
          </h1>
          <p className="text-balance text-base text-stone-500 dark:text-stone-400">
            {t("app.tagline")}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-2xl px-6 py-3.5 text-center font-semibold text-white shadow-lg shadow-brand-500/30 transition-all active:scale-[0.98] gradient-brand"
          >
            <span className="relative z-10">{t("auth.login")}</span>
            <span className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/10" />
          </Link>
          <Link
            href="/signup"
            className="rounded-2xl border border-stone-200 bg-white/70 px-6 py-3.5 text-center font-semibold text-stone-900 backdrop-blur transition-all hover:bg-white active:scale-[0.98] dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-100 dark:hover:bg-stone-900"
          >
            {t("auth.signup")}
          </Link>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 pt-2">
          <FeatureChip Icon={MessageCircle} label="แชท" />
          <FeatureChip Icon={NotebookPen} label="บันทึก" />
          <FeatureChip Icon={BellRing} label="แจ้งเตือน" />
          <FeatureChip Icon={Wallet} label="ค่าใช้จ่าย" />
          <FeatureChip Icon={Calendar} label="ปฏิทิน" />
          <FeatureChip Icon={Images} label="อัลบั้ม" />
        </div>
      </main>
    </div>
  );
}

function FeatureChip({
  Icon,
  label,
}: {
  Icon: typeof Heart;
  label: string;
}) {
  return (
    <div className="surface flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs">
      <Icon className="size-5 text-brand-600 dark:text-brand-400" />
      <span className="font-medium text-stone-700 dark:text-stone-200">{label}</span>
    </div>
  );
}
