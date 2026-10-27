// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReferenceBrowser } from "@/components/catalog/reference-browser";
import { ReferenceSelectionProvider } from "@/components/browse/reference-selection-context";
import { ReferenceSelectionReview } from "@/components/browse/reference-selection-review";
import { fitmentReferences } from "@/lib/catalog/reference";
import { REFERENCE_SELECTION_KEY } from "@/lib/browse/reference-selection";
import { getBrands, getModels, getYears } from "@/lib/catalog/data";
const state = vi.hoisted(() => ({ vehicle: null as null | {brandId: string; modelId: string; yearId: string; trimId: string} }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <span role="img" aria-label={props.alt} /> }));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/components/combo/combo-context", () => ({ useCombo: () => state }));
const id = fitmentReferences[0].id;
function View() { return <ReferenceSelectionProvider><ReferenceBrowser references={fitmentReferences} locale="en" /><ReferenceSelectionReview locale="en" /></ReferenceSelectionProvider>; }
beforeEach(() => { window.localStorage.clear(); state.vehicle = null; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe("reference shortlist flow", () => {
  it("selects, reviews, persists and removes without creating a priced quote", () => {
    const first = render(<View />);
    fireEvent.click(screen.getByRole("button", { name: `Select for review ${id}` }));
    expect(screen.getByRole("link", { name: /1 configurations selected/ }).getAttribute("href")).toBe("/en/combo");
    expect(screen.getByText(/not submitted/)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(REFERENCE_SELECTION_KEY)!)).toEqual({version: 1, ids: [id]});
    fireEvent.change(screen.getByLabelText("Search configuration / controls"), {target: {value: "nothing matches"}});
    expect(screen.getByRole("button", {name: `Remove ${id}`})).toBeTruthy();
    first.unmount(); render(<View />);
    expect(screen.getByRole("button", {name: `Remove interest ${id}`}).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", {name: `Remove ${id}`}));
    expect(screen.getByText(/Nothing selected yet/)).toBeTruthy();
    expect(screen.queryByRole("button", {name: /export|add to combo/i})).toBeNull();
  });
  it("keeps damaged storage untouched while allowing temporary selection", () => {
    window.localStorage.setItem(REFERENCE_SELECTION_KEY, "{damaged"); render(<View />);
    fireEvent.click(screen.getByRole("button", {name: `Select for review ${id}`}));
    expect(screen.getByRole("button", {name: `Remove ${id}`})).toBeTruthy();
    expect(window.localStorage.getItem(REFERENCE_SELECTION_KEY)).toBe("{damaged");
    expect(screen.getAllByText(/this session/).length).toBeGreaterThan(0);
  });
  it("survives unavailable localStorage and repeated toggles", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage blocked"); });
    render(<View />);
    fireEvent.click(screen.getByRole("button", {name: `Select for review ${id}`}));
    expect(screen.getByRole("button", {name: `Remove ${id}`})).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: `Remove interest ${id}`}));
    expect(screen.getByText(/Nothing selected yet/)).toBeTruthy();
  });
  it("applies the selected vehicle only explicitly and recovers from no references", () => {
    const brand = getBrands().find((b) => b.name === "Toyota")!;
    const model = getModels(brand.id).find((m) => m.name === "Camry")!;
    state.vehicle = {brandId: brand.id, modelId: model.id, yearId: getYears(model.id)[0].id, trimId: ""};
    render(<View />);
    expect(screen.getByRole("status").textContent).toContain("45 reference");
    fireEvent.click(screen.getByRole("button", {name: "Filter by selected vehicle"}));
    expect(screen.getByRole("status").textContent).toContain("0 reference");
    expect((screen.getByLabelText("Model") as HTMLSelectElement).value).toBe("Camry");
    fireEvent.click(screen.getByRole("button", {name: "View all configurations"}));
    expect(screen.getByRole("status").textContent).toContain("45 reference");
  });
});
