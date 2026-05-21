"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeNextFireAt } from "@/lib/reminders";

const frequencyEnum = z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  frequency: frequencyEnum,
  startAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  recipientIds: z.array(z.string().uuid()).min(1, "กรุณาเลือกผู้รับการแจ้งเตือนอย่างน้อย 1 คน"),
  enabled: z.boolean().default(true),
});

export type ReminderActionResult =
  | { ok: true; redirect?: string }
  | { ok: false; error: string };

function parseDate(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  return d;
}

export async function upsertReminder(formData: FormData): Promise<ReminderActionResult> {
  const me = await requireUser();

  const recipientIds = formData.getAll("recipientIds").map(String);

  const parsed = upsertSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || "",
    frequency: formData.get("frequency"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || null,
    recipientIds,
    enabled: formData.get("enabled") !== "false",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  let startAt: Date;
  let endAt: Date | null = null;
  try {
    startAt = parseDate(parsed.data.startAt);
    if (parsed.data.endAt) endAt = parseDate(parsed.data.endAt);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "วันที่ไม่ถูกต้อง" };
  }

  const nextFireAt = computeNextFireAt(startAt, parsed.data.frequency, new Date(), endAt);

  const { id, title, description, frequency, recipientIds: recipients, enabled } = parsed.data;

  if (id) {
    const existing = await db.reminder.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "ไม่พบรายการ" };
    if (existing.creatorId !== me.id && me.role !== "ADMIN") {
      return { ok: false, error: "ไม่มีสิทธิ์แก้ไข" };
    }
    await db.$transaction([
      db.reminder.update({
        where: { id },
        data: {
          title,
          description: description || null,
          frequency,
          startAt,
          endAt,
          nextFireAt,
          enabled,
        },
      }),
      db.reminderRecipient.deleteMany({ where: { reminderId: id } }),
      db.reminderRecipient.createMany({
        data: recipients.map((userId) => ({ reminderId: id, userId })),
      }),
    ]);
    revalidatePath("/reminders");
    return { ok: true, redirect: "/reminders" };
  }

  await db.reminder.create({
    data: {
      creatorId: me.id,
      title,
      description: description || null,
      frequency,
      startAt,
      endAt,
      nextFireAt,
      enabled,
      recipients: {
        create: recipients.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath("/reminders");
  return { ok: true, redirect: "/reminders" };
}

export async function deleteReminder(reminderId: string) {
  const me = await requireUser();
  const r = await db.reminder.findUnique({ where: { id: reminderId } });
  if (!r) return { ok: false as const, error: "ไม่พบรายการ" };
  if (r.creatorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  await db.reminder.delete({ where: { id: reminderId } });
  revalidatePath("/reminders");
  redirect("/reminders");
}

export async function toggleReminderEnabled(reminderId: string) {
  const me = await requireUser();
  const r = await db.reminder.findUnique({ where: { id: reminderId } });
  if (!r) return { ok: false as const, error: "ไม่พบรายการ" };
  if (r.creatorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์" };
  }
  const enabled = !r.enabled;
  const nextFireAt = enabled
    ? computeNextFireAt(r.startAt, r.frequency, new Date(), r.endAt, r.lastFiredAt)
    : null;
  await db.reminder.update({
    where: { id: reminderId },
    data: { enabled, nextFireAt },
  });
  revalidatePath("/reminders");
  return { ok: true as const };
}
