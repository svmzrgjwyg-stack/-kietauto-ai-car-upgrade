"use client";

import { useCatalog } from "@/lib/catalog/use-catalog";
import type { CatalogSnapshot } from "@/lib/catalog/snapshot";

import Link from "next/link";
import { useReferenceSelection } from "@/components/browse/reference-selection-context";
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
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [flash, setFlash] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CategoryConflict | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [afterAdd, setAfterAdd] = useState<"stay" | "review">("stay");

  const { catalog, failed } = useCatalog(initialCatalog);
  const { products, fitment } = catalog;
  const categories = useMemo(() => getCategories(), []);

  const visible = products.filter((p) => showSamples || p.catalogSource === "owner");
  const presentCategories = categories.filter((c) => visible.some((p) => p.categoryId === c.id));
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = visible.filter((p) =>
    (categoryId === "all" || p.categoryId === categoryId) &&
    (!normalizedQuery || `${t(p.nameKey as Parameters<typeof t>[0])} ${t(p.descriptionKey as Parameters<typeof t>[0])}`.toLocaleLowerCase(locale).includes(normalizedQuery)),
  );

  const { count: referenceCount } = useReferenceSelection();
  const comboCount = items.reduce((n, i) => n + i.qty, 0) + referenceCount;

  if (failed) return <div className="space-y-4"><p role="alert">{t("catalog.unavailable")}</p><Link href={`/${locale}/catalog`} className="inline-flex min-h-11 items-center font-semibold text-[var(--brand)]">{t("nav.catalog")}</Link><Link href={`/${locale}/combo`} className="flex min-h-11 items-center font-semibold text-[var(--brand)]">{t("nav.combo")}</Link></div>;

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
    if (mode === "review") {
      router.push(`/${locale}/combo`);
    }
  }

  function requestAdd(productId: string, mode: "stay" | "review") {
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
    <div className="space-y-4 pb-28">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{locale === "vi" ? "Bước 2 · Khám phá" : "Step 2 · Explore"}</p><h1 className="mt-2 font-display text-3xl font-bold">{locale === "vi" ? "Chọn món cho xe" : "Find your upgrades"}</h1><p className="mt-2 text-sm text-[var(--muted)]">{locale === "vi" ? "Chạm vào ảnh để xem chi tiết, chọn món rồi xem lại gói. Thông tin chưa đủ luôn được ghi rõ." : "Tap an image for details, select items, then review your package. Missing information stays clearly marked."}</p></div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--brand-soft)] p-4">
        <div className="min-w-0"><p className="text-xs text-[var(--muted)]">{locale === "vi" ? "Xe đang xem" : "Browsing for"}</p><p className="mt-1 text-sm font-semibold text-[var(--brand)]">{vehicle ? vehicleLabel(vehicle) : (locale === "vi" ? "Chưa chọn xe · vẫn có thể khám phá" : "No vehicle yet · feel free to explore")}</p></div>
        <Link className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-white px-3 text-sm font-semibold text-[var(--brand)]" href={`/${locale}/vehicle`}>{vehicle ? (locale === "vi" ? "Đổi xe" : "Change") : (locale === "vi" ? "Chọn xe" : "Choose")}</Link>
      </div>
      <Link className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 text-sm font-semibold text-[var(--brand)]" href={`/${locale}/catalog`}><span>{locale === "vi" ? "Khám phá CarPlay Toyota / Lexus" : "Explore Toyota / Lexus CarPlay"}<span className="mt-1 block text-xs font-normal text-[var(--muted)]">{locale === "vi" ? "Ảnh cấu hình & danh sách quan tâm · chưa có giá" : "Configuration images & interest list · unpriced"}</span></span><span aria-hidden="true">→</span></Link>
      <label className="block text-sm font-semibold">{locale === "vi" ? "Tìm sản phẩm" : "Search products"}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={120} placeholder={locale === "vi" ? "Tên sản phẩm, 2CH, 4CH…" : "Product name, 2CH, 4CH…"} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base font-normal" /></label>
      <details className="rounded-xl border border-[var(--line)] bg-white p-3"><summary className="cursor-pointer text-sm font-medium">{locale === "vi" ? "Dữ liệu dùng thử" : "Demo data options"}</summary><label className="mt-2 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showSamples} onChange={(e) => { setShowSamples(e.target.checked); setCategoryId("all"); }} />{locale === "vi" ? "Hiện sản phẩm mẫu (giá chưa được duyệt)" : "Show sample products (unapproved prices)"}</label></details>
      <p className="text-xs leading-relaxed text-[var(--muted)]">{t("fitment.disclaimer")}</p>
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
          aria-pressed={categoryId === "all"}
          className={`min-h-11 touch-manipulation whitespace-nowrap rounded-full px-3 text-sm font-medium ${
            categoryId === "all"
              ? "bg-[var(--brand)] text-white"
              : "border border-[var(--line)] bg-white text-[var(--muted)]"
          }`}
        >
          {t("recommend.all")}
        </button>
        {presentCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            aria-pressed={categoryId === c.id}
            className={`min-h-11 touch-manipulation whitespace-nowrap rounded-full px-3 text-sm font-medium ${
              categoryId === c.id
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--muted)]"
            }`}
          >
            {t(c.nameKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      <p role="status" className="text-sm text-[var(--muted)]">{filtered.length} {locale === "vi" ? "sản phẩm" : "products"}</p>
      {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-6 text-center"><p className="font-semibold">{locale === "vi" ? "Chưa tìm thấy món phù hợp" : "No products match yet"}</p><p className="mt-2 text-sm text-[var(--muted)]">{locale === "vi" ? "Thử từ khóa khác hoặc xóa bộ lọc. Chưa có kết quả không có nghĩa là xe không lắp được." : "Try another term or reset filters. No result does not mean your vehicle is incompatible."}</p><button type="button" onClick={() => { setQuery(""); setCategoryId("all"); }} className="mt-4 min-h-12 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white">{locale === "vi" ? "Xóa tìm kiếm & bộ lọc" : "Reset search & filters"}</button></div>}
      <div className="space-y-4">
        {filtered.map((product) => {
          const { status } = resolveFitment(product.id, vehicle, fitment);
          return (
            <ProductCard
              key={product.id}
              product={product}
              status={status}
              locale={locale}
              onAdd={() => requestAdd(product.id, "stay")}
              selectedQty={items.find((i) => i.productId === product.id)?.qty ?? 0}
              onRequestQuote={() => items.some((i) => i.productId === product.id) ? router.push(`/${locale}/combo`) : requestAdd(product.id, "review")}
            />
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"><Link href={`/${locale}/combo`} className="mx-auto flex min-h-12 max-w-lg items-center justify-between rounded-2xl bg-[var(--brand)] px-5 text-sm font-semibold text-white"><span>{locale === "vi" ? "Xem gói đã chọn" : "Review your package"}</span><span>{comboCount} {locale === "vi" ? "món" : "items"} →</span></Link></div>
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
            if (afterAdd === "review") {
              router.push(`/${locale}/combo`);
            }
          }}
        />
      )}
    </div>
  );
}
