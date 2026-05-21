import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddItemForm } from "@/components/shopping/add-item-form";
import { ShoppingRow } from "@/components/shopping/shopping-row";
import { ClearChecked } from "@/components/shopping/clear-checked";

export default async function ShoppingPage() {
  const me = await requireUser();
  const t = await getTranslations("shopping");

  const items = await db.shoppingItem.findMany({
    orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
    include: {
      createdBy: { select: { name: true } },
      checkedBy: { select: { name: true } },
    },
  });

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        {checked.length > 0 && <ClearChecked count={checked.length} />}
      </div>

      <AddItemForm />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-stone-500">
          <ShoppingCart className="size-12 text-stone-300" />
          <p className="text-sm">ยังไม่มีของในรายการ</p>
        </div>
      ) : (
        <>
          {unchecked.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                ต้องซื้อ · {unchecked.length}
              </h2>
              <ul className="space-y-2">
                {unchecked.map((i) => (
                  <ShoppingRow
                    key={i.id}
                    item={i}
                    canDelete={i.createdById === me.id || me.role === "ADMIN"}
                  />
                ))}
              </ul>
            </section>
          )}
          {checked.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                ซื้อแล้ว · {checked.length}
              </h2>
              <ul className="space-y-2">
                {checked.map((i) => (
                  <ShoppingRow
                    key={i.id}
                    item={i}
                    canDelete={i.createdById === me.id || me.role === "ADMIN"}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
