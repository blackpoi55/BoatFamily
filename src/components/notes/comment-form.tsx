"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { addComment } from "@/app/actions/notes";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useImageAttachments } from "@/lib/use-image-attachments";

export function CommentForm({ noteId }: { noteId: string }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const attach = useImageAttachments({ max: 4 });
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const el = textRef.current;
    if (!el) return;
    const content = el.value.trim();
    if (!content && attach.attachments.length === 0) return;

    const formData = new FormData();
    formData.set("noteId", noteId);
    formData.set("content", content);
    attach.appendToFormData(formData);

    startTransition(async () => {
      const result = await addComment(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      el.value = "";
      el.style.height = "auto";
      attach.clear();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={attach.inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={attach.onFileInputChange}
      />

      {attach.attachments.length > 0 && (
        <AttachmentPreview
          attachments={attach.attachments}
          onRemove={attach.removeAt}
          size="sm"
        />
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={attach.openFilePicker}
          disabled={attach.isFull || isPending || attach.isProcessing}
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
          ref={textRef}
          rows={1}
          maxLength={2000}
          placeholder="เม้นได้เลย..."
          onKeyDown={onKeyDown}
          onPaste={attach.onPaste}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 128) + "px";
          }}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || attach.isProcessing}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
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
