"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Send } from "lucide-react";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscriptionEndpoint,
} from "@/lib/push";
import {
  savePushSubscription,
  removePushSubscription,
  sendTestPushToSelf,
} from "@/app/actions/push";

type Props = {
  vapidPublicKey: string;
};

export function NotificationToggle({ vapidPublicKey }: Props) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    getCurrentSubscriptionEndpoint().then((endpoint) => setEnabled(!!endpoint));
  }, []);

  const enable = () => {
    startTransition(async () => {
      const result = await subscribeToPush(vapidPublicKey);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const saved = await savePushSubscription(result.payload);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      setEnabled(true);
      setPermission("granted");
      toast.success("เปิดการแจ้งเตือนแล้ว");
    });
  };

  const disable = () => {
    startTransition(async () => {
      const endpoint = await getCurrentSubscriptionEndpoint();
      const ok = await unsubscribeFromPush();
      if (!ok) {
        toast.error("ยกเลิกไม่สำเร็จ");
        return;
      }
      if (endpoint) await removePushSubscription(endpoint);
      setEnabled(false);
      toast.success("ปิดการแจ้งเตือนแล้ว");
    });
  };

  const sendTest = () => {
    startTransition(async () => {
      const result = await sendTestPushToSelf();
      if (result.sent === 0) {
        toast.error("ยังไม่ได้ subscribe การแจ้งเตือน");
      } else {
        toast.success(`ส่ง ${result.sent} เครื่องสำเร็จ`);
      }
    });
  };

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        เบราเซอร์นี้ไม่รองรับการแจ้งเตือน (ลองเปิดด้วย Chrome/Edge บนคอมพ์ หรือ Chrome บน Android)
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
        คุณบล็อกการแจ้งเตือนของไซต์นี้ — เปิดในตั้งค่าเบราเซอร์เพื่อใช้งาน
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Bell className="size-5 text-brand-600" />
          ) : (
            <BellOff className="size-5 text-stone-400" />
          )}
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-100">
              แจ้งเตือนเข้ามือถือ
            </p>
            <p className="text-xs text-stone-500">
              {enabled
                ? "เปิดอยู่ — จะแจ้งเตือนเมื่อถึงเวลา หรือมีบิลใกล้ครบกำหนด"
                : "ปิดอยู่ — ไม่ได้รับ noti บนเครื่องนี้"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={enabled ? disable : enable}
          disabled={isPending}
          className={
            enabled
              ? "rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200 disabled:opacity-60 dark:bg-stone-800 dark:text-stone-200"
              : "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          }
        >
          {enabled ? "ปิด" : "เปิด"}
        </button>
      </div>

      {enabled && (
        <button
          type="button"
          onClick={sendTest}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        >
          <Send className="size-4" /> ส่ง noti ทดสอบ
        </button>
      )}
    </div>
  );
}
