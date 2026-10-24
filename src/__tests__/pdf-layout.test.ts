import { describe, expect, it } from "vitest";
import {
  TABLE_COLS,
  TABLE_COL_GAP,
  dedupeQuoteDisclaimers,
  getPdfLayoutReport,
  pdfContentWidth,
  tableRowWidth,
} from "@/lib/pdf/layout";
import { comboTotals, lineLaborTotal, lineProductTotal } from "@/lib/pricing/totals";
import { getSeedProducts } from "@/lib/catalog/seed";
import type { ComboItem, Product } from "@/types";

describe("PDF layout invariants", () => {
  it("table columns fit inside A4 content width (no margin overflow)", () => {
    const report = getPdfLayoutReport();
    expect(report.tableWidth).toBeLessThanOrEqual(report.contentWidth);
    expect(report.fitsPage).toBe(true);
    expect(report.overflowPt).toBe(0);
    expect(report.marginX).toBeGreaterThanOrEqual(36);
  });

  it("qty and fitment columns are separate with a positive gap", () => {
    expect(TABLE_COLS.qty).toBeGreaterThan(0);
    expect(TABLE_COLS.fit).toBeGreaterThan(TABLE_COLS.qty);
    expect(TABLE_COL_GAP).toBeGreaterThanOrEqual(4);
    // Explicit separation: fitment width reserved so “2” cannot sit on “Cần xác minh”
    expect(TABLE_COLS.fit).toBeGreaterThanOrEqual(80);
  });

  it("column width sum matches tableRowWidth helper", () => {
    const sum =
      Object.values(TABLE_COLS).reduce((a, b) => a + b, 0) +
      TABLE_COL_GAP * (Object.keys(TABLE_COLS).length - 1);
    expect(tableRowWidth()).toBe(sum);
    expect(sum).toBeLessThanOrEqual(pdfContentWidth());
  });
});

describe("dedupeQuoteDisclaimers", () => {
  it("keeps a single fitment warning when duplicates are present", () => {
    const lines = [
      "Phụ kiện chưa được xác minh tương thích với xe này — kỹ thuật viên phải kiểm tra trước khi lắp đặt/đặt hàng.",
      "Giá ước tính; chưa gồm thuế, shipping, phụ phí phát sinh.",
      "Sản phẩm cần xác minh chưa được xác nhận lắp được trên xe này. Cần kỹ thuật viên kiểm tra trước khi đặt hàng.",
      "Báo giá không phải hợp đồng; cần xác nhận kỹ thuật trước khi đặt hàng.",
      "Phụ kiện chưa được xác minh tương thích với xe này — kỹ thuật viên phải kiểm tra trước khi lắp đặt/đặt hàng.",
    ];
    const out = dedupeQuoteDisclaimers(lines);
    const fitmentLines = out.filter((l) =>
      /chưa xác minh|not verified|technician|kỹ thuật viên/i.test(l),
    );
    // One primary fitment warning (may also match contract line — count strict fitment phrase)
    const strictFitment = out.filter((l) =>
      /chưa xác minh|not verified for this vehicle|chưa được xác minh tương thích/i.test(
        l,
      ),
    );
    expect(strictFitment.length).toBe(1);
    expect(out.length).toBeLessThan(lines.length);
    expect(fitmentLines.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves price and contract notes alongside one fitment warning", () => {
    const out = dedupeQuoteDisclaimers([
      "Accessories are not verified for this vehicle — a technician must check before install/order.",
      "Estimated pricing; tax, shipping, and extras not included.",
      "This quote is not a contract; technical confirmation required before order.",
      "Items marked needs verification have not been confirmed to fit this vehicle. Technician confirmation required before ordering.",
    ]);
    expect(out).toHaveLength(3);
    expect(out[0]).toMatch(/not verified/i);
  });
});

describe("Camry 2025 SE quote totals ($964 case)", () => {
  it("V35×2 + Pro4K×1 → parts $707, labor $257, total $964", () => {
    const products = getSeedProducts();
    const v35 = products.find((p) => p.id === "dc-v35") as Product;
    const pro = products.find((p) => p.id === "dc-pro4k") as Product;
    expect(v35.priceUsd).toBe(189);
    expect(v35.laborCostUsd).toBe(79);
    expect(pro.priceUsd).toBe(329);
    expect(pro.laborCostUsd).toBe(99);

    const items: ComboItem[] = [
      { productId: "dc-v35", includeLabor: true, qty: 2 },
      { productId: "dc-pro4k", includeLabor: true, qty: 1 },
    ];
    const byId = new Map(products.map((p) => [p.id, p]));
    const totals = comboTotals(items, byId);

    expect(lineProductTotal(v35, items[0])).toBe(378);
    expect(lineLaborTotal(v35, items[0])).toBe(158);
    expect(lineProductTotal(pro, items[1])).toBe(329);
    expect(lineLaborTotal(pro, items[1])).toBe(99);

    expect(totals.subtotalProducts).toBe(707);
    expect(totals.subtotalLabor).toBe(257);
    expect(totals.total).toBe(964);
  });
});
