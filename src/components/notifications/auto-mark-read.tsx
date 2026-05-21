"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/app/actions/notifications";

export function AutoMarkRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (!hasUnread) return;
    void markAllNotificationsRead();
  }, [hasUnread]);
  return null;
}
