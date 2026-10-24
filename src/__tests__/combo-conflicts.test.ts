import { describe, expect, it } from "vitest";
import {
  findSameCategoryConflict,
  listDuplicateCategories,
} from "@/lib/combo/conflicts";
import { getSeedProducts } from "@/lib/catalog/seed";
import type { ComboItem } from "@/types";

describe("combo category conflicts", () => {
  const products = getSeedProducts();

  it("detects two dashcams as same-category conflict", () => {
    const items: ComboItem[] = [
      { productId: "dc-v35", includeLabor: true, qty: 1 },
    ];
    const conflict = findSameCategoryConflict("dc-pro4k", items, products);
    expect(conflict).not.toBeNull();
    expect(conflict?.categoryId).toBe("dashcam");
    expect(conflict?.existingProductId).toBe("dc-v35");
    expect(conflict?.newProduct.id).toBe("dc-pro4k");
  });

  it("same product id is quantity bump, not conflict", () => {
    const items: ComboItem[] = [
      { productId: "dc-v35", includeLabor: true, qty: 1 },
    ];
    expect(findSameCategoryConflict("dc-v35", items, products)).toBeNull();
  });

  it("different categories do not conflict", () => {
    const items: ComboItem[] = [
      { productId: "dc-v35", includeLabor: true, qty: 1 },
    ];
    expect(
      findSameCategoryConflict("liftgate-kit", items, products),
    ).toBeNull();
  });

  it("lists duplicate categories already in combo", () => {
    const items: ComboItem[] = [
      { productId: "dc-v35", includeLabor: true, qty: 1 },
      { productId: "dc-pro4k", includeLabor: true, qty: 1 },
    ];
    expect(listDuplicateCategories(items, products)).toEqual(["dashcam"]);
  });
});
