"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Pin, Pencil, Trash2 } from "lucide-react";
import { togglePinNote, deleteNote, deleteComment } from "@/app/actions/notes";
import { confirm as swalConfirm } from "@/lib/swal";
import { cn } from "@/lib/utils";

export function NoteActions({
  noteId,
  pinned,
  canEdit,
}: {
  noteId: string;
  pinned: boolean;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handlePin = () => {
    startTransition(async () => {
      const r = await togglePinNote(noteId);
      if (r.ok) toast.success(pinned ? "เลิกปักหมุด" : "ปักหมุดแล้ว");
      else toast.error(r.error ?? "ผิดพลาด");
    });
  };

  const handleDelete = async () => {
    const ok = await swalConfirm({
      title: "ลบบันทึก?",
      text: "คอมเมนต์ทั้งหมดในบันทึกจะหายไปด้วย",
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteNote(noteId);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <button
          type="button"
          onClick={handlePin}
          disabled={isPending}
          className={cn(
            "rounded-full p-2 transition-colors",
            pinned
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800",
          )}
          aria-label="pin"
        >
          <Pin className={cn("size-4", pinned && "fill-current")} />
        </button>
      )}
      {canEdit && (
        <Link
          href={`/notes/${noteId}/edit`}
          className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="edit"
        >
          <Pencil className="size-4" />
        </Link>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-full p-2 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950"
          aria-label="delete"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [isPending, startTransition] = useTransition();

  const onClick = async () => {
    const ok = await swalConfirm({
      title: "ลบความคิดเห็น?",
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteComment(commentId);
      if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="rounded-full p-1 text-stone-400 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
      aria-label="delete comment"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
