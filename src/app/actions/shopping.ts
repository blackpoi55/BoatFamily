"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const addSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อของก่อน").max(150),
  quantity: z.string().trim().max(50).optional().or(z.literal("")),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function addShoppingItem(formData: FormData) {
  const me = await requireUser();
  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || "",
    category: formData.get("category") || "",
    note: formData.get("note") || "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  await db.shoppingItem.create({
    data: {
      createdById: me.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity || null,
      category: parsed.data.category || null,
      note: parsed.data.note || null,
    },
  });
  revalidatePath("/shopping");
  return { ok: true as const };
}

export async function toggleShoppingItem(itemId: string) {
  const me = await requireUser();
  const item = await db.shoppingItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, error: "ไม่พบของในรายการ" };

  const checked = !item.checked;
  await db.shoppingItem.update({
    where: { id: itemId },
    data: {
      checked,
      checkedById: checked ? me.id : null,
      checkedAt: checked ? new Date() : null,
    },
  });
  revalidatePath("/shopping");
  return { ok: true as const };
}

export async function deleteShoppingItem(itemId: string) {
  const me = await requireUser();
  const item = await db.shoppingItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, error: "ไม่พบของในรายการ" };
  if (item.createdById !== me.id && me.role !== "ADMIN") {
    return { ok: false as const, error: "ไม่มีสิทธิ์ลบ" };
  }
  await db.shoppingItem.delete({ where: { id: itemId } });
  revalidatePath("/shopping");
  return { ok: true as const };
}

export async function clearCheckedItems() {
  await requireUser();
  await db.shoppingItem.deleteMany({ where: { checked: true } });
  revalidatePath("/shopping");
  return { ok: true as const };
}
