import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export const getSession = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const authUser = await getSession();
  if (!authUser) return null;
  return db.user.findUnique({ where: { id: authUser.id } });
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status === "REJECTED" || user.status === "SUSPENDED") {
    redirect("/login?error=account_disabled");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/chat");
  return user;
}
