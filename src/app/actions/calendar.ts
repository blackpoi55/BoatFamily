"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  startAt: z.string().min(1),
  endAt: z.string().optional().or(z.literal("")),
  allDay: z.coerce.boolean().default(false),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  color: z.enum(["yellow", "blue", "green", "pink", "purple", "stone"]).default("blue"),
  participantIds: z.array(z.string().uuid()).default([]),
});

export type EventActionResult =
  | { ok: true; redirect?: string }
  | { ok: false; error: string };

function parseDate(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  return d;
}

export async function upsertEvent(formData: FormData): Promise<EventActionResult> {
  const me = await requireUser();
  const participantIds = formData.getAll("participantIds").map(String);

  const parsed = upsertSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || "",
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || "",
    allDay: formData.get("allDay") === "on" || formData.get("allDay") === "true",
    location: formData.get("location") || "",
    color: formData.get("color") || "blue",
    participantIds,
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

  const { id, title, description, allDay, location, color, participantIds: participants } =
    parsed.data;

  if (id) {
    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "ไม่พบกิจกรรม" };
    if (existing.creatorId !== me.id && me.role !== "ADMIN") {
      return { ok: false, error: "ไม่มีสิทธิ์แก้ไข" };
    }
    await db.$transaction([
      db.calendarEvent.update({
        where: { id },
        data: {
          title,
          description: description || null,
          startAt,
          endAt,
          allDay,
          location: location || null,
          color,
        },
      }),
      db.eventParticipant.deleteMany({ where: { eventId: id } }),
      ...(participants.length > 0
        ? [
            db.eventParticipant.createMany({
              data: participants.map((userId) => ({ eventId: id, userId })),
            }),
          ]
        : []),
    ]);
    revalidatePath("/calendar");
    return { ok: true, redirect: "/calendar" };
  }

  await db.calendarEvent.create({
    data: {
      creatorId: me.id,
      title,
      description: description || null,
      startAt,
      endAt,
      allDay,
      location: location || null,
      color,
      participants: {
        create: participants.map((userId) => ({ userId })),
      },
    },
  });
  revalidatePath("/calendar");
  return { ok: true, redirect: "/calendar" };
}

export async function deleteEvent(eventId: string) {
  const me = await requireUser();
  const e = await db.calendarEvent.findUnique({ where: { id: eventId } });
  if (!e) return { ok: false as const, error: "ไม่พบกิจกรรม" };
  if (e.creatorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  await db.calendarEvent.delete({ where: { id: eventId } });
  revalidatePath("/calendar");
  redirect("/calendar");
}
