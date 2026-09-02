import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { useProducts } from "@/lib/useProducts";
import { useOrders } from "@/lib/useOrders";
import { CartLine, OrderStage, Product } from "@/lib/types";

export default function MiniMartPage() {
  const { products, addProduct, removeProduct } = useProducts("minimart");
  const { createOrder } = useOrders("minimart");

  const [lines, setLines] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [stage, setStage] = useState<OrderStage>("cart");

  function addToCart(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 },
      ];
    });
    setStage("cart");
  }

  function qtyChange(productId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function checkout() {
    if (lines.length === 0) return;

    // Save direct checkout order
    createOrder({
      module: "minimart",
      lines,
      discountPercent: discount,
      stage: "paid",
    });

    setStage("paid");

    setTimeout(() => {
      clearCart();
    }, 1200);
  }

  function clearCart() {
    setLines([]);
    setDiscount(0);
    setStage("cart");
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-minimart text-xs uppercase tracking-wide font-medium">Mini Mart</p>
          <h1 className="font-display text-2xl">Point of Sale</h1>
        </div>
        <ProductGrid
          module="minimart"
          accent="minimart"
          products={products}
          onAdd={(data) => addProduct(data)}
          onRemove={removeProduct}
          onAddToCart={addToCart}
        />
      </div>
      <div className="p-6 pl-0">
        <Cart
          accent="minimart"
          flow="direct"
          lines={lines}
          discountPercent={discount}
          stage={stage}
          onQtyChange={qtyChange}
          onRemoveLine={removeLine}
          onDiscountChange={setDiscount}
          onClear={clearCart}
          onAdvance={checkout}
        />
      </div>
    </div>
  );
}
