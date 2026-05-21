"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useImageAttachments } from "@/lib/use-image-attachments";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { uploadPhotos } from "@/app/actions/photos";
import { IMAGE_ACCEPT } from "@/lib/utils";

export function PhotoUploader({ albumId }: { albumId: string }) {
  const attach = useImageAttachments({ max: 20 });
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (attach.attachments.length === 0) return;
    const formData = new FormData();
    formData.set("albumId", albumId);
    attach.appendToFormData(formData);

    startTransition(async () => {
      const r = await uploadPhotos(formData);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`อัพ ${r.count} รูปแล้ว`);
      attach.clear();
    });
  };

  return (
    <div className="space-y-2">
      <input
        ref={attach.inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={attach.onFileInputChange}
      />

      {attach.attachments.length > 0 && (
        <AttachmentPreview
          attachments={attach.attachments}
          onRemove={attach.removeAt}
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={attach.openFilePicker}
          disabled={attach.isFull || attach.isProcessing}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-4 text-sm font-medium text-stone-600 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950"
        >
          {attach.isProcessing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {attach.isProcessing
            ? "กำลังย่อรูป..."
            : `เลือกรูป (${attach.attachments.length}/20)`}
        </button>
        {attach.attachments.length > 0 && (
          <button
            type="button"
            onClick={submit}
            disabled={isPending || attach.isProcessing}
            className="flex items-center gap-1 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            อัพ {attach.attachments.length} รูป
          </button>
        )}
      </div>
    </div>
  );
}
