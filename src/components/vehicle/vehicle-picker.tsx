"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  getBrands,
  getModels,
  getTrims,
  getYears,
  vehicleLabel,
} from "@/lib/catalog/data";
import { useCombo } from "@/components/combo/combo-context";

export function VehiclePicker() {
  const t = useTranslations("vehicle");
  const locale = useLocale();
  const router = useRouter();
  const { vehicle, setVehicle } = useCombo();

  const [brandId, setBrandId] = useState(vehicle?.brandId ?? "");
  const [modelId, setModelId] = useState(vehicle?.modelId ?? "");
  const [yearId, setYearId] = useState(vehicle?.yearId ?? "");
  const [trimId, setTrimId] = useState(vehicle?.trimId ?? "");

  const brands = useMemo(() => getBrands(), []);
  const models = useMemo(
    () => (brandId ? getModels(brandId) : []),
    [brandId],
  );
  const years = useMemo(() => (modelId ? getYears(modelId) : []), [modelId]);
  const trims = useMemo(() => (yearId ? getTrims(yearId) : []), [yearId]);

  const complete = Boolean(brandId && modelId && yearId && trimId);

  function onContinue() {
    if (!complete) return;
    setVehicle({ brandId, modelId, yearId, trimId });
    router.push(`/${locale}/recommend`);
  }

  function onReset() {
    setBrandId("");
    setModelId("");
    setYearId("");
    setTrimId("");
    setVehicle(null);
  }

  // text-[16px] avoids iOS Safari input-zoom; touch-manipulation improves tap response
  const selectClass =
    "w-full min-h-12 appearance-none rounded-2xl border border-[var(--line)] bg-white px-4 text-[16px] text-[var(--ink)] shadow-sm outline-none touch-manipulation focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]";

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">
          {t("brand")}
        </label>
        <select
          className={selectClass}
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setModelId("");
            setYearId("");
            setTrimId("");
          }}
        >
          <option value="">—</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">
          {t("model")}
        </label>
        <select
          className={selectClass}
          value={modelId}
          disabled={!brandId}
          onChange={(e) => {
            setModelId(e.target.value);
            setYearId("");
            setTrimId("");
          }}
        >
          <option value="">—</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">
          {t("year")}
        </label>
        <select
          className={selectClass}
          value={yearId}
          disabled={!modelId}
          onChange={(e) => {
            setYearId(e.target.value);
            setTrimId("");
          }}
        >
          <option value="">—</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">
          {t("trim")}
        </label>
        <select
          className={selectClass}
          value={trimId}
          disabled={!yearId}
          onChange={(e) => setTrimId(e.target.value)}
        >
          <option value="">—</option>
          {trims.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.name}
            </option>
          ))}
        </select>
      </div>

      {complete && (
        <p className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand)]">
          <span className="font-semibold">{t("selected")}: </span>
          {vehicleLabel({ brandId, modelId, yearId, trimId })}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="min-h-12 flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-semibold"
        >
          {t("reset")}
        </button>
        <button
          type="button"
          disabled={!complete}
          onClick={onContinue}
          className="min-h-12 flex-[1.4] rounded-2xl bg-[var(--brand)] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
