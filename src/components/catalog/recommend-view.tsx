"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ProductCard } from "./product-card";
import { useCombo } from "@/components/combo/combo-context";
import { useToast } from "@/components/ui/toast";
import {
  getCategories,
  getFitmentRecords,
  getSeedProducts,
  vehicleLabel,
} from "@/lib/catalog/data";
import { resolveFitment } from "@/lib/fitment/resolve";

export function RecommendView() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { vehicle, addProduct, items, hydrated } = useCombo();
  const { showToast } = useToast();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [flash, setFlash] = useState<string | null>(null);

  const products = useMemo(() => getSeedProducts(), []);
  const categories = useMemo(() => getCategories(), []);
  const fitment = useMemo(() => getFitmentRecords(), []);

  const filtered = products.filter(
    (p) => categoryId === "all" || p.categoryId === categoryId,
  );

  const comboCount = items.reduce((n, i) => n + i.qty, 0);

  if (!hydrated) {
    return <p className="text-sm text-[var(--muted)]">…</p>;
  }

  function handleAdd(productId: string) {
    addProduct(productId);
    const msg = t("recommend.addedToast");
    setFlash(msg);
    showToast(msg);
    window.setTimeout(() => setFlash(null), 3200);
  }

  return (
    <div className="space-y-4 pb-6">
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
              onAdd={() => handleAdd(product.id)}
              onRequestQuote={() => {
                handleAdd(product.id);
                router.push(`/${locale}/quote`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
