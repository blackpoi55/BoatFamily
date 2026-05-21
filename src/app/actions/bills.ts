"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { computeNextFireAt } from "@/lib/reminders";

const SLIP_BUCKET = "payment-slips";
const MAX_SLIP_BYTES = 8 * 1024 * 1024;

const frequencyEnum = z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อบิล").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  amount: z.coerce.number().nonnegative("จำนวนเงินไม่ถูกต้อง"),
  currency: z.string().trim().min(1).max(8).default("THB"),
  frequency: frequencyEnum,
  dueDate: z.string().min(1),
  notifyDaysBefore: z.coerce.number().int().min(0).max(30).default(3),
  participantIds: z.array(z.string().uuid()).min(1, "เลือกผู้ร่วมจ่ายอย่างน้อย 1 คน"),
  iconKey: z.string().max(40).nullable().optional(),
});

export type BillActionResult =
  | { ok: true; redirect?: string }
  | { ok: false; error: string };

function parseDate(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  return d;
}

export async function upsertBill(formData: FormData): Promise<BillActionResult> {
  const me = await requireUser();

  const participantIds = formData.getAll("participantIds").map(String);

  const parsed = upsertSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || "",
    amount: formData.get("amount"),
    currency: formData.get("currency") || "THB",
    frequency: formData.get("frequency"),
    dueDate: formData.get("dueDate"),
    notifyDaysBefore: formData.get("notifyDaysBefore") ?? 3,
    participantIds,
    iconKey: formData.get("iconKey") || null,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  let dueDate: Date;
  try {
    dueDate = parseDate(parsed.data.dueDate);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "วันที่ไม่ถูกต้อง" };
  }

  const nextDueDate =
    parsed.data.frequency === "ONCE"
      ? dueDate
      : computeNextFireAt(dueDate, parsed.data.frequency, new Date(), null);

  const {
    id,
    name,
    description,
    amount,
    currency,
    frequency,
    notifyDaysBefore,
    participantIds: participants,
    iconKey,
  } = parsed.data;

  if (id) {
    const existing = await db.bill.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "ไม่พบบิล" };
    if (existing.creatorId !== me.id && me.role !== "ADMIN") {
      return { ok: false, error: "ไม่มีสิทธิ์แก้ไข" };
    }
    await db.$transaction([
      db.bill.update({
        where: { id },
        data: {
          name,
          description: description || null,
          amount,
          currency,
          frequency,
          dueDate,
          nextDueDate,
          notifyDaysBefore,
          iconKey: iconKey ?? null,
        },
      }),
      db.billParticipant.deleteMany({ where: { billId: id } }),
      db.billParticipant.createMany({
        data: participants.map((userId) => ({ billId: id, userId })),
      }),
    ]);
    revalidatePath("/bills");
    return { ok: true, redirect: `/bills/${id}` };
  }

  const created = await db.bill.create({
    data: {
      creatorId: me.id,
      name,
      description: description || null,
      amount,
      currency,
      frequency,
      dueDate,
      nextDueDate,
      notifyDaysBefore,
      iconKey: iconKey ?? null,
      participants: {
        create: participants.map((userId) => ({ userId })),
      },
    },
  });
  revalidatePath("/bills");
  return { ok: true, redirect: `/bills/${created.id}` };
}

export async function deleteBill(billId: string) {
  const me = await requireUser();
  const b = await db.bill.findUnique({ where: { id: billId } });
  if (!b) return { ok: false as const, error: "ไม่พบบิล" };
  if (b.creatorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }

  const slips = await db.paymentSlip.findMany({ where: { billId } });
  if (slips.length > 0) {
    const supabase = createSupabaseServiceRoleClient();
    const paths = slips.map((s) => s.imageUrl);
    await supabase.storage.from(SLIP_BUCKET).remove(paths);
  }

  await db.bill.delete({ where: { id: billId } });
  revalidatePath("/bills");
  redirect("/bills");
}

export async function markParticipantPaid(billId: string, userId: string, paid: boolean) {
  const me = await requireUser();
  const b = await db.bill.findUnique({
    where: { id: billId },
    include: { participants: true },
  });
  if (!b) return { ok: false as const, error: "ไม่พบบิล" };

  const isParticipant = b.participants.some((p) => p.userId === userId);
  if (!isParticipant) return { ok: false as const, error: "ไม่ใช่ผู้ร่วมจ่าย" };

  const canMark =
    userId === me.id || b.creatorId === me.id || me.role === "ADMIN";
  if (!canMark) return { ok: false as const, error: "ไม่มีสิทธิ์" };

  await db.billParticipant.update({
    where: { billId_userId: { billId, userId } },
    data: { paid, paidAt: paid ? new Date() : null },
  });

  const all = await db.billParticipant.findMany({ where: { billId } });
  const allPaid = all.every((p) => p.paid);
  const somePaid = all.some((p) => p.paid);
  const newStatus = allPaid ? "PAID" : somePaid ? "PARTIAL" : "PENDING";

  await db.bill.update({ where: { id: billId }, data: { status: newStatus } });

  revalidatePath("/bills");
  revalidatePath(`/bills/${billId}`);
  return { ok: true as const };
}

export async function uploadSlip(formData: FormData): Promise<BillActionResult> {
  const me = await requireUser();
  const billId = formData.get("billId");
  const note = (formData.get("note") as string) || null;
  const amountRaw = formData.get("amount");
  const file = formData.get("file");

  if (typeof billId !== "string" || !billId) {
    return { ok: false, error: "ไม่พบ billId" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "กรุณาเลือกรูปสลิป" };
  }
  if (file.size > MAX_SLIP_BYTES) {
    return { ok: false, error: `ไฟล์ใหญ่เกิน ${MAX_SLIP_BYTES / 1024 / 1024}MB` };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "อนุญาตเฉพาะรูปภาพ" };
  }

  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { participants: true },
  });
  if (!bill) return { ok: false, error: "ไม่พบบิล" };

  const canUpload =
    bill.creatorId === me.id ||
    bill.participants.some((p) => p.userId === me.id) ||
    me.role === "ADMIN";
  if (!canUpload) return { ok: false, error: "ไม่มีสิทธิ์อัพสลิปบิลนี้" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";
  const path = `${billId}/${me.id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.storage.from(SLIP_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { ok: false, error: `อัพโหลดไม่สำเร็จ: ${error.message}` };

  await db.paymentSlip.create({
    data: {
      billId,
      userId: me.id,
      imageUrl: path,
      amount: amountRaw ? Number(amountRaw) : null,
      note: note || null,
    },
  });

  await db.billParticipant.updateMany({
    where: { billId, userId: me.id },
    data: { paid: true, paidAt: new Date() },
  });

  const all = await db.billParticipant.findMany({ where: { billId } });
  const allPaid = all.every((p) => p.paid);
  const somePaid = all.some((p) => p.paid);
  await db.bill.update({
    where: { id: billId },
    data: { status: allPaid ? "PAID" : somePaid ? "PARTIAL" : "PENDING" },
  });

  revalidatePath(`/bills/${billId}`);
  revalidatePath("/bills");
  return { ok: true };
}

export async function deleteSlip(slipId: string) {
  const me = await requireUser();
  const slip = await db.paymentSlip.findUnique({ where: { id: slipId } });
  if (!slip) return { ok: false as const, error: "ไม่พบสลิป" };
  if (slip.userId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  const supabase = createSupabaseServiceRoleClient();
  await supabase.storage.from(SLIP_BUCKET).remove([slip.imageUrl]);
  await db.paymentSlip.delete({ where: { id: slipId } });
  revalidatePath(`/bills/${slip.billId}`);
  return { ok: true as const };
}
