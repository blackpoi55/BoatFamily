import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BillForm } from "@/components/bills/bill-form";

export default async function NewBillPage() {
  const me = await requireUser();
  const members = await db.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-4">
      <Link
        href="/bills"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">เพิ่มบิลใหม่</h1>
      <BillForm members={members} currentUserId={me.id} />
    </div>
  );
}
