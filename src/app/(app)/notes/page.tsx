import Link from "next/link";
import { Plus, Lock, Globe2, Users, NotebookPen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { visibleNotesFor } from "@/app/actions/notes";
import { NoteCard } from "@/components/notes/note-card";
import { cn } from "@/lib/utils";

type Tab = "private" | "shared" | "tagged";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await requireUser();
  const t = await getTranslations("notes");
  const tn = await getTranslations("nav");

  const params = await searchParams;
  const tab: Tab =
    params.tab === "shared" ? "shared" : params.tab === "tagged" ? "tagged" : "private";

  const notes = await visibleNotesFor(me.id, tab);

  const tabs: { key: Tab; label: string; Icon: typeof Lock }[] = [
    { key: "private", label: t("private"), Icon: Lock },
    { key: "shared", label: t("shared"), Icon: Globe2 },
    { key: "tagged", label: t("tagged"), Icon: Users },
  ];

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{tn("notes")}</h1>
        <Link
          href="/notes/new"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all active:scale-95 gradient-brand"
        >
          <Plus className="size-4" /> {t("newNote")}
        </Link>
      </div>

      <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 dark:border-stone-700 dark:bg-stone-800">
        {tabs.map(({ key, label, Icon }) => (
          <Link
            key={key}
            href={`/notes?tab=${key}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-900 dark:text-stone-400",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-stone-500">
          <NotebookPen className="size-12 text-stone-300" />
          <p className="text-sm">
            ยังไม่มีบันทึก — กด &ldquo;{t("newNote")}&rdquo; เพื่อเริ่ม
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
