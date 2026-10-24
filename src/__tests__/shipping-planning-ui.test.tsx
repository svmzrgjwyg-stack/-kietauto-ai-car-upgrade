// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FulfillmentEditor, ShippingSummary } from "@/components/admin/shipping-planning";
import type { Product } from "@/types";
import React from "react";
const product: Product = { id: "p", sku: "SKU", categoryId: "x", nameKey: "x", descriptionKey: "x", imageUrl: "", priceUsd: 2, laborCostUsd: 1, tags: [] };
afterEach(cleanup);
it("missing metadata displays incomplete, manual/private/approval boundaries", () => {
  render(<ShippingSummary products={[product]} vi={false} />);
  expect(screen.getByText(/INCOMPLETE COSTS/)).toBeTruthy();
  expect(screen.getByText(/Incomplete \/ unknown/)).toBeTruthy();
  expect(screen.getByText(/owner approval/)).toBeTruthy();
});
it("legacy product fields remain empty and manual input updates optional data", () => {
  const onChange = vi.fn();
  render(<FulfillmentEditor product={product} disabled={false} vi={false} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Supplier (private)"), { target: { value: "Test supplier" } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplier: "Test supplier", feeStatus: "unknown", orderStatus: "not_recorded" }));
  expect((screen.getByLabelText("Earliest estimated arrival") as HTMLInputElement).value).toBe("");
  expect(screen.queryByLabelText("WHOLE GROUP fee (USD)")).toBeNull();
});
it("switching fee to unknown clears amount instead of keeping stale costs", () => {
  const onChange = vi.fn();
  render(<FulfillmentEditor product={{ ...product, fulfillment: { stockStatus: "in_stock", orderStatus: "planned", feeStatus: "estimated", feeUsd: 15 } }} disabled={false} vi={false} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Group fee status"), { target: { value: "unknown" } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ feeStatus: "unknown", feeUsd: undefined }));
});
