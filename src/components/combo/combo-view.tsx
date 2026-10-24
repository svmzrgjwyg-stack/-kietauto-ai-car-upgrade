"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FitmentBadge } from "@/components/ui/fitment-badge";
import { useToast } from "@/components/ui/toast";
import { useCombo } from "@/components/combo/combo-context";
import {
  getFitmentRecords,
  getSeedProducts,
  vehicleLabel,
} from "@/lib/catalog/data";
import { resolveFitment } from "@/lib/fitment/resolve";
import {
  comboTotals,
  formatUsd,
  lineLaborTotal,
  lineProductTotal,
  lineTotal,
} from "@/lib/pricing/totals";

export function ComboView() {
  const t = useTranslations();
  const locale = useLocale();
  const { showToast } = useToast();
  const {
    items,
    vehicle,
    setQty,
    setIncludeLabor,
    removeProduct,
    hydrated,
  } = useCombo();

  const products = useMemo(() => getSeedProducts(), []);
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const fitment = useMemo(() => getFitmentRecords(), []);
  const totals = comboTotals(items, byId);

  const hasUnverified = items.some((item) => {
    const { status } = resolveFitment(item.productId, vehicle, fitment);
    return status === "unverified";
  });

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)]">{t("combo.empty")}</p>
        <Link
          href={`/${locale}/recommend`}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--brand)] px-5 text-sm font-semibold text-white touch-manipulation"
        >
          {t("nav.recommend")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36">
      {vehicle && (
        <p className="text-sm font-medium text-[var(--brand)]">
          {vehicleLabel(vehicle)}
        </p>
      )}
      {hasUnverified && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("combo.unverifiedWarn")}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const product = byId.get(item.productId);
          if (!product) return null;
          const { status } = resolveFitment(item.productId, vehicle, fitment);
          const name = t(product.nameKey as Parameters<typeof t>[0]);
          const parts = lineProductTotal(product, item);
          const labor = lineLaborTotal(product, item);
          const line = lineTotal(product, item);
          return (
            <li
              key={item.productId}
              className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--ink)]">{name}</p>
                  <p className="text-xs text-[var(--muted)]">{product.sku}</p>
                </div>
                <FitmentBadge status={status} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  {t("combo.qty")}
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.qty}
                    onChange={(e) =>
                      setQty(item.productId, Number(e.target.value) || 1)
                    }
                    className="min-h-11 w-16 rounded-xl border border-[var(--line)] px-2 text-center text-[16px]"
                  />
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.includeLabor}
                    onChange={(e) =>
                      setIncludeLabor(item.productId, e.target.checked)
                    }
                    className="h-5 w-5"
                  />
                  {t("combo.includeLabor")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    removeProduct(item.productId);
                    showToast(t("combo.removedToast"));
                  }}
                  className="ml-auto min-h-11 touch-manipulation rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700"
                >
                  {t("combo.remove")}
                </button>
              </div>
              <div className="mt-3 space-y-1 rounded-2xl bg-[var(--wash)] px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t("combo.lineParts")}</span>
                  <span>{formatUsd(parts, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t("combo.lineLabor")}</span>
                  <span>{formatUsd(labor, locale)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--line)] pt-1 font-semibold">
                  <span>{t("combo.lineTotal")}</span>
                  <span>{formatUsd(line, locale)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--wash)] p-4 text-sm">
        <div className="flex justify-between py-1">
          <span>{t("combo.subtotalProducts")}</span>
          <span>{formatUsd(totals.subtotalProducts, locale)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{t("combo.subtotalLabor")}</span>
          <span>{formatUsd(totals.subtotalLabor, locale)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-[var(--line)] pt-3 text-base font-bold">
          <span>{t("combo.total")}</span>
          <span>{formatUsd(totals.total, locale)}</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <Link
            href={`/${locale}/quote`}
            className="flex min-h-12 touch-manipulation items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-[var(--ink)]"
          >
            {t("combo.requestQuote")}
          </Link>
          <Link
            href={`/${locale}/quote`}
            className="flex min-h-11 touch-manipulation items-center justify-center text-sm font-semibold text-[var(--brand)]"
          >
            {t("combo.exportPdf")}
          </Link>
        </div>
      </div>
    </div>
  );
}
