import { NextResponse } from "next/server";
import {
  quoteSubmitConfigured,
  submitQuoteRequest,
} from "@/lib/quote/submit";

export async function GET() {
  return NextResponse.json({
    configured: quoteSubmitConfigured(),
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await submitQuoteRequest(body);

  if (!result.ok) {
    const status =
      result.code === "not_configured"
        ? 503
        : result.code === "consent_required" || result.code === "invalid"
          ? 400
          : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
