import { readLocalJson, writeLocalJson } from "./local-json";
import seedProducts from "../../../data/products.json";
import type { Product } from "@/types";


export async function listProducts(): Promise<Product[]> {
  return readLocalJson("products.json", seedProducts as Product[]);
}

export async function saveProducts(records: Product[]): Promise<void> {
  await writeLocalJson("products.json", records);
}

export async function upsertProduct(product: Product): Promise<Product[]> {
  const products = await listProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push({ ...product, active: product.active ?? true });
  }
  await saveProducts(products);
  return products;
}

export async function softDeleteProduct(id: string): Promise<Product[]> {
  const products = await listProducts();
  const next = products.map((p) =>
    p.id === id ? { ...p, active: false } : p,
  );
  await saveProducts(next);
  return next;
}

export function getSeedProducts(): Product[] {
  return seedProducts as Product[];
}
