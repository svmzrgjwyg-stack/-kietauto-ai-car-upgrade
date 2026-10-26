import type { CatalogSnapshot } from "@/lib/catalog/snapshot";
import type { ComboItem, QuoteLineItem, VehicleSelection } from "@/types";
import { resolveFitment } from "@/lib/fitment/resolve";

/** Shared quote/PDF model: hidden/missing lines must never silently disappear from a quote. */
export function buildQuoteModel(
  items: ComboItem[], vehicle: VehicleSelection | null, catalog: CatalogSnapshot,
  translate: (key: string) => string,
) {
  const byId = new Map(catalog.products.filter((p) => p.active !== false).map((p) => [p.id, p]));
  const cents = (value: number) => Math.round(value * 100);
  const lineItems: QuoteLineItem[] = items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new Error("Catalog item unavailable");
    const unitPrice = cents(product.priceUsd) / 100;
    const labor = item.includeLabor && !product.hardwareOnly && product.laborCostUsd !== null ? cents(product.laborCostUsd) * item.qty / 100 : 0;
    return {
      priceScope: product.catalogSource === "sample" ? "sample" : product.hardwareOnly || product.laborCostUsd === null || product.taxStatus === "unconfirmed" ? "pending_charges" : undefined,
      hardwareOnly: product.hardwareOnly,
      productId: product.id, name: translate(product.nameKey), sku: product.sku,
      qty: item.qty, unitPrice, labor,
      lineTotal: (cents(unitPrice) * item.qty + cents(labor)) / 100,
      fitmentStatus: resolveFitment(item.productId, vehicle, catalog.fitment).status,
    };
  });
  const productCents = lineItems.reduce((sum, row) => sum + cents(row.unitPrice) * row.qty, 0);
  const laborCents = lineItems.reduce((sum, row) => sum + cents(row.labor), 0);
  const selected = items.map((item) => byId.get(item.productId)!);
  const priceScope: "sample" | "pending_charges" | undefined = selected.some((p) => p.catalogSource === "sample") ? "sample" : selected.some((p) => p.hardwareOnly || p.laborCostUsd === null || p.taxStatus === "unconfirmed") ? "pending_charges" : undefined;
  return { priceScope, lineItems, subtotalProducts: productCents / 100, subtotalLabor: laborCents / 100, total: (productCents + laborCents) / 100 };
}
