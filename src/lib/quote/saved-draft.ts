import { z } from "zod";
import type { ComboItem, Locale, VehicleSelection } from "@/types";
import type { CatalogSnapshot } from "@/lib/catalog/snapshot";
import { getBrands, getModels, getYears, getTrims, vehicleLabel } from "@/lib/catalog/data";
import { buildQuoteModel } from "./model";

export const MAX_DRAFTS = 50;
export const MAX_BACKUP_BYTES = 1_000_000;
const id = z.string().min(1).max(120);
const text = z.string().min(1).max(200);
const cents = z.number().int().nonnegative().max(1_000_000_000);
export const vehicleSelectionSchema = z.object({ brandId: id, modelId: id, yearId: id, trimId: id }).strict();
export const comboItemsSchema = z.array(z.object({ productId: id, qty: z.number().int().min(1).max(99), includeLabor: z.boolean() }).strict()).max(30).refine((items) => new Set(items.map((i) => i.productId)).size === items.length, "Duplicate products");
export const workingComboSchema = z.object({ vehicle: vehicleSelectionSchema.nullable(), items: comboItemsSchema }).strict();
const snapshotSchema = z.object({
  priceScope: z.enum(["sample", "pending_charges"]).optional(),
  vehicleLabel: text,
  lines: z.array(z.object({ productId: id, name: text, sku: text, qty: z.number().int().min(1).max(99), unitCents: cents, laborCents: cents, totalCents: cents, fitment: z.enum(["verified", "unverified", "incompatible"]) }).strict()).min(1).max(30),
  totalCents: cents,
}).strict();
export const savedDraftSchema = z.object({
  schemaVersion: z.literal(1), id: z.uuid(), title: z.string().trim().min(1).max(80),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), locale: z.enum(["vi", "en"]), currency: z.literal("USD"),
  vehicle: vehicleSelectionSchema, items: comboItemsSchema.refine((items) => items.length > 0), snapshot: snapshotSchema,
}).strict().superRefine((draft, ctx) => {
  const lines = draft.snapshot.lines;
  if (lines.length !== draft.items.length || lines.some((line, index) => {
    const item = draft.items[index];
    return !item || line.productId !== item.productId || line.qty !== item.qty || (!item.includeLabor && line.laborCents !== 0) || line.totalCents !== line.unitCents * line.qty + line.laborCents;
  }) || draft.snapshot.totalCents !== lines.reduce((sum, line) => sum + line.totalCents, 0)) {
    ctx.addIssue({ code: "custom", message: "Invalid snapshot totals or items" });
  }
});
export type SavedQuoteDraft = z.infer<typeof savedDraftSchema>;
export const backupSchema = z.object({ schemaVersion: z.literal(1), drafts: z.array(savedDraftSchema).max(MAX_DRAFTS).refine((drafts) => new Set(drafts.map((d) => d.id)).size === drafts.length, "Duplicate draft IDs") }).strict();

export function isKnownVehicle(vehicle: VehicleSelection): boolean {
  return getBrands().some((b) => b.id === vehicle.brandId) && getModels(vehicle.brandId).some((m) => m.id === vehicle.modelId) && getYears(vehicle.modelId).some((y) => y.id === vehicle.yearId) && getTrims(vehicle.yearId).some((t) => t.id === vehicle.trimId);
}
export function draftSnapshot(items: ComboItem[], vehicle: VehicleSelection, catalog: CatalogSnapshot, translate: (key: string) => string): SavedQuoteDraft["snapshot"] {
  if (!isKnownVehicle(vehicle)) throw new Error("Vehicle unavailable");
  const quote = buildQuoteModel(comboItemsSchema.parse(items), vehicle, catalog, translate);
  return snapshotSchema.parse({ priceScope: quote.priceScope, vehicleLabel: vehicleLabel(vehicle), lines: quote.lineItems.map((line) => ({ productId: line.productId, name: line.name, sku: line.sku, qty: line.qty, unitCents: Math.round(line.unitPrice * 100), laborCents: Math.round(line.labor * 100), totalCents: Math.round(line.lineTotal * 100), fitment: line.fitmentStatus })), totalCents: Math.round(quote.total * 100) });
}
export function createSavedDraft(input: { title: string; locale: Locale; vehicle: VehicleSelection; items: ComboItem[] }, catalog: CatalogSnapshot, translate: (key: string) => string): SavedQuoteDraft {
  const now = new Date().toISOString();
  // Explicit allowlist: customer/contact/note and supplier metadata never enter a saved draft.
  return savedDraftSchema.parse({ schemaVersion: 1, id: crypto.randomUUID(), title: input.title, createdAt: now, updatedAt: now, locale: input.locale, currency: "USD", vehicle: input.vehicle, items: input.items, snapshot: draftSnapshot(input.items, input.vehicle, catalog, translate) });
}
export function reconcileDraft(draft: SavedQuoteDraft, catalog: CatalogSnapshot) {
  const valid = savedDraftSchema.parse(draft);
  const unavailable = valid.items.filter((item) => !catalog.products.some((p) => p.id === item.productId && p.active !== false)).map((item) => item.productId);
  if (!isKnownVehicle(valid.vehicle) || unavailable.length) return { kind: "unavailable" as const, unavailable };
  // Retain historical display labels; compare prices and fitment, not locale-dependent translations.
  const current = draftSnapshot(valid.items, valid.vehicle, catalog, (key) => {
    const product = catalog.products.find((p) => p.nameKey === key);
    return valid.snapshot.lines.find((line) => line.productId === product?.id)?.name || key;
  });
  const changed = current.priceScope !== valid.snapshot.priceScope || current.lines.some((line, i) => {
    const old = valid.snapshot.lines[i];
    return line.unitCents !== old.unitCents || line.laborCents !== old.laborCents || line.fitment !== old.fitment || line.sku !== old.sku;
  });
  return { kind: changed ? "changed" as const : "unchanged" as const, current };
}
export function parseBackup(raw: string): SavedQuoteDraft[] {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new Error("Backup too large");
  return backupSchema.parse(JSON.parse(raw)).drafts;
}
export function serializeBackup(drafts: SavedQuoteDraft[]): string {
  const raw = JSON.stringify(backupSchema.parse({ schemaVersion: 1, drafts }), null, 2);
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new Error("Backup too large");
  return raw;
}
