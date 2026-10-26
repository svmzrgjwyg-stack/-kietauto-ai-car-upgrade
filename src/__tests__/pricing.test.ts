import { describe, expect, it } from "vitest";
import { comboTotals, lineTotal } from "@/lib/pricing/totals";
import type { ComboItem, Product } from "@/types";

const product: Product = {
  id: "p1",
  sku: "SKU-1",
  categoryId: "dashcam",
  nameKey: "products.dcV35.name",
  descriptionKey: "products.dcV35.desc",
  imageUrl: "/placeholders/dashcam.svg",
  priceUsd: 100,
  laborCostUsd: 40,
  tags: [],
};

describe("pricing", () => {
  it("includes labor when toggled", () => {
    const item: ComboItem = { productId: "p1", includeLabor: true, qty: 2 };
    expect(lineTotal(product, item)).toBe(280);
  });

  it("excludes labor when toggled off", () => {
    const item: ComboItem = { productId: "p1", includeLabor: false, qty: 2 };
    expect(lineTotal(product, item)).toBe(200);
  });

  it("sums combo totals", () => {
    const map = new Map([["p1", product]]);
    const totals = comboTotals(
      [{ productId: "p1", includeLabor: true, qty: 1 }],
      map,
    );
    expect(totals).toEqual({
      subtotalProducts: 100,
      subtotalLabor: 40,
      total: 140,
    });
  });

  it("line total equals product + labor", () => {
    const item: ComboItem = { productId: "p1", includeLabor: true, qty: 1 };
    expect(lineTotal(product, item)).toBe(
      product.priceUsd + product.laborCostUsd!,
    );
  });
});
