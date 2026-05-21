import Link from "next/link";
import { Plus, Images } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function PhotosPage() {
  await requireUser();
  const t = await getTranslations("photos");
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;

  const albums = await db.photoAlbum.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      creator: { select: { name: true } },
      _count: { select: { photos: true } },
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Link
          href="/photos/new"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all active:scale-95 gradient-brand"
        >
          <Plus className="size-4" /> {t("newAlbum")}
        </Link>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-stone-500">
          <Images className="size-12 text-stone-300" />
          <p className="text-sm">ยังไม่มีอัลบั้ม</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((a) => (
            <Link
              key={a.id}
              href={`/photos/${a.id}`}
              className="block overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800">
                {a.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.coverUrl}
                    alt={a.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-stone-400">
                    <Images className="size-8" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 font-semibold">{a.title}</h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  {a._count.photos} รูป ·{" "}
                  {a.eventDate
                    ? format(a.eventDate, "d MMM yyyy", { locale: dateLocale })
                    : format(a.createdAt, "d MMM yyyy", { locale: dateLocale })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
