import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AlbumForm } from "@/components/photos/album-form";

export default async function NewAlbumPage() {
  await requireUser();
  return (
    <div className="space-y-4 p-4">
      <Link
        href="/photos"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">สร้างอัลบั้มใหม่</h1>
      <AlbumForm />
    </div>
  );
}
