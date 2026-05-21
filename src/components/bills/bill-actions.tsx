"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteBill } from "@/app/actions/bills";
import { confirm as swalConfirm } from "@/lib/swal";

export function BillActions({
  billId,
  canEdit,
}: {
  billId: string;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const ok = await swalConfirm({
      title: "ลบบิลนี้?",
      text: "สลิปทั้งหมดจะถูกลบด้วย ไม่สามารถกู้คืนได้",
      confirmText: "ลบบิล",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteBill(billId);
    });
  };

  if (!canEdit) return null;

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/bills/${billId}/edit`}
        className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800"
        aria-label="edit"
      >
        <Pencil className="size-4" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950"
        aria-label="delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
