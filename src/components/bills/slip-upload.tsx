"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Upload, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { uploadSlip } from "@/app/actions/bills";
import { IMAGE_ACCEPT } from "@/lib/utils";

export function SlipUpload({ billId }: { billId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pick = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("รองรับเฉพาะรูปภาพ");
      return;
    }
    setIsProcessing(true);
    const toastId = toast.loading("กำลังย่อรูป...");
    try {
      const compressed = await compressImage(f);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      const savedRatio = 1 - compressed.size / f.size;
      if (savedRatio > 0.05) {
        toast.success(`ย่อแล้วลด ${Math.round(savedRatio * 100)}%`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.error("อ่านไฟล์ไม่ได้", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setAmount("");
    setNote("");
  };

  const submit = () => {
    if (!file) return;
    const formData = new FormData();
    formData.set("billId", billId);
    formData.set("file", file);
    if (amount) formData.set("amount", amount);
    if (note) formData.set("note", note);

    startTransition(async () => {
      const result = await uploadSlip(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("อัพสลิปแล้ว");
      reset();
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={onFileChange}
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={pick}
          disabled={isProcessing}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-8 text-sm font-medium text-stone-600 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950"
        >
          {isProcessing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {isProcessing ? "กำลังย่อรูป..." : "เลือกรูปสลิป"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="slip" className="w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={reset}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-stone-900/80 text-white"
              aria-label="remove"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder="จำนวนเงิน (ถ้ามี)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
            />
            <input
              type="text"
              placeholder="หมายเหตุ"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isPending ? "กำลังอัพ..." : "อัพสลิป"}
          </button>
        </div>
      )}
    </div>
  );
}
