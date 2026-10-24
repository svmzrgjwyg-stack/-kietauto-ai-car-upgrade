import {
  getBrands,
  getModels,
  getTrims,
  getYears,
} from "@/lib/catalog/data";
import type { VehicleSelection } from "@/types";

/** True only when all four ids exist and form a valid brand→model→year→trim chain. */
export function isCompleteVehicleSelection(
  selection: Partial<VehicleSelection> | null | undefined,
): selection is VehicleSelection {
  if (!selection?.brandId || !selection.modelId || !selection.yearId || !selection.trimId) {
    return false;
  }
  const brand = getBrands().find((b) => b.id === selection.brandId);
  if (!brand) return false;

  const model = getModels(selection.brandId).find((m) => m.id === selection.modelId);
  if (!model) return false;

  const year = getYears(selection.modelId).find((y) => y.id === selection.yearId);
  if (!year) return false;

  const trim = getTrims(selection.yearId).find((t) => t.id === selection.trimId);
  return Boolean(trim);
}

/** Drop child ids that no longer belong to the parent (e.g. year change → clear trim). */
export function sanitizeVehicleDraft(draft: {
  brandId: string;
  modelId: string;
  yearId: string;
  trimId: string;
}): { brandId: string; modelId: string; yearId: string; trimId: string } {
  const { brandId } = draft;
  let { modelId, yearId, trimId } = draft;

  if (brandId && !getBrands().some((b) => b.id === brandId)) {
    return { brandId: "", modelId: "", yearId: "", trimId: "" };
  }
  if (modelId && !getModels(brandId).some((m) => m.id === modelId)) {
    modelId = "";
    yearId = "";
    trimId = "";
  }
  if (yearId && !getYears(modelId).some((y) => y.id === yearId)) {
    yearId = "";
    trimId = "";
  }
  if (trimId && !getTrims(yearId).some((t) => t.id === trimId)) {
    trimId = "";
  }
  return { brandId, modelId, yearId, trimId };
}
