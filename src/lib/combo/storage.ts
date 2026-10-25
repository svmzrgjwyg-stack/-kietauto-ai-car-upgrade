import type { ComboItem, VehicleSelection } from "@/types";
import { workingComboSchema } from "@/lib/quote/saved-draft";

export const WORKING_COMBO_KEY = "ai-car-upgrade-working-combo-v1";
const VEHICLE_KEY = "ka-vehicle";
const COMBO_KEY = "ka-combo";

function loadWorking() {
  if (typeof window === "undefined") return { vehicle: null, items: [] };
  try {
    const raw = localStorage.getItem(WORKING_COMBO_KEY);
    if (raw !== null) return workingComboSchema.parse(JSON.parse(raw));
    // Read old trial state once; the next successful write uses the atomic envelope.
    return workingComboSchema.parse({ vehicle: JSON.parse(localStorage.getItem(VEHICLE_KEY) || "null"), items: JSON.parse(localStorage.getItem(COMBO_KEY) || "[]") });
  } catch {
    return { vehicle: null, items: [] };
  }
}
export function loadVehicle(): VehicleSelection | null { return loadWorking().vehicle; }
export function loadCombo(): ComboItem[] { return loadWorking().items; }
/** Validate and write both halves together before changing React state. A failed write preserves the previous combo. */
export function saveWorkingCombo(vehicle: VehicleSelection | null, items: ComboItem[]): void {
  const next = workingComboSchema.parse({ vehicle, items });
  if (typeof window === "undefined") throw new Error("Browser storage unavailable");
  localStorage.setItem(WORKING_COMBO_KEY, JSON.stringify(next));
}
export function saveVehicle(vehicle: VehicleSelection | null): void { saveWorkingCombo(vehicle, loadCombo()); }
export function saveCombo(items: ComboItem[]): void { saveWorkingCombo(loadVehicle(), items); }
