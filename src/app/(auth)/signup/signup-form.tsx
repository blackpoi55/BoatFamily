"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Smile, AtSign, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUp } from "@/app/actions/auth";

export function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await signUp(formData);
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
      <Field icon={<Smile className="size-4" />} label={t("nickname")}>
        <Input
          name="name"
          required
          maxLength={60}
          autoComplete="nickname"
          placeholder={t("nicknamePlaceholder")}
          className="pl-10"
        />
      </Field>

      <Field icon={<AtSign className="size-4" />} label={t("username")}>
        <Input
          name="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]{3,20}"
          autoComplete="username"
          placeholder={t("usernamePlaceholder")}
          className="pl-10 lowercase"
        />
      </Field>

      <Field icon={<KeyRound className="size-4" />} label={t("password")}>
        <Input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="pl-10"
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "กำลังสมัคร..." : t("signup")}
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
