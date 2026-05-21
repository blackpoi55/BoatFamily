"use server";

import { cookies } from "next/headers";

const VALID = ["light", "dark", "system"] as const;
type Theme = (typeof VALID)[number];

export async function setThemeCookie(theme: Theme) {
  if (!VALID.includes(theme)) return;
  const c = await cookies();
  c.set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
