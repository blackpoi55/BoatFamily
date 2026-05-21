import Link from "next/link";
import { Pin, Lock, Globe2, Users, MessageSquare, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { getLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const colorClasses: Record<string, string> = {
  yellow: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/70 dark:from-amber-950/40 dark:to-amber-900/20 dark:border-amber-900/40",
  blue: "bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200/70 dark:from-sky-950/40 dark:to-sky-900/20 dark:border-sky-900/40",
  green: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/70 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-900/40",
  pink: "bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200/70 dark:from-pink-950/40 dark:to-pink-900/20 dark:border-pink-900/40",
  purple: "bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200/70 dark:from-violet-950/40 dark:to-violet-900/20 dark:border-violet-900/40",
  stone: "bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800",
};

type Note = {
  id: string;
  title: string;
  content: string;
  attachments: string[];
  visibility: "PRIVATE" | "SHARED" | "TAGGED";
  color: string | null;
  pinned: boolean;
  updatedAt: Date;
  author: { id: string; name: string; avatarUrl?: string | null };
  tags: { user: { id: string; name: string } }[];
  _count: { comments: number };
};

export async function NoteCard({ note }: { note: Note }) {
  const locale = await getLocale();
  const dateLocale = locale === "th" ? th : enUS;
  const colorKey = note.color ?? "stone";
  const VisibilityIcon =
    note.visibility === "PRIVATE" ? Lock : note.visibility === "SHARED" ? Globe2 : Users;
  const thumb = note.attachments[0];

  return (
    <Link
      href={`/notes/${note.id}`}
      className={cn(
        "lift block overflow-hidden rounded-3xl border shadow-sm",
        colorClasses[colorKey],
      )}
    >
      {thumb && (
        <div className="aspect-[3/2] w-full overflow-hidden bg-stone-200 dark:bg-stone-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 flex-1 text-base font-semibold text-stone-900 dark:text-stone-50">
            {note.title}
          </h3>
          {note.pinned && (
            <Pin className="size-4 shrink-0 fill-amber-500 text-amber-500" />
          )}
        </div>
        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-stone-600 dark:text-stone-300">
          {note.content}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Avatar name={note.author.name} src={note.author.avatarUrl} size="xs" />
            <span className="truncate">{note.author.name}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {note.attachments.length > 0 && (
              <span className="flex items-center gap-0.5">
                <ImageIcon className="size-3" />
                {note.attachments.length}
              </span>
            )}
            {note._count.comments > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="size-3" />
                {note._count.comments}
              </span>
            )}
            <VisibilityIcon className="size-3.5" />
            <span>{format(note.updatedAt, "d MMM", { locale: dateLocale })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
