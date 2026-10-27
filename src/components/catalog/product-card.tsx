"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FitmentBadge } from "@/components/ui/fitment-badge";
import { formatUsd } from "@/lib/pricing/totals";
import type { FitmentStatus, Product } from "@/types";

type Props = {
  product: Product;
  status: FitmentStatus;
  locale: string;
  onAdd: () => void;
  onRequestQuote: () => void;
  selectedQty?: number;
};

/** Selection feedback comes from the persisted combo, never a speculative click timer. */
export function ProductCard({ product, status, locale, onAdd, onRequestQuote, selectedQty = 0 }: Props) {
  const t = useTranslations();
  const vi = locale === "vi";
  const name = t(product.nameKey as Parameters<typeof t>[0]);
  const desc = t(product.descriptionKey as Parameters<typeof t>[0]);
  const owner = product.catalogSource === "owner";
  const blocked = status === "incompatible";
  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${blocked ? "border-rose-200" : "border-[var(--line)]"}`}>
      <details className="group">
        <summary className="cursor-pointer list-none rounded-t-3xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)] [&::-webkit-details-marker]:hidden">
          <Image src={product.imageUrl} alt={name}
            width={owner ? 660 : 96} height={owner ? (product.id === "botslab-2ch-model-pending" ? 710 : 700) : 96}
            sizes="(max-width: 640px) 100vw, 640px"
            className="h-52 w-full rounded-2xl bg-white object-contain transition-[height] group-open:h-80 sm:h-64" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <FitmentBadge status={status} />
            {selectedQty > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">{vi ? `Đã chọn · ${selectedQty}` : `Selected · ${selectedQty}`}</span>}
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-[var(--ink)]">{name}</h3>
          <p className="mt-2 text-xl font-bold text-[var(--brand)]">{formatUsd(product.priceUsd, locale)}{product.hardwareOnly && <span className="ml-2 text-xs font-medium text-[var(--muted)]">{vi ? "giá máy" : "hardware"}</span>}</p>
          {product.catalogSource === "sample" && <p className="mt-2 text-xs font-bold text-amber-800">{vi ? "GIÁ MẪU · chưa được duyệt để bán" : "SAMPLE · not approved retail pricing"}</p>}
          <p className="mt-3 flex justify-between text-sm font-semibold text-[var(--brand)]"><span className="group-open:hidden">{vi ? "Xem hình lớn & chi tiết" : "View larger image & details"}</span><span className="hidden group-open:inline">{vi ? "Thu gọn chi tiết" : "Collapse details"}</span><span aria-hidden="true" className="group-open:rotate-180">⌄</span></p>
        </summary>
        <div className="space-y-3 border-t border-[var(--line)] px-4 py-4 text-sm leading-relaxed text-[var(--muted)]">
          <p>{desc}</p>
          {owner && <p className="text-xs">{vi ? "Ảnh giới thiệu sản phẩm; điện thoại minh họa không kèm theo. Phụ kiện cần xác nhận." : "Product reference image; pictured phone is not included. Confirm supplied accessories."}</p>}
          <p>{t("recommend.labor")}: {product.hardwareOnly || product.laborCostUsd == null ? (vi ? "chưa báo giá · không bao gồm" : "not quoted · not included") : formatUsd(product.laborCostUsd, locale)}</p>
        </div>
      </details>
      {product.hardwareOnly && <p className="px-4 pb-3 text-xs leading-relaxed text-amber-900">{vi ? "Chỉ máy · chưa gồm công lắp. Thuế, tồn kho và vận chuyển chưa xác nhận." : "Hardware only · installation excluded. Tax inclusion, stock and shipping unconfirmed."}</p>}
      {blocked ? <p className="bg-rose-50 p-4 text-sm text-rose-900">{vi ? "Không thể chọn món này cho cấu hình xe hiện tại. Đổi xe hoặc xem món khác." : "This item cannot be selected for the current vehicle configuration. Change the vehicle or browse another item."}</p> : (
        <div className="grid grid-cols-2 gap-2 border-t border-[var(--line)] bg-[var(--wash)]/60 p-3">
          <button type="button" onClick={onAdd} className="min-h-12 touch-manipulation rounded-xl border border-[var(--brand)] bg-white px-3 text-sm font-semibold text-[var(--brand)] active:bg-[var(--brand-soft)]">{selectedQty > 0 ? (vi ? "Thêm 1" : "Add one more") : t("recommend.add")}</button>
          <button type="button" onClick={onRequestQuote} className="min-h-12 touch-manipulation rounded-xl bg-[var(--brand)] px-3 text-sm font-semibold text-white">{selectedQty > 0 ? (vi ? "Xem gói đã chọn" : "Review selection") : (vi ? "Chọn & xem gói" : "Add & review")}</button>
        </div>
      )}
    </article>
  );
}
