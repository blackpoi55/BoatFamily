import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BillForm } from "@/components/bills/bill-form";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();

  const bill = await db.bill.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true } } } },
    },
  });
  if (!bill) notFound();
  if (bill.creatorId !== me.id && me.role !== "ADMIN") redirect(`/bills/${id}`);

  const members = await db.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-4">
      <Link
        href={`/bills/${id}`}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">แก้ไขบิล</h1>
      <BillForm members={members} currentUserId={me.id} bill={bill} />
    </div>
  );
}
