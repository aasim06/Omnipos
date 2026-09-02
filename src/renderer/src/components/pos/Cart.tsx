"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  RotateCcw,
  Printer,
  CreditCard,
  PauseCircle,
  Banknote,
  Smartphone,
  User,
  ShoppingBag,
} from "lucide-react";
import { CartLine, OrderStage } from "@/lib/types";
import { formatPKR } from "@/lib/utils";

interface CartProps {
  accent: "fastfood" | "minimart";
  flow: "staged" | "direct";
  lines: CartLine[];
  discountPercent: number;
  stage: OrderStage;
  onQtyChange: (productId: string, delta: number) => void;
  onRemoveLine: (productId: string) => void;
  onDiscountChange: (value: number) => void;
  onClear: () => void;
  onAdvance: () => void;
}

export function Cart({
  accent,
  flow,
  lines,
  discountPercent,
  stage,
  onQtyChange,
  onRemoveLine,
  onDiscountChange,
  onClear,
  onAdvance,
}: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [customerName, setCustomerName] = useState("");

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="w-80 xl:w-96 shrink-0 bg-[#161822] border border-[#232734] rounded-lg flex flex-col h-full p-4 shadow-2xl text-white no-scrollbar font-sans">
      {/* Cart Header */}
      <div className="flex items-center justify-between border-b border-[#232734] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-[#00c9a7]/10 text-[#00c9a7]">
            <ShoppingBag size={18} />
          </span>
          <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Checkout Cart{" "}
            <span className="text-xs font-mono font-normal text-[#8b92a0]">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1.5 rounded-md bg-[#222634] hover:bg-red-950/60 text-[#8b92a0] hover:text-red-400 transition"
            title="Reset Cart"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-md bg-[#222634] hover:bg-red-950/60 text-[#8b92a0] hover:text-red-400 transition"
            title="Clear All Items"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-1.5 mb-3">
        <label className="text-[11px] uppercase tracking-wider font-bold text-[#8b92a0]">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0e1015] rounded-md border border-[#232734]">
          <button
            type="button"
            onClick={() => setPaymentMethod("cash")}
            className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition ${
              paymentMethod === "cash"
                ? "bg-[#00c9a7] text-[#00201a] shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Banknote size={13} /> Cash
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition ${
              paymentMethod === "card"
                ? "bg-[#00c9a7] text-[#00201a] shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <CreditCard size={13} /> Card
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("credit")}
            className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition ${
              paymentMethod === "credit"
                ? "bg-[#00c9a7] text-[#00201a] shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Smartphone size={13} /> Udhaar
          </button>
        </div>
      </div>

      {/* Customer Reference */}
      <div className="space-y-1 mb-3">
        <label className="text-[11px] uppercase tracking-wider font-bold text-[#8b92a0] flex items-center gap-1">
          <User size={12} /> Customer Name / Ref (Optional)
        </label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Walk-In Customer"
          className="w-full bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3 py-2 text-xs text-white placeholder-[#585f70] outline-none transition"
        />
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 my-2 divide-y divide-[#232734]/60 no-scrollbar">
        {lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#8b92a0] py-10">
            <span className="text-3xl mb-2 opacity-40">🛒</span>
            <p className="text-xs font-bold text-white">Cart is empty</p>
            <p className="text-[10px] mt-0.5 text-[#585f70]">
              Click products on the left to add items
            </p>
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.productId} className="pt-2.5 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between font-medium text-xs">
                <span className="text-white truncate max-w-[180px] font-semibold">{line.name}</span>
                <span className="font-mono font-bold text-white">
                  {formatPKR(line.unitPrice * line.quantity)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8b92a0]">
                <span>{formatPKR(line.unitPrice)} each</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onQtyChange(line.productId, -1)}
                    className="w-5 h-5 rounded-md bg-[#222634] flex items-center justify-center hover:bg-[#343a4e] text-white transition"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-white text-xs">
                    {line.quantity}
                  </span>
                  <button
                    onClick={() => onQtyChange(line.productId, 1)}
                    className="w-5 h-5 rounded-md bg-[#222634] flex items-center justify-center hover:bg-[#343a4e] text-white transition"
                  >
                    <Plus size={11} />
                  </button>

                  <button
                    onClick={() => onRemoveLine(line.productId)}
                    className="ml-1.5 w-5 h-5 rounded-md bg-[#3e1b21] hover:bg-red-900 text-red-400 flex items-center justify-center transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary Totals */}
      <div className="border-t border-[#232734] pt-3 mt-auto space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-[#8b92a0]">
          <span>Subtotal:</span>
          <span className="text-white font-bold">{formatPKR(subtotal)}</span>
        </div>

        {discountPercent > 0 && (
          <div className="flex items-center justify-between text-[#8b92a0]">
            <span>Discount ({discountPercent}%):</span>
            <span className="text-red-400">-{formatPKR(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm font-bold pt-1.5 text-white border-t border-[#232734]/80">
          <span>Grand Total:</span>
          <span className="text-base text-[#00c9a7] font-extrabold">{formatPKR(grandTotal)}</span>
        </div>
      </div>

      {/* Discount (%) Field */}
      <div className="mt-3 space-y-1">
        <label className="text-[10px] text-[#8b92a0] uppercase tracking-wider font-bold block">
          Discount (%)
        </label>
        <input
          type="number"
          value={discountPercent}
          onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
          className="w-full bg-[#0e1015] border border-[#232734] focus:border-[#00c9a7] rounded-md px-3 py-1.5 text-xs font-mono text-white text-right outline-none transition"
          placeholder="0"
        />
      </div>

      {/* Action Buttons Row */}
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={() => {
              if (lines.length === 0) return;
              if (typeof window !== "undefined") {
                const heldList = JSON.parse(localStorage.getItem("pos_held_orders") || "[]");
                heldList.push({ id: `hold_${Date.now()}`, lines, grandTotal, date: new Date().toLocaleTimeString() });
                localStorage.setItem("pos_held_orders", JSON.stringify(heldList));
              }
              onClear();
              alert(`Order held on pause! Cart cleared for next customer.`);
            }}
            className="py-2.5 px-3 rounded-md bg-[#d97706]/20 hover:bg-[#d97706]/35 border border-[#d97706]/40 text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PauseCircle size={15} /> Hold Order
          </button>

          <button
            type="button"
            disabled={lines.length === 0}
            onClick={onAdvance}
            className="py-2.5 px-3 rounded-md bg-[#161822] hover:bg-[#232734] border border-[#232734] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition disabled:opacity-40"
          >
            <Printer size={14} /> Print Bill
          </button>
        </div>

        {/* Primary Main Check Out Button */}
        <button
          type="button"
          disabled={lines.length === 0}
          onClick={onAdvance}
          className="w-full py-3 px-4 rounded-md bg-[#00c9a7] hover:bg-[#00b093] text-[#00201a] text-sm font-extrabold transition flex items-center justify-center gap-2 shadow-lg shadow-[#00c9a7]/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CreditCard size={18} /> Check Out &amp; Pay ({formatPKR(grandTotal)})
        </button>
      </div>
    </div>
  );
}
