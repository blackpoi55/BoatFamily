"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { clearAllChat } from "@/app/actions/chat";
import { confirm as swalConfirm } from "@/lib/swal";

export function DangerZone({ messageCount }: { messageCount: number }) {
  const [isPending, startTransition] = useTransition();

  const onClear = async () => {
    const first = await swalConfirm({
      title: "ล้างแชททั้งหมด?",
      text: `จะลบ ${messageCount} ข้อความและรูปทั้งหมดใน storage — ไม่สามารถกู้คืนได้`,
      confirmText: "ดำเนินการต่อ",
      danger: true,
    });
    if (!first) return;
    const second = await swalConfirm({
      title: "ยืนยันอีกครั้ง",
      text: "การกระทำนี้ถาวร แน่ใจหรือไม่?",
      confirmText: "ล้างแชท",
      danger: true,
    });
    if (!second) return;

    startTransition(async () => {
      const result = await clearAllChat();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `ล้างเรียบร้อย: ${result.messagesDeleted} ข้อความ, ${result.filesDeleted} ไฟล์`,
      );
    });
  };

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 backdrop-blur dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
        <AlertTriangle className="size-4" /> Danger zone
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
            ล้างแชททั้งหมด
          </p>
          <p className="text-xs text-stone-500">
            ลบข้อความและรูปทั้งหมดใน storage — ปลดล็อกพื้นที่ ({messageCount} ข้อความ)
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          {isPending ? "กำลังล้าง..." : "ล้างแชท"}
        </button>
      </div>
    </section>
  );
}
