"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Tag,
  BarChart2,
  Settings,
  Database,
  UploadCloud,
  Check,
  X,
  Eye,
  Sun,
  Flame,
  Sparkles,
  Utensils,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ModuleKey, Product } from "@/lib/types";
import { KEYS, storage } from "@/lib/storage";
import { formatPKR, nowISO, uid } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface AddProductFormProps {
  initialModule?: ModuleKey;
  onSaved?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  "Burger",
  "Starter",
  "Pizza",
  "Fries",
  "Wrap",
  "Beverages",
  "Desserts",
  "Grocery",
  "Toys",
  "Dairy",
  "Snacks",
];

const PRICING_TYPES = [
  { id: "fixed", label: "Fixed Price", desc: "Fixed price — drinks, roti, chai etc." },
  { id: "smlxl", label: "S / M / L / XL", desc: "Multiple size variations" },
  { id: "halffull", label: "Half / Full", desc: "Portion size variations" },
  { id: "perkg", label: "Per KG", desc: "Weighed item pricing" },
  { id: "amountse", label: "Amount se (Meethai/Doodh)", desc: "Flexible amount pricing" },
  { id: "perpiece", label: "# Per Piece", desc: "Piece unit rate" },
  { id: "custom", label: "Custom Variants", desc: "Custom add-ons & options" },
];

const AVAILABLE_TAGS = [
  { id: "Bestseller", label: "⭐ Bestseller" },
  { id: "New", label: "🆕 New" },
  { id: "Spicy", label: "🌶 Spicy" },
  { id: "Chef Special", label: "👨‍🍳 Chef Special" },
  { id: "Must Try", label: "🔥 Must Try" },
];

const ALLERGENS = [
  { id: "Nuts", label: "🥜 Nuts" },
  { id: "Dairy", label: "🥛 Dairy" },
  { id: "Gluten", label: "🌾 Gluten" },
  { id: "Egg", label: "🥚 Egg" },
];

export function AddProductForm({ initialModule = "minimart", onSaved, onCancel }: AddProductFormProps) {
  // Form State
  const [module, setModule] = useState<ModuleKey>(initialModule);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Grocery");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState("fixed");

  const [price, setPrice] = useState("350");
  const [costPrice, setCostPrice] = useState("200");
  const [prepTime, setPrepTime] = useState("0");
  const [displayOrder, setDisplayOrder] = useState("1");

  const [selectedTags, setSelectedTags] = useState<string[]>(["Bestseller"]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const [stockQuantity, setStockQuantity] = useState("50");
  const [minThreshold, setMinThreshold] = useState("5");

  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenId) ? prev.filter((a) => a !== allergenId) : [...prev, allergenId]
    );
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  function saveProduct(addAnother: boolean = false) {
    if (!name.trim()) {
      showToast("Please enter a Product Name!");
      return;
    }

    const priceNum = Number(price) || 0;
    const costNum = Number(costPrice) || 0;

    const newProduct: Product = {
      id: uid("prod_"),
      module,
      name: name.trim(),
      category: category || "General",
      description: description.trim() || undefined,
      costPrice: costNum,
      price: priceNum,
      prepTime: Number(prepTime) || 0,
      displayOrder: Number(displayOrder) || 1,
      tags: selectedTags,
      allergens: selectedAllergens,
      isAvailable,
      openingStock: Number(stockQuantity) || 50,
      minThreshold: Number(minThreshold) || 5,
      imageUrl: imagePreview || imageUrl.trim() || undefined,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const all = storage.getList<Product>(KEYS.products);
    storage.setList(KEYS.products, [newProduct, ...all]);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pos_orders_updated"));
    }

    showToast(`Product "${newProduct.name}" saved!`);

    if (addAnother) {
      setName("");
      setDescription("");
      setImagePreview(null);
      setImageUrl("");
    } else {
      if (onSaved) onSaved();
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const activePricingDesc =
    PRICING_TYPES.find((p) => p.id === pricingType)?.desc || "Fixed price";

  return (
    <div className="w-full bg-[#0c0e12] text-[#f3f4f6] p-2 sm:p-4 font-sans space-y-6 no-scrollbar">
      {toast && (
        <div className="p-3.5 rounded-md bg-emerald-900 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg fixed top-4 right-4 z-50">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-[#141720] border-[#232734] rounded-lg shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#232734] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00c9a7]/20 text-[#00c9a7] flex items-center justify-center font-bold text-xs">
                  ⊕
                </span>
                <h2 className="font-bold text-white text-base">Add New Mini Mart Store Item</h2>
              </div>

              {/* Module Lock Selector */}
              <div className="flex items-center gap-1 p-1 bg-[#0e1015] rounded-md border border-[#232734]">
                {/* <button
                  type="button"
                  onClick={() => setModule("fastfood")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    module === "fastfood"
                      ? "bg-[#ff6b00] text-white font-bold"
                      : "text-[#8b92a0] hover:text-white"
                  }`}
                >
                  Fast Food
                </button> */}
                <button
                  type="button"
                  onClick={() => setModule("minimart")}
                  className="px-3 py-1 rounded-md text-xs font-bold transition bg-[#00c9a7] text-[#00201a]"
                >
                  Mini Mart
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0] block">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BBQ Chicken Feast"
                className="w-full bg-[#0e1015] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#585f70] outline-none transition"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0] block">
                Category <span className="text-red-400">*</span>
              </label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={CATEGORIES}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold text-[#8b92a0] block">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the item"
                className="w-full bg-[#0e1015] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#585f70] outline-none transition"
              />
            </div>



          </Card>

          {/* LIVE PREVIEW BOX */}
          <Card className="p-5 bg-[#141720] border-[#232734] rounded-lg shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#232734] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <h3 className="font-bold text-white text-xs">Live Preview</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#232734] text-[10px] font-mono text-[#8b92a0]">
                POS card
              </span>
            </div>

            <div className="w-64 mx-auto rounded-md border border-[#232734] bg-[#151720] overflow-hidden p-3 space-y-2">
              <div className="h-32 w-full bg-[#1e222d] rounded-md overflow-hidden flex items-center justify-center">
                {imagePreview || imageUrl ? (
                  <img
                    src={imagePreview || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Eye size={24} className="text-[#585f70]" />
                )}
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#f2a93b] font-bold">
                  {category}
                </span>
                <h4 className="font-bold text-white text-sm leading-tight">
                  {name || "Product Name"}
                </h4>
                <p className="text-[10px] text-[#8b92a0] line-clamp-1">
                  {description || "Item description..."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#232734]">
                <span className="font-mono text-xs font-bold text-[#33c9a8]">
                  {formatPKR(Number(price) || 0)}
                </span>
                <span className="px-2 py-1 rounded bg-[#e53935] text-white text-[10px] font-bold">
                  Add
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Product Image Upload Box */}
        <div className="space-y-6">
          <Card className="p-6 bg-[#141720] border-[#232734] rounded-lg shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#232734] pb-3">
              <UploadCloud size={18} className="text-[#ff6b00]" />
              <h3 className="font-bold text-white text-sm">Product Image</h3>
            </div>

            <div className="border-2 border-dashed border-[#2d3345] rounded-md p-8 text-center space-y-3 bg-[#0e1015] hover:border-[#ff6b00] transition">
              {imagePreview ? (
                <div className="relative w-36 h-36 mx-auto rounded-md overflow-hidden border border-[#232734]">
                  <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="mx-auto text-[#8b92a0]" />
                  <p className="text-xs font-semibold text-white">Click to upload image</p>
                </>
              )}

              <label className="inline-block cursor-pointer px-4 py-2 rounded-md bg-[#1a1d28] hover:bg-[#252a3a] border border-[#232734] text-xs font-semibold text-white transition">
                📁 Choose Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              <p className="text-[10px] text-[#8b92a0]">
                PNG, JPG, WEBP — Recommended: 400x400px
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-bold text-[#8b92a0] block">
                🔗 Or paste image URL instead
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#0e1015] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#585f70] outline-none"
              />
            </div>
          </Card>

          {/* Form Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => saveProduct(false)}
              className="w-full py-3 px-4 rounded-md bg-[#ff6b00] hover:bg-[#e05e00] text-white text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-lg shadow-[#ff6b00]/20"
            >
              <Check size={16} /> Save Product
            </button>

            <button
              type="button"
              onClick={() => saveProduct(true)}
              className="w-full py-2.5 px-4 rounded-md bg-[#161822] hover:bg-[#232734] border border-[#232734] text-white text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Plus size={15} /> Save &amp; Add Another
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 rounded-md bg-[#161822] hover:bg-[#232734] border border-[#232734] text-[#8b92a0] hover:text-white text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
