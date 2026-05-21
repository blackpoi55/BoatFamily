"use client";

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; ++i) view[i] = raw.charCodeAt(i);
  return buf;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.error("SW register failed", err);
    return null;
  }
}

export type PushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
};

export async function subscribeToPush(vapidPublicKey: string): Promise<
  | { ok: true; payload: PushSubscriptionPayload }
  | { ok: false; error: string }
> {
  if (!isPushSupported()) return { ok: false, error: "เบราเซอร์นี้ไม่รองรับการแจ้งเตือน" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "คุณไม่ได้อนุญาตการแจ้งเตือน" };
  }

  const reg = (await navigator.serviceWorker.ready) ?? (await registerServiceWorker());
  if (!reg) return { ok: false, error: "ติดตั้ง service worker ไม่สำเร็จ" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(vapidPublicKey),
    });
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, error: "subscription incomplete" };
  }

  return {
    ok: true,
    payload: {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      userAgent: navigator.userAgent,
    },
  };
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}

export async function getCurrentSubscriptionEndpoint(): Promise<string | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  return sub?.endpoint ?? null;
}
