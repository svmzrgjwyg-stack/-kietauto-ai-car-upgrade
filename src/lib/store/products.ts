import { promises as fs } from "fs";
import path from "path";
import seedProducts from "../../../data/products.json";
import type { Product } from "@/types";

const ADMIN_PRODUCTS_PATH = path.join(process.cwd(), "data/admin/products.json");

async function ensureAdminFile(): Promise<void> {
  try {
    await fs.access(ADMIN_PRODUCTS_PATH);
  } catch {
    await fs.mkdir(path.dirname(ADMIN_PRODUCTS_PATH), { recursive: true });
    await fs.writeFile(
      ADMIN_PRODUCTS_PATH,
      JSON.stringify(seedProducts, null, 2),
      "utf8",
    );
  }
}

export async function listProducts(): Promise<Product[]> {
  await ensureAdminFile();
  const raw = await fs.readFile(ADMIN_PRODUCTS_PATH, "utf8");
  return JSON.parse(raw) as Product[];
}

export async function saveProducts(products: Product[]): Promise<void> {
  await ensureAdminFile();
  await fs.writeFile(
    ADMIN_PRODUCTS_PATH,
    JSON.stringify(products, null, 2),
    "utf8",
  );
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
