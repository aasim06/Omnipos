"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ModuleKey, Product, StockMovementType } from "@/lib/types";
import { useProducts } from "@/lib/useProducts";
import { formatPKR } from "@/lib/utils";
import { Package, ArrowRight, Sparkles, CheckCircle2, Search } from "lucide-react";

interface StockFormProps {
  type: StockMovementType;
  onSubmit: (data: {
    module: ModuleKey;
    productName: string;
    category?: string;
    quantity: number;
    unitCost?: number;
    unitPrice?: number;
    reason?: string;
    note?: string;
  }) => void;
}

const OUT_REASONS = ["Sale", "Damage", "Waste", "Adjustment"];

export function StockForm({ type, onSubmit }: StockFormProps) {
  const module: ModuleKey = "minimart";
  const { products } = useProducts(module);

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("General");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [reason, setReason] = useState(OUT_REASONS[0]);
  const [note, setNote] = useState("");
  const [isManualName, setIsManualName] = useState(false);

  // Find currently selected existing product
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.openingStock || 0 : 0;

  // Auto-fill when existing product is selected
  useEffect(() => {
    if (selectedProduct && !isManualName) {
      setProductName(selectedProduct.name);
      setCategory(selectedProduct.category || "General");
      setUnitCost(selectedProduct.costPrice ? String(selectedProduct.costPrice) : "");
      setUnitPrice(selectedProduct.price ? String(selectedProduct.price) : "");
    }
  }, [selectedProductId, selectedProduct, isManualName]);

  const qtyNum = Number(quantity) || 0;
  const costNum = Number(unitCost) || 0;
  const priceNum = Number(unitPrice) || 0;

  const newTotalStock = currentStock + qtyNum;
  const totalCostBatch = qtyNum * costNum;
  const totalRetailBatch = qtyNum * priceNum;
  const batchProfit = totalRetailBatch - totalCostBatch;

  function handleProductSelect(id: string) {
    if (id === "__new__") {
      setIsManualName(true);
      setSelectedProductId("");
      setProductName("");
      setCategory("General");
      setUnitCost("");
      setUnitPrice("");
    } else {
      setIsManualName(false);
      setSelectedProductId(id);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalName = isManualName ? productName.trim() : selectedProduct ? selectedProduct.name : productName.trim();
    if (!finalName || !qtyNum) return;

    onSubmit({
      module,
      productName: finalName,
      category: category.trim() || "General",
      quantity: qtyNum,
      unitCost: type === "in" ? costNum : undefined,
      unitPrice: type === "in" ? priceNum : undefined,
      reason: type === "out" ? reason : undefined,
      note: note.trim() || undefined,
    });

    // Clean reset
    setSelectedProductId("");
    setIsManualName(false);
    setProductName("");
    setQuantity("");
    setUnitCost("");
    setUnitPrice("");
    setNote("");
  }

  const accent = type === "in" ? "minimart" : "danger";

  return (
    <Card className="p-6 space-y-6 w-full bg-[#161822] border-[#232734] rounded-lg text-white shadow-xl font-sans">
      {/* Header Helper Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md bg-[#0e1015] border border-[#232734]">
        <div className="flex items-center gap-2 text-xs text-[#8b92a0]">
          <Sparkles size={16} className="text-[#00c9a7]" />
          <span>
            Select an <strong className="text-white">Existing Item</strong> from your store catalog to replenish stock, or enter a new item name.
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleProductSelect(isManualName ? "" : "__new__")}
          className="px-3 py-1.5 rounded bg-[#1f2432] hover:bg-[#282f42] text-xs font-semibold text-[#00c9a7] border border-[#232734] transition shrink-0"
        >
          {isManualName ? "📋 Select Existing Item" : "✍️ Type Custom Item"}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Selector / Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
              Product / Item Name *
            </label>

            {!isManualName ? (
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white outline-none transition cursor-pointer"
              >
                <option value="">-- Choose Item From Store Catalog ({products.length}) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category}) — Stock: {p.openingStock || 0} units @ Rs. {p.price}
                  </option>
                ))}
                <option value="__new__">➕ Type New Product Name...</option>
              </select>
            ) : (
              <input
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white outline-none transition"
                placeholder="e.g. Fresh Milk / Potato Chips"
              />
            )}
          </div>

          {/* Category Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
              Category
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white outline-none transition"
              placeholder="e.g. Toys / Grocery / Snacks"
            />
          </div>
        </div>

        {/* Live Stock Addition Preview Badge */}
        {selectedProduct && type === "in" && (
          <div className="p-3.5 rounded-md bg-[#00c9a7]/10 border border-[#00c9a7]/30 flex flex-wrap items-center justify-between text-xs font-mono text-white gap-2">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-[#00c9a7]" />
              <span>
                Current Stock: <strong className="text-white font-bold">{currentStock} units</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#00c9a7] font-bold">
                + {qtyNum} incoming
              </span>
              <ArrowRight size={14} className="text-[#8b92a0]" />
              <span>
                New Inventory Total: <strong className="text-[#00c9a7] font-bold text-sm">{newTotalStock} units</strong>
              </span>
            </div>
          </div>
        )}

        {/* 3-Column Stock Quantity & Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
              Stock Quantity *
            </label>
            <input
              required
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white font-mono outline-none transition"
              placeholder="e.g. 50"
            />
          </div>

          {type === "in" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
                  Unit Cost Price (PKR)
                </label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white font-mono outline-none transition"
                  placeholder="Purchase rate (e.g. 350)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
                  Unit Retail Price (PKR)
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white font-mono outline-none transition"
                  placeholder="Selling rate (e.g. 550)"
                />
              </div>
            </>
          )}
        </div>

        {/* Live Financial Batch Valuation Card */}
        {type === "in" && qtyNum > 0 && costNum > 0 && (
          <div className="p-4 rounded-md bg-[#0e1015] border border-[#232734] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#8b92a0]">
              <span>Batch Purchase Investment:</span>
              <span className="text-white font-bold">{formatPKR(totalCostBatch)}</span>
            </div>
            {priceNum > 0 && (
              <div className="flex justify-between text-[#8b92a0]">
                <span>Expected Retail Valuation:</span>
                <span className="text-emerald-400 font-bold">{formatPKR(totalRetailBatch)}</span>
              </div>
            )}
            {priceNum > costNum && (
              <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-[#232734]">
                <span>Expected Gross Margin:</span>
                <span>+{formatPKR(batchProfit)}</span>
              </div>
            )}
          </div>
        )}

        {type === "out" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white outline-none"
            >
              {OUT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0]">
            Note / Supplier Remarks (Optional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3.5 py-2.5 text-sm text-white outline-none transition"
            placeholder="Vendor name, batch #, invoice ref..."
          />
        </div>

        <Button type="submit" variant={accent} className="w-full text-xs font-bold py-3 rounded-md mt-2 shadow-lg">
          Record {type === "in" ? "Stock In & Update Inventory" : "Stock Out"}
        </Button>
      </form>
    </Card>
  );
}
