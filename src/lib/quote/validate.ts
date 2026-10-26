import type { CatalogSnapshot } from "@/lib/catalog/snapshot";
import { z } from "zod";
import {
  getBrands,
  getModels,
  getYears,
  getTrims,
  vehicleLabel,
} from "@/lib/catalog/data";
import { resolveFitment } from "@/lib/fitment/resolve";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import type { QuoteSubmitPayload } from "./submit";

const id = z.string().trim().min(1).max(100);
const money = z.number().finite().min(0).max(1_000_000_000);
const schema = z.object({
  locale: z.enum(["vi", "en"]),
  customerName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), z.string().trim().max(254).email()]).optional(),
  note: z.string().trim().max(2000).optional(),
  consent: z.boolean(),
  vehicleLabel: z.string().max(300),
  vehicle: z.object({ brandId: id, modelId: id, yearId: id, trimId: id }).nullable(),
  items: z.array(z.object({
    productId: id,
    sku: z.string().max(100),
    name: z.string().max(300),
    qty: z.number().int().min(1).max(99),
    unitPrice: money,
    // Existing client sends the entire line's labor, or zero to opt out.
    labor: money,
    lineTotal: money,
    fitmentStatus: z.enum(["verified", "unverified", "incompatible"]),
  })).min(1).max(100),
  subtotalProducts: money,
  subtotalLabor: money,
  total: money,
  currency: z.literal("USD"),
});

const cents = (value: number) => Math.round(value * 100);
const sameMoney = (a: number, b: number) => Math.abs(a - b) < 0.000001;

function productName(key: string, locale: "vi" | "en", fallback: string): string {
  let value: unknown = locale === "vi" ? vi : en;
  for (const part of key.split(".")) {
    if (typeof value !== "object" || value === null || !Object.hasOwn(value, part)) return fallback;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : fallback;
}

/** Validate the trust boundary; never accept client prices or fitment claims as authoritative.
 * Snapshot is supplied by the authoritative server catalog.
 */
export function validateQuoteRequest(input: unknown, catalog: CatalogSnapshot): QuoteSubmitPayload | null {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return null;
  const data = parsed.data;
  const vehicle = data.vehicle;
  if (vehicle && (
    !getBrands().some((b) => b.id === vehicle.brandId) ||
    !getModels(vehicle.brandId).some((m) => m.id === vehicle.modelId) ||
    !getYears(vehicle.modelId).some((y) => y.id === vehicle.yearId) ||
    !getTrims(vehicle.yearId).some((t) => t.id === vehicle.trimId)
  )) return null;

  const products = new Map(catalog.products.filter((p) => p.active !== false).map((p) => [p.id, p]));
  const fitment = catalog.fitment;
  const seen = new Set<string>();
  const items: QuoteSubmitPayload["items"] = [];
  let productCents = 0;
  let laborCents = 0;
  for (const item of data.items) {
    const product = products.get(item.productId);
    if (!product || seen.has(item.productId)) return null;
    seen.add(item.productId);
    if (!money.safeParse(product.priceUsd).success || (product.laborCostUsd !== null && !money.safeParse(product.laborCostUsd).success)) return null;
    const unitPrice = cents(product.priceUsd) / 100;
    const fullLabor = product.hardwareOnly || product.laborCostUsd === null ? 0 : cents(product.laborCostUsd) * item.qty / 100;
    if (!sameMoney(item.unitPrice, unitPrice) ||
      (!sameMoney(item.labor, 0) && !sameMoney(item.labor, fullLabor))) return null;
    const labor = item.labor === 0 ? 0 : fullLabor;
    const lineTotal = (cents(unitPrice) * item.qty + cents(labor)) / 100;
    if (!sameMoney(item.lineTotal, lineTotal)) return null;
    productCents += cents(unitPrice) * item.qty;
    laborCents += cents(labor);
    items.push({
      priceScope: product.catalogSource === "sample" ? "sample" : product.hardwareOnly || product.laborCostUsd === null || product.taxStatus === "unconfirmed" ? "pending_charges" : undefined,
      hardwareOnly: product.hardwareOnly,
      productId: product.id,
      sku: product.sku,
      name: productName(product.nameKey, data.locale, product.sku),
      qty: item.qty,
      unitPrice,
      labor,
      lineTotal,
      fitmentStatus: resolveFitment(product.id, vehicle, fitment).status,
    });
  }
  const subtotalProducts = productCents / 100;
  const subtotalLabor = laborCents / 100;
  const total = (productCents + laborCents) / 100;
  if (!sameMoney(data.subtotalProducts, subtotalProducts) ||
    !sameMoney(data.subtotalLabor, subtotalLabor) || !sameMoney(data.total, total)) return null;
  return {
    ...data,
    vehicleLabel: vehicle ? vehicleLabel(vehicle) : "—",
    items,
    subtotalProducts,
    subtotalLabor,
    total,
  };
}
