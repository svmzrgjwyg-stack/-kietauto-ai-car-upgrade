"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  getBrands,
  getModels,
  getSeedProducts,
  getTrims,
  getYears,
} from "@/lib/catalog/data";
import type { FitmentRecord, FitmentStatus } from "@/types";

const DEFAULT_STATUS: FitmentStatus = "unverified";

export function AdminFitment() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<FitmentRecord[]>([]);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [trimId, setTrimId] = useState("");
  const [fitStatus, setFitStatus] = useState<FitmentStatus>(DEFAULT_STATUS);

  const products = useMemo(() => getSeedProducts(), []);
  const brands = useMemo(() => getBrands(), []);
  const models = useMemo(
    () => (brandId ? getModels(brandId) : []),
    [brandId],
  );
  const years = useMemo(
    () => (modelId ? getYears(modelId) : []),
    [modelId],
  );
  const trims = useMemo(() => (yearId ? getTrims(yearId) : []), [yearId]);

  async function load() {
    const res = await fetch("/api/admin/fitment");
    if (res.status === 401) {
      setError(t("admin.unauthorized"));
      return;
    }
    const data = await res.json();
    setRecords(data.records ?? []);
  }

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status]);

  if (status === "loading") return <p>…</p>;
  if (status !== "authenticated") return null;

  const role = session.user?.role;
  const canWrite = role === "admin" || role === "editor";

  async function save() {
    if (!productId) {
      setError(t("admin.fitmentProduct"));
      return;
    }
    setError("");
    const res = await fetch("/api/admin/fitment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        brandId: brandId || undefined,
        modelId: modelId || undefined,
        yearId: yearId || undefined,
        trimId: trimId || undefined,
        status: fitStatus,
      }),
    });
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    const data = await res.json();
    setRecords(data.records);
    // Reset status selector to unverified so next entry never inherits verified.
    setFitStatus(DEFAULT_STATUS);
  }

  async function remove(record: FitmentRecord) {
    if (role !== "admin") return;
    const res = await fetch("/api/admin/fitment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRecords(data.records);
  }

  function productLabel(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return id;
    return `${p.sku} · ${t(p.nameKey as Parameters<typeof t>[0])}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-[var(--ink)]">
          {t("admin.fitmentTitle")}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          {t("admin.fitmentHint")}
        </p>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="space-y-3 rounded-3xl border border-[var(--line)] bg-white p-4">
        <label className="block text-xs font-semibold">
          {t("admin.fitmentProduct")}
          <select
            disabled={!canWrite}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm font-normal"
          >
            <option value="">{t("admin.fitmentAny")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {productLabel(p.id)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold">
          {t("admin.fitmentBrand")}
          <select
            disabled={!canWrite}
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setModelId("");
              setYearId("");
              setTrimId("");
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm font-normal"
          >
            <option value="">{t("admin.fitmentAny")}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold">
          {t("admin.fitmentModel")}
          <select
            disabled={!canWrite || !brandId}
            value={modelId}
            onChange={(e) => {
              setModelId(e.target.value);
              setYearId("");
              setTrimId("");
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm font-normal"
          >
            <option value="">{t("admin.fitmentAny")}</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold">
          {t("admin.fitmentYear")}
          <select
            disabled={!canWrite || !modelId}
            value={yearId}
            onChange={(e) => {
              setYearId(e.target.value);
              setTrimId("");
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm font-normal"
          >
            <option value="">{t("admin.fitmentAny")}</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.year}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold">
          {t("admin.fitmentTrim")}
          <select
            disabled={!canWrite || !yearId}
            value={trimId}
            onChange={(e) => setTrimId(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm font-normal"
          >
            <option value="">{t("admin.fitmentAny")}</option>
            {trims.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold">
          {t("admin.fitmentStatus")}
          <select
            disabled={!canWrite}
            value={fitStatus}
            onChange={(e) => setFitStatus(e.target.value as FitmentStatus)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm font-normal"
          >
            <option value="unverified">{t("fitment.unverified")}</option>
            <option value="verified">{t("fitment.verified")}</option>
            <option value="incompatible">{t("fitment.incompatible")}</option>
          </select>
        </label>

        <button
          type="button"
          disabled={!canWrite || !productId}
          onClick={() => void save()}
          className="min-h-11 w-full rounded-xl bg-[var(--brand)] text-sm font-semibold text-white disabled:opacity-40"
        >
          {t("admin.fitmentConfirm")}
        </button>
      </div>

      <ul className="space-y-2">
        {records.map((r, i) => (
          <li
            key={`${r.productId}-${r.brandId}-${r.modelId}-${r.yearId}-${r.trimId}-${i}`}
            className="rounded-2xl border border-[var(--line)] bg-white p-3 text-sm"
          >
            <p className="font-semibold">{productLabel(r.productId)}</p>
            <p className="text-xs text-[var(--muted)]">
              {[r.brandId, r.modelId, r.yearId, r.trimId]
                .filter(Boolean)
                .join(" / ") || t("admin.fitmentAny")}
            </p>
            <p className="mt-1 text-xs font-semibold">
              {t(`fitment.${r.status}` as Parameters<typeof t>[0])}
              {r.verifiedBy ? ` · ${r.verifiedBy}` : ""}
            </p>
            {role === "admin" && (
              <button
                type="button"
                onClick={() => void remove(r)}
                className="mt-2 text-xs font-semibold text-rose-700"
              >
                {t("admin.fitmentRemove")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
