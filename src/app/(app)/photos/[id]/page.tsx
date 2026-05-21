import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { DeleteAlbumButton } from "@/components/photos/delete-album";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const album = await db.photoAlbum.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      photos: {
        orderBy: { createdAt: "desc" },
        select: { id: true, url: true, uploaderId: true },
      },
    },
  });
  if (!album) notFound();

  const canEdit = album.creatorId === me.id || me.role === "ADMIN";

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Link
            href="/photos"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <ChevronLeft className="size-4" /> กลับ
          </Link>
          {canEdit && (
            <div className="flex items-center gap-1">
              <Link
                href={`/photos/${album.id}/edit`}
                className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="edit"
              >
                <Pencil className="size-4" />
              </Link>
              <DeleteAlbumButton albumId={album.id} />
            </div>
          )}
        </div>

        <header>
          <h1 className="text-xl font-bold">{album.title}</h1>
          {album.description && (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {album.description}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
            <Calendar className="size-3" />
            {album.eventDate
              ? format(album.eventDate, "d MMM yyyy", { locale: dateLocale })
              : format(album.createdAt, "d MMM yyyy", { locale: dateLocale })}
            <span>· โดย {album.creator.name}</span>
            <span>· {album.photos.length} รูป</span>
          </div>
        </header>

        <PhotoUploader albumId={album.id} />

        {album.photos.length > 0 ? (
          <PhotoGrid
            photos={album.photos}
            currentUserId={me.id}
            isAdmin={me.role === "ADMIN"}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900">
            ยังไม่มีรูป — กดอัพรูปด้านบนเพื่อเริ่ม
          </div>
        )}
      </div>
    </div>
  );
}
