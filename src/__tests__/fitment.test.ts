import { describe, expect, it } from "vitest";
import { canClaimCompatible, resolveFitment } from "@/lib/fitment/resolve";
import type { FitmentRecord, VehicleSelection } from "@/types";

const selection: VehicleSelection = {
  brandId: "toyota",
  modelId: "camry",
  yearId: "camry-2024",
  trimId: "camry-2024-xle",
};

const records: FitmentRecord[] = [
  {
    productId: "dc-v35",
    brandId: "toyota",
    modelId: "camry",
    yearId: "camry-2024",
    status: "verified",
  },
  {
    productId: "hu-android10",
    brandId: "tesla",
    status: "incompatible",
  },
];

describe("resolveFitment", () => {
  it("defaults to unverified when no record exists", () => {
    const result = resolveFitment("unknown", selection, records);
    expect(result.status).toBe("unverified");
    expect(canClaimCompatible(result.status)).toBe(false);
  });

  it("defaults to unverified when selection is null", () => {
    const result = resolveFitment("dc-v35", null, records);
    expect(result.status).toBe("unverified");
  });

  it("returns verified only when a matching verified record exists", () => {
    const result = resolveFitment("dc-v35", selection, records);
    expect(result.status).toBe("verified");
    expect(canClaimCompatible(result.status)).toBe(true);
  });

  it("returns incompatible for matching incompatible records", () => {
    const tesla: VehicleSelection = {
      brandId: "tesla",
      modelId: "model3",
      yearId: "model3-2024",
      trimId: "model3-2024-rwd",
    };
    const result = resolveFitment("hu-android10", tesla, records);
    expect(result.status).toBe("incompatible");
    expect(canClaimCompatible(result.status)).toBe(false);
  });
});
