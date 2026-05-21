"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { AtSign, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInWithPassword } from "@/app/actions/auth";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await signInWithPassword(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.message) toast.success(result.message);
      if (result.redirect) {
        router.push(result.redirect);
        router.refresh();
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-4">
      {errorParam && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {errorParam === "account_disabled"
            ? "บัญชีของคุณถูกระงับ ติดต่อผู้ดูแล"
            : decodeURIComponent(errorParam)}
        </div>
      )}

      <Field icon={<AtSign className="size-4" />} label={t("username")}>
        <Input
          name="username"
          required
          autoComplete="username"
          placeholder="username"
          className="pl-10"
        />
      </Field>

      <Field icon={<KeyRound className="size-4" />} label={t("password")}>
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="pl-10"
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "กำลังเข้าสู่ระบบ..." : t("login")}
      </Button>
    </form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
