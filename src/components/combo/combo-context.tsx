"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ComboItem, VehicleSelection } from "@/types";
import {
  loadCombo,
  loadVehicle,
  saveCombo,
  saveVehicle,
  saveWorkingCombo,
} from "@/lib/combo/storage";

type ComboContextValue = {
  vehicle: VehicleSelection | null;
  setVehicle: (v: VehicleSelection | null) => void;
  items: ComboItem[];
  addProduct: (productId: string, includeLabor?: boolean) => void;
  /** Remove `replaceId` then add `productId` (same-category swap). */
  replaceProduct: (replaceId: string, productId: string, includeLabor?: boolean) => void;
  removeProduct: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  setIncludeLabor: (productId: string, includeLabor: boolean) => void;
  clearCombo: () => void;
  hydrated: boolean;
  restoreDraft: (vehicle: VehicleSelection, items: ComboItem[]) => void;
};

const ComboContext = createContext<ComboContextValue | null>(null);

export function ComboProvider({ children }: { children: React.ReactNode }) {
  const [vehicle, setVehicleState] = useState<VehicleSelection | null>(null);
  const [items, setItems] = useState<ComboItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setVehicleState(loadVehicle());
    setItems(loadCombo());
    setHydrated(true);
  }, []);

  const setVehicle = useCallback((v: VehicleSelection | null) => {
    setVehicleState(v);
    saveVehicle(v);
  }, []);

  const persistItems = useCallback((next: ComboItem[]) => {
    setItems(next);
    saveCombo(next);
  }, []);

  const addProduct = useCallback(
    (productId: string, includeLabor = true) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        const next = existing
          ? prev.map((i) =>
              i.productId === productId ? { ...i, qty: Math.min(99, i.qty + 1) } : i,
            )
          : [...prev, { productId, includeLabor, qty: 1 }];
        saveCombo(next);
        return next;
      });
    },
    [],
  );

  const replaceProduct = useCallback(
    (replaceId: string, productId: string, includeLabor = true) => {
      setItems((prev) => {
        const without = prev.filter((i) => i.productId !== replaceId);
        const existing = without.find((i) => i.productId === productId);
        const next = existing
          ? without.map((i) =>
              i.productId === productId ? { ...i, qty: Math.min(99, i.qty + 1) } : i,
            )
          : [...without, { productId, includeLabor, qty: 1 }];
        saveCombo(next);
        return next;
      });
    },
    [],
  );

  const removeProduct = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      saveCombo(next);
      return next;
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.productId === productId
            ? { ...i, qty: Math.max(1, Math.min(99, Number.isFinite(qty) ? Math.floor(qty) : 1)) }
            : i,
        )
        .filter((i) => i.qty > 0);
      saveCombo(next);
      return next;
    });
  }, []);

  const setIncludeLabor = useCallback(
    (productId: string, includeLabor: boolean) => {
      setItems((prev) => {
        const next = prev.map((i) =>
          i.productId === productId ? { ...i, includeLabor } : i,
        );
        saveCombo(next);
        return next;
      });
    },
    [],
  );

  const clearCombo = useCallback(() => persistItems([]), [persistItems]);

  const restoreDraft = useCallback((nextVehicle: VehicleSelection, nextItems: ComboItem[]) => {
    saveWorkingCombo(nextVehicle, nextItems);
    // React batches these updates; the single persistent envelope was committed first.
    setVehicleState({ ...nextVehicle });
    setItems(nextItems.map((item) => ({ ...item })));
  }, []);

  const value = useMemo(
    () => ({
      vehicle,
      setVehicle,
      items,
      addProduct,
      replaceProduct,
      removeProduct,
      setQty,
      setIncludeLabor,
      clearCombo,
      hydrated,
      restoreDraft,
    }),
    [
      vehicle,
      setVehicle,
      items,
      addProduct,
      replaceProduct,
      removeProduct,
      setQty,
      setIncludeLabor,
      clearCombo,
      hydrated,
      restoreDraft,
    ],
  );

  return (
    <ComboContext.Provider value={value}>{children}</ComboContext.Provider>
  );
}

export function useCombo() {
  const ctx = useContext(ComboContext);
  if (!ctx) throw new Error("useCombo must be used within ComboProvider");
  return ctx;
}
