"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NoteVisibility } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "note-attachments";
const MAX_NOTE_ATTACHMENTS = 8;
const MAX_COMMENT_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const visibilityEnum = z.enum(["PRIVATE", "SHARED", "TAGGED"]);
const colorEnum = z
  .enum(["yellow", "blue", "green", "pink", "purple", "stone"])
  .nullable()
  .optional();

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(150),
  content: z.string().trim().min(1, "กรุณากรอกเนื้อหา").max(20000),
  visibility: visibilityEnum,
  color: colorEnum,
  tagUserIds: z.array(z.string().uuid()).default([]),
  keepUrls: z.array(z.string().url()).default([]),
});

export type NoteFormState =
  | { ok: true; redirect?: string }
  | { ok: false; error: string };

async function uploadFiles(
  files: File[],
  userId: string,
  prefix: string,
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: true, urls: [] };
  const supabase = createSupabaseServiceRoleClient();
  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `ไฟล์ใหญ่เกิน ${MAX_FILE_BYTES / 1024 / 1024}MB` };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "อนุญาตเฉพาะรูปภาพ" };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    const path = `${userId}/${prefix}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return { ok: false, error: `อัพโหลดไม่สำเร็จ: ${error.message}` };
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return { ok: true, urls };
}

export async function upsertNote(formData: FormData): Promise<NoteFormState> {
  const me = await requireUser();

  const tagUserIds = formData.getAll("tagUserIds").map(String);
  const keepUrls = formData.getAll("keepUrls").map(String);

  const parsed = upsertSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    content: formData.get("content"),
    visibility: formData.get("visibility"),
    color: formData.get("color") || null,
    tagUserIds,
    keepUrls,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { id, title, content, visibility, color, tagUserIds: tags } = parsed.data;

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length + parsed.data.keepUrls.length > MAX_NOTE_ATTACHMENTS) {
    return { ok: false, error: `แนบรูปได้สูงสุด ${MAX_NOTE_ATTACHMENTS} รูป` };
  }

  const uploaded = await uploadFiles(files, me.id, "notes");
  if (!uploaded.ok) return uploaded;

  const attachments = [...parsed.data.keepUrls, ...uploaded.urls];

  if (id) {
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "ไม่พบบันทึก" };
    if (existing.authorId !== me.id && me.role !== "ADMIN") {
      return { ok: false, error: "ไม่มีสิทธิ์แก้ไข" };
    }

    await db.$transaction([
      db.note.update({
        where: { id },
        data: { title, content, visibility, color: color ?? null, attachments },
      }),
      db.noteTag.deleteMany({ where: { noteId: id } }),
      ...(visibility === "TAGGED" && tags.length > 0
        ? [db.noteTag.createMany({ data: tags.map((userId) => ({ noteId: id, userId })) })]
        : []),
    ]);

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);
    return { ok: true, redirect: `/notes/${id}` };
  }

  const created = await db.note.create({
    data: {
      authorId: me.id,
      title,
      content,
      attachments,
      visibility,
      color: color ?? null,
      ...(visibility === "TAGGED" && tags.length > 0
        ? { tags: { create: tags.map((userId) => ({ userId })) } }
        : {}),
    },
  });

  revalidatePath("/notes");
  return { ok: true, redirect: `/notes/${created.id}` };
}

export async function deleteNote(noteId: string) {
  const me = await requireUser();
  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note) return { ok: false as const, error: "ไม่พบบันทึก" };
  if (note.authorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  await db.note.delete({ where: { id: noteId } });
  revalidatePath("/notes");
  redirect("/notes");
}

export async function togglePinNote(noteId: string) {
  const me = await requireUser();
  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note) return { ok: false as const, error: "ไม่พบบันทึก" };
  if (note.authorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์" };
  }
  await db.note.update({
    where: { id: noteId },
    data: { pinned: !note.pinned },
  });
  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  return { ok: true as const };
}

const commentSchema = z.object({
  noteId: z.string().uuid(),
  content: z.string().trim().max(2000).default(""),
});

export async function addComment(formData: FormData): Promise<NoteFormState> {
  const me = await requireUser();
  const parsed = commentSchema.safeParse({
    noteId: formData.get("noteId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { ok: false, error: "ความคิดเห็นไม่ถูกต้อง" };

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_COMMENT_ATTACHMENTS) {
    return {
      ok: false,
      error: `แนบรูปได้สูงสุด ${MAX_COMMENT_ATTACHMENTS} รูปต่อความคิดเห็น`,
    };
  }
  if (!parsed.data.content && files.length === 0) {
    return { ok: false, error: "ใส่ข้อความหรือรูปก่อนส่ง" };
  }

  const uploaded = await uploadFiles(files, me.id, "comments");
  if (!uploaded.ok) return uploaded;

  await db.noteComment.create({
    data: {
      noteId: parsed.data.noteId,
      authorId: me.id,
      content: parsed.data.content,
      attachments: uploaded.urls,
    },
  });

  revalidatePath(`/notes/${parsed.data.noteId}`);
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const me = await requireUser();
  const c = await db.noteComment.findUnique({ where: { id: commentId } });
  if (!c) return { ok: false as const, error: "ไม่พบความคิดเห็น" };
  if (c.authorId !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  await db.noteComment.delete({ where: { id: commentId } });
  revalidatePath(`/notes/${c.noteId}`);
  return { ok: true as const };
}

export async function visibleNotesFor(
  userId: string,
  filter: "private" | "shared" | "tagged" | "all",
) {
  const visibilityWhere = (() => {
    switch (filter) {
      case "private":
        return { authorId: userId, visibility: NoteVisibility.PRIVATE };
      case "shared":
        return { visibility: NoteVisibility.SHARED };
      case "tagged":
        return {
          visibility: NoteVisibility.TAGGED,
          OR: [{ authorId: userId }, { tags: { some: { userId } } }],
        };
      case "all":
      default:
        return {
          OR: [
            { authorId: userId },
            { visibility: NoteVisibility.SHARED },
            {
              visibility: NoteVisibility.TAGGED,
              tags: { some: { userId } },
            },
          ],
        };
    }
  })();

  return db.note.findMany({
    where: visibilityWhere,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },

      tags: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });
}

export async function getNoteWithComments(noteId: string) {
  const me = await requireUser();
  const note = await db.note.findUnique({
    where: { id: noteId },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },

      tags: { include: { user: { select: { id: true, name: true } } } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, username: true, avatarUrl: true } },

        },
      },
    },
  });

  if (!note) return null;

  const canView =
    note.authorId === me.id ||
    note.visibility === "SHARED" ||
    (note.visibility === "TAGGED" && note.tags.some((t) => t.userId === me.id)) ||
    me.role === "ADMIN";
  if (!canView) return null;

  return note;
}
