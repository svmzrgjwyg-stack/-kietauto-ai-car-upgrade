import { describe, expect, it } from "vitest";
import { formatQuoteDate, formatUsdPdf } from "@/lib/pdf/format";

describe("pdf format helpers", () => {
  it("formats USD for vi locale", () => {
    expect(formatUsdPdf(189, "vi")).toMatch(/189/);
    expect(formatUsdPdf(189, "vi")).toMatch(/US\$|USD|\$/);
  });

  it("formats quote date for vi locale with Vietnamese-capable output", () => {
    const out = formatQuoteDate("2026-10-24T12:00:00.000Z", "vi");
    expect(out.length).toBeGreaterThan(4);
    expect(out).toMatch(/2026/);
  });
});
