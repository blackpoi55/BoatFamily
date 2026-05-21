"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { markParticipantPaid } from "@/app/actions/bills";
import { cn } from "@/lib/utils";

export function PaidToggle({
  billId,
  userId,
  paid,
  canToggle,
}: {
  billId: string;
  userId: string;
  paid: boolean;
  canToggle: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    if (!canToggle) return;
    startTransition(async () => {
      const r = await markParticipantPaid(billId, userId, !paid);
      if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending || !canToggle}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        paid
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        canToggle && "hover:opacity-80",
        !canToggle && "cursor-default",
      )}
    >
      {paid ? <Check className="size-3" /> : <X className="size-3" />}
      {paid ? "จ่ายแล้ว" : "ยังไม่จ่าย"}
    </button>
  );
}
