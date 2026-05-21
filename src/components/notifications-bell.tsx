"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function NotificationsBell({
  initialUnread,
  userId,
}: {
  initialUnread: number;
  userId: string;
}) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`noti:user:${userId}`);
    channel
      .on("broadcast", { event: "new" }, () => {
        setUnread((n) => n + 1);
      })
      .on("broadcast", { event: "read" }, () => {
        setUnread(0);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
      aria-label="notifications"
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 px-1 text-[10px] font-bold text-white shadow-md">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
