import Link from "next/link";
import { Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative mx-auto mb-3">
          <div className="absolute inset-0 size-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 blur-2xl opacity-60" />
          <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
            <Heart className="size-7 fill-white" strokeWidth={0} />
          </div>
        </div>
        <h1 className="text-2xl font-bold gradient-text">{t("login")}</h1>
        <p className="mt-1 text-sm text-stone-500">{t("welcome")}</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-stone-500">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
          {t("signup")}
        </Link>
      </p>
    </div>
  );
}
