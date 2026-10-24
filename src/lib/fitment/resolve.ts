import type { FitmentRecord, FitmentStatus, VehicleSelection } from "@/types";

/**
 * Fitment honesty: missing record ⇒ unverified.
 * Prefer the most specific matching record (trim > year > model > brand).
 */
export function resolveFitment(
  productId: string,
  selection: VehicleSelection | null,
  records: FitmentRecord[],
): { status: FitmentStatus; record: FitmentRecord | null } {
  if (!selection) {
    return { status: "unverified", record: null };
  }

  const candidates = records.filter((r) => r.productId === productId);
  if (candidates.length === 0) {
    return { status: "unverified", record: null };
  }

  let best: FitmentRecord | null = null;
  let bestScore = -1;

  for (const r of candidates) {
    if (r.brandId && r.brandId !== selection.brandId) continue;
    if (r.modelId && r.modelId !== selection.modelId) continue;
    if (r.yearId && r.yearId !== selection.yearId) continue;
    if (r.trimId && r.trimId !== selection.trimId) continue;

    let score = 0;
    if (r.brandId) score += 1;
    if (r.modelId) score += 2;
    if (r.yearId) score += 4;
    if (r.trimId) score += 8;

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  if (!best) {
    return { status: "unverified", record: null };
  }

  return { status: best.status, record: best };
}

export function fitmentLabelKey(status: FitmentStatus): string {
  switch (status) {
    case "verified":
      return "fitment.verified";
    case "incompatible":
      return "fitment.incompatible";
    default:
      return "fitment.unverified";
  }
}

/** Never escalate unverified → “compatible”. Only verified may claim fit. */
export function canClaimCompatible(status: FitmentStatus): boolean {
  return status === "verified";
}
