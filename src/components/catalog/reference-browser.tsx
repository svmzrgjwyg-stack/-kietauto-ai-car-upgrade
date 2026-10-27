"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCombo } from "@/components/combo/combo-context";
import { useReferenceSelection } from "@/components/browse/reference-selection-context";
import { getBrands, getModels, getYears, vehicleLabel } from "@/lib/catalog/data";
import { filterReferences, referenceCopy, referenceModels, type FitmentReference } from "@/lib/catalog/reference";

export function ReferenceBrowser({ references, locale }: { references: FitmentReference[]; locale: "vi" | "en" }) {
  const t = referenceCopy[locale];
  const { vehicle } = useCombo();
  const selection = useReferenceSelection();
  const vi = locale === "vi";
  function applyVehicle() {
    if (!vehicle) return;
    const brand = getBrands().find((b) => b.id === vehicle.brandId)?.name ?? "";
    const selectedModel = getModels(vehicle.brandId).find((m) => m.id === vehicle.modelId)?.name ?? "";
    setMake(brand); setModel(selectedModel);
    setYear(String(getYears(vehicle.modelId).find((y) => y.id === vehicle.yearId)?.year ?? "")); setQuery("");
  }
  const [make, setMake] = useState(""); const [model, setModel] = useState("");
  const [year, setYear] = useState(""); const [query, setQuery] = useState("");
  const filtered = filterReferences(references, { make, model, year, query });
  const fieldClass = "mt-1 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-base font-normal";
  return <section className="space-y-4 pb-6">
    <div className="rounded-3xl bg-[var(--brand-soft)] p-5">
      <h1 className="font-display text-2xl font-bold text-[var(--brand)]">{t.title}</h1>
      <p className="mt-2 font-semibold">{t.subtitle}</p><p className="mt-2 text-sm leading-relaxed">{t.intro}</p>
    </div>
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
      <p className="text-sm font-semibold">{vehicle ? vehicleLabel(vehicle) : (vi ? "Anh có thể xem trước, chọn xe sau" : "Explore first, choose a vehicle later")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {vehicle && <button type="button" onClick={applyVehicle} className="min-h-11 rounded-xl bg-[var(--brand-soft)] px-3 text-sm font-semibold text-[var(--brand)]">{vi ? "Lọc theo xe đã chọn" : "Filter by selected vehicle"}</button>}
        <Link href={`/${locale}/vehicle`} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--line)] px-3 text-sm font-semibold">{vi ? (vehicle ? "Đổi xe" : "Chọn xe của anh") : (vehicle ? "Change vehicle" : "Choose your vehicle")}</Link>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{vi ? "Bộ lọc giúp tìm ảnh tham khảo, không xác nhận lắp vừa." : "Filtering helps find reference photos; it does not verify fitment."}</p>
    </div>
    {selection.count > 0 && <Link href={`/${locale}/combo`} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"><span>{vi ? `${selection.count} cấu hình đã chọn để xem lại` : `${selection.count} configurations selected for review`}</span><span aria-hidden="true">→</span></Link>}
    {selection.storageWarning && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-950">{vi ? "Chỉ giữ lựa chọn trong phiên này vì trình duyệt chưa lưu được. Dữ liệu cũ không bị ghi đè." : "Selections last for this session because browser saving is unavailable. Existing stored data was not overwritten."}</p>}
    <Link href={`/${locale}/recommend`} className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-center text-sm font-semibold text-white">{t.camera}</Link>
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--line)] p-4">
      <label className="text-sm font-semibold">{t.make}<select value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }} className={fieldClass}>
        <option value="">{t.all}</option><option>Toyota</option><option>Lexus</option></select></label>
      <label className="text-sm font-semibold">{t.model}<select value={model} onChange={(e) => setModel(e.target.value)} className={fieldClass}>
        <option value="">{t.all}</option>{model && !referenceModels(references, make).includes(model) && <option value={model}>{model}</option>}{referenceModels(references, make).map((m) => <option key={m}>{m}</option>)}</select></label>
      <label className="text-sm font-semibold">{t.year}<input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" maxLength={4} placeholder="2020" className={fieldClass} /></label>
      <button type="button" className="mt-6 min-h-12 rounded-xl border border-[var(--line)] px-2 text-sm font-semibold" onClick={() => { setMake(""); setModel(""); setYear(""); setQuery(""); }}>{t.reset}</button>
      <label className="col-span-2 text-sm font-semibold">{t.search}<input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={120} placeholder={t.placeholder} className={fieldClass} /></label>
    </div>
    <p role="status" aria-live="polite" className="text-sm font-semibold">{filtered.length} {t.count}{selection.count > 0 ? ` · ${selection.count} ${vi ? "đã chọn" : "selected"}` : ""}</p>
    <p className="text-xs leading-relaxed text-[var(--muted)]">{t.note}</p>
    {filtered.length === 0 && <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950"><p>{t.empty}</p><button type="button" onClick={() => { setMake(""); setModel(""); setYear(""); setQuery(""); }} className="mt-3 min-h-11 rounded-xl border border-amber-300 bg-white px-3 font-semibold">{vi ? "Xem tất cả cấu hình" : "View all configurations"}</button></div>}
    <div className="space-y-3">{filtered.map((r) => <article key={r.id} className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="min-w-0"><h2 className="font-semibold">{r.make} {r.model} · {r.yearFrom ?? "?"}–{r.yearTo ?? "?"}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{t.reference}: {r.id}</p><p className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950">{t.unverified}</p></div></div>
      <div className="mt-4 flex flex-wrap items-start gap-3">{r.images.map((photo) => <figure key={photo.src} className="max-w-full">
        <Image src={photo.src} alt={`${r.make} ${r.model} ${r.yearFrom ?? "?"}–${r.yearTo ?? "?"} · ${photo.kind === "oem_headunit_rear_reference" ? t.rearImage : t.dashboardImage}`} width={photo.width} height={photo.height} sizes="240px" unoptimized className="h-auto max-h-44 w-auto max-w-full rounded-xl bg-[var(--wash)] object-contain" />
        <figcaption className="mt-1 max-w-60 text-xs text-[var(--muted)]">{photo.kind === "oem_headunit_rear_reference" ? t.rearImage : t.imageCaption}</figcaption>
      </figure>)}</div>
      {r.images.some((photo) => photo.sharedReference) && <p className="mt-2 text-xs text-amber-900">{t.sharedImage}</p>}
      <button type="button" disabled={!selection.hydrated} aria-pressed={selection.ids.includes(r.id)} onClick={() => selection.toggle(r.id)} className={`mt-4 min-h-12 w-full rounded-xl px-4 text-sm font-semibold disabled:opacity-50 ${selection.ids.includes(r.id) ? "border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-[var(--brand)] text-white"}`} aria-label={`${selection.ids.includes(r.id) ? (vi ? "Bỏ quan tâm" : "Remove interest") : (vi ? "Chọn để xem lại" : "Select for review")} ${r.id}`}>
        {selection.ids.includes(r.id) ? (vi ? "✓ Đã chọn · bấm để bỏ" : "✓ Selected · tap to remove") : (vi ? "Chọn để xem lại" : "Select for review")}
      </button>
      <p className="mt-3 text-lg font-bold text-[var(--brand)]">{t.quote}</p><p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{t.noPrice}</p>
      <details className="mt-3 border-t border-[var(--line)] pt-2"><summary className="cursor-pointer py-2 text-sm font-semibold">{t.details}</summary>
        <dl className="space-y-2 text-sm"><div><dt className="font-semibold">{t.control}</dt><dd>{r.control ?? t.unknown}</dd></div>
          <div><dt className="font-semibold">{t.screen}</dt><dd>{r.screen ?? t.unknown}</dd></div>
          <div><dt className="font-semibold">{t.nav}</dt><dd>{r.navigationRequired === true ? t.yes : t.navUnknown}</dd></div>
          <div><dt className="font-semibold">{t.market}</dt><dd>{r.market ?? t.unknown}</dd></div></dl>
        <p className="mt-3 text-xs font-medium text-amber-900">{t.us}</p><p className="mt-2 text-xs text-[var(--muted)]">{t.stock}</p></details>
    </article>)}</div>
  </section>;
}
