import { Bell } from "lucide-react";
import { listMyNotifications } from "@/app/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { AutoMarkRead } from "@/components/notifications/auto-mark-read";

export default async function NotificationsPage() {
  const notifications = await listMyNotifications(50);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">การแจ้งเตือน</h1>

      <AutoMarkRead hasUnread={hasUnread} />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-stone-500">
          <Bell className="size-12 text-stone-300" />
          <p className="text-sm">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
