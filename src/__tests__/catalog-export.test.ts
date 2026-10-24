// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuoteView } from "@/components/quote/quote-view";
import { downloadQuotePdf } from "@/components/quote/quote-pdf";
import { getSeedProducts, getFitmentRecords } from "@/lib/catalog/seed";
import type { CatalogSnapshot } from "@/lib/catalog/snapshot";

vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("@/components/combo/combo-context", () => ({
  useCombo: () => ({ items: [{ productId: "dc-v35", qty: 2, includeLabor: true }], vehicle: null, hydrated: true }),
}));
vi.mock("@/components/quote/quote-pdf", () => ({ downloadQuotePdf: vi.fn(async () => {}) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
function seed(): CatalogSnapshot { return structuredClone({ products: getSeedProducts(), fitment: getFitmentRecords() }); }

describe("quote export freshness in the client", () => {
  it("clicking PDF after an admin price change exports the newly fetched canonical model", async () => {
    let current = seed();
    const fetch = vi.fn(async (url: string) => new Response(JSON.stringify(url === "/api/catalog" ? current : { configured: false })));
    vi.stubGlobal("fetch", fetch);
    render(createElement(QuoteView, { catalog: seed() }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/catalog", { cache: "no-store" }));
    current = seed();
    current.products = current.products.map((p) => p.id === "dc-v35" ? { ...p, priceUsd: 300 } : p);
    fireEvent.click(screen.getByText("quote.download"));
    await waitFor(() => expect(downloadQuotePdf).toHaveBeenCalledOnce());
    expect(vi.mocked(downloadQuotePdf).mock.calls[0][0]).toMatchObject({
      total: 758, subtotalProducts: 600, subtotalLabor: 158,
      lineItems: [expect.objectContaining({ productId: "dc-v35", unitPrice: 300, qty: 2 })],
    });
  });

  it("failed catalog refresh displays cannot-load state and never exports fallback seed prices", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url === "/api/catalog"
      ? new Response("{}", { status: 503 })
      : new Response(JSON.stringify({ configured: false }))));
    render(createElement(QuoteView, { catalog: seed() }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("catalog.unavailable"));
    expect(screen.queryByText("quote.download")).toBeNull();
    expect(downloadQuotePdf).not.toHaveBeenCalled();
  });

  it("an item hidden between view and export gives an explicit error rather than a partial PDF", async () => {
    let current = seed();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url === "/api/catalog" ? current : { configured: false }))));
    render(createElement(QuoteView, { catalog: seed() }));
    await waitFor(() => expect(screen.getByText("quote.notConfiguredBanner")).toBeTruthy());
    current = { products: [], fitment: [] };
    fireEvent.click(screen.getByText("quote.download"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("catalog.quoteUnavailable"));
    expect(downloadQuotePdf).not.toHaveBeenCalled();
  });
});
