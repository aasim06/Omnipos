"use client";

import { useCallback, useEffect, useState } from "react";
import { KEYS, storage } from "./storage";
import { ModuleKey, StockMovement } from "./types";
import { nowISO, uid } from "./utils";

export function useStock(module?: ModuleKey) {
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    const all = storage.getList<StockMovement>(KEYS.stockMovements);
    setMovements(module ? all.filter((m) => m.module === module) : all);
  }, [module]);

  const record = useCallback(
    (data: Omit<StockMovement, "id" | "date">) => {
      const all = storage.getList<StockMovement>(KEYS.stockMovements);
      const entry: StockMovement = { ...data, id: uid("stk_"), date: nowISO() };
      const updated = [entry, ...all];
      storage.setList(KEYS.stockMovements, updated);
      setMovements(module ? updated.filter((m) => m.module === module) : updated);
      return entry;
    },
    [module]
  );

  return { movements, record };
}
