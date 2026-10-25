import { NextResponse } from "next/server";
import { auth, hasRole } from "@/lib/auth/config";
import {
  listFitment,
  normalizeFitmentRecord,
  removeFitment,
  upsertFitment,
} from "@/lib/store/fitment";
import type { FitmentRecord } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const records = await listFitment();
  return NextResponse.json({ records });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<FitmentRecord>;
  if (!body?.productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }
  // Explicit normalize: missing/invalid status → unverified (never silent verified).
  const normalized = normalizeFitmentRecord({
    ...body,
    productId: body.productId,
    verifiedBy: session.user.email ?? "admin",
  });
  const records = await upsertFitment(normalized);
  return NextResponse.json({ records, saved: normalized });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as Partial<FitmentRecord>;
  if (!body?.productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }
  const records = await removeFitment({
    productId: body.productId,
    brandId: body.brandId,
    modelId: body.modelId,
    yearId: body.yearId,
    trimId: body.trimId,
  });
  return NextResponse.json({ records });
}
