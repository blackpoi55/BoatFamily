import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold gradient-text">{t("signup")}</h1>
        <p className="mt-1 text-sm text-stone-500">
          สมาชิกใหม่ต้องรอผู้ดูแลอนุมัติก่อนเข้าใช้งาน
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-stone-500">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
