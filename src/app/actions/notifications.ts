"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function listMyNotifications(limit = 30) {
  const me = await requireUser();
  return db.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnreadNotifications() {
  const me = await requireUser();
  return db.notification.count({ where: { userId: me.id, read: false } });
}

export async function markNotificationRead(id: string) {
  const me = await requireUser();
  await db.notification.updateMany({
    where: { id, userId: me.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const me = await requireUser();
  await db.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function clearAllNotifications() {
  const me = await requireUser();
  await db.notification.deleteMany({ where: { userId: me.id } });
  revalidatePath("/notifications");
  return { ok: true as const };
}
