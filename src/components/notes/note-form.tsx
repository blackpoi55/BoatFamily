"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Globe2, Users, Save, ImagePlus, X, Loader2 } from "lucide-react";
import { upsertNote } from "@/app/actions/notes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useImageAttachments } from "@/lib/use-image-attachments";
import { cn, getInitials } from "@/lib/utils";

type FamilyMember = {
  id: string;
  name: string;
  username: string;
};

type Visibility = "PRIVATE" | "SHARED" | "TAGGED";

type Props = {
  members: FamilyMember[];
  note?: {
    id: string;
    title: string;
    content: string;
    visibility: Visibility;
    color: string | null;
    attachments: string[];
    tags: { user: { id: string } }[];
  };
};

const COLORS = [
  { key: "yellow", className: "bg-amber-200" },
  { key: "blue", className: "bg-sky-200" },
  { key: "green", className: "bg-emerald-200" },
  { key: "pink", className: "bg-pink-200" },
  { key: "purple", className: "bg-violet-200" },
  { key: "stone", className: "bg-stone-200" },
] as const;

const MAX_TOTAL = 8;

export function NoteForm({ members, note }: Props) {
  const t = useTranslations("notes");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [visibility, setVisibility] = useState<Visibility>(note?.visibility ?? "PRIVATE");
  const [color, setColor] = useState<string | null>(note?.color ?? "yellow");
  const [tagged, setTagged] = useState<Set<string>>(
    new Set(note?.tags.map((t) => t.user.id) ?? []),
  );
  const [keepUrls, setKeepUrls] = useState<string[]>(note?.attachments ?? []);

  const existingCount = keepUrls.length;
  const attach = useImageAttachments({ max: MAX_TOTAL - existingCount });

  const toggleTag = (id: string) => {
    setTagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeExistingUrl = (idx: number) => {
    setKeepUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = (formData: FormData) => {
    if (note) formData.set("id", note.id);
    formData.set("visibility", visibility);
    if (color) formData.set("color", color);
    tagged.forEach((id) => formData.append("tagUserIds", id));
    keepUrls.forEach((url) => formData.append("keepUrls", url));
    attach.appendToFormData(formData);

    startTransition(async () => {
      const result = await upsertNote(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(note ? "บันทึกแล้ว" : "สร้างบันทึกแล้ว");
      if (result.redirect) {
        router.push(result.redirect);
        router.refresh();
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {t("noteTitle")}
        </label>
        <Input
          name="title"
          required
          maxLength={150}
          defaultValue={note?.title}
          placeholder="หัวข้อของบันทึก"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {t("noteContent")}
        </label>
        <textarea
          name="content"
          required
          rows={8}
          maxLength={20000}
          defaultValue={note?.content}
          placeholder="เขียนเลย..."
          onPaste={attach.onPaste}
          className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-colors focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            รูปแนบ ({existingCount + attach.attachments.length}/{MAX_TOTAL})
          </label>
          <button
            type="button"
            onClick={attach.openFilePicker}
            disabled={attach.isFull || attach.isProcessing}
            className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 disabled:opacity-40 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            {attach.isProcessing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> กำลังย่อรูป
              </>
            ) : (
              <>
                <ImagePlus className="size-3.5" /> เพิ่มรูป
              </>
            )}
          </button>
        </div>
        <input
          ref={attach.inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={attach.onFileInputChange}
        />

        {(keepUrls.length > 0 || attach.attachments.length > 0) && (
          <div className="flex gap-2 overflow-x-auto rounded-xl border border-dashed border-stone-300 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-900">
            {keepUrls.map((url, i) => (
              <div key={url} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingUrl(i)}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-stone-900 text-white shadow"
                  aria-label="remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <AttachmentPreview
              attachments={attach.attachments}
              onRemove={attach.removeAt}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {t("visibility")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <VisibilityOption
            active={visibility === "PRIVATE"}
            onClick={() => setVisibility("PRIVATE")}
            icon={<Lock className="size-4" />}
            label={t("private")}
          />
          <VisibilityOption
            active={visibility === "SHARED"}
            onClick={() => setVisibility("SHARED")}
            icon={<Globe2 className="size-4" />}
            label={t("shared")}
          />
          <VisibilityOption
            active={visibility === "TAGGED"}
            onClick={() => setVisibility("TAGGED")}
            icon={<Users className="size-4" />}
            label={t("tagged")}
          />
        </div>
      </div>

      {visibility === "TAGGED" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
            {t("tagPeople")}
          </label>
          <div className="flex flex-wrap gap-2">
            {members.length === 0 && (
              <p className="text-xs text-stone-500">ยังไม่มีสมาชิกอื่นในครอบครัว</p>
            )}
            {members.map((m) => {
              const active = tagged.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleTag(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200",
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-stone-200 text-[9px] font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                    {getInitials(m.name)}
                  </span>
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          สีบันทึก
        </label>
        <div className="flex gap-2">
          {COLORS.map(({ key, className }) => (
            <button
              key={key}
              type="button"
              onClick={() => setColor(key)}
              aria-label={key}
              className={cn(
                "size-9 rounded-full border-2 transition-transform",
                className,
                color === key
                  ? "border-stone-900 scale-110 dark:border-stone-100"
                  : "border-transparent",
              )}
            />
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending || attach.isProcessing}
        className="w-full"
      >
        <Save className="size-4" />
        {isPending ? "กำลังบันทึก..." : note ? "บันทึกการแก้ไข" : "สร้างบันทึก"}
      </Button>
    </form>
  );
}

function VisibilityOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-colors",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300",
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
