import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/quote/request/route";

afterEach(() => {
  delete process.env.QUOTE_WEBHOOK_URL;
  vi.unstubAllGlobals();
});

describe("POST /api/quote/request", () => {
  it.each(["{broken", "null", "[]", '"text"', '{"consent":"false","items":[]}'])
  ("returns 400 for malformed request bodies without a throw: %s", async (body) => {
    process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/quote/request", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, code: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

it("does not coerce a string consent flag on an otherwise valid request", async () => {
  process.env.QUOTE_WEBHOOK_URL = "https://hooks.example/quote";
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal("fetch", fetchMock);
  const response = await POST(new Request("http://localhost/api/quote/request", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "en", consent: "false", customerName: "Test person",
      vehicleLabel: "—", vehicle: null, currency: "USD",
      items: [{ productId: "dc-v35", sku: "KA-DC-V35", name: "Dashcam",
        qty: 1, unitPrice: 189, labor: 79, lineTotal: 268, fitmentStatus: "unverified" }],
      subtotalProducts: 189, subtotalLabor: 79, total: 268,
    }),
  }));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ ok: false, code: "invalid" });
  expect(fetchMock).not.toHaveBeenCalled();
});
