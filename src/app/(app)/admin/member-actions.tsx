"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import {
  approveUser,
  rejectUser,
  deleteUser,
  toggleAdmin,
} from "./actions";
import { Button } from "@/components/ui/button";
import { confirm as swalConfirm } from "@/lib/swal";

type Props = {
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  role: "ADMIN" | "MEMBER";
};

export function MemberActions({ userId, status, role }: Props) {
  const [isPending, startTransition] = useTransition();

  const run = (
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const r = await fn(userId);
      if (r.ok) toast.success(successMessage);
      else toast.error(r.error ?? "เกิดข้อผิดพลาด");
    });
  };

  const handleDelete = async () => {
    const ok = await swalConfirm({
      title: "ลบสมาชิกถาวร?",
      text: "ข้อมูลทั้งหมดของสมาชิกจะหายไปด้วย",
      confirmText: "ลบสมาชิก",
      danger: true,
    });
    if (!ok) return;
    run(deleteUser, "ลบสมาชิกแล้ว");
  };

  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(approveUser, "อนุมัติสมาชิกแล้ว")}
        >
          <Check className="size-4" /> อนุมัติ
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => run(rejectUser, "ปฏิเสธสมาชิกแล้ว")}
        >
          <X className="size-4" /> ปฏิเสธ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          run(
            toggleAdmin,
            role === "ADMIN" ? "ลดเป็นสมาชิกแล้ว" : "เลื่อนเป็นผู้ดูแลแล้ว",
          )
        }
      >
        {role === "ADMIN" ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
        {role === "ADMIN" ? "ลดสิทธิ์" : "ทำเป็น Admin"}
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={isPending}
        onClick={handleDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
