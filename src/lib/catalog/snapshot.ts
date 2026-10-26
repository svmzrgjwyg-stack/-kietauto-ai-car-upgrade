import type { Product, FitmentRecord } from "@/types";
export type CatalogSnapshot = { products: Product[]; fitment: FitmentRecord[] };

export function publicCatalog(products: Product[], fitment: FitmentRecord[]): CatalogSnapshot {
  const active = products.filter((p) => p.active !== false);
  const ids = new Set(active.map((p) => p.id));
  return {
    products: active.map((p) => ({
      id: p.id, sku: p.sku, categoryId: p.categoryId, nameKey: p.nameKey,
      descriptionKey: p.descriptionKey, imageUrl: p.imageUrl,
      priceUsd: p.priceUsd, laborCostUsd: p.laborCostUsd, tags: p.tags, active: p.active,
      catalogSource: p.catalogSource, hardwareOnly: p.hardwareOnly, taxStatus: p.taxStatus,
    })),
    fitment: fitment.filter((r) => ids.has(r.productId)).map((r) => ({
      productId: r.productId, brandId: r.brandId, modelId: r.modelId,
      yearId: r.yearId, trimId: r.trimId, status: r.status,
      notesKey: r.notesKey, verifiedAt: r.verifiedAt,
      // Deliberately omit internal verifier identity/email.
    })),
  };
}
