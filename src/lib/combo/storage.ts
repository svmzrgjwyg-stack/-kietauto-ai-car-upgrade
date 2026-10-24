import type { ComboItem, VehicleSelection } from "@/types";

const VEHICLE_KEY = "ka-vehicle";
const COMBO_KEY = "ka-combo";

export function loadVehicle(): VehicleSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VEHICLE_KEY);
    return raw ? (JSON.parse(raw) as VehicleSelection) : null;
  } catch {
    return null;
  }
}

export function saveVehicle(selection: VehicleSelection | null): void {
  if (typeof window === "undefined") return;
  if (!selection) {
    localStorage.removeItem(VEHICLE_KEY);
    return;
  }
  localStorage.setItem(VEHICLE_KEY, JSON.stringify(selection));
}

export function loadCombo(): ComboItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMBO_KEY);
    return raw ? (JSON.parse(raw) as ComboItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCombo(items: ComboItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMBO_KEY, JSON.stringify(items));
}
