"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageGrid({
  urls,
  className,
}: {
  urls: string[];
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (urls.length === 0) return null;

  const cols =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <>
      <div className={cn("grid gap-1 overflow-hidden rounded-xl", cols, className)}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(url)}
            className="relative block aspect-square overflow-hidden bg-stone-200 dark:bg-stone-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
