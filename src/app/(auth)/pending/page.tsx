import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Clock className="size-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t("pendingApproval")}</h1>
        <p className="text-sm text-stone-500">
          ผู้ดูแลครอบครัวจะอนุมัติเร็วๆ นี้ คุณจะเข้าใช้งานได้ทันทีที่ได้รับอนุมัติ
        </p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="secondary" className="w-full">
          ออกจากระบบ
        </Button>
      </form>
    </div>
  );
}
