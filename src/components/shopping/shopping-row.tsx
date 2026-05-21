"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { toggleShoppingItem, deleteShoppingItem } from "@/app/actions/shopping";
import { confirm as swalConfirm } from "@/lib/swal";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  quantity: string | null;
  note: string | null;
  checked: boolean;
  createdBy: { name: string };
  checkedBy: { name: string } | null;
};

export function ShoppingRow({
  item,
  canDelete,
}: {
  item: Item;
  canDelete: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      await toggleShoppingItem(item.id);
    });
  };

  const onDelete = async () => {
    const ok = await swalConfirm({
      title: "ลบรายการ?",
      text: `จะลบ "${item.name}" ออกจากรายการ`,
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteShoppingItem(item.id);
      if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        item.checked
          ? "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50"
          : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          item.checked
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-stone-300 hover:border-brand-500 dark:border-stone-600",
        )}
        aria-label="toggle"
      >
        {item.checked && <Check className="size-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-2",
            item.checked && "text-stone-400 line-through",
          )}
        >
          <span className="font-medium">{item.name}</span>
          {item.quantity && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              {item.quantity}
            </span>
          )}
        </div>
        {item.note && (
          <p className="text-xs text-stone-500">{item.note}</p>
        )}
        <p className="text-[10px] text-stone-400">
          {item.checked && item.checkedBy
            ? `${item.checkedBy.name} ซื้อแล้ว`
            : `${item.createdBy.name} เพิ่ม`}
        </p>
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="rounded-full p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950"
          aria-label="delete"
        >
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}
