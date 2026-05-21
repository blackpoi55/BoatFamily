import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

type Props = {
  name: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function UserMenu({ name, avatarUrl, isAdmin }: Props) {
  return (
    <Link
      href="/more"
      className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
      aria-label={name}
    >
      <Avatar
        name={name}
        src={avatarUrl}
        size="md"
        className="!size-8 ring-2 ring-brand-500/20"
      />
      {isAdmin && (
        <span className="hidden rounded-full bg-gradient-to-r from-violet-500 to-violet-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white sm:inline">
          Admin
        </span>
      )}
    </Link>
  );
}
