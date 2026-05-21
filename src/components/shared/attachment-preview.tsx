"use client";

import { X } from "lucide-react";
import type { Attachment } from "@/lib/use-image-attachments";

type Props = {
  attachments: Attachment[];
  onRemove: (idx: number) => void;
  size?: "sm" | "md";
};

export function AttachmentPreview({ attachments, onRemove, size = "md" }: Props) {
  if (attachments.length === 0) return null;
  const sizeClass = size === "sm" ? "size-14" : "size-16";

  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {attachments.map((a, i) => (
        <div key={i} className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.previewUrl}
            alt={a.file.name}
            className={`${sizeClass} rounded-lg object-cover`}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-stone-900 text-white shadow"
            aria-label="remove"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
