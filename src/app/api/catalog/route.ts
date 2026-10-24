import { NextResponse } from "next/server";
import { readCatalog } from "@/lib/catalog/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await readCatalog(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
