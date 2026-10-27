import { describe, expect, it } from "vitest";
import { fitmentReferences } from "@/lib/catalog/reference";
import { MAX_REFERENCE_SELECTIONS, parseReferenceSelection, serializeReferenceSelection } from "@/lib/browse/reference-selection";
const id = fitmentReferences[0].id;
describe("reference interest storage", () => {
  it("stores only known public identifiers and deduplicates", () => {
    expect(parseReferenceSelection(null)).toEqual([]);
    expect(parseReferenceSelection(serializeReferenceSelection([id, id]))).toEqual([id]);
    expect(parseReferenceSelection(serializeReferenceSelection(fitmentReferences.map((r) => r.id)))).toHaveLength(MAX_REFERENCE_SELECTIONS);
  });
  it.each(["{", "null", "[]", JSON.stringify({ version: 2, ids: [] }), JSON.stringify({ version: 1, ids: ["unknown"] }), JSON.stringify({ version: 1, ids: [3] }), JSON.stringify({ version: 1, ids: [], customer: "private" }), JSON.stringify({ version: 1, ids: Array(46).fill(id) }), " ".repeat(4097)])("rejects invalid or unsupported storage without accepting partial data: %s", (raw) => {
    expect(() => parseReferenceSelection(raw)).toThrow();
  });
});
