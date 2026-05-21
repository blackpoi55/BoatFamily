import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock, Globe2, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getNoteWithComments } from "@/app/actions/notes";
import { CommentForm } from "@/components/notes/comment-form";
import { NoteActions, DeleteCommentButton } from "@/components/notes/note-actions";
import { ImageGrid } from "@/components/shared/image-grid";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const colorClasses: Record<string, string> = {
  yellow: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
  blue: "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900",
  green: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
  pink: "bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900",
  purple: "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900",
  stone: "bg-stone-50 border-stone-200 dark:bg-stone-900 dark:border-stone-800",
};

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;
  const note = await getNoteWithComments(id);
  if (!note) notFound();

  const canEdit = note.authorId === me.id || me.role === "ADMIN";
  const VisibilityIcon =
    note.visibility === "PRIVATE" ? Lock : note.visibility === "SHARED" ? Globe2 : Users;
  const visibilityLabel =
    note.visibility === "PRIVATE"
      ? "ส่วนตัว"
      : note.visibility === "SHARED"
        ? "รวม"
        : "เฉพาะคนที่แท็ก";

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/notes"
              className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
            >
              <ChevronLeft className="size-4" /> กลับ
            </Link>
            <NoteActions noteId={note.id} pinned={note.pinned} canEdit={canEdit} />
          </div>

          <article
            className={cn(
              "rounded-2xl border p-4",
              colorClasses[note.color ?? "stone"],
            )}
          >
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
              {note.title}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <Avatar
                  name={note.author.name}
                  src={note.author.avatarUrl}
                  size="xs"
                />
                {note.author.name}
              </span>
              <span className="flex items-center gap-1">
                <VisibilityIcon className="size-3" />
                {visibilityLabel}
              </span>
              <span>
                {format(note.updatedAt, "d MMM yyyy HH:mm", { locale: dateLocale })}
              </span>
            </div>

            {note.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.tags.map((t) => (
                  <span
                    key={t.user.id}
                    className="rounded-full bg-stone-200/80 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-700/80 dark:text-stone-200"
                  >
                    @{t.user.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 whitespace-pre-wrap text-base text-stone-800 dark:text-stone-200">
              {note.content}
            </div>

            {note.attachments.length > 0 && (
              <div className="mt-4">
                <ImageGrid urls={note.attachments} />
              </div>
            )}
          </article>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              ความคิดเห็น ({note.comments.length})
            </h2>

            {note.comments.length === 0 ? (
              <p className="text-sm text-stone-400">ยังไม่มีความคิดเห็น</p>
            ) : (
              <ul className="space-y-2">
                {note.comments.map((c) => {
                  const canDelete = c.authorId === me.id || me.role === "ADMIN";
                  return (
                    <li
                      key={c.id}
                      className="group flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                    >
                      <Avatar
                        name={c.author.name}
                        src={c.author.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {c.author.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {formatDistanceToNow(c.createdAt, {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                        {c.content && (
                          <p className="mt-0.5 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-300">
                            {c.content}
                          </p>
                        )}
                        {c.attachments.length > 0 && (
                          <div className="mt-2 max-w-xs">
                            <ImageGrid urls={c.attachments} />
                          </div>
                        )}
                      </div>
                      {canDelete && <DeleteCommentButton commentId={c.id} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950">
        <CommentForm noteId={note.id} />
      </div>
    </div>
  );
}
