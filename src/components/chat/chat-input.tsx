"use client";

import { useRef, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Send, X, ImagePlus, Loader2 } from "lucide-react";
import { sendMessage, type ChatMessage } from "@/app/actions/chat";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useImageAttachments } from "@/lib/use-image-attachments";
import { cn, IMAGE_ACCEPT } from "@/lib/utils";

type Props = {
  replyTo: ChatMessage | null;
  onClearReply: () => void;
};

const MAX_FILES = 6;

export function ChatInput({ replyTo, onClearReply }: Props) {
  const t = useTranslations("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attach = useImageAttachments({ max: MAX_FILES });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  const submit = () => {
    const el = textareaRef.current;
    if (!el) return;
    const content = el.value.trim();
    if (!content && attach.attachments.length === 0) return;

    const formData = new FormData();
    formData.set("content", content);
    if (replyTo) formData.set("replyToId", replyTo.id);
    attach.appendToFormData(formData);

    startTransition(async () => {
      const result = await sendMessage(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      el.value = "";
      el.style.height = "auto";
      attach.clear();
      onClearReply();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const busy = isPending || attach.isProcessing;

  return (
    <div className="border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      {replyTo && (
        <div className="flex items-start gap-2 border-l-4 border-brand-500 bg-stone-50 px-3 py-2 text-xs dark:bg-stone-900">
          <div className="flex-1">
            <div className="font-semibold text-brand-700 dark:text-brand-400">
              ตอบกลับ {replyTo.senderName}
            </div>
            <div className="line-clamp-1 text-stone-500">
              {replyTo.content || (replyTo.attachments?.length ? "📷 รูปภาพ" : "")}
            </div>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="rounded-full p-1 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
            aria-label="cancel reply"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {attach.attachments.length > 0 && (
        <div className="px-3 py-2">
          <AttachmentPreview
            attachments={attach.attachments}
            onRemove={attach.removeAt}
          />
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2">
        <input
          ref={attach.inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          hidden
          onChange={attach.onFileInputChange}
        />
        <button
          type="button"
          onClick={attach.openFilePicker}
          disabled={busy || attach.isFull}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-600 disabled:opacity-40 dark:hover:bg-stone-800"
          aria-label="attach image"
        >
          {attach.isProcessing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          onKeyDown={onKeyDown}
          onInput={onInput}
          onPaste={attach.onPaste}
          placeholder={t("placeholder")}
          className={cn(
            "max-h-[120px] flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none transition-colors",
            "placeholder:text-stone-400",
            "focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30",
            "dark:border-stone-700 dark:bg-stone-900",
          )}
          disabled={isPending}
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          aria-label="send"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
