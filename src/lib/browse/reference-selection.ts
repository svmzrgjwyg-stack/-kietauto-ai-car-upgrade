import { fitmentReferences } from "@/lib/catalog/reference";

export const REFERENCE_SELECTION_KEY = "acu-reference-interest-v1";
export const MAX_REFERENCE_SELECTIONS = 45;
const validIds = new Set(fitmentReferences.map((r) => r.id));

/** Only public reference IDs; no prices, vehicle details or customer data. */
export function parseReferenceSelection(raw: string | null): string[] {
  if (raw === null) return [];
  if (raw.length > 4096) throw new Error("Reference selection is too large");
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid reference selection");
  const record = data as Record<string, unknown>;
  if (record.version !== 1 || Object.keys(record).some((key) => !["version", "ids"].includes(key)) || !Array.isArray(record.ids) || record.ids.length > MAX_REFERENCE_SELECTIONS) throw new Error("Invalid reference selection");
  if (record.ids.some((id) => typeof id !== "string" || !validIds.has(id))) throw new Error("Unknown reference selection");
  return [...new Set(record.ids as string[])];
}
export function serializeReferenceSelection(ids: string[]): string {
  const raw = JSON.stringify({ version: 1, ids });
  parseReferenceSelection(raw);
  return raw;
}
export function isReferenceId(id: string): boolean { return validIds.has(id); }
