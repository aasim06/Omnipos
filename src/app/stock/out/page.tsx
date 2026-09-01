"use client";

import { StockForm } from "@/components/stock/StockForm";
import { useStock } from "@/lib/useStock";
import { uid } from "@/lib/utils";

export default function StockOutPage() {
  const { record } = useStock();

  return (
    <div className="p-8 max-w-2xl">
      <p className="text-minimart text-xs uppercase tracking-wide font-medium">Stock</p>
      <h1 className="font-display text-2xl mb-6">Stock Out</h1>
      <StockForm
        type="out"
        onSubmit={(data) =>
          record({
            module: data.module,
            productId: uid("item_"),
            productName: data.productName,
            type: "out",
            quantity: data.quantity,
            reason: data.reason,
            note: data.note,
          })
        }
      />
    </div>
  );
}
