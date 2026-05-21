import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";

type Props = {
  title?: string;
  right?: React.ReactNode;
};

export function AppHeader({ title, right }: Props) {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 glass safe-top dark:border-stone-800/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow shadow-brand-500/30">
            <Heart className="size-4 fill-white" strokeWidth={0} />
          </div>
          <h1 className="truncate text-base font-bold">
            {title ?? t("name")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
