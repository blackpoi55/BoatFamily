import { NextResponse, type NextRequest } from "next/server";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { sendPushToUsers } from "@/lib/server-push";
import { computeNextFireAt } from "@/lib/reminders";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function broadcastNew(userIds: string[]) {
  if (userIds.length === 0) return;
  const supabase = createSupabaseServiceRoleClient();
  await Promise.all(
    Array.from(new Set(userIds)).map(async (uid) => {
      const channel = supabase.channel(`noti:user:${uid}`);
      await channel.send({ type: "broadcast", event: "new", payload: {} });
      await supabase.removeChannel(channel);
    }),
  );
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret === "change-me-to-a-random-string") return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const vercelHeader = request.headers.get("x-vercel-cron");
  if (vercelHeader === "1") return true;

  return false;
}

async function fireReminders(now: Date) {
  const due = await db.reminder.findMany({
    where: { enabled: true, nextFireAt: { not: null, lte: now } },
    include: { recipients: { select: { userId: true } } },
    take: 200,
  });

  let sent = 0;
  let failed = 0;
  const items: { id: string; title: string }[] = [];

  for (const r of due) {
    const userIds = r.recipients.map((x) => x.userId);
    const result =
      userIds.length > 0
        ? await sendPushToUsers(userIds, {
            title: r.title,
            body: r.description || "ถึงเวลาที่คุณตั้งไว้แล้ว",
            url: "/reminders",
            tag: `reminder:${r.id}`,
          })
        : { sent: 0, failed: 0 };
    sent += result.sent;
    failed += result.failed;

    const newNextFireAt =
      r.frequency === "ONCE"
        ? null
        : computeNextFireAt(r.startAt, r.frequency, now, r.endAt, now);

    await db.reminder.update({
      where: { id: r.id },
      data: {
        lastFiredAt: now,
        nextFireAt: newNextFireAt,
        enabled: r.frequency === "ONCE" ? false : r.enabled,
      },
    });

    await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: r.title,
        body: r.description || "ถึงเวลาที่คุณตั้งไว้แล้ว",
        url: "/reminders",
        category: "reminder",
      })),
    });
    await broadcastNew(userIds);

    items.push({ id: r.id, title: r.title });
  }

  return { count: items.length, sent, failed, items };
}

async function fireBillReminders(now: Date) {
  const bills = await db.bill.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL"] },
      nextDueDate: { not: null },
    },
    include: {
      participants: { select: { userId: true, paid: true } },
    },
    take: 200,
  });

  let sent = 0;
  let failed = 0;
  const items: { id: string; name: string; phase: string }[] = [];

  for (const b of bills) {
    if (!b.nextDueDate) continue;
    const due = b.nextDueDate;
    const notifyAt = addDays(due, -b.notifyDaysBefore);

    let phase: "advance" | "due" | null = null;
    if (now >= due) phase = "due";
    else if (now >= notifyAt) phase = "advance";
    if (!phase) continue;

    const tagKey = `bill:${b.id}:${phase}:${due.toISOString().slice(0, 10)}`;
    const already = await db.notification.findFirst({
      where: { category: "bill", body: { contains: tagKey } },
      select: { id: true },
    });
    if (already) continue;

    const unpaidUserIds = b.participants.filter((p) => !p.paid).map((p) => p.userId);
    if (unpaidUserIds.length === 0) continue;

    const dueDateStr = due.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
    const title =
      phase === "due" ? `⚠️ ครบกำหนด: ${b.name}` : `🔔 ใกล้ครบ: ${b.name}`;
    const body =
      phase === "due"
        ? `บิล ${b.name} ครบกำหนดวันนี้ (${b.amount} ${b.currency})`
        : `บิล ${b.name} ครบ ${dueDateStr} (อีก ${b.notifyDaysBefore} วัน)`;

    const result = await sendPushToUsers(unpaidUserIds, {
      title,
      body,
      url: `/bills/${b.id}`,
      tag: tagKey,
    });
    sent += result.sent;
    failed += result.failed;

    await db.notification.createMany({
      data: unpaidUserIds.map((userId) => ({
        userId,
        title,
        body: `${body}\n[${tagKey}]`,
        url: `/bills/${b.id}`,
        category: "bill",
      })),
    });
    await broadcastNew(unpaidUserIds);

    if (phase === "due" && b.frequency !== "ONCE") {
      const newNextDue = computeNextFireAt(due, b.frequency, now, null);
      await db.bill.update({
        where: { id: b.id },
        data: { nextDueDate: newNextDue },
      });
    } else if (phase === "due" && b.frequency === "ONCE") {
      await db.bill.update({
        where: { id: b.id },
        data: { status: "OVERDUE" },
      });
    }

    items.push({ id: b.id, name: b.name, phase });
  }

  return { count: items.length, sent, failed, items };
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const reminders = await fireReminders(now);
  const bills = await fireBillReminders(now);

  return NextResponse.json({
    ok: true,
    reminders,
    bills,
  });
}
