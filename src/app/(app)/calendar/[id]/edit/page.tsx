import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventForm } from "@/components/calendar/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();

  const event = await db.calendarEvent.findUnique({
    where: { id },
    include: { participants: { include: { user: { select: { id: true } } } } },
  });
  if (!event) notFound();
  if (event.creatorId !== me.id && me.role !== "ADMIN") redirect("/calendar");

  const members = await db.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-4">
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">แก้ไขกิจกรรม</h1>
      <EventForm members={members} currentUserId={me.id} event={event} />
    </div>
  );
}
