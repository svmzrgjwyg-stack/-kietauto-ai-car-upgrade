export type Locale = "vi" | "en";

export type FitmentStatus = "verified" | "unverified" | "incompatible";

export type Role = "admin" | "editor";

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Model {
  id: string;
  brandId: string;
  name: string;
  slug: string;
}

export interface Year {
  id: string;
  modelId: string;
  year: number;
}

export interface Trim {
  id: string;
  yearId: string;
  name: string;
  slug: string;
}

export interface VehicleSelection {
  brandId: string;
  modelId: string;
  yearId: string;
  trimId: string;
}

export interface Category {
  id: string;
  slug: string;
  nameKey: string;
}

export interface Product {
  id: string;
  sku: string;
  categoryId: string;
  nameKey: string;
  descriptionKey: string;
  imageUrl: string;
  priceUsd: number;
  laborCostUsd: number;
  tags: string[];
  active?: boolean;
}

export interface FitmentRecord {
  productId: string;
  brandId?: string;
  modelId?: string;
  yearId?: string;
  trimId?: string;
  status: FitmentStatus;
  notesKey?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ComboItem {
  productId: string;
  includeLabor: boolean;
  qty: number;
}

export interface QuoteLineItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  labor: number;
  lineTotal: number;
  fitmentStatus: FitmentStatus;
}

export interface QuoteDraft {
  id: string;
  locale: Locale;
  currency: "USD";
  vehicleLabel: string;
  lineItems: QuoteLineItem[];
  subtotalProducts: number;
  subtotalLabor: number;
  total: number;
  disclaimers: string[];
  customerName?: string;
  note?: string;
  createdAt: string;
}
