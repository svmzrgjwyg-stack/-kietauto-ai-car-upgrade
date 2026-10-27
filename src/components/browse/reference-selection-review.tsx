"use client";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { fitmentReferences } from "@/lib/catalog/reference";
import { useReferenceSelection } from "./reference-selection-context";

export function ReferenceSelectionReview({ locale: suppliedLocale, compact = false }: { locale?: "vi" | "en"; compact?: boolean }) {
  const currentLocale = useLocale();
  const locale = suppliedLocale ?? (currentLocale === "vi" ? "vi" : "en");
  const vi = locale === "vi";
  const { ids, count, remove, hydrated, storageWarning } = useReferenceSelection();
  if (!hydrated || (compact && count === 0)) return null;
  const selected = ids.map((id) => fitmentReferences.find((r) => r.id === id)).filter((r) => !!r);
  return <section aria-label={vi ? "Cấu hình quan tâm" : "Configurations of interest"} className="space-y-3 rounded-3xl border border-[var(--line)] bg-white p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">{vi ? "Cấu hình quan tâm" : "Configurations of interest"} <span className="text-[var(--brand)]">({count})</span></h2><Link href={`/${locale}/catalog`} className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-[var(--brand)] underline">{vi ? "Chọn thêm" : "Browse more"}</Link></div>
    <p className="text-sm text-[var(--muted)]">{vi ? "Danh sách trải nghiệm, chưa gửi đi. Chưa có giá và chưa xác minh lắp vừa; không cộng vào tổng tiền hoặc PDF báo giá." : "A browsing shortlist, not submitted. Prices and fitment are unverified; these do not enter the price total or quote PDF."}</p>
    {count === 0 ? <p className="rounded-xl bg-[var(--wash)] p-3 text-sm">{vi ? "Chưa chọn cấu hình. Mở danh mục, xem ảnh rồi chọn món anh muốn đối chiếu." : "Nothing selected yet. Browse the photos and select a configuration to review."}</p> : <ul className="space-y-3">{selected.map((r) => <li key={r.id} className="flex items-start gap-3 rounded-2xl bg-[var(--wash)] p-3">
      {r.images[0] && <Image src={r.images[0].src} width={72} height={64} unoptimized alt={`${r.make} ${r.model} ${vi ? "ảnh zin tham khảo" : "factory reference"}`} className="h-16 w-[72px] shrink-0 rounded-lg bg-white object-contain" />}
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{r.make} {r.model} · {r.yearFrom ?? "?"}–{r.yearTo ?? "?"}</p><p className="mt-1 text-xs text-[var(--muted)]">{r.id} · {vi ? "Cần xác minh / cần báo giá" : "Verify fitment / price pending"}</p><button type="button" onClick={() => remove(r.id)} className="mt-1 min-h-11 rounded-lg px-2 text-sm font-semibold text-rose-800" aria-label={`${vi ? "Bỏ" : "Remove"} ${r.id}`}>{vi ? "Bỏ khỏi danh sách" : "Remove from list"}</button></div>
    </li>)}</ul>}
    <p className="text-xs text-[var(--muted)]">{storageWarning ? (vi ? "Không lưu được trên trình duyệt. Lựa chọn chỉ còn trong phiên đang mở; dữ liệu cũ không bị ghi đè." : "Browser saving unavailable. Selections last only for this session; existing stored data was not overwritten.") : (vi ? "Chỉ lưu trong trình duyệt này, không đồng bộ giữa các máy. Tách riêng với các bản nháp báo giá đã lưu." : "Saved only in this browser, not synced across devices. Separate from saved quote drafts.")}</p>
  </section>;
}
