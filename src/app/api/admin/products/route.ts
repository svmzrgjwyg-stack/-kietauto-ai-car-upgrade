import { localCatalogWritable, READ_ONLY_MESSAGE } from "@/lib/store/local-json";
import { NextResponse } from "next/server";
import { auth, hasRole } from "@/lib/auth/config";
import {
  listProducts,
  softDeleteProduct,
  upsertProduct,
} from "@/lib/store/products";
import { z } from "zod";
import { fulfillmentSchema } from "@/lib/shipping/planning";
const editableProduct = z.object({
  id: z.string().min(1),
  priceUsd: z.number().finite().min(0).max(1_000_000_000),
  laborCostUsd: z.number().finite().min(0).max(1_000_000_000).nullable(),
  active: z.boolean().optional(),
  fulfillment: fulfillmentSchema.optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const products = await listProducts();
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!localCatalogWritable()) {
    return NextResponse.json({ error: READ_ONLY_MESSAGE }, { status: 503 });
  }
  const parsed = editableProduct.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: `Invalid product: ${parsed.error.issues.map((issue) => issue.message).join("; ")}` }, { status: 400 });
  const existing = (await listProducts()).find((p) => p.id === parsed.data.id);
  if (!existing) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  if (existing.hardwareOnly && parsed.data.laborCostUsd !== null) return NextResponse.json({ error: "Hardware-only product: installation price must remain unquoted" }, { status: 400 });
  const products = await upsertProduct({
    ...existing, ...parsed.data,
    priceUsd: Math.round(parsed.data.priceUsd * 100) / 100,
    laborCostUsd: parsed.data.laborCostUsd === null ? null : Math.round(parsed.data.laborCostUsd * 100) / 100,
  });
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!localCatalogWritable()) {
    return NextResponse.json({ error: READ_ONLY_MESSAGE }, { status: 503 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const products = await softDeleteProduct(id);
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}
