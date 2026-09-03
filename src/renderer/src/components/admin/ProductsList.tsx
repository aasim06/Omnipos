"use client";

import { useState } from "react";
import { Search, Edit3, Trash2, Plus, Sparkles, Filter, ArrowUpDown } from "lucide-react";
import { ModuleKey, Product } from "@/lib/types";
import { useProducts } from "@/lib/useProducts";
import { formatPKR } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

interface ProductsListProps {
  module?: ModuleKey;
  onAddProductClick: () => void;
  onEditProduct?: (product: Product) => void;
}

export function ProductsList({ module = "minimart", onAddProductClick, onEditProduct }: ProductsListProps) {
  const { products, removeProduct } = useProducts(module);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "name">("newest");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Extract unique categories for this module
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products by search term & category
  const filteredProducts = products
    .filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              (v.skuCode && v.skuCode.toLowerCase().includes(q)) ||
              (v.label && v.label.toLowerCase().includes(q))
          ));
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Handle delete
  function handleDelete(p: Product) {
    setProductToDelete(p);
  }

  function confirmDeleteProduct() {
    if (!productToDelete) return;
    removeProduct(productToDelete.id);
    showToast(`Deleted "${productToDelete.name}"`);
    setProductToDelete(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Fallback image helper
  const getFallbackImage = (p: Product) => {
    if (p.imageUrl) return p.imageUrl;
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes("doodh") || nameLower.includes("milk"))
      return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80";
    if (nameLower.includes("jamun") || nameLower.includes("barfi") || nameLower.includes("meethai"))
      return "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80";
    if (nameLower.includes("water") || nameLower.includes("drink"))
      return "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=300&q=80";
    if (nameLower.includes("roti") || nameLower.includes("naan"))
      return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80";
    if (nameLower.includes("burger"))
      return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";
    if (nameLower.includes("pizza"))
      return "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=300&q=80";
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80";
  };

  return (
    <div className="w-full bg-[#111319] border border-[#232734] rounded-lg p-6 space-y-5 text-white font-sans no-scrollbar shadow-xl">
      {toast && (
        <div className="p-3 rounded-md bg-emerald-900 border border-emerald-500 text-emerald-300 text-xs font-semibold">
          {toast}
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232734] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white text-base">
            {module === "fastfood" ? "Fast Food Products" : "Mini Mart Store Items"}{" "}
            <span className="text-[#8b92a0] text-sm">({filteredProducts.length})</span>
          </h2>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            module === "fastfood" ? "bg-[#ff6b00]/20 text-[#ff6b00]" : "bg-[#00c9a7]/20 text-[#00c9a7]"
          }`}>
            {module} module
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#8b92a0]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="bg-[#090a0e] border border-[#232734] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#585f70] outline-none focus:border-[#ff6b00]"
            />
          </div>

          {/* Categories Dropdown */}
          <div className="w-44">
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map((c) => ({
                value: c,
                label: c === "all" ? "All Categories" : c,
              }))}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-40">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "name", label: "Name A-Z" },
                { value: "price-asc", label: "Price Low to High" },
                { value: "price-desc", label: "Price High to Low" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="overflow-x-auto no-scrollbar rounded-md border border-[#232734]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#090a0e] border-b border-[#232734] text-[#8b92a0] uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                  onChange={toggleSelectAll}
                  className="rounded border-[#232734] text-[#ff6b00]"
                />
              </th>
              <th className="py-3 px-3">Product</th>
              <th className="py-3 px-3 text-right">Price</th>
              <th className="py-3 px-3 text-center">Stock</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#232734]/70 bg-[#111319]">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#8b92a0]">
                  No {module} products found matching your filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const img = getFallbackImage(p);

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#161822] transition ${
                      isSelected ? "bg-[#1a1d2a]" : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-[#232734] text-[#ff6b00]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-11 h-11 rounded-md object-cover border border-[#232734] bg-[#090a0e]"
                        />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{p.name}</h4>
                            <span className="px-2 py-0.5 rounded bg-[#3b2a1a] text-[#f2a93b] text-[9px] font-bold uppercase tracking-wide">
                              {p.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#8b92a0]">
                            {p.description || `${p.price} PKR per unit — jo amount chahein darj karein`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-white">
                      {p.price} PKR
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-[#8b92a0] text-sm">
                      {p.openingStock ? `${p.openingStock}` : "∞"}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="px-2.5 py-1 rounded text-[11px] font-semibold text-white bg-[#1a202c]">
                          Active
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (onEditProduct) onEditProduct(p);
                          }}
                          className="p-1.5 rounded border border-[#232734] hover:border-white text-[#8b92a0] hover:text-white transition"
                          title="Edit Product"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded border border-[#ef4444]/40 hover:bg-[#ef4444]/20 text-[#ef4444] transition"
                          title="Delete Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        itemName={productToDelete?.name || ""}
        message="This product will be removed from your catalog."
        onConfirm={confirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
