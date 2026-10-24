"use client";
import { useCallback, useEffect, useState } from "react";
import type { CatalogSnapshot } from "./snapshot";

export async function fetchCatalog(): Promise<CatalogSnapshot> {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  if (!response.ok) throw new Error("Catalog unavailable");
  return response.json();
}

/** Refresh on mount/tab focus (including Next client navigation), never cache admin edits. */
export function useCatalog(initial: CatalogSnapshot) {
  const [catalog, setCatalog] = useState(initial);
  const [failed, setFailed] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const next = await fetchCatalog();
      setCatalog(next);
      setFailed(false);
      return next;
    } catch (error) {
      setFailed(true);
      throw error;
    }
  }, []);
  useEffect(() => {
    const update = () => { void refresh().catch(() => {}); };
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [refresh]);
  return { catalog, refresh, failed };
}
