"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อเล่น").max(60),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  bloodType: z.string().trim().max(10).optional().or(z.literal("")),
  allergies: z.string().trim().max(500).optional().or(z.literal("")),
  emergencyContact: z.string().trim().max(200).optional().or(z.literal("")),
});

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

export async function updateProfile(formData: FormData) {
  const me = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber") || "",
    birthDate: formData.get("birthDate") || "",
    bloodType: formData.get("bloodType") || "",
    allergies: formData.get("allergies") || "",
    emergencyContact: formData.get("emergencyContact") || "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  await db.user.update({
    where: { id: me.id },
    data: {
      name: parsed.data.name,
      phoneNumber: parsed.data.phoneNumber || null,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      bloodType: parsed.data.bloodType || null,
      allergies: parsed.data.allergies || null,
      emergencyContact: parsed.data.emergencyContact || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/directory");
  return { ok: true as const };
}

export async function updateAvatar(formData: FormData) {
  const me = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "เลือกรูปก่อน" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false as const, error: `ไฟล์ใหญ่เกิน ${MAX_AVATAR_BYTES / 1024 / 1024}MB` };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false as const, error: "อนุญาตเฉพาะรูปภาพ" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";
  const path = `${me.id}/${Date.now()}.${safeExt}`;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return { ok: false as const, error: error.message };

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  await db.user.update({
    where: { id: me.id },
    data: { avatarUrl: data.publicUrl },
  });

  revalidatePath("/profile");
  revalidatePath("/directory");
  return { ok: true as const };
}
