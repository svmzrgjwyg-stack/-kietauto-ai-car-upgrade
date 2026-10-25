import { NextResponse } from "next/server";
import {
  quoteSubmitConfigured,
  submitQuoteRequest,
  type QuoteSubmitPayload,
} from "@/lib/quote/submit";

export async function GET() {
  return NextResponse.json({
    configured: quoteSubmitConfigured(),
  });
}

export async function POST(req: Request) {
  let body: QuoteSubmitPayload;
  try {
    body = (await req.json()) as QuoteSubmitPayload;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await submitQuoteRequest({
    ...body,
    consent: Boolean(body.consent),
  });

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
