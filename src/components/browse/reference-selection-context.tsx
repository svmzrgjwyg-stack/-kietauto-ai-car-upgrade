"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isReferenceId, parseReferenceSelection, REFERENCE_SELECTION_KEY, serializeReferenceSelection } from "@/lib/browse/reference-selection";

type ReferenceSelectionValue = {
  ids: string[]; count: number; hydrated: boolean; storageWarning: boolean;
  toggle: (id: string) => void; remove: (id: string) => void; clear: () => void;
};
const noop = () => {};
const ReferenceSelectionContext = createContext<ReferenceSelectionValue>({ ids: [], count: 0, hydrated: false, storageWarning: false, toggle: noop, remove: noop, clear: noop });

export function ReferenceSelectionProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const current = useRef<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const preserveStored = useRef(false);
  useEffect(() => {
    try {
      current.current = parseReferenceSelection(window.localStorage.getItem(REFERENCE_SELECTION_KEY));
      setIds(current.current);
    } catch {
      // Keep damaged/unsupported storage untouched. Selection can still work in memory.
      preserveStored.current = true;
      setStorageWarning(true);
    }
    setHydrated(true);
  }, []);
  const update = useCallback((next: string[]) => {
    current.current = next;
    setIds(next);
    if (preserveStored.current) return;
    try { window.localStorage.setItem(REFERENCE_SELECTION_KEY, serializeReferenceSelection(next)); }
    catch { setStorageWarning(true); }
  }, []);
  const toggle = useCallback((id: string) => {
    if (!hydrated || !isReferenceId(id)) return;
    update(current.current.includes(id) ? current.current.filter((x) => x !== id) : [...current.current, id]);
  }, [hydrated, update]);
  const remove = useCallback((id: string) => { if (hydrated) update(current.current.filter((x) => x !== id)); }, [hydrated, update]);
  const clear = useCallback(() => { if (hydrated) update([]); }, [hydrated, update]);
  const value = useMemo(() => ({ ids, count: ids.length, hydrated, storageWarning, toggle, remove, clear }), [ids, hydrated, storageWarning, toggle, remove, clear]);
  return <ReferenceSelectionContext.Provider value={value}>{children}</ReferenceSelectionContext.Provider>;
}
export function useReferenceSelection() { return useContext(ReferenceSelectionContext); }
