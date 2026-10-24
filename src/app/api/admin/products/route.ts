import { NextResponse } from "next/server";
import { auth, hasRole } from "@/lib/auth/config";
import {
  listProducts,
  softDeleteProduct,
  upsertProduct,
} from "@/lib/store/products";
import type { Product } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const products = await listProducts();
  return NextResponse.json({ products });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const product = (await req.json()) as Product;
  if (!product?.id) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  // New products always start unverified at fitment layer (no auto-verify).
  const products = await upsertProduct(product);
  return NextResponse.json({ products });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const products = await softDeleteProduct(id);
  return NextResponse.json({ products });
}
