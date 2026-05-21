"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const userIdSchema = z.string().uuid();

export async function approveUser(userId: string) {
  const admin = await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, error: "Invalid user id" };

  await db.user.update({
    where: { id: parsed.data },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectUser(userId: string) {
  const admin = await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, error: "Invalid user id" };

  await db.user.update({
    where: { id: parsed.data },
    data: { status: "REJECTED", approvedById: admin.id },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, error: "Invalid user id" };

  const supabase = createSupabaseServiceRoleClient();
  await supabase.auth.admin.deleteUser(parsed.data);
  await db.user.delete({ where: { id: parsed.data } }).catch(() => null);

  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleAdmin(userId: string) {
  await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, error: "Invalid user id" };

  const user = await db.user.findUnique({ where: { id: parsed.data } });
  if (!user) return { ok: false, error: "User not found" };

  await db.user.update({
    where: { id: parsed.data },
    data: { role: user.role === "ADMIN" ? "MEMBER" : "ADMIN" },
  });
  revalidatePath("/admin");
  return { ok: true };
}
