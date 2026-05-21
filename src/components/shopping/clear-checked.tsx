"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { clearCheckedItems } from "@/app/actions/shopping";
import { confirm as swalConfirm } from "@/lib/swal";

export function ClearChecked({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition();
  const onClick = async () => {
    const ok = await swalConfirm({
      title: "ล้างรายการที่ซื้อแล้ว?",
      text: `จะลบ ${count} รายการที่ติ๊กไว้`,
      confirmText: "ล้าง",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await clearCheckedItems();
      toast.success("ล้างแล้ว");
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200 disabled:opacity-60 dark:bg-stone-800 dark:text-stone-200"
    >
      <Trash2 className="size-3" /> ล้างที่ซื้อแล้ว ({count})
    </button>
  );
}
