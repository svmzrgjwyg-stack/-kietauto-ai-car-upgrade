import { afterEach, describe, expect, it, vi } from "vitest";
import {
  quoteSubmitConfigured,
  submitQuoteRequest,
  type QuoteSubmitPayload,
} from "@/lib/quote/submit";

function basePayload(
  overrides: Partial<QuoteSubmitPayload> = {},
): QuoteSubmitPayload {
  return {
    locale: "vi",
    consent: true,
    vehicleLabel: "Toyota Camry 2025 SE",
    vehicle: {
      brandId: "toyota",
      modelId: "camry",
      yearId: "camry-2025",
      trimId: "camry-2025-se",
    },
    items: [
      {
        productId: "dc-v35",
        sku: "DC-V35",
        name: "Dashcam V35",
        qty: 1,
        unitPrice: 189,
        labor: 79,
        lineTotal: 268,
        fitmentStatus: "unverified",
      },
    ],
    subtotalProducts: 189,
    subtotalLabor: 79,
    total: 268,
    currency: "USD",
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.QUOTE_WEBHOOK_URL;
  delete process.env.QUOTE_WEBHOOK_SECRET;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("quoteSubmitConfigured", () => {
  it("is false when QUOTE_WEBHOOK_URL is missing", () => {
    delete process.env.QUOTE_WEBHOOK_URL;
    expect(quoteSubmitConfigured()).toBe(false);
  });

  it("is true when QUOTE_WEBHOOK_URL is set", () => {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    expect(quoteSubmitConfigured()).toBe(true);
  });
});

describe("submitQuoteRequest", () => {
  it("returns not_configured and never invents success without webhook", async () => {
    delete process.env.QUOTE_WEBHOOK_URL;
    const result = await submitQuoteRequest(basePayload());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("not_configured");
    }
  });

  it("requires consent when PII is present", async () => {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    const result = await submitQuoteRequest(
      basePayload({
        customerName: "An",
        phone: "0900000000",
        consent: false,
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("consent_required");
    }
  });

  it("rejects empty combo", async () => {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    const result = await submitQuoteRequest(basePayload({ items: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid");
    }
  });

  it("returns ok only after webhook accepts", async () => {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    process.env.QUOTE_WEBHOOK_SECRET = "secret";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitQuoteRequest(
      basePayload({
        customerName: "An",
        consent: true,
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.id).toMatch(/^QR-/);
    }
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret",
    );
  });

  it("returns webhook_failed when remote rejects", async () => {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const result = await submitQuoteRequest(basePayload());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("webhook_failed");
    }
  });
});
