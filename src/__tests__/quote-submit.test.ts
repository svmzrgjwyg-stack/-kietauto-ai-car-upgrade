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

// Every request below uses a stubbed transport. No customer data or webhook network calls.
describe("quote request trust boundary", () => {
  function transport() {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    const mock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mock);
    return mock;
  }

  it.each([
    null, undefined, [], "quote", 42,
    {},
    { ...basePayload(), items: undefined },
    { ...basePayload(), items: "not an array" },
    { ...basePayload(), consent: "false" },
    { ...basePayload(), consent: "true" },
    { ...basePayload(), consent: 1 },
    { ...basePayload(), consent: undefined },
    { ...basePayload(), customerName: 123 },
    { ...basePayload(), phone: {} },
    { ...basePayload(), email: "not-an-email" },
    { ...basePayload(), note: "x".repeat(2001) },
    { ...basePayload(), locale: "fr" },
    { ...basePayload(), currency: "VND" },
    { ...basePayload(), total: -1 },
    { ...basePayload(), total: Infinity },
    { ...basePayload(), subtotalProducts: NaN },
    { ...basePayload(), vehicle: { ...basePayload().vehicle, brandId: "honda" } },
    { ...basePayload(), vehicle: { ...basePayload().vehicle, trimId: "unknown" } },
    { ...basePayload(), items: Array(101).fill(basePayload().items[0]) },
  ])("rejects malformed input without forwarding: %#", async (input) => {
    const mock = transport();
    expect(await submitQuoteRequest(input)).toMatchObject({ ok: false, code: "invalid" });
    expect(mock).not.toHaveBeenCalled();
  });

  it.each([
    { qty: 0 }, { qty: -1 }, { qty: 1.5 }, { qty: 100 }, { qty: "1" },
    { qty: NaN }, { qty: Infinity }, { unitPrice: 0 }, { unitPrice: -1 },
    { labor: -1 }, { labor: 1 }, { lineTotal: 1 },
    { productId: "unknown" }, { fitmentStatus: "compatible" },
  ])("rejects invalid or manipulated line values: %j", async (line) => {
    const mock = transport();
    const payload = basePayload();
    expect(await submitQuoteRequest({ ...payload, items: [{ ...payload.items[0], ...line }] }))
      .toMatchObject({ ok: false, code: "invalid" });
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects tampered totals and duplicate product IDs", async () => {
    const mock = transport();
    expect(await submitQuoteRequest(basePayload({ total: 1 })))
      .toMatchObject({ ok: false, code: "invalid" });
    const payload = basePayload();
    expect(await submitQuoteRequest({ ...payload, items: [...payload.items, ...payload.items] }))
      .toMatchObject({ ok: false, code: "invalid" });
    expect(mock).not.toHaveBeenCalled();
  });

  it("rebuilds display data and fitment from catalog, discarding unknown fields", async () => {
    const mock = transport();
    const payload = basePayload();
    const result = await submitQuoteRequest({
      ...payload,
      id: "forged-id", submittedAt: "forged-date", extraCustomerData: "discard",
      vehicleLabel: "Wrong vehicle",
      items: [{ ...payload.items[0], name: "Guaranteed fit", sku: "forged", fitmentStatus: "verified" }],
    });
    expect(result.ok).toBe(true);
    const body = JSON.parse(mock.mock.calls[0][1].body);
    expect(body.id).not.toBe("forged-id");
    expect(body.submittedAt).not.toBe("forged-date");
    expect(body).not.toHaveProperty("extraCustomerData");
    expect(body.vehicleLabel).toBe("Toyota Camry 2025 SE");
    expect(body.items[0]).toMatchObject({ sku: "KA-DC-V35", fitmentStatus: "unverified", unitPrice: 189, labor: 79, lineTotal: 268 });
    expect(body.items[0].name).not.toBe("Guaranteed fit");
    expect(body.total).toBe(268);
  });

  it("preserves supported quantity and parts-only selection with canonical totals", async () => {
    const mock = transport();
    const payload = basePayload();
    expect(await submitQuoteRequest({
      ...payload, locale: "en", vehicle: null, consent: false,
      items: [{ ...payload.items[0], qty: 2, labor: 0, lineTotal: 378 }],
      subtotalProducts: 378, subtotalLabor: 0, total: 378,
    })).toMatchObject({ ok: true });
    const body = JSON.parse(mock.mock.calls[0][1].body);
    expect(body.vehicleLabel).toBe("—");
    expect(body.items[0]).toMatchObject({ qty: 2, labor: 0, lineTotal: 378, fitmentStatus: "unverified" });
    expect(body).not.toHaveProperty("customerName");
    expect(body).not.toHaveProperty("note");
  });

  it("requires explicit consent for free-form notes too", async () => {
    const mock = transport();
    expect(await submitQuoteRequest(basePayload({ consent: false, note: "Please call me at a private number." })))
      .toMatchObject({ ok: false, code: "consent_required" });
    expect(mock).not.toHaveBeenCalled();
  });

  it("does not expose a transport exception or claim success", async () => {
    const mock = transport();
    mock.mockRejectedValue(new Error("private webhook information"));
    expect(await submitQuoteRequest(basePayload())).toEqual({
      ok: false, code: "webhook_failed", message: "Could not reach quote webhook.",
    });
  });
});

it("preserves multiple items, quantities and included line labor", async () => {
  process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
  const mock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal("fetch", mock);
  const payload = basePayload();
  const result = await submitQuoteRequest({
    ...payload,
    items: [
      { ...payload.items[0], qty: 2, labor: 158, lineTotal: 536 },
      { ...payload.items[0], productId: "dc-pro4k", unitPrice: 329, labor: 0, lineTotal: 329 },
    ],
    subtotalProducts: 707, subtotalLabor: 158, total: 865,
  });
  expect(result).toMatchObject({ ok: true });
  const body = JSON.parse(mock.mock.calls[0][1].body);
  expect(body.items[0]).toMatchObject({ qty: 2, labor: 158, lineTotal: 536 });
  expect(body.items[1]).toMatchObject({ sku: "KA-DC-4K", labor: 0 });
  expect(body.total).toBe(865);
});
