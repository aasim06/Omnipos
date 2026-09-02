"use client";

import { useCallback, useEffect, useState } from "react";
import { KEYS, storage } from "./storage";
import { ModuleKey, Product } from "./types";
import { ensureInitialData } from "./seedData";
import { nowISO, uid } from "./utils";

export function useProducts(module: ModuleKey) {
  const [products, setProducts] = useState<Product[]>([]);

  const reloadProducts = useCallback(() => {
    ensureInitialData();
    const all = storage.getList<Product>(KEYS.products);
    setProducts(all.filter((p) => p.module === module));
  }, [module]);

  useEffect(() => {
    reloadProducts();

    const handleStorageChange = () => reloadProducts();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pos_orders_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pos_orders_updated", handleStorageChange);
    };
  }, [reloadProducts]);

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pos_orders_updated"));
    }
  };

  const persist = useCallback(
    (updated: Product[]) => {
      const all = storage.getList<Product>(KEYS.products);
      const others = all.filter((p) => p.module !== module);
      storage.setList(KEYS.products, [...others, ...updated]);
      setProducts(updated);
      notifyChange();
    },
    [module]
  );

  const addProduct = useCallback(
    (data: Omit<Product, "id" | "module" | "createdAt" | "updatedAt">) => {
      const product: Product = {
        ...data,
        id: uid("prod_"),
        module,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      persist([...products, product]);
      return product;
    },
    [module, products, persist]
  );

  const removeProduct = useCallback(
    (id: string) => {
      persist(products.filter((p) => p.id !== id));
    },
    [products, persist]
  );

  return { products, reloadProducts, addProduct, removeProduct };
}
