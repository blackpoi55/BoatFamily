import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/photos/album-form";

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const album = await db.photoAlbum.findUnique({ where: { id } });
  if (!album) notFound();
  if (album.creatorId !== me.id && me.role !== "ADMIN") redirect(`/photos/${id}`);

  return (
    <div className="space-y-4 p-4">
      <Link
        href={`/photos/${id}`}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">แก้ไขอัลบั้ม</h1>
      <AlbumForm album={album} />
    </div>
  );
}
