import { describe, expect, it } from "vitest";
import { createSavedDraft, parseBackup, reconcileDraft, serializeBackup, savedDraftSchema } from "@/lib/quote/saved-draft";
import { addDraft, DRAFTS_KEY, duplicateDraft, importDrafts, readDrafts, removeDraft, writeDrafts } from "@/lib/quote/saved-draft-storage";
import { getBrands, getModels, getYears, getTrims } from "@/lib/catalog/data";
import { getSeedProducts, getFitmentRecords } from "@/lib/catalog/seed";
const brand = getBrands()[0]; const model = getModels(brand.id)[0]; const year = getYears(model.id)[0]; const trim = getTrims(year.id)[0];
const vehicle = { brandId: brand.id, modelId: model.id, yearId: year.id, trimId: trim.id };
const catalog = () => structuredClone({ products: getSeedProducts(), fitment: getFitmentRecords() });
const items = [{ productId: "dc-v35", qty: 2, includeLabor: true }];
const draft = () => createSavedDraft({ title: "Camry demo", locale: "en", vehicle, items }, catalog(), (key) => key);
function storage() { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }

describe("saved demo draft contract", () => {
  it("round trips a bounded snapshot with cents totals", () => {
    const value = draft(); expect(value.snapshot.totalCents).toBe(53600);
    expect(parseBackup(serializeBackup([value]))).toEqual([value]);
    expect(reconcileDraft(value, catalog()).kind).toBe("unchanged");
  });
  it("explicitly excludes contact and supplier data from creation", () => {
    const input = { title: "Demo", locale: "en" as const, vehicle, items, customerName: "SECRET NAME", phone: "SECRET PHONE", note: "SECRET NOTE" };
    const source = catalog(); source.products[0].fulfillment = { supplier: "PRIVATE SUPPLIER", stockStatus: "unknown", orderStatus: "not_recorded", feeStatus: "unknown" };
    const raw = JSON.stringify(createSavedDraft(input, source, (key) => key));
    expect(raw).not.toMatch(/SECRET|PRIVATE|customerName|fulfillment|phone|note/);
  });
  it.each(["customerName", "phone", "email", "note", "fulfillment"])("rejects imported extra field %s", (field) => {
    expect(() => parseBackup(JSON.stringify({ schemaVersion: 1, drafts: [{ ...draft(), [field]: "secret" }] }))).toThrow();
  });
  it("rejects corruption, unsupported version, oversized data and duplicate IDs", () => {
    expect(() => parseBackup("{" )).toThrow();
    expect(() => parseBackup(JSON.stringify({ schemaVersion: 2, drafts: [] }))).toThrow();
    expect(() => parseBackup(" ".repeat(1_000_001))).toThrow();
    const value = draft(); expect(() => serializeBackup([value, value])).toThrow();
  });
  it("rejects false-as-string labor, duplicate lines, quantities and currency tampering", () => {
    const value = draft();
    expect(() => savedDraftSchema.parse({ ...value, currency: "EUR" })).toThrow();
    expect(() => savedDraftSchema.parse({ ...value, items: [{ ...items[0], includeLabor: "false" }] })).toThrow();
    expect(() => savedDraftSchema.parse({ ...value, items: [{ ...items[0], qty: 0 }] })).toThrow();
    expect(() => savedDraftSchema.parse({ ...value, items: [items[0], items[0]] })).toThrow();
    expect(() => savedDraftSchema.parse({ ...value, snapshot: { ...value.snapshot, totalCents: 1 } })).toThrow();
  });
  it("detects price, labor, fitment and SKU changes without mutating history", () => {
    const value = draft(); const before = JSON.stringify(value); const current = catalog();
    current.products.find((p) => p.id === "dc-v35")!.priceUsd = 200;
    const result = reconcileDraft(value, current);
    expect(result.kind).toBe("changed"); if (result.kind !== "unavailable") expect(result.current.totalCents).toBe(55800);
    current.products.find((p) => p.id === "dc-v35")!.priceUsd = 189;
    current.products.find((p) => p.id === "dc-v35")!.sku = "NEW-SKU";
    expect(reconcileDraft(value, current).kind).toBe("changed");
    current.products.find((p) => p.id === "dc-v35")!.sku = value.snapshot.lines[0].sku;
    current.fitment = [{ productId: "dc-v35", ...vehicle, status: "incompatible" }];
    expect(reconcileDraft(value, current).kind).toBe("changed");
    expect(JSON.stringify(value)).toBe(before);
  });
  it("blocks unavailable products/vehicles, never silently drops lines", () => {
    const value = draft(); const current = catalog();
    current.products.find((p) => p.id === "dc-v35")!.active = false;
    expect(reconcileDraft(value, current)).toEqual({ kind: "unavailable", unavailable: ["dc-v35"] });
    expect(reconcileDraft({ ...value, vehicle: { ...vehicle, trimId: "missing" } }, catalog()).kind).toBe("unavailable");
  });
});
describe("atomic local draft storage", () => {
  it("saves, reloads, duplicates with new ID and deletes", () => {
    const store = storage(); const value = draft();
    addDraft(store, value); expect(readDrafts(store)).toEqual([value]);
    const duplicated = duplicateDraft(store, value); expect(duplicated).toHaveLength(2); expect(duplicated[0].id).not.toBe(value.id);
    expect(duplicated[0].snapshot).toEqual(value.snapshot);
    removeDraft(store, value.id); expect(readDrafts(store)).toHaveLength(1);
  });
  it("imports as copies instead of overwriting matching IDs", () => {
    const store = storage(); const value = draft(); addDraft(store, value);
    const next = importDrafts(store, serializeBackup([value]));
    expect(next).toHaveLength(2); expect(new Set(next.map((d) => d.id)).size).toBe(2); expect(next[1]).toEqual(value);
  });
  it("failed quota writes preserve previous content", () => {
    const store = storage(); addDraft(store, draft()); const before = store.getItem(DRAFTS_KEY);
    const denied = { getItem: store.getItem, setItem: () => { throw new Error("QuotaExceededError"); } };
    expect(() => addDraft(denied, draft())).toThrow(); expect(store.getItem(DRAFTS_KEY)).toBe(before);
  });
  it("corrupt storage is not silently overwritten", () => {
    const store = storage(); store.setItem(DRAFTS_KEY, "broken");
    expect(() => addDraft(store, draft())).toThrow(); expect(store.getItem(DRAFTS_KEY)).toBe("broken");
  });
  it("enforces limits and leaves content unchanged on invalid imports", () => {
    const store = storage(); const fifty = Array.from({ length: 50 }, draft); writeDrafts(store, fifty);
    expect(() => addDraft(store, draft())).toThrow();
    expect(() => importDrafts(store, serializeBackup([draft()]))).toThrow();
    expect(() => importDrafts(store, '{"schemaVersion":1,"drafts":[{}]}')).toThrow();
    expect(readDrafts(store)).toHaveLength(50);
  });
});
