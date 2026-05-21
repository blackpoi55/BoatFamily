import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NoteForm } from "@/components/notes/note-form";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();

  const note = await db.note.findUnique({
    where: { id },
    include: { tags: { include: { user: { select: { id: true } } } } },
  });
  if (!note) notFound();
  if (note.authorId !== me.id && me.role !== "ADMIN") redirect(`/notes/${id}`);

  const members = await db.user.findMany({
    where: { status: "APPROVED", NOT: { id: me.id } },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-4">
      <Link
        href={`/notes/${id}`}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">แก้ไขบันทึก</h1>
      <NoteForm members={members} note={note} />
    </div>
  );
}
