"use client";

import { useCatalog } from "@/lib/catalog/use-catalog";
import type { CatalogSnapshot } from "@/lib/catalog/snapshot";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ProductCard } from "./product-card";
import { ConflictDialog } from "@/components/combo/conflict-dialog";
import { useCombo } from "@/components/combo/combo-context";
import { useToast } from "@/components/ui/toast";
import {
  getCategories,
  vehicleLabel,
} from "@/lib/catalog/data";
import {
  findSameCategoryConflict,
  type CategoryConflict,
} from "@/lib/combo/conflicts";
import { resolveFitment } from "@/lib/fitment/resolve";

export function RecommendView({ catalog: initialCatalog }: { catalog: CatalogSnapshot }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { vehicle, addProduct, replaceProduct, items, hydrated } = useCombo();
  const { showToast } = useToast();
  const [showSamples, setShowSamples] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [flash, setFlash] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CategoryConflict | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [afterAdd, setAfterAdd] = useState<"stay" | "quote">("stay");

  const { catalog, failed } = useCatalog(initialCatalog);
  const { products, fitment } = catalog;
  const categories = useMemo(() => getCategories(), []);

  const filtered = products.filter(
    (p) => (showSamples || p.catalogSource === "owner") && (categoryId === "all" || p.categoryId === categoryId),
  );

  const comboCount = items.reduce((n, i) => n + i.qty, 0);

  if (failed) return <p role="alert">{t("catalog.unavailable")}</p>;

  if (!hydrated) {
    return <p className="text-sm text-[var(--muted)]">…</p>;
  }

  function confirmAdded() {
    const msg = t("recommend.addedToast");
    setFlash(msg);
    showToast(msg);
    window.setTimeout(() => setFlash(null), 3200);
  }

  function finishAdd(productId: string, mode = afterAdd) {
    addProduct(productId, !products.find((p) => p.id === productId)?.hardwareOnly);
    confirmAdded();
    if (mode === "quote") {
      router.push(`/${locale}/quote`);
    }
  }

  function requestAdd(productId: string, mode: "stay" | "quote") {
    setAfterAdd(mode);
    const c = findSameCategoryConflict(productId, items, products);
    if (c) {
      setPendingId(productId);
      setConflict(c);
      return;
    }
    finishAdd(productId, mode);
  }

  return (
    <div className="space-y-4 pb-6">
      <Link className="block rounded-xl bg-blue-50 p-3 underline" href={`/${locale}/catalog`}>{locale === "vi" ? "Danh mục CarPlay Toyota / Lexus · cần hỏi giá" : "Toyota / Lexus CarPlay references · price on request"}</Link>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={showSamples} onChange={(e) => setShowSamples(e.target.checked)} />{locale === "vi" ? "Hiện sản phẩm mẫu (giá chưa được duyệt)" : "Show sample products (unapproved prices)"}</label>
      {filtered.length === 0 && <p>{locale === "vi" ? "Chưa có sản phẩm đã chốt giá trong nhóm này. Xem danh mục tham khảo và yêu cầu báo giá." : "No owner-priced products in this category. Browse references and request a quote."}</p>}
      {!vehicle ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("recommend.needVehicle")}
        </p>
      ) : (
        <p className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand)]">
          {vehicleLabel(vehicle)}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        {t("fitment.disclaimer")}
      </p>

      {flash && (
        <p
          role="status"
          aria-live="assertive"
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950"
        >
          {flash}
        </p>
      )}

      {comboCount > 0 && (
        <p className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)]">
          {t("recommend.comboCount", { count: comboCount })}
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryId("all")}
          className={`min-h-10 touch-manipulation whitespace-nowrap rounded-full px-3 text-sm font-medium ${
            categoryId === "all"
              ? "bg-[var(--brand)] text-white"
              : "border border-[var(--line)] bg-white text-[var(--muted)]"
          }`}
        >
          {t("recommend.all")}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className={`min-h-10 touch-manipulation whitespace-nowrap rounded-full px-3 text-sm font-medium ${
              categoryId === c.id
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--muted)]"
            }`}
          >
            {t(c.nameKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((product) => {
          const { status } = resolveFitment(product.id, vehicle, fitment);
          return (
            <ProductCard
              key={product.id}
              product={product}
              status={status}
              locale={locale}
              onAdd={() => requestAdd(product.id, "stay")}
              onRequestQuote={() => requestAdd(product.id, "quote")}
            />
          );
        })}
      </div>

      {conflict && pendingId && (
        <ConflictDialog
          conflict={conflict}
          onCancel={() => {
            setConflict(null);
            setPendingId(null);
          }}
          onKeepBoth={() => {
            const id = pendingId;
            setConflict(null);
            setPendingId(null);
            finishAdd(id);
          }}
          onReplace={() => {
            const id = pendingId;
            const replaceId = conflict.existingProductId;
            setConflict(null);
            setPendingId(null);
            replaceProduct(replaceId, id, !products.find((p) => p.id === id)?.hardwareOnly);
            confirmAdded();
            if (afterAdd === "quote") {
              router.push(`/${locale}/quote`);
            }
          }}
        />
      )}
    </div>
  );
}
