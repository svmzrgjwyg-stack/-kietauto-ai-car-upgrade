import { listProducts } from "@/lib/store/products";
import { listFitment } from "@/lib/store/fitment";
import { publicCatalog } from "./snapshot";

/** Server only (node:fs dependency). No process cache: every read sees saved overrides. */
export async function readCatalog() {
  const [products, fitment] = await Promise.all([listProducts(), listFitment()]);
  return publicCatalog(products, fitment);
}
