import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { MemberActions } from "./member-actions";
import { DangerZone } from "./danger-zone";
import { Avatar } from "@/components/ui/avatar";

export default async function AdminPage() {
  await requireAdmin();

  const [users, messageCount] = await Promise.all([
    db.user.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.message.count(),
  ]);

  const pending = users.filter((u) => u.status === "PENDING");
  const approved = users.filter((u) => u.status === "APPROVED");
  const others = users.filter(
    (u) => u.status === "REJECTED" || u.status === "SUSPENDED",
  );

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-center gap-3">
        <ShieldCheck className="size-7 text-brand-600" />
        <div>
          <h1 className="text-xl font-bold">จัดการสมาชิกครอบครัว</h1>
          <p className="text-sm text-stone-500">อนุมัติ / ลบ / กำหนดสิทธิ์</p>
        </div>
      </header>

      {pending.length > 0 && (
        <section>
          <SectionTitle title="รออนุมัติ" count={pending.length} accent="amber" />
          <ul className="space-y-2">
            {pending.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle title="สมาชิก" count={approved.length} accent="emerald" />
        <ul className="space-y-2">
          {approved.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </ul>
      </section>

      {others.length > 0 && (
        <section>
          <SectionTitle title="ถูกระงับ / ปฏิเสธ" count={others.length} accent="stone" />
          <ul className="space-y-2">
            {others.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </ul>
        </section>
      )}

      <DangerZone messageCount={messageCount} />
    </div>
  );
}

function SectionTitle({
  title,
  count,
  accent,
}: {
  title: string;
  count: number;
  accent: "amber" | "emerald" | "stone";
}) {
  const colors = {
    amber: "bg-amber-100 text-amber-800",
    emerald: "bg-emerald-100 text-emerald-800",
    stone: "bg-stone-200 text-stone-700",
  } as const;
  return (
    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
      {title}
      <span className={`rounded-full px-2 py-0.5 text-xs ${colors[accent]}`}>
        {count}
      </span>
    </h2>
  );
}

function UserCard({
  user,
}: {
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    role: "ADMIN" | "MEMBER";
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  };
}) {
  return (
    <li className="surface flex items-center gap-3 rounded-2xl p-3">
      <Avatar name={user.name} src={user.avatarUrl} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{user.name}</span>
          {user.role === "ADMIN" && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-700/20 dark:text-brand-300">
              Admin
            </span>
          )}
        </div>
        <div className="truncate text-xs text-stone-500">@{user.username}</div>
      </div>
      <MemberActions userId={user.id} status={user.status} role={user.role} />
    </li>
  );
}
