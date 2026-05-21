"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/ui/thai-date-picker";
import { upsertAlbum } from "@/app/actions/photos";

type Props = {
  album?: {
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
  };
};

export function AlbumForm({ album }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    if (album) formData.set("id", album.id);
    startTransition(async () => {
      const r = await upsertAlbum(formData);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(album ? "บันทึกแล้ว" : "สร้างอัลบั้มแล้ว");
      if (r.redirect) {
        router.push(r.redirect);
        router.refresh();
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          ชื่ออัลบั้ม
        </label>
        <Input
          name="title"
          required
          maxLength={150}
          defaultValue={album?.title}
          placeholder="เช่น เที่ยวเขาใหญ่ พฤษภาคม"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          คำอธิบาย (ถ้ามี)
        </label>
        <textarea
          name="description"
          rows={2}
          maxLength={1000}
          defaultValue={album?.description ?? ""}
          className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <Calendar className="inline size-4 align-text-bottom" /> วันที่เกิดเหตุการณ์
        </label>
        <ThaiDatePicker
          name="eventDate"
          mode="date"
          defaultValue={album?.eventDate ?? null}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        <Save className="size-4" />
        {isPending ? "กำลังบันทึก..." : album ? "บันทึกการแก้ไข" : "สร้างอัลบั้ม"}
      </Button>
    </form>
  );
}
