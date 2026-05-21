"use client";

import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Reply, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { ChatMessage } from "@/app/actions/chat";

type Props = {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  onReply?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  onOpenImage?: (url: string) => void;
};

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showName,
  onReply,
  onDelete,
  onOpenImage,
}: Props) {
  const locale = useLocale();
  const dateLocale = locale === "th" ? th : enUS;
  const time = format(new Date(message.createdAt), "HH:mm", { locale: dateLocale });
  const hasImages = message.attachments.length > 0;

  return (
    <div
      className={cn(
        "group flex w-full items-end gap-2",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {!isOwn && (
        <div className="size-8 shrink-0">
          {showAvatar && (
            <Avatar
              name={message.senderName}
              src={message.senderAvatarUrl}
              size="md"
              className="!size-8"
            />
          )}
        </div>
      )}

      <div className={cn("flex max-w-[78%] flex-col gap-0.5", isOwn && "items-end")}>
        {!isOwn && showName && (
          <span className="px-1 text-xs font-medium text-stone-500">
            {message.senderName}
          </span>
        )}

        <div className="relative">
          {message.replyToId && (message.replyToContent || true) && (
            <div
              className={cn(
                "mb-1 rounded-lg border-l-2 px-2 py-1 text-xs",
                isOwn
                  ? "border-brand-300 bg-brand-700/30 text-brand-50"
                  : "border-stone-400 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
              )}
            >
              <div className="font-semibold">{message.replyToSenderName}</div>
              <div className="line-clamp-2 opacity-80">
                {message.replyToContent || "📷 รูปภาพ"}
              </div>
            </div>
          )}

          <div
            className={cn(
              "overflow-hidden rounded-2xl shadow-sm",
              isOwn
                ? "rounded-br-md bg-brand-600 text-white"
                : "rounded-bl-md bg-white text-stone-900 dark:bg-stone-800 dark:text-stone-100",
            )}
          >
            {hasImages && (
              <ImageGrid
                urls={message.attachments}
                onOpen={onOpenImage}
                hasText={message.content.length > 0}
              />
            )}
            {message.content && (
              <div className="whitespace-pre-wrap break-words px-3.5 py-2 text-sm">
                {message.content}
              </div>
            )}
          </div>

          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100",
              isOwn ? "right-full mr-2" : "left-full ml-2",
            )}
          >
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="rounded-full bg-white p-1.5 text-stone-500 shadow hover:text-stone-900 dark:bg-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
                aria-label="reply"
              >
                <Reply className="size-3.5" />
              </button>
            )}
            {isOwn && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message)}
                className="rounded-full bg-white p-1.5 text-rose-500 shadow hover:text-rose-700 dark:bg-stone-800"
                aria-label="delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <span
          className={cn(
            "px-1 text-[10px] text-stone-400",
            isOwn ? "text-right" : "text-left",
          )}
        >
          {time}
        </span>
      </div>
    </div>
  );
}

function ImageGrid({
  urls,
  onOpen,
  hasText,
}: {
  urls: string[];
  onOpen?: (url: string) => void;
  hasText: boolean;
}) {
  const count = urls.length;
  const cols =
    count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className={cn("grid gap-0.5", cols, hasText && "rounded-b-none")}>
      {urls.map((url, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onOpen?.(url)}
          className="relative block aspect-square overflow-hidden bg-stone-200 dark:bg-stone-900"
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
  );
}

export function DayDivider({ date }: { date: string }) {
  const locale = useLocale();
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = locale === "th" ? "วันนี้" : "Today";
  else if (isYesterday(d)) label = locale === "th" ? "เมื่อวาน" : "Yesterday";
  else
    label = format(d, "d MMM yyyy", { locale: locale === "th" ? th : enUS });

  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-stone-200/80 px-3 py-1 text-xs text-stone-600 dark:bg-stone-800/80 dark:text-stone-300">
        {label}
      </span>
    </div>
  );
}

export function ImageLightbox({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
        aria-label="close"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
