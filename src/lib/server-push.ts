import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";

let configured = false;
function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure();
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { ok: true as const, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const expired: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
        sent++;
      } catch (err) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expired.push(sub.endpoint);
        }
      }
    }),
  );

  if (expired.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { endpoint: { in: expired } },
    });
  }

  return { ok: true as const, sent, failed };
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const results = await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
  const sent = results.reduce((s, r) => s + r.sent, 0);
  const failed = results.reduce((s, r) => s + r.failed, 0);
  return { ok: true as const, sent, failed };
}
