import { describe, expect, it } from "vitest";
import { filterReferences, fitmentReferences, referenceModels, type FitmentReference } from "@/lib/catalog/reference";
describe("Toyota/Lexus reference catalog", () => {
  it("preserves 45 distinct configurations without pretending each is a product", () => {
    expect(fitmentReferences).toHaveLength(45); expect(new Set(fitmentReferences.map((r) => r.id)).size).toBe(45);
    expect(fitmentReferences.filter((r) => r.make === "Toyota")).toHaveLength(4);
    expect(fitmentReferences.filter((r) => r.model === "Camry")).toHaveLength(0);
  });
  it("keeps pricing, stock and US fitment unknown", () => {
    for (const r of fitmentReferences) { expect(r.priceUsd).toBeNull(); expect(r.installationPriceUsd).toBeNull(); expect(r.fitmentStatus).toBe("unverified"); expect(r.usMarketVerified).toBe(false); expect(r.availability).toBe("unknown"); }
  });
  it("includes only public allowlisted fields without supplier/private source data", () => {
    const fields = ["images", "id", "make", "model", "yearFrom", "yearTo", "control", "screen", "screenInches", "navigationRequired", "market", "usMarketVerified", "fitmentStatus", "priceUsd", "installationPriceUsd", "availability"].sort();
    fitmentReferences.forEach((r) => expect(Object.keys(r).sort()).toEqual(fields));
    const raw = JSON.stringify(fitmentReferences);
    for (const value of ["supplier", "library_file", "raw_values", "cost_cents", "source_workbook"]) expect(raw).not.toContain(value);
  });
  it("filters inclusive year boundaries and distinct makes/models", () => {
    for (const year of ["2016", "2021"]) expect(filterReferences(fitmentReferences, { make: "Toyota", model: "Land Cruiser 200", year }).map((r) => r.id)).toEqual(["CP-001"]);
    expect(filterReferences(fitmentReferences, { make: "Toyota", model: "Land Cruiser 200", year: "2022" })).toHaveLength(0);
    expect(filterReferences(fitmentReferences, { make: "Toyota", model: "GX" })).toHaveLength(0);
  });
  it("does not infer missing or invalid years", () => {
    const unknown: FitmentReference = { ...fitmentReferences[0], yearFrom: null, yearTo: null };
    expect(filterReferences([unknown], {})).toHaveLength(1); expect(filterReferences([unknown], { year: "2020" })).toHaveLength(0);
    for (const year of ["20", "2e3", "2020.5", "abcd"]) expect(filterReferences(fitmentReferences, { year })).toHaveLength(0);
  });
  it("preserves same-model configurations and searches controls/size/region", () => {
    const rx2016 = filterReferences(fitmentReferences, { make: "Lexus", model: "RX", year: "2016" });
    expect(rx2016.map((r) => r.id)).toEqual(["CP-013", "CP-014", "CP-022"]);
    expect(filterReferences(rx2016, { query: "chuot 12.3" }).map((r) => r.id)).toEqual(["CP-013"]);
    expect(filterReferences(fitmentReferences, { query: "Japan" })).toHaveLength(2);
  });
  it("preserves unknown navigation and limits model choices by make", () => {
    expect(fitmentReferences.find((r) => r.id === "CP-006")?.navigationRequired).toBeNull();
    expect(fitmentReferences.find((r) => r.id === "CP-001")?.navigationRequired).toBe(true);
    expect(referenceModels(fitmentReferences, "Toyota")).toEqual(["Alphard / Vellfire", "Crown", "Land Cruiser 200"]);
  });
});
