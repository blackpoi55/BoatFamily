"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Clock, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/ui/thai-date-picker";
import { upsertReminder } from "@/app/actions/reminders";
import { cn, getInitials } from "@/lib/utils";

type Frequency = "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  currentUserId: string;
  reminder?: {
    id: string;
    title: string;
    description: string | null;
    frequency: Frequency;
    startAt: Date;
    endAt: Date | null;
    enabled: boolean;
    recipients: { user: { id: string } }[];
  };
};

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "ONCE", label: "ครั้งเดียว" },
  { value: "DAILY", label: "ทุกวัน" },
  { value: "WEEKLY", label: "ทุกอาทิตย์" },
  { value: "MONTHLY", label: "ทุกเดือน" },
  { value: "YEARLY", label: "ทุกปี" },
];

function defaultStart() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30, 0, 0);
  return d;
}

export function ReminderForm({ members, currentUserId, reminder }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [frequency, setFrequency] = useState<Frequency>(reminder?.frequency ?? "ONCE");
  const [recipients, setRecipients] = useState<Set<string>>(
    new Set(
      reminder
        ? reminder.recipients.map((r) => r.user.id)
        : [currentUserId],
    ),
  );

  const toggleRecipient = (id: string) => {
    setRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = (formData: FormData) => {
    if (reminder) formData.set("id", reminder.id);
    formData.set("frequency", frequency);
    recipients.forEach((id) => formData.append("recipientIds", id));

    startTransition(async () => {
      const result = await upsertReminder(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(reminder ? "แก้ไขแล้ว" : "สร้างการแจ้งเตือนแล้ว");
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
          defaultValue={reminder?.title}
          placeholder="เช่น จ่ายค่าเน็ตฟลิกซ์"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          รายละเอียด (ถ้ามี)
        </label>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={reminder?.description ?? ""}
          placeholder="หมายเหตุเพิ่มเติม"
          className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-colors focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <Repeat className="inline size-4 align-text-bottom" /> ความถี่
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                frequency === f.value
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <Clock className="inline size-4 align-text-bottom" /> วันและเวลา
          {frequency !== "ONCE" && (
            <span className="ml-2 text-xs font-normal text-stone-500">
              (เวลานี้จะเป็นจุดเริ่มต้น แล้วทำซ้ำตามความถี่)
            </span>
          )}
        </label>
        <ThaiDatePicker
          name="startAt"
          mode="datetime"
          required
          defaultValue={reminder?.startAt ?? defaultStart()}
        />
      </div>

      {frequency !== "ONCE" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            สิ้นสุด (เว้นว่างได้)
          </label>
          <ThaiDatePicker
            name="endAt"
            mode="datetime"
            defaultValue={reminder?.endAt ?? null}
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          แจ้งเตือนถึง
        </label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = recipients.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleRecipient(m.id)}
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
        {recipients.size === 0 && (
          <p className="mt-2 text-xs text-rose-500">เลือกผู้รับอย่างน้อย 1 คน</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || recipients.size === 0}
        className="w-full"
      >
        <Save className="size-4" />
        {isPending ? "กำลังบันทึก..." : reminder ? "บันทึกการแก้ไข" : "สร้างการแจ้งเตือน"}
      </Button>
    </form>
  );
}
