import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NoteForm } from "@/components/notes/note-form";

export default async function NewNotePage() {
  const me = await requireUser();
  const members = await db.user.findMany({
    where: { status: "APPROVED", NOT: { id: me.id } },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-4">
      <Link
        href="/notes"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">บันทึกใหม่</h1>
      <NoteForm members={members} />
    </div>
  );
}
