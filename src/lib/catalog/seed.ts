/** Seed fixtures only; runtime catalog consumers must use readCatalog on the server. */
import products from "../../../data/products.json";
import fitment from "../../../data/fitment.json";
import type { Product, FitmentRecord } from "@/types";
export function getSeedProducts(): Product[] { return (products as Product[]).filter((p) => p.active !== false); }
export function getFitmentRecords(): FitmentRecord[] { return fitment as FitmentRecord[]; }
