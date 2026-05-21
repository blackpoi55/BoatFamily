"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { db } from "@/lib/db";

const usernameRegex = /^[a-z0-9_]{3,20}$/;

const signupSchema = z.object({
  username: z
    .string()
    .regex(
      usernameRegex,
      "username ต้องเป็นตัวอักษรอังกฤษเล็ก/ตัวเลข/_ ความยาว 3-20 ตัว",
    ),
  password: z.string().min(6, "รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร"),
  name: z.string().min(1, "กรุณากรอกชื่อเล่น").max(60),
});

const loginSchema = z.object({
  username: z.string().min(1, "กรุณากรอก username"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type ActionResult =
  | { ok: true; message?: string; redirect?: string }
  | { ok: false; error: string };

function usernameToEmail(username: string) {
  return `${username}@family.local`;
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    username: (formData.get("username") as string)?.trim().toLowerCase(),
    password: formData.get("password"),
    name: (formData.get("name") as string)?.trim(),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { username, password, name } = parsed.data;

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) return { ok: false, error: "username นี้ถูกใช้แล้ว" };

  const email = usernameToEmail(username);

  const admin = createSupabaseServiceRoleClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, name },
  });
  if (createErr) return { ok: false, error: createErr.message };
  if (!created.user) return { ok: false, error: "สมัครไม่สำเร็จ" };

  const existingCount = await db.user.count();
  const isFirstUser = existingCount === 0;

  try {
    await db.user.create({
      data: {
        id: created.user.id,
        username,
        email,
        name,
        role: isFirstUser ? "ADMIN" : "MEMBER",
        status: isFirstUser ? "APPROVED" : "PENDING",
        approvedAt: isFirstUser ? new Date() : null,
      },
    });
  } catch (err) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => null);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "สร้างบัญชีล้มเหลว",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) return { ok: false, error: signInErr.message };

  if (isFirstUser) {
    return { ok: true, redirect: "/chat", message: "ยินดีต้อนรับ! คุณคือผู้ดูแลคนแรก" };
  }
  return { ok: true, redirect: "/pending" };
}

export async function signInWithPassword(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    username: (formData.get("username") as string)?.trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const dbUser = await db.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (!dbUser) return { ok: false, error: "username หรือรหัสผ่านไม่ถูกต้อง" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: dbUser.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: "username หรือรหัสผ่านไม่ถูกต้อง" };

  if (dbUser.status === "PENDING") return { ok: true, redirect: "/pending" };
  if (dbUser.status === "REJECTED" || dbUser.status === "SUSPENDED") {
    await supabase.auth.signOut();
    return { ok: false, error: "บัญชีของคุณถูกระงับ" };
  }
  return { ok: true, redirect: "/chat" };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
