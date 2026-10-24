import { describe, expect, it } from "vitest";
import { getTrims, getYears } from "@/lib/catalog/data";
import {
  isCompleteVehicleSelection,
  sanitizeVehicleDraft,
} from "@/lib/catalog/vehicle-cascade";

describe("vehicle cascade data", () => {
  it("Camry 2024 has LE and XLE trims", () => {
    const years = getYears("camry");
    expect(years.some((y) => y.id === "camry-2024" && y.year === 2024)).toBe(
      true,
    );
    const trims = getTrims("camry-2024");
    expect(trims.map((t) => t.name).sort()).toEqual(["LE", "XLE"]);
    expect(trims.some((t) => t.id === "camry-2024-le")).toBe(true);
  });

  it("Camry 2025 has SE trim", () => {
    const years = getYears("camry");
    expect(years.some((y) => y.id === "camry-2025" && y.year === 2025)).toBe(
      true,
    );
    const trims = getTrims("camry-2025");
    expect(trims).toHaveLength(1);
    expect(trims[0]).toMatchObject({
      id: "camry-2025-se",
      name: "SE",
      yearId: "camry-2025",
    });
  });

  it("every year has at least one trim (no silent empty selects)", () => {
    for (const modelId of ["camry", "rav4", "accord", "crv", "f150", "model3", "tucson"]) {
      for (const year of getYears(modelId)) {
        expect(
          getTrims(year.id).length,
          `${year.id} should have trims`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("sanitizeVehicleDraft / isCompleteVehicleSelection", () => {
  it("clears trim when year changes to one that does not include that trim", () => {
    const next = sanitizeVehicleDraft({
      brandId: "toyota",
      modelId: "camry",
      yearId: "camry-2025",
      trimId: "camry-2024-le",
    });
    expect(next.trimId).toBe("");
    expect(next.yearId).toBe("camry-2025");
  });

  it("keeps Camry 2024 LE when chain is valid", () => {
    const sel = {
      brandId: "toyota",
      modelId: "camry",
      yearId: "camry-2024",
      trimId: "camry-2024-le",
    };
    expect(sanitizeVehicleDraft(sel)).toEqual(sel);
    expect(isCompleteVehicleSelection(sel)).toBe(true);
  });

  it("keeps Camry 2025 SE when chain is valid", () => {
    const sel = {
      brandId: "toyota",
      modelId: "camry",
      yearId: "camry-2025",
      trimId: "camry-2025-se",
    };
    expect(isCompleteVehicleSelection(sel)).toBe(true);
  });

  it("rejects incomplete selection (no trim)", () => {
    expect(
      isCompleteVehicleSelection({
        brandId: "toyota",
        modelId: "camry",
        yearId: "camry-2024",
        trimId: "",
      }),
    ).toBe(false);
  });
});
