"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAlbum } from "@/app/actions/photos";
import { confirm as swalConfirm } from "@/lib/swal";

export function DeleteAlbumButton({ albumId }: { albumId: string }) {
  const [isPending, startTransition] = useTransition();
  const onClick = async () => {
    const ok = await swalConfirm({
      title: "ลบอัลบั้มทั้งหมด?",
      text: "รูปทุกใบในอัลบั้มจะหายไปด้วย",
      confirmText: "ลบอัลบั้ม",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteAlbum(albumId);
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="rounded-full p-1.5 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950"
      aria-label="delete album"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
