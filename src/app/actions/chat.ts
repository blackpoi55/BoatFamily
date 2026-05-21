"use server";

import { z } from "zod";
import { requireUser, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

const CHANNEL = "family:chat";
const BUCKET = "chat-attachments";
const MAX_ATTACHMENTS = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const sendInputSchema = z.object({
  content: z.string().trim().max(2000).default(""),
  replyToId: z.string().uuid().nullable().optional(),
});

export type ChatMessage = {
  id: string;
  content: string;
  attachments: string[];
  createdAt: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  replyToId: string | null;
  replyToContent?: string | null;
  replyToSenderName?: string | null;
};

export async function sendMessage(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUser();

  const rawContent = (formData.get("content") as string) ?? "";
  const rawReplyTo = (formData.get("replyToId") as string) || null;

  const parsed = sendInputSchema.safeParse({
    content: rawContent,
    replyToId: rawReplyTo,
  });
  if (!parsed.success) return { ok: false, error: "ข้อความไม่ถูกต้อง" };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `แนบรูปได้สูงสุด ${MAX_ATTACHMENTS} รูปต่อข้อความ` };
  }
  if (!parsed.data.content && files.length === 0) {
    return { ok: false, error: "ข้อความว่าง" };
  }

  const attachments: string[] = [];
  if (files.length > 0) {
    const supabaseAdmin = createSupabaseServiceRoleClient();
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return { ok: false, error: `ไฟล์ใหญ่เกิน ${MAX_FILE_BYTES / 1024 / 1024}MB` };
      }
      if (!file.type.startsWith("image/")) {
        return { ok: false, error: "อนุญาตเฉพาะรูปภาพ" };
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
      const path = `${me.id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
      if (error) return { ok: false, error: `อัพโหลดไม่สำเร็จ: ${error.message}` };
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      attachments.push(data.publicUrl);
    }
  }

  const created = await db.message.create({
    data: {
      senderId: me.id,
      content: parsed.data.content,
      attachments,
      replyToId: parsed.data.replyToId ?? null,
    },
    include: {
      sender: { select: { name: true, username: true, avatarUrl: true } },
      replyTo: {
        select: {
          content: true,
          sender: { select: { name: true } },
        },
      },
    },
  });

  const payload: ChatMessage = {
    id: created.id,
    content: created.content,
    attachments: created.attachments,
    createdAt: created.createdAt.toISOString(),
    senderId: created.senderId,
    senderName: created.sender.name,
    senderUsername: created.sender.username,
    senderAvatarUrl: created.sender.avatarUrl,
    replyToId: created.replyToId,
    replyToContent: created.replyTo?.content ?? null,
    replyToSenderName: created.replyTo?.sender.name ?? null,
  };

  const supabase = await createSupabaseServerClient();
  const channel = supabase.channel(CHANNEL);
  await channel.send({ type: "broadcast", event: "message", payload });
  await supabase.removeChannel(channel);

  return { ok: true };
}

export async function deleteMessage(messageId: string) {
  const me = await requireUser();
  const msg = await db.message.findUnique({ where: { id: messageId } });
  if (!msg) return { ok: false, error: "ไม่พบข้อความ" };
  if (msg.senderId !== me.id && me.role !== "ADMIN") {
    return { ok: false, error: "ไม่มีสิทธิ์ลบข้อความนี้" };
  }
  await db.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "", attachments: [] },
  });

  const supabase = await createSupabaseServerClient();
  const channel = supabase.channel(CHANNEL);
  await channel.send({
    type: "broadcast",
    event: "delete",
    payload: { id: messageId },
  });
  await supabase.removeChannel(channel);

  return { ok: true };
}

export async function clearAllChat(): Promise<
  { ok: true; messagesDeleted: number; filesDeleted: number } | { ok: false; error: string }
> {
  await requireAdmin();

  const supabaseAdmin = createSupabaseServiceRoleClient();
  let filesDeleted = 0;

  const { data: folders, error: listErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .list("", { limit: 1000 });
  if (listErr) return { ok: false, error: listErr.message };

  for (const folder of folders ?? []) {
    if (!folder.name) continue;
    const paths: string[] = [];
    let offset = 0;
    while (true) {
      const { data: files, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .list(folder.name, { limit: 1000, offset });
      if (error) return { ok: false, error: error.message };
      if (!files || files.length === 0) break;
      paths.push(...files.map((f) => `${folder.name}/${f.name}`));
      if (files.length < 1000) break;
      offset += 1000;
    }
    if (paths.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < paths.length; i += BATCH) {
        const { error } = await supabaseAdmin.storage
          .from(BUCKET)
          .remove(paths.slice(i, i + BATCH));
        if (error) return { ok: false, error: error.message };
      }
      filesDeleted += paths.length;
    }
  }

  const { count: messagesDeleted } = await db.message.deleteMany();

  const supabase = await createSupabaseServerClient();
  const channel = supabase.channel(CHANNEL);
  await channel.send({ type: "broadcast", event: "clear", payload: {} });
  await supabase.removeChannel(channel);

  return { ok: true, messagesDeleted, filesDeleted };
}

export async function loadInitialMessages(limit = 50): Promise<ChatMessage[]> {
  await requireUser();
  const rows = await db.message.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: { select: { name: true, username: true, avatarUrl: true } },
      replyTo: {
        select: {
          content: true,
          sender: { select: { name: true } },
        },
      },
    },
  });

  return rows.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    attachments: m.attachments,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    senderName: m.sender.name,
    senderUsername: m.sender.username,
    senderAvatarUrl: m.sender.avatarUrl,
    replyToId: m.replyToId,
    replyToContent: m.replyTo?.content ?? null,
    replyToSenderName: m.replyTo?.sender.name ?? null,
  }));
}
