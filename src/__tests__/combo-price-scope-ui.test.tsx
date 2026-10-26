// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ComboView } from "@/components/combo/combo-view";
import { getSeedProducts } from "@/lib/catalog/seed";
import type { ComboItem } from "@/types";
const state = vi.hoisted(() => ({ items: [] as ComboItem[] }));
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/catalog/use-catalog", () => ({ useCatalog: (catalog: unknown) => ({ catalog, failed: false }) }));
vi.mock("@/components/combo/combo-context", () => ({ useCombo: () => ({ items: state.items, vehicle: null, hydrated: true, setQty: vi.fn(), setIncludeLabor: vi.fn(), removeProduct: vi.fn() }) }));
afterEach(cleanup);
it("hardware-only combo never offers an installation checkbox or labels unknown labor as free", () => {
  const products = getSeedProducts(); const owner = products.find((p) => p.catalogSource === "owner")!;
  state.items = [{ productId: owner.id, qty: 1, includeLabor: true }];
  render(<ComboView catalog={{ products, fitment: [] }} />);
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.getByText("Not included — needs quote")).toBeTruthy();
  expect(screen.getByText("Known-price subtotal")).toBeTruthy();
  expect(screen.getByText(/Tax inclusion, shipping, stock/)).toBeTruthy();
});
it("restored legacy sample products are conspicuously marked as not approved retail", () => {
  state.items = [{ productId: "dc-v35", qty: 1, includeLabor: true }];
  render(<ComboView catalog={{ products: getSeedProducts(), fitment: [] }} />);
  expect(screen.getAllByText(/SAMPLE — prices are not owner-approved retail/).length).toBe(2);
});
