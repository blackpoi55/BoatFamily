"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { deleteReminder, toggleReminderEnabled } from "@/app/actions/reminders";
import { confirm as swalConfirm } from "@/lib/swal";

export function ReminderActions({
  reminderId,
  enabled,
  canEdit,
}: {
  reminderId: string;
  enabled: boolean;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const r = await toggleReminderEnabled(reminderId);
      if (r.ok) toast.success(enabled ? "ปิดแล้ว" : "เปิดแล้ว");
      else toast.error(r.error ?? "ผิดพลาด");
    });
  };

  const handleDelete = async () => {
    const ok = await swalConfirm({
      title: "ลบการแจ้งเตือน?",
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteReminder(reminderId);
    });
  };

  if (!canEdit) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800"
        aria-label="toggle"
      >
        {enabled ? (
          <ToggleRight className="size-5 text-emerald-600" />
        ) : (
          <ToggleLeft className="size-5" />
        )}
      </button>
      <Link
        href={`/reminders/${reminderId}/edit`}
        className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800"
        aria-label="edit"
      >
        <Pencil className="size-4" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
        aria-label="delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
