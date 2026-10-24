import type { ComboItem, Product } from "@/types";

export type CategoryConflict = {
  existingProductId: string;
  existingProduct: Product;
  newProduct: Product;
  categoryId: string;
};

/**
 * Same functional category already in combo (e.g. two dashcams).
 * Same product id is quantity bump, not a category conflict.
 */
export function findSameCategoryConflict(
  productId: string,
  items: ComboItem[],
  products: Product[],
): CategoryConflict | null {
  const byId = new Map(products.map((p) => [p.id, p]));
  const incoming = byId.get(productId);
  if (!incoming) return null;

  for (const item of items) {
    if (item.productId === productId) continue;
    const existing = byId.get(item.productId);
    if (!existing) continue;
    if (existing.categoryId === incoming.categoryId) {
      return {
        existingProductId: existing.id,
        existingProduct: existing,
        newProduct: incoming,
        categoryId: incoming.categoryId,
      };
    }
  }
  return null;
}

/** All category ids that currently have more than one distinct product in the combo. */
export function listDuplicateCategories(
  items: ComboItem[],
  products: Product[],
): string[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const counts = new Map<string, Set<string>>();
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) continue;
    const set = counts.get(p.categoryId) ?? new Set();
    set.add(p.id);
    counts.set(p.categoryId, set);
  }
  return [...counts.entries()]
    .filter(([, set]) => set.size > 1)
    .map(([cat]) => cat);
}
