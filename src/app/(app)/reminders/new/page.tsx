import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReminderForm } from "@/components/reminders/reminder-form";

export default async function NewReminderPage() {
  const me = await requireUser();
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
      <h1 className="text-xl font-bold">สร้างการแจ้งเตือนใหม่</h1>
      <ReminderForm members={members} currentUserId={me.id} />
    </div>
  );
}
