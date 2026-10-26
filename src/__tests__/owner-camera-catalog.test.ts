import { describe, expect, it } from "vitest";
import { getSeedProducts } from "@/lib/catalog/seed";
import { publicCatalog } from "@/lib/catalog/snapshot";
import { lineLaborTotal } from "@/lib/pricing/totals";
import { buildQuoteModel } from "@/lib/quote/model";
import { validateQuoteRequest } from "@/lib/quote/validate";
import { createSavedDraft, reconcileDraft, savedDraftSchema } from "@/lib/quote/saved-draft";

const products = getSeedProducts();
const catalog = publicCatalog(products, []);
const owner = products.filter((p) => p.catalogSource === "owner");
const vehicle = { brandId: "toyota", modelId: "camry", yearId: "camry-2025", trimId: "camry-2025-se" };
const items = owner.map((p) => ({ productId: p.id, qty: 1, includeLabor: true }));
function payload() {
  const { lineItems, ...totals } = buildQuoteModel(items, vehicle, catalog, (k) => k);
  return { locale: "en", currency: "USD", consent: false, vehicle, vehicleLabel: "", items: lineItems, ...totals };
}
describe("owner camera retail is hardware only, not a completed installed quote", () => {
  it("retains approved USD retail prices and explicit unknown installation/tax", () => {
    expect(owner.map((p) => p.priceUsd)).toEqual([115, 230]);
    for (const p of owner) {
      expect(p.hardwareOnly).toBe(true);
      expect(p.laborCostUsd).toBeNull();
      expect(p.taxStatus).toBe("unconfirmed");
      expect(p.imageUrl).toBe(p.id === "botslab-2ch-model-pending" ? "/products/botslab-2ch.png" : "/products/botslab-g980-4ch.png");
    }
    expect(products.filter((p) => p.catalogSource === "sample")).toHaveLength(14);
  });
  it("ignores stale includeLabor toggles; zero labor charge is explicitly not included", () => {
    expect(lineLaborTotal(owner[0], items[0])).toBe(0);
    expect(lineLaborTotal({ ...owner[0], laborCostUsd: 99 }, items[0])).toBe(0);
    const model = buildQuoteModel(items, vehicle, catalog, (k) => k);
    expect(model.total).toBe(345);
    expect(model.priceScope).toBe("pending_charges");
    expect(model.lineItems.every((p) => p.hardwareOnly && p.labor === 0 && p.fitmentStatus === "unverified")).toBe(true);
  });
  it("server accepts hardware subtotal only and rejects invented installation charges", () => {
    const valid = validateQuoteRequest(payload(), catalog)!;
    expect(valid.total).toBe(345);
    expect(valid.items[0].priceScope).toBe("pending_charges");
    expect(valid.items[0].hardwareOnly).toBe(true);
    const tampered = payload();
    tampered.items[0].labor = 99;
    tampered.items[0].lineTotal += 99;
    tampered.subtotalLabor += 99;
    tampered.total += 99;
    expect(validateQuoteRequest(tampered, catalog)).toBeNull();
  });
  it("preserves sample scope in mixed quotes", () => {
    const model = buildQuoteModel([...items, { productId: "dc-v35", qty: 1, includeLabor: false }], vehicle, catalog, (k) => k);
    expect(model.priceScope).toBe("sample");
    expect(model.lineItems.at(-1)?.priceScope).toBe("sample");
  });
  it("snapshot scope survives save and legacy snapshots require scope review", () => {
    const draft = createSavedDraft({ title: "Camera", locale: "en", vehicle, items }, catalog, (k) => k);
    expect(draft.snapshot.priceScope).toBe("pending_charges");
    expect(reconcileDraft(draft, catalog).kind).toBe("unchanged");
    delete draft.snapshot.priceScope;
    expect(savedDraftSchema.safeParse(draft).success).toBe(true);
    expect(reconcileDraft(draft, catalog).kind).toBe("changed");
  });
  it("public DTO excludes source/cost/supplier metadata", () => {
    const unsafe = { ...owner[0], supplier: "private", sourceRow: 8, costUsd: 9 };
    const dto = publicCatalog([unsafe], []).products[0];
    expect(dto).not.toHaveProperty("supplier");
    expect(dto).not.toHaveProperty("sourceRow");
    expect(dto).not.toHaveProperty("costUsd");
    expect(dto.hardwareOnly).toBe(true);
  });
});
