"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ShoppingCart, History, Package, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ModuleKey, Product } from "@/lib/types";
import { formatPKR } from "@/lib/utils";
import { AddProductForm } from "@/components/admin/AddProductForm";

interface ProductGridProps {
  module: ModuleKey;
  accent: "fastfood" | "minimart";
  products: Product[];
  onAdd: (data: { name: string; price: number; category: string; description?: string; imageUrl?: string }) => void;
  onRemove: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({
  module,
  accent,
  products,
  onAdd,
  onRemove,
  onAddToCart,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showFullAdminModal, setShowFullAdminModal] = useState(false);

  // Extract unique categories
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // Fallback image based on product name / category
  const getFallbackImage = (p: Product) => {
    if (p.imageUrl) return p.imageUrl;
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes("burger")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80";
    if (nameLower.includes("pizza")) return "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80";
    if (nameLower.includes("fries")) return "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80";
    if (nameLower.includes("strip") || nameLower.includes("nugget")) return "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80";
    if (nameLower.includes("wrap")) return "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80";
    if (nameLower.includes("milk") || nameLower.includes("water")) return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80";
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";
  };

  return (
    <div className="space-y-5 no-scrollbar">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232734] pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            All Items
          </h1>
          <p className="text-xs text-[#8b92a0] mt-0.5">{products.length} Item(s) available</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            className="text-xs rounded-md border-[#ff6b00]/50 text-[#ff6b00] hover:bg-[#ff6b00]/10 px-3.5 py-1.5 font-bold"
            onClick={() => setShowFullAdminModal(true)}
          >
            <Plus size={14} /> Add Product
          </Button>

          <Link href="/stock/history">
            <Button variant="neutral" className="text-xs rounded-md border-[#0284c7]/40 text-[#38bdf8] hover:bg-[#0284c7]/20 px-3 py-1.5">
              <History size={14} /> Order History
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? accent === "fastfood"
                    ? "bg-fastfood text-[#1a1300]"
                    : "bg-minimart text-[#00201a]"
                  : "bg-[#161822] text-[#8b92a0] hover:text-white border border-[#232734]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FULL SCREEN ADMIN ADD PRODUCT MODAL matching Reference Screenshot */}
      {showFullAdminModal && (
        <div className="fixed inset-y-0 right-0 left-64 z-40 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 no-scrollbar">
          <div className="w-full relative">
            <button
              onClick={() => setShowFullAdminModal(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-[#1e222d] text-white hover:text-red-400 border border-[#232734]"
            >
              <X size={18} />
            </button>

            <AddProductForm
              onSaved={() => setShowFullAdminModal(false)}
              onCancel={() => setShowFullAdminModal(false)}
            />
          </div>
        </div>
      )}

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center text-[#8b92a0] bg-[#161822] border-[#232734] rounded-md">
          <Package size={40} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No items found in this category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const img = getFallbackImage(p);

            return (
              <div
                key={p.id}
                className="rounded-md border border-[#232734] bg-[#151720] overflow-hidden flex flex-col justify-between group hover:border-[#ff6b00]/50 transition-all duration-300 shadow-md relative"
              >
                {/* Delete Button overlay on hover */}
                <button
                  onClick={() => onRemove(p.id)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-black/60 text-white/70 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-black/90 transition flex items-center justify-center"
                  title="Delete item"
                >
                  <Trash2 size={12} />
                </button>

                {/* Product Image Header */}
                <div className="h-40 w-full relative overflow-hidden bg-[#1e222d] rounded-t-md">
                  <img
                    src={img}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151720] via-transparent to-transparent opacity-80" />
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#8b92a0] mt-0.5 line-clamp-1">
                      {p.description || `${p.category} item`}
                    </p>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222634]">
                    <span className="font-mono font-extrabold text-sm text-[#33c9a8] tracking-tight">
                      {formatPKR(p.price)}
                    </span>

                    <button
                      onClick={() => onAddToCart(p)}
                      className="px-3 py-1.5 rounded-md bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <ShoppingCart size={13} /> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
