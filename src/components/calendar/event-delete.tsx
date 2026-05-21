"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/app/actions/calendar";
import { confirm as swalConfirm } from "@/lib/swal";

export function EventDelete({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const onDelete = async () => {
    const ok = await swalConfirm({
      title: "ลบกิจกรรม?",
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteEvent(eventId);
    });
  };
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      className="rounded-full p-1.5 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950"
      aria-label="delete"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
