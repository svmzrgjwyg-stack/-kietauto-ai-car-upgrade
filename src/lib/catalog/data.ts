import vehicles from "../../../data/vehicles.json";
import categories from "../../../data/categories.json";
import type {
  Brand,
  Category,
  Model,
  Trim,
  VehicleSelection,
  Year,
} from "@/types";

export function getBrands(): Brand[] {
  return vehicles.brands as Brand[];
}

export function getModels(brandId?: string): Model[] {
  const models = vehicles.models as Model[];
  return brandId ? models.filter((m) => m.brandId === brandId) : models;
}

export function getYears(modelId?: string): Year[] {
  const years = vehicles.years as Year[];
  return modelId ? years.filter((y) => y.modelId === modelId) : years;
}

export function getTrims(yearId?: string): Trim[] {
  const trims = vehicles.trims as Trim[];
  return yearId ? trims.filter((t) => t.yearId === yearId) : trims;
}

export function getCategories(): Category[] {
  return categories as Category[];
}

export function vehicleLabel(selection: VehicleSelection): string {
  const brand = getBrands().find((b) => b.id === selection.brandId);
  const model = getModels().find((m) => m.id === selection.modelId);
  const year = getYears().find((y) => y.id === selection.yearId);
  const trim = getTrims().find((t) => t.id === selection.trimId);
  return [brand?.name, model?.name, year?.year, trim?.name]
    .filter(Boolean)
    .join(" ");
}
