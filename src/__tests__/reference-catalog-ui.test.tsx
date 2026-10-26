// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReferenceBrowser } from "@/components/catalog/reference-browser";
import { fitmentReferences } from "@/lib/catalog/reference";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <span role="img" aria-label={props.alt || "illustration"} /> }));
afterEach(cleanup);
describe("reference browser", () => {
  it("shows unknown prices and no combo/quote actions", () => {
    render(<ReferenceBrowser references={fitmentReferences} locale="en" />);
    expect(screen.getByRole("status").textContent).toContain("45 reference configurations");
    expect(screen.getAllByText("Price on request")).toHaveLength(45);
    expect(screen.queryByText(/\$0/)).toBeNull(); expect(screen.queryByRole("button", { name: /add|quote|export/i })).toBeNull();
    expect(screen.getByText(/not 45 separate products/)).toBeTruthy(); expect(screen.getAllByText(/US-market fitment is unverified/)).toHaveLength(45);
  });
  it("filters, clears stale model on make change, resets inputs", () => {
    render(<ReferenceBrowser references={fitmentReferences} locale="en" />);
    fireEvent.change(screen.getByLabelText("Make"), { target: { value: "Lexus" } }); fireEvent.change(screen.getByLabelText("Model"), { target: { value: "RX" } }); fireEvent.change(screen.getByLabelText("Model year"), { target: { value: "2016" } });
    expect(screen.getByRole("status").textContent).toContain("3 reference"); fireEvent.change(screen.getByLabelText("Make"), { target: { value: "Toyota" } });
    expect((screen.getByLabelText("Model") as HTMLSelectElement).value).toBe(""); fireEvent.click(screen.getByRole("button", { name: "Reset filters" })); expect(screen.getByRole("status").textContent).toContain("45 reference");
  });
  it("shows Vietnamese unknown wording and safe empty result message", () => {
    render(<ReferenceBrowser references={fitmentReferences} locale="vi" />); expect(screen.getAllByText("Cần báo giá")).toHaveLength(45);
    expect(screen.getAllByText("Chưa rõ; không có nghĩa là không cần").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Tìm cấu hình / bộ điều khiển"), { target: { value: "Camry" } }); expect(screen.getByRole("status").textContent).toContain("0 cấu hình"); expect(screen.getByText(/Không có kết quả không có nghĩa/)).toBeTruthy();
  });
});
