"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Trash2 } from "lucide-react";
import { deletePhoto } from "@/app/actions/photos";
import { confirm as swalConfirm } from "@/lib/swal";

type Photo = {
  id: string;
  url: string;
  uploaderId: string;
};

export function PhotoGrid({
  photos,
  currentUserId,
  isAdmin,
}: {
  photos: Photo[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState<Photo | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDelete = async (photoId: string) => {
    const ok = await swalConfirm({
      title: "ลบรูปนี้?",
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deletePhoto(photoId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("ลบแล้ว");
      setOpen(null);
    });
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(p)}
            className="aspect-square overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(null);
            }}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
            aria-label="close"
          >
            <X className="size-5" />
          </button>
          {(open.uploaderId === currentUserId || isAdmin) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(open.id);
              }}
              disabled={isPending}
              className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              <Trash2 className="size-4" /> ลบ
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open.url}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
