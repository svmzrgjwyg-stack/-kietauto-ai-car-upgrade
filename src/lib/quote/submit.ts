export type QuoteSubmitPayload = {
  locale: string;
  customerName?: string;
  phone?: string;
  email?: string;
  note?: string;
  consent: boolean;
  vehicleLabel: string;
  vehicle: {
    brandId: string;
    modelId: string;
    yearId: string;
    trimId: string;
  } | null;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    qty: number;
    unitPrice: number;
    labor: number;
    lineTotal: number;
    fitmentStatus: string;
  }>;
  subtotalProducts: number;
  subtotalLabor: number;
  total: number;
  currency: "USD";
};

export type QuoteSubmitResult =
  | { ok: true; id: string }
  | {
      ok: false;
      code: "not_configured" | "webhook_failed" | "invalid" | "consent_required";
      message: string;
    };

export function quoteSubmitConfigured(): boolean {
  return Boolean(process.env.QUOTE_WEBHOOK_URL?.trim());
}

/**
 * Forward quote request to configured webhook. Never invents success.
 * Does not persist PII locally — webhook/store is the only sink when configured.
 */
export async function submitQuoteRequest(
  payload: QuoteSubmitPayload,
): Promise<QuoteSubmitResult> {
  const hasPii = Boolean(
    payload.customerName?.trim() ||
      payload.phone?.trim() ||
      payload.email?.trim(),
  );
  if (hasPii && !payload.consent) {
    return {
      ok: false,
      code: "consent_required",
      message: "Consent required to send contact details.",
    };
  }

  const url = process.env.QUOTE_WEBHOOK_URL?.trim();
  if (!url) {
    return {
      ok: false,
      code: "not_configured",
      message:
        "Quote submission is not configured (QUOTE_WEBHOOK_URL missing).",
    };
  }

  if (!payload.items.length) {
    return {
      ok: false,
      code: "invalid",
      message: "Combo is empty.",
    };
  }

  const id = `QR-${Date.now().toString(36).toUpperCase()}`;
  const body = {
    id,
    submittedAt: new Date().toISOString(),
    ...payload,
    // Only include PII fields when consent is true
    customerName: payload.consent ? payload.customerName : undefined,
    phone: payload.consent ? payload.phone : undefined,
    email: payload.consent ? payload.email : undefined,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.QUOTE_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.QUOTE_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return {
        ok: false,
        code: "webhook_failed",
        message: `Webhook responded ${res.status}.`,
      };
    }
    return { ok: true, id };
  } catch {
    return {
      ok: false,
      code: "webhook_failed",
      message: "Could not reach quote webhook.",
    };
  }
}
