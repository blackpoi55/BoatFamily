"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Clock, Repeat, BellRing, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/ui/thai-date-picker";
import { upsertBill } from "@/app/actions/bills";
import { cn, getInitials } from "@/lib/utils";

type Frequency = "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  currentUserId: string;
  bill?: {
    id: string;
    name: string;
    description: string | null;
    amount: { toString: () => string };
    currency: string;
    frequency: Frequency;
    dueDate: Date;
    notifyDaysBefore: number;
    iconKey: string | null;
    participants: { user: { id: string } }[];
  };
};

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "ONCE", label: "ครั้งเดียว" },
  { value: "DAILY", label: "ทุกวัน" },
  { value: "WEEKLY", label: "ทุกอาทิตย์" },
  { value: "MONTHLY", label: "ทุกเดือน" },
  { value: "YEARLY", label: "ทุกปี" },
];

const ICONS: { key: string; emoji: string; label: string }[] = [
  { key: "tv", emoji: "📺", label: "Netflix/ดูหนัง" },
  { key: "internet", emoji: "🌐", label: "เน็ต/Wi-Fi" },
  { key: "power", emoji: "💡", label: "ค่าไฟ" },
  { key: "water", emoji: "💧", label: "ค่าน้ำ" },
  { key: "phone", emoji: "📱", label: "ค่าโทรศัพท์" },
  { key: "music", emoji: "🎵", label: "Spotify/เพลง" },
  { key: "gym", emoji: "🏋️", label: "ฟิตเนส" },
  { key: "home", emoji: "🏠", label: "ค่าเช่า/บ้าน" },
  { key: "car", emoji: "🚗", label: "ค่าน้ำมัน/รถ" },
  { key: "other", emoji: "💸", label: "อื่นๆ" },
];

function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function BillForm({ members, currentUserId, bill }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [frequency, setFrequency] = useState<Frequency>(bill?.frequency ?? "MONTHLY");
  const [iconKey, setIconKey] = useState<string>(bill?.iconKey ?? "tv");
  const [participants, setParticipants] = useState<Set<string>>(
    new Set(
      bill ? bill.participants.map((p) => p.user.id) : [currentUserId],
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
    if (bill) formData.set("id", bill.id);
    formData.set("frequency", frequency);
    formData.set("iconKey", iconKey);
    participants.forEach((id) => formData.append("participantIds", id));

    startTransition(async () => {
      const result = await upsertBill(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(bill ? "แก้ไขแล้ว" : "สร้างบิลแล้ว");
      if (result.redirect) {
        router.push(result.redirect);
        router.refresh();
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          ประเภท
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ICONS.map((icon) => (
            <button
              key={icon.key}
              type="button"
              onClick={() => setIconKey(icon.key)}
              title={icon.label}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border text-2xl transition-colors",
                iconKey === icon.key
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/40"
                  : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900",
              )}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          ชื่อบิล
        </label>
        <Input
          name="name"
          required
          maxLength={150}
          defaultValue={bill?.name}
          placeholder="เช่น Netflix"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <Wallet className="inline size-4 align-text-bottom" /> จำนวนเงิน
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            name="amount"
            required
            min={0}
            step="0.01"
            defaultValue={bill?.amount.toString() ?? ""}
            placeholder="0.00"
            className="flex-1"
          />
          <Input
            name="currency"
            maxLength={8}
            defaultValue={bill?.currency ?? "THB"}
            className="w-20 text-center"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          รายละเอียด (ถ้ามี)
        </label>
        <textarea
          name="description"
          rows={2}
          maxLength={2000}
          defaultValue={bill?.description ?? ""}
          placeholder="เช่น บัญชี family, เลขบัตร, ฯลฯ"
          className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-colors focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <Repeat className="inline size-4 align-text-bottom" /> รอบบิล
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
          <Clock className="inline size-4 align-text-bottom" /> ครบกำหนดถัดไป
        </label>
        <ThaiDatePicker
          name="dueDate"
          mode="datetime"
          required
          defaultValue={bill?.dueDate ?? defaultDue()}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          <BellRing className="inline size-4 align-text-bottom" /> แจ้งเตือนล่วงหน้า (วัน)
        </label>
        <Input
          type="number"
          name="notifyDaysBefore"
          min={0}
          max={30}
          defaultValue={bill?.notifyDaysBefore ?? 3}
        />
        <p className="mt-1 text-xs text-stone-500">0 = แจ้งเฉพาะวันครบกำหนด</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          ผู้ร่วมจ่าย (แจ้งเตือนถึงคนเหล่านี้)
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

      <Button
        type="submit"
        disabled={isPending || participants.size === 0}
        className="w-full"
      >
        <Save className="size-4" />
        {isPending ? "กำลังบันทึก..." : bill ? "บันทึกการแก้ไข" : "สร้างบิล"}
      </Button>
    </form>
  );
}
