import { z } from "zod";
import type { Product } from "@/types";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
  const parsed = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === v;
}, "Invalid calendar date");
export const fulfillmentSchema = z.object({
  supplier: z.string().trim().max(160).optional(),
  source: z.string().trim().max(500).optional(),
  stockStatus: z.enum(["unknown", "in_stock", "backorder", "unavailable"]).default("unknown"),
  orderStatus: z.enum(["not_recorded", "planned", "ordered", "received"]).default("not_recorded"),
  arrivalFrom: date.optional(), arrivalTo: date.optional(), checkedOn: date.refine((v) => v <= new Date().toISOString().slice(0, 10), "Checked date cannot be in the future").optional(),
  shipmentGroup: z.string().trim().max(100).optional(),
  feeStatus: z.enum(["unknown", "estimated", "confirmed"]).default("unknown"),
  feeUsd: z.number().finite().min(0).max(1_000_000).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use cents").optional(),
}).superRefine((v, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!!v.arrivalFrom !== !!v.arrivalTo) issue("Enter both arrival dates or neither");
  if (v.arrivalFrom && v.arrivalTo && v.arrivalFrom > v.arrivalTo) issue("Arrival window is reversed");
  if (v.feeStatus !== "unknown" && (v.feeUsd === undefined || !v.shipmentGroup || !v.supplier || !v.checkedOn)) issue("Known fees need amount, supplier, shipment group and checked date");
  if (v.feeStatus === "unknown" && v.feeUsd !== undefined) issue("Unknown fee must have no amount");
});
export type Fulfillment = z.infer<typeof fulfillmentSchema>;

/** Internal purchasing estimate only: never a customer selling price or a tracking promise. */
export function planShipping(products: Product[]) {
  const rows = products.map((product) => ({ product, parsed: fulfillmentSchema.safeParse(product.fulfillment) }));
  const etaMissing: string[] = [];
  let from = "", to = "";
  const groups = new Map<string, { fee?: number; status: string; supplier?: string; valid: boolean }>();
  const ungrouped: string[] = [];
  for (const { product, parsed } of rows) {
    const f = parsed.success ? parsed.data : undefined;
    if (!f?.arrivalFrom || !f.arrivalTo || !f.checkedOn || f.stockStatus === "unavailable" || f.stockStatus === "unknown") etaMissing.push(product.sku);
    else { from = from > f.arrivalFrom ? from : f.arrivalFrom; to = to > f.arrivalTo ? to : f.arrivalTo; }
    if (!f?.shipmentGroup) { ungrouped.push(product.sku); continue; }
    const current = { fee: f.feeUsd, status: f.feeStatus, supplier: f.supplier, valid: f.feeStatus !== "unknown" && f.feeUsd !== undefined };
    const previous = groups.get(f.shipmentGroup);
    if (previous && (previous.fee !== current.fee || previous.status !== current.status || previous.supplier !== current.supplier)) current.valid = false;
    if (previous && !previous.valid) current.valid = false;
    groups.set(f.shipmentGroup, current);
  }
  let estimatedCents = 0, confirmedCents = 0;
  const unknownGroups: string[] = [];
  for (const [id, group] of groups) {
    if (!group.valid) { unknownGroups.push(id); continue; }
    const cents = Math.round(group.fee! * 100);
    if (group.status === "confirmed") confirmedCents += cents; else estimatedCents += cents;
  }
  return {
    readyWindow: products.length && !etaMissing.length ? { from, to } : null,
    etaMissing, ungrouped, unknownGroups,
    estimatedUsd: estimatedCents / 100, confirmedUsd: confirmedCents / 100,
    feesComplete: products.length > 0 && !ungrouped.length && !unknownGroups.length,
    groupCount: groups.size,
  };
}
