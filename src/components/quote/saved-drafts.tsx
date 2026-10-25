"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCombo } from "@/components/combo/combo-context";
import { fetchCatalog } from "@/lib/catalog/use-catalog";
import { createSavedDraft, MAX_BACKUP_BYTES, reconcileDraft, serializeBackup, type SavedQuoteDraft } from "@/lib/quote/saved-draft";
import { addDraft, duplicateDraft, importDrafts, readDrafts, removeDraft } from "@/lib/quote/saved-draft-storage";

const labels = {
  vi: {
    heading: "Bản nháp thử trên máy này", warning: "Chỉ lưu trên trình duyệt này, không đồng bộ giữa anh và Tèo hoặc giữa các thiết bị. Xóa dữ liệu trình duyệt hay đổi địa chỉ Preview có thể làm mất bản nháp. Hãy tải bản sao lưu. Chỉ dùng dữ liệu mẫu; không nhập tên, điện thoại hoặc thông tin khách vào tiêu đề.",
    title: "Tên gói thử (không ghi thông tin khách)", save: "Lưu gói hiện tại", saved: "Đã lưu bản nháp trên trình duyệt này.", empty: "Chưa có bản nháp. Chọn xe và ít nhất một món để lưu.", export: "Tải sao lưu JSON", import: "Nhập sao lưu JSON", imported: "Đã nhập dưới dạng bản sao mới; không ghi đè bản cũ.", error: "Không hoàn tất được. Kiểm tra dữ liệu, quyền lưu trình duyệt hoặc kết nối. Tối đa 50 bản nháp, 30 món mỗi gói và tệp 1 MB. Không tự xóa bản cũ khi gặp lỗi.", open: "Xem / mở lại", duplicate: "Nhân bản", delete: "Xóa", deleteConfirm: "Xóa bản nháp này? Hãy sao lưu trước nếu cần.", cancel: "Hủy", unavailable: "Xe hoặc sản phẩm không còn trong danh mục. Không thể mở lại; bản lưu được giữ nguyên, không tự bỏ món.", review: "Xem lại trước khi mở", changed: "Giá, mã hàng hoặc tình trạng tương thích đã đổi. Xem số cũ và mới trước khi chấp nhận.", unchanged: "Giá và tình trạng tương thích khớp lần lưu. Mở lại sẽ thay gói hiện tại, nhưng không sửa bản nháp đã lưu.", historical: "Lúc lưu (chỉ tham khảo)", current: "Danh mục hiện tại", accept: "Chấp nhận và mở gói", reopened: "Đã mở gói bằng danh mục hiện tại. Bản nháp cũ vẫn giữ nguyên. Lưu thành bản mới nếu cần.", changedAgain: "Danh mục vừa thay đổi tiếp. Kiểm tra lại rồi chấp nhận lần nữa.", loading: "Đang kiểm tra…", copy: "Đã nhân bản.", deleted: "Đã xóa bản nháp.", viewCombo: "Xem / chỉnh gói hiện tại", fitment: { verified: "Đã xác minh", unverified: "Cần xác minh", incompatible: "Không tương thích" }, total: "Tổng", qty: "SL", unit: "Giá món", labor: "Công lắp", localDate: "Ngày lưu", backupReady: "Đã tạo tệp sao lưu để tải xuống.",
  },
  en: {
    heading: "Demo drafts on this browser", warning: "Stored only in this browser, not shared between you and Tèo or across devices. Clearing browser data or changing Preview URLs can lose drafts. Download a backup. Demo data only; do not put customer names, phone numbers or personal information in titles.",
    title: "Demo package title (no customer information)", save: "Save current package", saved: "Draft saved in this browser.", empty: "No drafts yet. Select a vehicle and at least one item to save.", export: "Download JSON backup", import: "Import JSON backup", imported: "Imported as new copies; existing drafts were not overwritten.", error: "Could not complete. Check data, browser storage permissions or connection. Limits: 50 drafts, 30 items per package, 1 MB file. Existing drafts are not automatically erased on errors.", open: "Review / reopen", duplicate: "Duplicate", delete: "Delete", deleteConfirm: "Delete this draft? Download a backup first if needed.", cancel: "Cancel", unavailable: "Vehicle or products are no longer in the catalog. Cannot reopen; the saved draft is preserved without silently dropping items.", review: "Review before reopening", changed: "Prices, SKUs or fitment changed. Review saved and current values before accepting.", unchanged: "Prices and fitment match the saved version. Reopening replaces the current package but does not change the saved draft.", historical: "At save time (reference only)", current: "Current catalog", accept: "Accept and reopen", reopened: "Opened using the current catalog. The historical draft is unchanged. Save a new copy if needed.", changedAgain: "The catalog changed again. Review and accept once more.", loading: "Checking…", copy: "Draft duplicated.", deleted: "Draft deleted.", viewCombo: "View / edit current package", fitment: { verified: "Verified", unverified: "Needs verification", incompatible: "Incompatible" }, total: "Total", qty: "Qty", unit: "Unit price", labor: "Labor", localDate: "Saved", backupReady: "Backup file prepared for download.",
  },
};
type Review = { draft: SavedQuoteDraft; result: ReturnType<typeof reconcileDraft> };
const button = "min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40";

export function SavedDrafts({ onRestore }: { onRestore?: () => void }) {
  const locale = useLocale() as "vi" | "en";
  const l = labels[locale];
  const t = useTranslations();
  const { vehicle, items, hydrated, restoreDraft } = useCombo();
  const [drafts, setDrafts] = useState<SavedQuoteDraft[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const upload = useRef<HTMLInputElement>(null);
  const money = (value: number) => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "USD" }).format(value / 100);

  const cancelPending = useCallback(() => { generation.current++; }, []);

  useEffect(() => {
    const load = () => { try { setDrafts(readDrafts(localStorage)); setError(false); } catch { setError(true); } };
    load();
    window.addEventListener("storage", load);
    return () => { cancelPending(); window.removeEventListener("storage", load); };
  }, [cancelPending]);

  async function run(action: () => void | Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(false); setMessage("");
    try { await action(); } catch { setError(true); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    await run(async () => {
      if (!vehicle) throw new Error("Vehicle required");
      const catalog = await fetchCatalog();
      const draft = createSavedDraft({ title, locale, vehicle, items }, catalog, (key) => t(key));
      setDrafts(addDraft(localStorage, draft)); setTitle(""); setMessage(l.saved);
    });
  }
  async function open(draft: SavedQuoteDraft) {
    const request = ++generation.current;
    await run(async () => {
      const result = reconcileDraft(draft, await fetchCatalog());
      if (request === generation.current) { setReview({ draft, result }); setDeleting(null); }
    });
  }
  async function accept() {
    if (!review || review.result.kind === "unavailable") return;
    const request = ++generation.current;
    const previous = review;
    await run(async () => {
      const result = reconcileDraft(previous.draft, await fetchCatalog());
      if (request !== generation.current) return;
      if (result.kind === "unavailable" || JSON.stringify(result.current) !== JSON.stringify(previous.result.kind !== "unavailable" && previous.result.current)) {
        setReview({ draft: previous.draft, result }); setMessage(l.changedAgain); return;
      }
      restoreDraft(previous.draft.vehicle, previous.draft.items);
      onRestore?.();
      setReview(null); setMessage(l.reopened);
    });
  }
  const cancelReview = () => { generation.current++; setReview(null); };

  return <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-slate-50 p-4" aria-label={l.heading}>
    <h2 className="text-lg font-bold">{l.heading}</h2>
    <p className="text-sm leading-relaxed text-amber-950">{l.warning}</p>
    <label className="block text-sm font-semibold">{l.title}<input className="mt-2 min-h-11 w-full rounded-xl border px-3" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} /></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} onClick={save} disabled={!hydrated || busy || !vehicle || !items.length || !title.trim()}>{l.save}</button>
      <button type="button" className={button} disabled={busy || !drafts.length} onClick={() => run(() => {
        const raw = serializeBackup(readDrafts(localStorage));
        const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
        const link = document.createElement("a"); link.href = url; link.download = "AI-Car-Upgrade-DEMO-drafts.json"; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage(l.backupReady);
      })}>{l.export}</button>
      <button type="button" className={button} disabled={busy} onClick={() => upload.current?.click()}>{l.import}</button>
      <input ref={upload} type="file" accept=".json,application/json" className="sr-only" aria-label={l.import} disabled={busy} onChange={(e) => {
        const file = e.target.files?.[0]; e.target.value = "";
        if (file) void run(async () => { if (file.size > MAX_BACKUP_BYTES) throw new Error("Too large"); setDrafts(importDrafts(localStorage, await file.text())); setMessage(l.imported); });
      }} />
    </div>
    {busy && <p role="status">{l.loading}</p>}
    {error && <p role="alert" className="text-sm text-red-800">{l.error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {!drafts.length && <p className="text-sm">{l.empty}</p>}
    <ul className="space-y-3">{drafts.map((draft) => <li key={draft.id} className="rounded-xl border bg-white p-3">
      <h3 className="break-words font-semibold">{draft.title}</h3>
      <p className="text-sm">{draft.snapshot.vehicleLabel}</p>
      <p className="text-xs text-slate-600">{l.localDate}: {new Date(draft.createdAt).toLocaleString(locale)} · {l.historical}: {money(draft.snapshot.totalCents)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={busy} onClick={() => open(draft)}>{l.open}</button>
        <button type="button" className={button} disabled={busy} onClick={() => run(() => { setDrafts(duplicateDraft(localStorage, draft)); setMessage(l.copy); })}>{l.duplicate}</button>
        <button type="button" className={button} disabled={busy} onClick={() => setDeleting(draft.id)}>{l.delete}</button>
      </div>
      {deleting === draft.id && <div className="mt-2" role="group" aria-label={l.deleteConfirm}><p>{l.deleteConfirm}</p><button type="button" className={button} disabled={busy} onClick={() => run(() => { setDrafts(removeDraft(localStorage, draft.id)); setDeleting(null); if (review?.draft.id === draft.id) cancelReview(); setMessage(l.deleted); })}>{l.delete}</button><button type="button" className={button} disabled={busy} onClick={() => setDeleting(null)}>{l.cancel}</button></div>}
    </li>)}</ul>
    {review && <div role="region" aria-label={l.review} className="space-y-3 rounded-xl border-2 border-[var(--brand)] bg-white p-3">
      <h3 className="font-bold">{l.review}: {review.draft.title}</h3>
      <p className="text-sm">{review.result.kind === "unavailable" ? l.unavailable : review.result.kind === "changed" ? l.changed : l.unchanged}</p>
      {review.draft.snapshot.lines.map((line, index) => <div key={line.productId} className="border-b py-2 text-sm">
        <p className="font-semibold">{line.name} · {l.qty} {line.qty}</p>
        <p>{l.historical}: {line.sku} · {l.unit} {money(line.unitCents)} · {l.labor} {money(line.laborCents)} · {l.total} {money(line.totalCents)} · {l.fitment[line.fitment]}</p>
        {review.result.kind !== "unavailable" && <p>{l.current}: {review.result.current.lines[index].sku} · {l.unit} {money(review.result.current.lines[index].unitCents)} · {l.labor} {money(review.result.current.lines[index].laborCents)} · {l.total} {money(review.result.current.lines[index].totalCents)} · {l.fitment[review.result.current.lines[index].fitment]}</p>}
      </div>)}
      <p>{l.historical} · {l.total}: {money(review.draft.snapshot.totalCents)}</p>
      {review.result.kind !== "unavailable" && <p>{l.current} · {l.total}: {money(review.result.current.totalCents)}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy || review.result.kind === "unavailable"} onClick={accept}>{l.accept}</button><button type="button" className={button} onClick={cancelReview}>{l.cancel}</button></div>
    </div>}
    <a href={`/${locale}/combo`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand)]">{l.viewCombo}</a>
  </section>;
}
