import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { listProducts, upsertProduct, softDeleteProduct } from "@/lib/store/products";
import { listFitment, upsertFitment } from "@/lib/store/fitment";
import { localCatalogWritable, readLocalJson, writeLocalJson } from "@/lib/store/local-json";
import { fetchCatalog } from "@/lib/catalog/use-catalog";
import { readCatalog } from "@/lib/catalog/server";
import { publicCatalog } from "@/lib/catalog/snapshot";
import { buildQuoteModel } from "@/lib/quote/model";
import { validateQuoteRequest } from "@/lib/quote/validate";
import { GET as getPublicCatalog } from "@/app/api/catalog/route";
import { GET as getAdminProducts, PUT as putAdminProduct, DELETE as hideAdminProduct } from "@/app/api/admin/products/route";
import { PUT as putAdminFitment } from "@/app/api/admin/fitment/route";
vi.mock("@/lib/auth/config", () => ({
  auth: async () => ({ user: { role: "admin", email: "test@example.invalid" } }),
  hasRole: () => true,
}));
let directory: string;
beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "catalog-test-"));
  vi.stubEnv("CATALOG_LOCAL_DIR", directory);
  vi.stubEnv("CATALOG_STORAGE", "local");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("AWS_LAMBDA_FUNCTION_NAME", "");
  vi.stubEnv("NETLIFY", "");
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await fs.rm(directory, { recursive: true, force: true });
});
const vehicle = { brandId: "toyota", modelId: "camry", yearId: "camry-2025", trimId: "camry-2025-se" };
const items = [{ productId: "dc-v35", qty: 2, includeLabor: true }];
function request(value: unknown) {
  return new Request("http://localhost/api/admin/products", { method: "PUT", body: JSON.stringify(value), headers: { "Content-Type": "application/json" } });
}
function quotePayload(model: ReturnType<typeof buildQuoteModel>) {
  const { lineItems, ...totals } = model;
  return { locale: "vi", consent: false, vehicle, vehicleLabel: "", items: lineItems, ...totals, currency: "USD" };
}

describe("one current catalog for admin, recommendation, combo, quote and PDF", () => {
  it("admin API price save is reread by catalog API, quote/PDF model and server validator", async () => {
    const previous = await readCatalog();
    const oldQuote = quotePayload(buildQuoteModel(items, vehicle, previous, (key) => key));
    const product = (await listProducts()).find((p) => p.id === "dc-v35")!;
    const saved = await putAdminProduct(request({ ...product, priceUsd: 777.25, laborCostUsd: 81.5 }));
    expect(saved.status).toBe(200);
    const admin = await (await getAdminProducts()).json();
    expect(admin.products.find((p: { id: string }) => p.id === product.id).priceUsd).toBe(777.25);
    const response = await getPublicCatalog();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const catalog = await response.json();
    const pdf = buildQuoteModel(items, vehicle, catalog, (key) => key);
    expect(pdf.lineItems[0].unitPrice).toBe(777.25);
    expect(pdf.total).toBe(1717.5);
    expect(validateQuoteRequest(quotePayload(pdf), catalog)?.total).toBe(1717.5);
    expect(validateQuoteRequest(oldQuote, catalog)).toBeNull();
    // New module request/read does not re-seed or retain a stale in-memory snapshot.
    expect(await readCatalog()).toEqual(catalog);
    expect(JSON.parse(await fs.readFile(path.join(directory, "products.json"), "utf8")).find((p: { id: string }) => p.id === "dc-v35").priceUsd).toBe(777.25);
  });

  it("refresh immediately before export uses a changed admin price, not the earlier view snapshot", async () => {
    const earlierView = await readCatalog();
    const product = earlierView.products.find((p) => p.id === "dc-v35")!;
    await upsertProduct({ ...product, priceUsd: 250.5 });
    const fetch = vi.fn(async () => getPublicCatalog());
    vi.stubGlobal("fetch", fetch);
    const freshExport = buildQuoteModel(items, vehicle, await fetchCatalog(), (key) => key);
    expect(earlierView.products.find((p) => p.id === "dc-v35")?.priceUsd).toBe(189);
    expect(freshExport.total).toBe(659);
    expect(fetch).toHaveBeenCalledWith("/api/catalog", { cache: "no-store" });
    await fs.writeFile(path.join(directory, "products.json"), "corrupt");
    await expect(fetchCatalog()).rejects.toThrow("unavailable");
  });

  it("hidden products disappear from recommendations and invalidate saved combo/quote rather than silent PDF omission", async () => {
    const before = await readCatalog();
    const payload = quotePayload(buildQuoteModel(items, vehicle, before, (key) => key));
    await hideAdminProduct(new Request("http://localhost/api/admin/products?id=dc-v35", { method: "DELETE" }));
    const current = await readCatalog();
    expect(current.products.some((p) => p.id === "dc-v35")).toBe(false);
    expect(current.fitment.some((p) => p.productId === "dc-v35")).toBe(false);
    expect((await listProducts()).find((p) => p.id === "dc-v35")?.active).toBe(false);
    expect(validateQuoteRequest(payload, current)).toBeNull();
    expect(() => buildQuoteModel(items, vehicle, current, (key) => key)).toThrow("unavailable");
  });

  it("admin fitment update is reflected in quote/PDF and validator, including after another read", async () => {
    const response = await putAdminFitment(request({ productId: "dc-v35", ...vehicle, status: "incompatible" }));
    expect(response.status).toBe(200);
    const catalog = await readCatalog();
    const pdf = buildQuoteModel(items, vehicle, catalog, (key) => key);
    expect(pdf.lineItems[0].fitmentStatus).toBe("incompatible");
    expect(validateQuoteRequest(quotePayload(pdf), await readCatalog())?.items[0].fitmentStatus).toBe("incompatible");
  });

  it("missing fitment status stays unverified and verification evidence notes/date survive public projection", async () => {
    await upsertFitment({ productId: "dc-v35", ...vehicle });
    expect(buildQuoteModel(items, vehicle, await readCatalog(), (key) => key).lineItems[0].fitmentStatus).toBe("unverified");
    await upsertFitment({ productId: "dc-v35", ...vehicle, status: "verified", verifiedAt: "2026-01-02", verifiedBy: "private@example.invalid", notesKey: "evidence" });
    const records = (await readCatalog()).fitment;
    expect(records).toContainEqual(expect.objectContaining({ verifiedAt: "2026-01-02", notesKey: "evidence", status: "verified" }));
    expect(JSON.stringify(records)).not.toContain("private@example.invalid");
    expect((await listFitment()).some((r) => r.verifiedBy === "private@example.invalid")).toBe(true);
  });

  it("public DTO never spreads extra internal fields from stored products", async () => {
    const products = await listProducts();
    const withSecret = products.map((p) => ({ ...p, purchaseCost: 10, secret: "not-public" }));
    expect(JSON.stringify(publicCatalog(withSecret, []))).not.toMatch(/purchaseCost|not-public/);
  });

  it("manual fulfillment persists only locally and stays absent from public catalog and PDF model", async () => {
    const product = (await listProducts()).find((p) => p.id === "dc-v35")!;
    const fulfillment = { supplier: "PRIVATE", source: "private-reference", stockStatus: "in_stock", orderStatus: "planned", checkedOn: "2026-10-20", arrivalFrom: "2026-10-25", arrivalTo: "2026-10-28", shipmentGroup: "order-A", feeStatus: "estimated", feeUsd: 24.50 };
    expect((await putAdminProduct(request({ ...product, fulfillment }))).status).toBe(200);
    expect((await listProducts()).find((p) => p.id === "dc-v35")!.fulfillment).toEqual(fulfillment);
    expect(JSON.stringify(await readCatalog())).not.toMatch(/PRIVATE|private-reference|fulfillment/);
    expect(buildQuoteModel(items, vehicle, await readCatalog(), (key) => key).total).toBe(536);
    expect((await putAdminProduct(request({ ...product, fulfillment: { ...fulfillment, feeUsd: -1 } }))).status).toBe(400);
    expect((await listProducts()).find((p) => p.id === "dc-v35")!.fulfillment).toEqual(fulfillment);
  });

  it("keeps owner camera labor unquoted and rejects an installed-price edit", async () => {
    const id = "botslab-2ch-model-pending";
    expect((await putAdminProduct(request({ id, priceUsd: 115, laborCostUsd: null }))).status).toBe(200);
    expect((await putAdminProduct(request({ id, priceUsd: 115, laborCostUsd: 0 }))).status).toBe(400);
    expect((await putAdminProduct(request({ id, priceUsd: 115, laborCostUsd: 50 }))).status).toBe(400);
    expect((await readCatalog()).products.find((p) => p.id === id)?.laborCostUsd).toBeNull();
  });

  it("rejects unknown products and invalid price edits at the admin API", async () => {
    expect((await putAdminProduct(request({ id: "new-id", priceUsd: 1, laborCostUsd: 2 }))).status).toBe(404);
    expect((await putAdminProduct(request({ id: "dc-v35", priceUsd: -1, laborCostUsd: 2 }))).status).toBe(400);
    expect((await readCatalog()).products.find((p) => p.id === "dc-v35")!.priceUsd).toBe(189);
  });

  it("reads do not create files and corrupt overrides fail visibly instead of reverting to seed prices", async () => {
    await readCatalog();
    expect(await fs.readdir(directory)).toEqual([]);
    await fs.writeFile(path.join(directory, "products.json"), "broken");
    await expect(readCatalog()).rejects.toThrow();
    expect((await getPublicCatalog()).status).toBe(503);
  });
});

describe("local-only storage boundary", () => {
  it.each(["VERCEL", "AWS_LAMBDA_FUNCTION_NAME", "NETLIFY"])("%s overrides any local opt-in and never reports successful save", async (host) => {
    vi.stubEnv(host, "1");
    expect(localCatalogWritable()).toBe(false);
    const product = (await listProducts()).find((p) => p.id === "dc-v35")!;
    await expect(upsertProduct({ ...product, priceUsd: 999 })).rejects.toThrow("read-only");
    await expect(softDeleteProduct(product.id)).rejects.toThrow("read-only");
    expect((await putAdminProduct(request(product))).status).toBe(503);
    expect((await putAdminFitment(request({ productId: product.id }))).status).toBe(503);
    expect((await readCatalog()).products.find((p) => p.id === "dc-v35")!.priceUsd).toBe(189);
    expect(await fs.readdir(directory)).toEqual([]);
  });

  it("production defaults to read-only without an explicit local test opt-in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.CATALOG_STORAGE;
    expect(localCatalogWritable()).toBe(false);
    await expect(writeLocalJson("products.json", [])).rejects.toThrow("read-only");
    expect(await readLocalJson("products.json", ["seed"])).toEqual(["seed"]);
  });
});
