"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { addShoppingItem } from "@/app/actions/shopping";

export function AddItemForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const r = await addShoppingItem(formData);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      formRef.current?.reset();
    });
  };

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex-1 min-w-[160px]">
        <input
          name="name"
          required
          maxLength={150}
          placeholder="ชื่อของ..."
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-950"
        />
      </div>
      <div className="w-24">
        <input
          name="quantity"
          maxLength={50}
          placeholder="จำนวน"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-950"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex h-10 items-center gap-1 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        เพิ่ม
      </button>
    </form>
  );
}
