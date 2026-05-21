"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { compressImage } from "./compress-image";

export type Attachment = {
  file: File;
  previewUrl: string;
  originalBytes: number;
  compressed: boolean;
};

const HARD_MAX_BYTES = 25 * 1024 * 1024;
const FINAL_MAX_BYTES = 4 * 1024 * 1024;

export function useImageAttachments({ max }: { max: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    };
  }, [attachments]);

  const addFiles = async (incoming: FileList | File[]) => {
    const candidates = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (candidates.length === 0) {
      toast.error("รองรับเฉพาะรูปภาพ");
      return;
    }
    const tooLargeOriginal = candidates.find((f) => f.size > HARD_MAX_BYTES);
    if (tooLargeOriginal) {
      toast.error(`ไฟล์ ${tooLargeOriginal.name} ใหญ่เกิน ${HARD_MAX_BYTES / 1024 / 1024}MB`);
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("กำลังย่อรูป...");
    const processed: Attachment[] = [];
    try {
      for (const original of candidates) {
        try {
          const out = await compressImage(original);
          if (out.size > FINAL_MAX_BYTES) {
            toast.error(`รูป ${original.name} ใหญ่เกินไปแม้หลังย่อแล้ว`, {
              id: toastId,
            });
            continue;
          }
          processed.push({
            file: out,
            previewUrl: URL.createObjectURL(out),
            originalBytes: original.size,
            compressed: out.size < original.size,
          });
        } catch {
          toast.error(`อ่านไฟล์ ${original.name} ไม่ได้`, { id: toastId });
        }
      }
      const savedRatio =
        processed.length > 0
          ? 1 -
            processed.reduce((s, a) => s + a.file.size, 0) /
              processed.reduce((s, a) => s + a.originalBytes, 0)
          : 0;
      if (processed.length > 0 && savedRatio > 0.05) {
        toast.success(`ย่อรูปเรียบร้อย ลดขนาด ${Math.round(savedRatio * 100)}%`, {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsProcessing(false);
    }

    if (processed.length === 0) return;

    setAttachments((prev) => {
      const next = [...prev, ...processed];
      if (next.length > max) {
        toast.error(`แนบได้สูงสุด ${max} รูป`);
        next.slice(max).forEach((a) => URL.revokeObjectURL(a.previewUrl));
        return next.slice(0, max);
      }
      return next;
    });
  };

  const removeAt = (idx: number) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[idx]!.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clear = () => {
    setAttachments((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      return [];
    });
  };

  const openFilePicker = () => inputRef.current?.click();

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = "";
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.files;
    if (items.length > 0) {
      e.preventDefault();
      void addFiles(items);
    }
  };

  const appendToFormData = (formData: FormData, fieldName = "files") => {
    attachments.forEach((a) => formData.append(fieldName, a.file));
  };

  return {
    attachments,
    inputRef,
    isProcessing,
    addFiles,
    removeAt,
    clear,
    openFilePicker,
    onFileInputChange,
    onPaste,
    appendToFormData,
    isFull: attachments.length >= max,
  };
}
