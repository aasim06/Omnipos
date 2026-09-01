"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useStock } from "@/lib/useStock";
import { ModuleKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ label: string; value: ModuleKey | "all" }> = [
  { label: "All", value: "all" },
  { label: "Fast Food", value: "fastfood" },
  { label: "Mini Mart", value: "minimart" },
];

export default function StockHistoryPage() {
  const { movements } = useStock();
  const [filter, setFilter] = useState<ModuleKey | "all">("all");

  const filtered = movements.filter((m) => filter === "all" || m.module === filter);

  return (
    <div className="p-8">
      <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Stock</p>
      <h1 className="font-display text-2xl mb-6">Movement History</h1>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "text-sm px-3 py-1.5 rounded-md border",
              filter === f.value
                ? "border-transparent bg-surface-2 text-text"
                : "border-border text-text-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-text-muted">No stock movements yet.</Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {filtered.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {m.type === "in" ? (
                  <ArrowDownToLine size={16} className="text-fastfood" />
                ) : (
                  <ArrowUpFromLine size={16} className="text-minimart" />
                )}
                <div>
                  <p className="text-sm">{m.productName}</p>
                  <p className="text-xs text-text-muted">
                    {m.module === "fastfood" ? "Fast Food" : "Mini Mart"}
                    {m.reason ? ` \u00b7 ${m.reason}` : ""}
                    {m.note ? ` \u00b7 ${m.note}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">
                  {m.type === "in" ? "+" : "-"}
                  {m.quantity}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(m.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
