import { describe, expect, it } from "vitest";
import { normalizeFitmentRecord } from "@/lib/store/fitment";

describe("normalizeFitmentRecord", () => {
  it("defaults missing status to unverified (never verified)", () => {
    const record = normalizeFitmentRecord({ productId: "liftgate-kit" });
    expect(record.status).toBe("unverified");
    expect(record.verifiedAt).toBeUndefined();
    expect(record.verifiedBy).toBeUndefined();
  });

  it("defaults invalid status to unverified", () => {
    const record = normalizeFitmentRecord({
      productId: "liftgate-kit",
      // @ts-expect-error intentional bad status
      status: "ok",
    });
    expect(record.status).toBe("unverified");
  });

  it("preserves explicit verified only when provided", () => {
    const record = normalizeFitmentRecord({
      productId: "liftgate-pro",
      brandId: "toyota",
      status: "verified",
      verifiedBy: "tech",
      verifiedAt: "2026-01-01",
    });
    expect(record.status).toBe("verified");
    expect(record.verifiedBy).toBe("tech");
    expect(record.verifiedAt).toBe("2026-01-01");
  });
});
