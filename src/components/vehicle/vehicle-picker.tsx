"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  getBrands,
  getModels,
  getTrims,
  getYears,
  vehicleLabel,
} from "@/lib/catalog/data";
import {
  isCompleteVehicleSelection,
  sanitizeVehicleDraft,
} from "@/lib/catalog/vehicle-cascade";
import { useCombo } from "@/components/combo/combo-context";

export function VehiclePicker() {
  const t = useTranslations("vehicle");
  const locale = useLocale();
  const router = useRouter();
  const { vehicle, setVehicle, hydrated } = useCombo();

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [trimId, setTrimId] = useState("");
  const [restored, setRestored] = useState(false);

  // Restore from localStorage-backed context once; then keep cascade local.
  useEffect(() => {
    if (!hydrated || restored) return;
    if (vehicle) {
      const next = sanitizeVehicleDraft(vehicle);
      setBrandId(next.brandId);
      setModelId(next.modelId);
      setYearId(next.yearId);
      setTrimId(next.trimId);
    }
    setRestored(true);
  }, [hydrated, restored, vehicle]);

  const brands = useMemo(() => getBrands(), []);
  const models = useMemo(
    () => (brandId ? getModels(brandId) : []),
    [brandId],
  );
  const years = useMemo(() => (modelId ? getYears(modelId) : []), [modelId]);
  const trims = useMemo(() => (yearId ? getTrims(yearId) : []), [yearId]);

  // Drop stale child ids when parent options change (esp. year → trim rebuild).
  useEffect(() => {
    const next = sanitizeVehicleDraft({ brandId, modelId, yearId, trimId });
    if (next.modelId !== modelId) setModelId(next.modelId);
    if (next.yearId !== yearId) setYearId(next.yearId);
    if (next.trimId !== trimId) setTrimId(next.trimId);
  }, [brandId, modelId, yearId, trimId]);

  const complete = isCompleteVehicleSelection({
    brandId,
    modelId,
    yearId,
    trimId,
  });

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
    "w-full min-h-12 appearance-none rounded-2xl border border-[var(--line)] bg-white px-4 text-[16px] text-[var(--ink)] shadow-sm outline-none touch-manipulation focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)] disabled:bg-[var(--wash)] disabled:text-[var(--muted)]";

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
          <option value="">{t("placeholder")}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {brands.length === 0 && (
          <p className="mt-2 text-sm text-amber-800">{t("emptyBrands")}</p>
        )}
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
          <option value="">{t("placeholder")}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {brandId && models.length === 0 && (
          <p className="mt-2 text-sm text-amber-800">{t("emptyModels")}</p>
        )}
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
            // Year change always rebuilds trim: clear stale trim first.
            setYearId(e.target.value);
            setTrimId("");
          }}
        >
          <option value="">{t("placeholder")}</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.year}
            </option>
          ))}
        </select>
        {modelId && years.length === 0 && (
          <p className="mt-2 text-sm text-amber-800">{t("emptyYears")}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">
          {t("trim")}
        </label>
        <select
          className={selectClass}
          value={trimId}
          disabled={!yearId || trims.length === 0}
          onChange={(e) => setTrimId(e.target.value)}
        >
          <option value="">{t("placeholder")}</option>
          {trims.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.name}
            </option>
          ))}
        </select>
        {yearId && trims.length === 0 && (
          <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {t("emptyTrims")}
          </p>
        )}
        {yearId && trims.length > 0 && !trimId && (
          <p className="mt-2 text-xs text-[var(--muted)]">{t("pickTrim")}</p>
        )}
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
          className="min-h-12 flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-semibold touch-manipulation"
        >
          {t("reset")}
        </button>
        <button
          type="button"
          disabled={!complete}
          onClick={onContinue}
          className="min-h-12 flex-[1.4] rounded-2xl bg-[var(--brand)] px-4 text-sm font-semibold text-white touch-manipulation disabled:opacity-40"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
