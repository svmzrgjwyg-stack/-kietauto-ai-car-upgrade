// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SavedDrafts } from "@/components/quote/saved-drafts";
import { ComboProvider, useCombo } from "@/components/combo/combo-context";
import { createSavedDraft, serializeBackup } from "@/lib/quote/saved-draft";
import { addDraft, readDrafts } from "@/lib/quote/saved-draft-storage";
import { saveWorkingCombo, WORKING_COMBO_KEY } from "@/lib/combo/storage";
import { getBrands, getModels, getYears, getTrims } from "@/lib/catalog/data";
import { getSeedProducts, getFitmentRecords } from "@/lib/catalog/seed";
const locale = vi.hoisted(() => ({ value: "en" }));
vi.mock("next-intl", () => ({ useLocale: () => locale.value, useTranslations: () => (key: string) => key }));
const brand = getBrands()[0]; const model = getModels(brand.id)[0]; const year = getYears(model.id)[0]; const trim = getTrims(year.id)[0];
const vehicle = { brandId: brand.id, modelId: model.id, yearId: year.id, trimId: trim.id };
const items = [{ productId: "dc-v35", qty: 1, includeLabor: true }];
const seed = () => structuredClone({ products: getSeedProducts(), fitment: getFitmentRecords() });
let current = seed();
function State() { const combo = useCombo(); return <output data-testid="working">{JSON.stringify({ vehicle: combo.vehicle, items: combo.items })}</output>; }
function setup() { return render(<ComboProvider><SavedDrafts /><State /></ComboProvider>); }
function stored() { const draft = createSavedDraft({ title: "Test Camry", locale: "en", vehicle, items }, seed(), (key) => key); addDraft(localStorage, draft); return draft; }
beforeEach(() => { locale.value = "en"; localStorage.clear(); current = seed(); vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(current)))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("saves current package and survives remount with visible local-only limitation", async () => {
  saveWorkingCombo(vehicle, items); const view = setup();
  expect(screen.getByText(/Stored only in this browser/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/Demo package title/), { target: { value: "Demo saved" } });
  fireEvent.click(screen.getByText("Save current package"));
  await screen.findByText("Draft saved in this browser."); expect(readDrafts(localStorage)).toHaveLength(1);
  view.unmount(); setup(); await screen.findByText("Demo saved");
});
it("requires explicit review for changed prices and preserves historical draft", async () => {
  const old = stored(); current.products.find((p) => p.id === "dc-v35")!.priceUsd = 300; setup();
  fireEvent.click(await screen.findByText("Review / reopen")); await screen.findByText(/Prices, SKUs or fitment changed/);
  expect(screen.getByTestId("working").textContent).toContain('"items":[]');
  fireEvent.click(screen.getByText("Accept and reopen")); await screen.findByText(/Opened using the current catalog/);
  expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual(items);
  expect(readDrafts(localStorage)[0]).toEqual(old);
});
it("rechecks again on acceptance and requires another confirmation if catalog changes", async () => {
  stored(); setup(); fireEvent.click(await screen.findByText("Review / reopen")); await screen.findByText(/Prices and fitment match/);
  current.products.find((p) => p.id === "dc-v35")!.priceUsd = 301;
  fireEvent.click(screen.getByText("Accept and reopen")); await screen.findByText(/catalog changed again/);
  expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual([]);
  fireEvent.click(screen.getByText("Accept and reopen")); await screen.findByText(/Opened using/);
});
it("cancelled review leaves current state intact; unavailable products block restore", async () => {
  stored(); setup(); fireEvent.click(await screen.findByText("Review / reopen")); await screen.findByText("Accept and reopen");
  fireEvent.click(screen.getByText("Cancel")); expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual([]);
  current.products = []; fireEvent.click(screen.getByText("Review / reopen")); await screen.findByText(/Vehicle or products are no longer/);
  expect((screen.getByText("Accept and reopen") as HTMLButtonElement).disabled).toBe(true);
});
it("failed atomic restore keeps old working state and reports error", async () => {
  stored(); setup(); fireEvent.click(await screen.findByText("Review / reopen")); await screen.findByText("Accept and reopen");
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) { if (key === WORKING_COMBO_KEY) throw new Error("quota"); setItem.call(this, key, value); });
  fireEvent.click(screen.getByText("Accept and reopen")); await screen.findByRole("alert");
  expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual([]); expect(localStorage.getItem(WORKING_COMBO_KEY)).toBeNull();
});
it("duplicate and confirmed delete do not modify current package", async () => {
  stored(); setup(); fireEvent.click(await screen.findByText("Duplicate")); await screen.findByText("Draft duplicated.");
  expect(readDrafts(localStorage)).toHaveLength(2);
  fireEvent.click(screen.getAllByText("Delete")[0]); const group = screen.getByRole("group");
  fireEvent.click(group.querySelector("button")!); await screen.findByText("Draft deleted."); expect(readDrafts(localStorage)).toHaveLength(1);
  expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual([]);
});
it("imports backup as new copies and rejects malformed files", async () => {
  const draft = stored(); setup();
  const input = screen.getByLabelText("Import JSON backup") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [{ size: 1000, text: async () => serializeBackup([draft]) }] } });
  await screen.findByText(/Imported as new copies/); expect(readDrafts(localStorage)).toHaveLength(2);
  fireEvent.change(input, { target: { files: [{ size: 1, text: async () => "{" }] } });
  await screen.findByRole("alert"); expect(readDrafts(localStorage)).toHaveLength(2);
});
it("shows Vietnamese boundary and handles failed network without restoring", async () => {
  locale.value = "vi"; stored(); setup(); expect(screen.getByText(/Chỉ lưu trên trình duyệt này/)).toBeTruthy();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
  fireEvent.click(await screen.findByText("Xem / mở lại")); await screen.findByRole("alert");
  expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual([]);
});
it("repeated save clicks create only one draft", async () => {
  saveWorkingCombo(vehicle, items); setup(); fireEvent.change(screen.getByLabelText(/Demo package title/), { target: { value: "Once" } });
  const button = screen.getByText("Save current package"); fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(readDrafts(localStorage)).toHaveLength(1));
});
it("adding or replacing into quantity 99 does not throw or exceed the validation bound", async () => {
  saveWorkingCombo(vehicle, [{ ...items[0], qty: 99 }, { productId: "other", qty: 1, includeLabor: true }]);
  function Actions() { const combo = useCombo(); return <><button onClick={() => combo.addProduct("dc-v35")}>add99</button><button onClick={() => combo.replaceProduct("other", "dc-v35")}>replace99</button><State /></>; }
  render(<ComboProvider><Actions /></ComboProvider>);
  fireEvent.click(screen.getByText("add99"));
  expect(JSON.parse(screen.getByTestId("working").textContent!).items[0].qty).toBe(99);
  fireEvent.click(screen.getByText("replace99"));
  expect(JSON.parse(screen.getByTestId("working").textContent!).items).toEqual([{ ...items[0], qty: 99 }]);
});
it("normalizes fractional and nonfinite quantities before persistence", () => {
  saveWorkingCombo(vehicle, items);
  function Actions() { const combo = useCombo(); return <><button onClick={() => combo.setQty("dc-v35", 1.5)}>fraction</button><button onClick={() => combo.setQty("dc-v35", NaN)}>nan</button><State /></>; }
  render(<ComboProvider><Actions /></ComboProvider>);
  fireEvent.click(screen.getByText("fraction")); expect(JSON.parse(screen.getByTestId("working").textContent!).items[0].qty).toBe(1);
  fireEvent.click(screen.getByText("nan")); expect(JSON.parse(screen.getByTestId("working").textContent!).items[0].qty).toBe(1);
});
