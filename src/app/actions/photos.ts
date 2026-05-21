"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "photos";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PER_UPLOAD = 20;

const albumSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "ตั้งชื่ออัลบั้ม").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
});

export type AlbumResult = { ok: true; redirect?: string } | { ok: false; error: string };

function parseDate(raw: string) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  return d;
}

export async function upsertAlbum(formData: FormData): Promise<AlbumResult> {
  const me = await requireUser();

  const parsed = albumSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || "",
    eventDate: formData.get("eventDate") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  let eventDate: Date | null = null;
  try {
    eventDate = parseDate(parsed.data.eventDate ?? "");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "วันที่ไม่ถูกต้อง" };
  }

  if (parsed.data.id) {
    const existing = await db.photoAlbum.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return { ok: false, error: "ไม่พบอัลบั้ม" };
    if (existing.creatorId !== me.id && me.role !== "ADMIN") {
      return { ok: false, error: "ไม่มีสิทธิ์แก้ไข" };
    }
    await db.photoAlbum.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        eventDate,
      },
    });
    revalidatePath("/photos");
    revalidatePath(`/photos/${parsed.data.id}`);
    return { ok: true, redirect: `/photos/${parsed.data.id}` };
  }

  const created = await db.photoAlbum.create({
    data: {
      creatorId: me.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate,
    },
  });
  revalidatePath("/photos");
  return { ok: true, redirect: `/photos/${created.id}` };
}

export async function deleteAlbum(albumId: string) {
  const me = await requireUser();
  const album = await db.photoAlbum.findUnique({
    where: { id: albumId },
    include: { photos: true },
  });
  if (!album) return { ok: false as const, error: "ไม่พบอัลบั้ม" };
  if (album.creatorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  if (album.photos.length > 0) {
    const supabase = createSupabaseServiceRoleClient();
    const paths = album.photos
      .map((p) => extractStoragePath(p.url))
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  }
  await db.photoAlbum.delete({ where: { id: albumId } });
  revalidatePath("/photos");
  redirect("/photos");
}

function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.substring(idx + marker.length);
}

export async function uploadPhotos(formData: FormData) {
  const me = await requireUser();
  const albumId = formData.get("albumId");
  if (typeof albumId !== "string" || !albumId) {
    return { ok: false as const, error: "ไม่พบ albumId" };
  }

  const album = await db.photoAlbum.findUnique({ where: { id: albumId } });
  if (!album) return { ok: false as const, error: "ไม่พบอัลบั้ม" };

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false as const, error: "เลือกรูปก่อน" };
  if (files.length > MAX_PER_UPLOAD) {
    return { ok: false as const, error: `อัพได้สูงสุด ${MAX_PER_UPLOAD} รูปต่อครั้ง` };
  }

  const supabase = createSupabaseServiceRoleClient();
  const created: { url: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false as const, error: `ไฟล์ใหญ่เกิน ${MAX_FILE_BYTES / 1024 / 1024}MB` };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false as const, error: "อนุญาตเฉพาะรูปภาพ" };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";
    const path = `${albumId}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return { ok: false as const, error: `อัพไม่สำเร็จ: ${error.message}` };
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    await db.photo.create({
      data: { albumId, uploaderId: me.id, url: data.publicUrl },
    });
    created.push({ url: data.publicUrl });
  }

  if (!album.coverUrl && created.length > 0) {
    await db.photoAlbum.update({
      where: { id: albumId },
      data: { coverUrl: created[0]!.url },
    });
  }

  revalidatePath(`/photos/${albumId}`);
  revalidatePath("/photos");
  return { ok: true as const, count: created.length };
}

export async function deletePhoto(photoId: string) {
  const me = await requireUser();
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) return { ok: false as const, error: "ไม่พบรูป" };
  if (photo.uploaderId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  const path = extractStoragePath(photo.url);
  if (path) {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.storage.from(BUCKET).remove([path]);
  }
  await db.photo.delete({ where: { id: photoId } });
  revalidatePath(`/photos/${photo.albumId}`);
  return { ok: true as const };
}
