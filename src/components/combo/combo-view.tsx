"use client";

import { useCatalog } from "@/lib/catalog/use-catalog";
import type { CatalogSnapshot } from "@/lib/catalog/snapshot";

import Link from "next/link";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FitmentBadge } from "@/components/ui/fitment-badge";
import { useToast } from "@/components/ui/toast";
import { useCombo } from "@/components/combo/combo-context";
import { vehicleLabel } from "@/lib/catalog/data";
import { listDuplicateCategories } from "@/lib/combo/conflicts";
import { resolveFitment } from "@/lib/fitment/resolve";
import {
  comboTotals,
  formatUsd,
  lineLaborTotal,
  lineProductTotal,
  lineTotal,
} from "@/lib/pricing/totals";

const CATEGORY_I18N: Record<string, string> = {
  dashcam: "dashcam",
  "head-unit": "headUnit",
  carplay: "carplay",
  "camera-360": "camera360",
  lights: "lights",
  "power-liftgate": "powerLiftgate",
  other: "other",
};

export function ComboView({ catalog: initialCatalog }: { catalog: CatalogSnapshot }) {
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

  const { catalog, failed } = useCatalog(initialCatalog);
  const { products, fitment } = catalog;
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const totals = comboTotals(items, byId);
  const hasPendingCharges = items.some((item) => { const p = byId.get(item.productId); return p?.hardwareOnly || p?.laborCostUsd === null || p?.taxStatus === "unconfirmed"; });
  const hasSamples = items.some((item) => byId.get(item.productId)?.catalogSource === "sample");
  const pendingText = locale === "vi" ? "Chỉ giá máy; chưa gồm công lắp. Thuế, phí vận chuyển, tồn kho và bộ phụ kiện cần xác nhận. Đây không phải tổng thanh toán cuối cùng." : "Hardware only; installation is not included. Tax inclusion, shipping, stock and package contents need confirmation. This is not a final payable total.";
  const sampleText = locale === "vi" ? "MẪU — giá chưa được chủ cửa hàng duyệt, không dùng làm báo giá bán chính thức." : "SAMPLE — prices are not owner-approved retail; not a final sales quote.";

  const hasUnverified = items.some((item) => {
    const { status } = resolveFitment(item.productId, vehicle, fitment);
    return status === "unverified";
  });

  const duplicateCategories = useMemo(
    () => listDuplicateCategories(items, products),
    [items, products],
  );

  const duplicateLabel = duplicateCategories
    .map((id) =>
      t(
        `categories.${CATEGORY_I18N[id] ?? "other"}` as Parameters<typeof t>[0],
      ),
    )
    .join(", ");

  if (failed) return <p role="alert">{t("catalog.unavailable")}</p>;

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
      {hasPendingCharges && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{pendingText}</p>}
      {hasSamples && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{sampleText}</p>}
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
      {duplicateCategories.length > 0 && (
        <p
          role="status"
          className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950"
        >
          {t("combo.duplicateWarn", { categories: duplicateLabel })}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const product = byId.get(item.productId);
          if (!product) return (
            <li key={item.productId} className="rounded-3xl border border-amber-200 p-4">
              <p>{t("catalog.itemUnavailable")}</p>
              <button type="button" onClick={() => removeProduct(item.productId)} className="min-h-11 font-semibold">
                {t("combo.remove")}
              </button>
            </li>
          );
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
                  {product.catalogSource === "sample" && <p className="text-xs font-bold text-amber-900">{sampleText}</p>}
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
                {!product.hardwareOnly && product.laborCostUsd !== null && <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.includeLabor}
                    onChange={(e) =>
                      setIncludeLabor(item.productId, e.target.checked)
                    }
                    className="h-5 w-5"
                  />
                  {t("combo.includeLabor")}
                </label>}
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
                  <span>{product.hardwareOnly || product.laborCostUsd === null ? (locale === "vi" ? "Chưa bao gồm — cần báo giá" : "Not included — needs quote") : formatUsd(labor, locale)}</span>
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
          <span>{hasPendingCharges ? (locale === "vi" ? "Tạm tính phần đã có giá" : "Known-price subtotal") : t("combo.total")}</span>
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
