import { describe, expect, it } from "vitest";
import { fulfillmentSchema, planShipping, type Fulfillment } from "@/lib/shipping/planning";
import { publicCatalog } from "@/lib/catalog/snapshot";
import { buildQuoteModel } from "@/lib/quote/model";
import type { Product } from "@/types";
const f: Fulfillment = { supplier: "Private supplier", source: "Private source", stockStatus: "in_stock", orderStatus: "planned", shipmentGroup: "A", feeStatus: "estimated", feeUsd: 12.34, checkedOn: "2026-10-20", arrivalFrom: "2026-10-25", arrivalTo: "2026-10-27" };
const product = (id: string, fulfillment?: Fulfillment): Product => ({ id, sku: id, categoryId: "test", nameKey: "name", descriptionKey: "desc", imageUrl: "", priceUsd: 100, laborCostUsd: 20, tags: [], fulfillment });

describe("manual internal shipping planning", () => {
  it("older products remain unknown, not free or ready", () => {
    expect(planShipping([product("old")])).toMatchObject({ readyWindow: null, feesComplete: false, ungrouped: ["old"], etaMissing: ["old"] });
    expect(planShipping([])).toMatchObject({ readyWindow: null, feesComplete: false });
  });
  it("counts a shared shipment once, never once per product", () => {
    expect(planShipping([product("a", f), product("b", f)])).toMatchObject({ estimatedUsd: 12.34, confirmedUsd: 0, feesComplete: true, groupCount: 1 });
  });
  it("combines multiple vendors and takes latest earliest/latest arrival", () => {
    expect(planShipping([product("a", f), product("b", { ...f, supplier: "Other", shipmentGroup: "B", feeStatus: "confirmed", feeUsd: 7.66, arrivalFrom: "2026-10-26", arrivalTo: "2026-10-30" })])).toMatchObject({ estimatedUsd: 12.34, confirmedUsd: 7.66, feesComplete: true, readyWindow: { from: "2026-10-26", to: "2026-10-30" } });
  });
  it("one unknown ETA prevents a package date but known fees stay separate", () => {
    expect(planShipping([product("a", f), product("b", { ...f, shipmentGroup: "B", arrivalFrom: undefined, arrivalTo: undefined, feeStatus: "unknown", feeUsd: undefined })])).toMatchObject({ readyWindow: null, etaMissing: ["b"], estimatedUsd: 12.34, unknownGroups: ["B"], feesComplete: false });
  });
  it.each([ { feeUsd: 9 }, { supplier: "Other" }, { feeStatus: "confirmed" as const } ])("conflicting shared group is excluded rather than choosing a cheaper fee: %j", (change) => {
    expect(planShipping([product("a", f), product("b", { ...f, ...change }), product("c", f)])).toMatchObject({ estimatedUsd: 0, confirmedUsd: 0, unknownGroups: ["A"], feesComplete: false });
  });
  it("unknown group member contaminates the whole group's total", () => {
    expect(planShipping([product("a", f), product("b", { ...f, feeStatus: "unknown", feeUsd: undefined })])).toMatchObject({ estimatedUsd: 0, unknownGroups: ["A"] });
  });
  it("explicit confirmed zero is different from unknown", () => {
    expect(planShipping([product("a", { ...f, feeStatus: "confirmed", feeUsd: 0 })])).toMatchObject({ confirmedUsd: 0, feesComplete: true });
  });
  it.each([ { checkedOn: undefined, feeStatus: "unknown" as const, feeUsd: undefined }, { stockStatus: "unknown" as const }, { stockStatus: "unavailable" as const } ])("does not promise readiness without trustworthy input: %j", (change) => {
    expect(planShipping([product("a", { ...f, ...change })]).readyWindow).toBeNull();
  });
  it.each([ { checkedOn: "2099-01-01" }, { arrivalFrom: "2026-02-30" }, { arrivalTo: undefined }, { arrivalFrom: "2026-11-01" }, { feeUsd: -1 }, { feeUsd: 0.001 }, { feeUsd: Number.NaN }, { shipmentGroup: "" }, { checkedOn: undefined }, { feeStatus: "unknown", feeUsd: 12 } ])("rejects incomplete/invalid manual data: %j", (change) => {
    expect(fulfillmentSchema.safeParse({ ...f, ...change }).success).toBe(false);
  });
  it("public catalog and quote/PDF model never carry sourcing metadata or alter sell totals", () => {
    const catalog = publicCatalog([product("a", f), product("old")], []);
    expect(JSON.stringify(catalog)).not.toMatch(/fulfillment|Private supplier|Private source|feeUsd|shipmentGroup/);
    const quote = buildQuoteModel([{ productId: "a", qty: 2, includeLabor: true }, { productId: "old", qty: 1, includeLabor: false }], null, catalog, (key) => key);
    expect(quote.total).toBe(340);
    expect(quote.lineItems[0].fitmentStatus).toBe("unverified");
    expect(JSON.stringify(quote)).not.toMatch(/fulfillment|Private supplier|Private source|feeUsd|shipmentGroup/);
  });
});
