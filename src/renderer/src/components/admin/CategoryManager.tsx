"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Check, Trash2, Info, Edit3, CheckCircle2 } from "lucide-react";
import { KEYS, storage } from "@/lib/storage";
import { ModuleKey, Product } from "@/lib/types";
import { useProducts } from "@/lib/useProducts";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
}

interface CategoryManagerProps {
  module?: ModuleKey;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [];

export function CategoryManager({ module = "minimart" }: CategoryManagerProps) {
  const { products } = useProducts(module);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const storageKey = `pos_categories_${module}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (e) {
        setCategories([]);
      }
    } else {
      setCategories([]);
    }
  }, [module, storageKey]);

  function saveCategoriesToStorage(updated: CategoryItem[]) {
    setCategories(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("pos_orders_updated"));
    }
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newItem: CategoryItem = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      emoji: newCatEmoji || "🏷",
    };

    const updated = [...categories, newItem];
    saveCategoriesToStorage(updated);
    setNewCatName("");
    setNewCatEmoji("🏷");
    showToast(`Category "${newItem.name}" added to ${module}!`);
  }

  function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name: editingName.trim() } : c
    );
    saveCategoriesToStorage(updated);
    setEditingId(null);
    showToast("Category renamed!");
  }

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  function handleDeleteCategory(cat: CategoryItem) {
    const itemCount = getItemCount(cat.name);
    if (itemCount > 0) {
      showToast(`Cannot delete "${cat.name}" because it contains ${itemCount} products. Reassign them first.`);
      return;
    }
    setCategoryToDelete(cat);
  }

  function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    const updated = categories.filter((c) => c.id !== categoryToDelete.id);
    saveCategoriesToStorage(updated);
    showToast(`Deleted category "${categoryToDelete.name}"`);
    setCategoryToDelete(null);
  }

  function getItemCount(categoryName: string) {
    return products.filter(
      (p) => p.category.toLowerCase() === categoryName.toLowerCase()
    ).length;
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="w-full text-white font-sans space-y-6 no-scrollbar">
      {toast && (
        <div className="p-3.5 rounded-md bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Main 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-5 bg-[#141720] border border-[#232734] rounded-lg p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232734] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[#ff6b00]" />
                <h2 className="font-bold text-white text-base">
                  {module === "fastfood" ? "Fast Food Category Manager" : "Mini Mart Category Manager"}
                </h2>
              </div>
              <p className="text-[#8b92a0] text-xs mt-1">
                Add, rename, reorder, or delete categories for {module}.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-[#8b92a0]">
              {categories.length} categories
            </span>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2 items-center bg-[#090a0e] p-3 rounded-md border border-[#232734]">
            <input
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              placeholder="🍔"
              className="w-10 text-center bg-[#161822] border border-[#232734] rounded-md py-1.5 text-xs text-white"
            />
            <input
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New Category Name (e.g. Desserts)"
              className="flex-1 bg-[#161822] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3 py-1.5 text-xs text-white placeholder-[#585f70] outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-[#ff6b00] hover:bg-[#e05e00] text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <Plus size={14} /> Add Category
            </button>
          </form>

          {/* Categories Rows List */}
          <div className="space-y-2">
            {categories.map((cat) => {
              const count = getItemCount(cat.name);
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 rounded-md bg-[#0e1015] border border-[#232734] hover:border-[#ff6b00]/40 transition group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-base">{cat.emoji}</span>

                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-[#161822] border border-[#ff6b00] rounded px-2 py-1 text-xs text-white outline-none"
                      />
                    ) : (
                      <span className="font-bold text-white text-sm">{cat.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[#8b92a0]">
                      {count} items
                    </span>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 transition"
                          title="Save Rename"
                        >
                          <Check size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="p-1.5 text-[#8b92a0] hover:text-white transition"
                          title="Rename Category"
                        >
                          <Check size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-[#ef4444] hover:text-[#b91c1c] transition"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Tips */}
        <div className="space-y-6">
          <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#232734] pb-3 text-[#38bdf8]">
              <Info size={18} />
              <h3 className="font-bold text-white text-sm">Category Tips</h3>
            </div>

            <ul className="space-y-3 text-xs text-[#8b92a0]">
              <li className="flex items-start gap-2">
                <span className="text-[#38bdf8] font-bold">•</span>
                <span>Categories appear as tabs on the POS screen.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#38bdf8] font-bold">•</span>
                <span>The emoji shows on the POS category tab.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#38bdf8] font-bold">•</span>
                <span>Delete only works if products are reassigned first.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!categoryToDelete}
        itemName={categoryToDelete?.name || ""}
        message="This category will be permanently removed from your store."
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
