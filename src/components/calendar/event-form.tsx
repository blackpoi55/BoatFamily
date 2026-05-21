"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/ui/thai-date-picker";
import { upsertEvent } from "@/app/actions/calendar";
import { cn, getInitials } from "@/lib/utils";

type Color = "yellow" | "blue" | "green" | "pink" | "purple" | "stone";

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  currentUserId: string;
  event?: {
    id: string;
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date | null;
    allDay: boolean;
    location: string | null;
    color: string | null;
    participants: { user: { id: string } }[];
  };
};

const COLORS: { key: Color; className: string }[] = [
  { key: "blue", className: "bg-sky-400" },
  { key: "green", className: "bg-emerald-400" },
  { key: "yellow", className: "bg-amber-400" },
  { key: "pink", className: "bg-pink-400" },
  { key: "purple", className: "bg-violet-400" },
  { key: "stone", className: "bg-stone-400" },
];

function defaultStart() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export function EventForm({ members, currentUserId, event }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [color, setColor] = useState<Color>(
    ((event?.color as Color) ?? "blue") as Color,
  );
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [participants, setParticipants] = useState<Set<string>>(
    new Set(
      event ? event.participants.map((p) => p.user.id) : [currentUserId],
    ),
  );

  const toggleParticipant = (id: string) => {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = (formData: FormData) => {
    if (event) formData.set("id", event.id);
    formData.set("color", color);
    formData.set("allDay", String(allDay));
    participants.forEach((id) => formData.append("participantIds", id));

    startTransition(async () => {
      const result = await upsertEvent(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(event ? "แก้ไขแล้ว" : "สร้างกิจกรรมแล้ว");
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
          หัวข้อ
        </label>
        <Input
          name="title"
          required
          maxLength={150}
          defaultValue={event?.title}
          placeholder="เช่น วันเกิดแม่"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          รายละเอียด (ถ้ามี)
        </label>
        <textarea
          name="description"
          rows={2}
          maxLength={2000}
          defaultValue={event?.description ?? ""}
          className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="size-4"
        />
        <span className="text-sm font-medium">ทั้งวัน (all-day)</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            เริ่ม
          </label>
          <ThaiDatePicker
            name="startAt"
            mode={allDay ? "date" : "datetime"}
            required
            defaultValue={event?.startAt ?? defaultStart()}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            สิ้นสุด (ถ้ามี)
          </label>
          <ThaiDatePicker
            name="endAt"
            mode={allDay ? "date" : "datetime"}
            defaultValue={event?.endAt ?? null}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <MapPin className="inline size-4 align-text-bottom" /> สถานที่ (ถ้ามี)
        </label>
        <Input name="location" maxLength={200} defaultValue={event?.location ?? ""} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          สี
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

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          ผู้เกี่ยวข้อง (ทุกคนเห็นกิจกรรมรวมอยู่แล้ว แต่ตรงนี้คือคนที่เข้าร่วม)
        </label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = participants.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleParticipant(m.id)}
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

      <Button type="submit" disabled={isPending} className="w-full">
        <Save className="size-4" />
        {isPending ? "กำลังบันทึก..." : event ? "บันทึกการแก้ไข" : "สร้างกิจกรรม"}
      </Button>
    </form>
  );
}
