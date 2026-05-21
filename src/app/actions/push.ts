"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().max(300).optional(),
});

export async function savePushSubscription(input: unknown) {
  const me = await requireUser();
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "ข้อมูลไม่ถูกต้อง" };

  await db.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: me.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      userAgent: parsed.data.userAgent ?? null,
    },
    update: {
      userId: me.id,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      userAgent: parsed.data.userAgent ?? null,
    },
  });

  return { ok: true as const };
}

export async function removePushSubscription(endpoint: string) {
  await requireUser();
  await db.pushSubscription.deleteMany({ where: { endpoint } });
  return { ok: true as const };
}

export async function sendTestPushToSelf() {
  const me = await requireUser();
  const { sendPushToUser } = await import("@/lib/server-push");
  const result = await sendPushToUser(me.id, {
    title: "ทดสอบการแจ้งเตือน 🔔",
    body: "ระบบแจ้งเตือนทำงานปกติ — แจ้งเตือนจากครอบครัวจะเข้ามาในรูปแบบนี้",
    url: "/reminders",
    tag: "test",
  });
  return result;
}
