import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FORWARD_USER_HEADER } from "@/lib/supabase/middleware";
import type { User } from "@prisma/client";

export const getSession = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Cheap auth check that trusts the middleware's getUser() result via a
// request header. Use only to fetch the row by id — anything that mutates
// or grants access should still call getSession() so Supabase validates the
// JWT freshly.
const getAuthenticatedUserId = cache(async (): Promise<string | null> => {
  const h = await headers();
  const id = h.get(FORWARD_USER_HEADER);
  if (id) return id;
  const session = await getSession();
  return session?.id ?? null;
});

export type UserWithUnread = User & { unreadCount: number };

export const getCurrentUser = cache(
  async (): Promise<UserWithUnread | null> => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const row = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { notifications: { where: { read: false } } },
        },
      },
    });
    if (!row) return null;
    const { _count, ...user } = row;
    return { ...user, unreadCount: _count.notifications };
  },
);

export async function requireUser(): Promise<UserWithUnread> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status === "REJECTED" || user.status === "SUSPENDED") {
    redirect("/login?error=account_disabled");
  }
  return user;
}

export const requireUserWithUnread = requireUser;

export async function requireAdmin(): Promise<UserWithUnread> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/chat");
  return user;
}
