// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QuoteDocument, type QuotePdfLabels } from "@/components/quote/quote-pdf";
import type { QuoteDraft } from "@/types";
vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  StyleSheet: { create: (s: unknown) => s }, pdf: vi.fn(),
}));
afterEach(cleanup);
const labels = Object.fromEntries(["title", "quoteId", "date", "vehicle", "sku", "item", "qty", "fitment", "unit", "labor", "line", "partsSubtotal", "laborSubtotal", "total", "contact", "fitmentVerified", "fitmentUnverified", "fitmentIncompatible", "disclaimerHeading"].map((key) => [key, key])) as QuotePdfLabels;
const base: QuoteDraft = { id: "Q-test", locale: "en", currency: "USD", vehicleLabel: "Toyota Camry", createdAt: "2026-10-26T00:00:00.000Z", subtotalProducts: 115, subtotalLabor: 0, total: 115, disclaimers: [], priceScope: "pending_charges", lineItems: [{ productId: "owner", name: "Botslab", sku: "BOT", qty: 1, unitPrice: 115, labor: 0, lineTotal: 115, fitmentStatus: "unverified", hardwareOnly: true, priceScope: "pending_charges" }] };
it("PDF labels hardware-only subtotal and exclusions without showing installation as free", () => {
  render(<QuoteDocument quote={base} labels={labels} />);
  expect(screen.getByText("Known-price subtotal (USD)")).toBeTruthy();
  expect(screen.getByText("Not included")).toBeTruthy();
  expect(screen.getAllByText(/Tax inclusion, shipping, stock/).length).toBeGreaterThan(0);
});
it("mixed sample and owner PDF keeps both sample warning and pending charge subtotal", () => {
  const quote: QuoteDraft = { ...base, priceScope: "sample", lineItems: [...base.lineItems, { ...base.lineItems[0], productId: "sample", hardwareOnly: false, priceScope: "sample" }] };
  render(<QuoteDocument quote={quote} labels={labels} />);
  expect(screen.getByText("SAMPLE — unapproved price")).toBeTruthy();
  expect(screen.getAllByText(/not approved retail/).length).toBeGreaterThan(0);
  expect(screen.getByText("Known-price subtotal (USD)")).toBeTruthy();
});
it("Vietnamese PDF carries the same explicit exclusions", () => {
  render(<QuoteDocument quote={{ ...base, locale: "vi" }} labels={labels} />);
  expect(screen.getByText("Tạm tính phần đã có giá (USD)")).toBeTruthy();
  expect(screen.getByText("Chưa gồm công")).toBeTruthy();
});
