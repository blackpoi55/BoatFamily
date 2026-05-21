import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReminderForm } from "@/components/reminders/reminder-form";

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();

  const reminder = await db.reminder.findUnique({
    where: { id },
    include: {
      recipients: { include: { user: { select: { id: true } } } },
    },
  });
  if (!reminder) notFound();
  if (reminder.creatorId !== me.id && me.role !== "ADMIN") {
    redirect("/reminders");
  }
  if (reminder.frequency === "CUSTOM") redirect("/reminders");

  const members = await db.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-4">
      <Link
        href="/reminders"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">แก้ไขการแจ้งเตือน</h1>
      <ReminderForm
        members={members}
        currentUserId={me.id}
        reminder={{ ...reminder, frequency: reminder.frequency as "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" }}
      />
    </div>
  );
}
