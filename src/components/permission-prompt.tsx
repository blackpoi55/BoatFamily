"use client";

import { useEffect, useState } from "react";
import { Bell, Camera, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  isPushSupported,
  subscribeToPush,
  getCurrentSubscriptionEndpoint,
} from "@/lib/push";
import { savePushSubscription } from "@/app/actions/push";

const STORAGE_KEY = "fr-perm-prompt-v1";

type Props = {
  vapidPublicKey: string;
};

type Status = "idle" | "pending" | "done";

export function PermissionPrompt({ vapidPublicKey }: Props) {
  const [open, setOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState<Status>("idle");
  const [camStatus, setCamStatus] = useState<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "done") return;

    const supportsNotif =
      "Notification" in window && isPushSupported();
    const supportsCam =
      "mediaDevices" in navigator &&
      typeof navigator.mediaDevices.getUserMedia === "function";

    if (!supportsNotif && !supportsCam) {
      window.localStorage.setItem(STORAGE_KEY, "done");
      return;
    }

    const notifNeeded =
      supportsNotif && Notification.permission === "default";

    let camNeeded = false;
    const checkCam = async () => {
      if (!supportsCam) return false;
      // navigator.permissions may not support 'camera' on all browsers (Safari)
      try {
        const q = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        return q.state === "prompt";
      } catch {
        // assume needed — user can skip if not
        return true;
      }
    };

    checkCam().then((cam) => {
      camNeeded = cam;
      // Don't show if neither needs asking, and at least one already granted
      if (!notifNeeded && !camNeeded) {
        // Mark done so we don't re-check every nav
        if (
          (!supportsNotif || Notification.permission !== "default") &&
          !cam
        ) {
          window.localStorage.setItem(STORAGE_KEY, "done");
        }
        return;
      }
      // Small delay so the layout has time to paint first
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    });
  }, []);

  const finish = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "done");
    }
    setOpen(false);
  };

  const enableNotifications = async () => {
    if (!isPushSupported()) {
      toast.error("เบราเซอร์นี้ไม่รองรับการแจ้งเตือน");
      setNotifStatus("done");
      return;
    }
    setNotifStatus("pending");
    const existing = await getCurrentSubscriptionEndpoint();
    if (existing) {
      setNotifStatus("done");
      return;
    }
    const result = await subscribeToPush(vapidPublicKey);
    if (!result.ok) {
      toast.error(result.error);
      setNotifStatus("idle");
      return;
    }
    const saved = await savePushSubscription(result.payload);
    if (!saved.ok) {
      toast.error(saved.error);
      setNotifStatus("idle");
      return;
    }
    toast.success("เปิดการแจ้งเตือนแล้ว");
    setNotifStatus("done");
  };

  const enableCamera = async () => {
    if (
      !("mediaDevices" in navigator) ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      setCamStatus("done");
      return;
    }
    setCamStatus("pending");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      stream.getTracks().forEach((t) => t.stop());
      toast.success("อนุญาตกล้องแล้ว");
      setCamStatus("done");
    } catch {
      toast.error("ไม่ได้อนุญาตกล้อง (เปิดในตั้งค่าได้ภายหลัง)");
      setCamStatus("idle");
    }
  };

  const enableAll = async () => {
    await enableNotifications();
    await enableCamera();
    finish();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            อนุญาตเพื่อใช้งานเต็มที่
          </h2>
          <button
            type="button"
            onClick={finish}
            aria-label="ปิด"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">
          แอพต้องใช้สิทธิ์ต่อไปนี้เพื่อทำงานเต็มประสิทธิภาพ —
          อนุญาตได้เลย หรือเปิดในตั้งค่าภายหลังก็ได้
        </p>

        <ul className="space-y-2.5">
          <PermissionRow
            Icon={Bell}
            title="แจ้งเตือน"
            desc="รับ noti เมื่อถึงเวลาช่วยจำ มีบิลใกล้ครบ หรือมีคนแท็ก"
            status={notifStatus}
            onClick={enableNotifications}
          />
          <PermissionRow
            Icon={Camera}
            title="กล้อง / รูปภาพ"
            desc="ใช้ถ่ายรูปแนบในบันทึก/บิล/อัลบั้ม"
            status={camStatus}
            onClick={enableCamera}
          />
        </ul>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={finish}
            className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          >
            ภายหลัง
          </button>
          <button
            type="button"
            onClick={enableAll}
            className="flex-1 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 hover:bg-brand-700"
          >
            อนุญาตทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}

function PermissionRow({
  Icon,
  title,
  desc,
  status,
  onClick,
}: {
  Icon: typeof Bell;
  title: string;
  desc: string;
  status: Status;
  onClick: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-700 dark:bg-stone-800/40">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {title}
        </p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
          {desc}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={status !== "idle"}
        className={
          status === "done"
            ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
        }
      >
        {status === "done" ? (
          <Check className="size-4" />
        ) : status === "pending" ? (
          "..."
        ) : (
          "อนุญาต"
        )}
      </button>
    </li>
  );
}
