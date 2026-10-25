import type { ComboItem, Product } from "@/types";

export function lineProductTotal(product: Product, item: ComboItem): number {
  return product.priceUsd * item.qty;
}

export function lineLaborTotal(product: Product, item: ComboItem): number {
  if (!item.includeLabor) return 0;
  return product.laborCostUsd * item.qty;
}

export function lineTotal(product: Product, item: ComboItem): number {
  return lineProductTotal(product, item) + lineLaborTotal(product, item);
}

export function comboTotals(
  items: ComboItem[],
  productsById: Map<string, Product>,
): { subtotalProducts: number; subtotalLabor: number; total: number } {
  let subtotalProducts = 0;
  let subtotalLabor = 0;

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) continue;
    subtotalProducts += lineProductTotal(product, item);
    subtotalLabor += lineLaborTotal(product, item);
  }

  return {
    subtotalProducts,
    subtotalLabor,
    total: subtotalProducts + subtotalLabor,
  };
}

export function formatUsd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
