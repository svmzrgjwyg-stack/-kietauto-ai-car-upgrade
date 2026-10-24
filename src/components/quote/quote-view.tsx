"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCombo } from "@/components/combo/combo-context";
import { downloadQuotePdf } from "./quote-pdf";
import {
  getFitmentRecords,
  getSeedProducts,
  vehicleLabel,
} from "@/lib/catalog/data";
import { resolveFitment } from "@/lib/fitment/resolve";
import { comboTotals, lineLaborTotal, lineProductTotal } from "@/lib/pricing/totals";
import type { QuoteDraft, QuoteLineItem } from "@/types";

export function QuoteView() {
  const t = useTranslations();
  const locale = useLocale() as "vi" | "en";
  const { items, vehicle, hydrated } = useCombo();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const products = useMemo(() => getSeedProducts(), []);
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const fitment = useMemo(() => getFitmentRecords(), []);

  if (!hydrated) return null;

  async function onDownload() {
    setBusy(true);
    try {
      const lineItems: QuoteLineItem[] = items.flatMap((item) => {
        const product = byId.get(item.productId);
        if (!product) return [];
        const { status } = resolveFitment(item.productId, vehicle, fitment);
        const labor = lineLaborTotal(product, item);
        return [
          {
            productId: product.id,
            name: t(product.nameKey as Parameters<typeof t>[0]),
            sku: product.sku,
            qty: item.qty,
            unitPrice: product.priceUsd,
            labor,
            lineTotal: lineProductTotal(product, item) + labor,
            fitmentStatus: status,
          },
        ];
      });

      const totals = comboTotals(items, byId);
      const quote: QuoteDraft = {
        id: `Q-${Date.now().toString(36).toUpperCase()}`,
        locale,
        currency: "USD",
        vehicleLabel: vehicle ? vehicleLabel(vehicle) : "—",
        lineItems,
        ...totals,
        disclaimers: [
          t("pdf.disclaimerPrice"),
          t("pdf.disclaimerFitment"),
          t("pdf.disclaimerContract"),
          t("fitment.disclaimer"),
        ],
        customerName: name || undefined,
        note: note || undefined,
        createdAt: new Date().toISOString(),
      };

      await downloadQuotePdf(
        quote,
        {
          title: t("pdf.title"),
          quoteId: t("pdf.quoteId"),
          date: t("pdf.date"),
          vehicle: t("pdf.vehicle"),
          sku: t("pdf.sku"),
          item: t("pdf.item"),
          qty: t("pdf.qty"),
          fitment: t("pdf.fitment"),
          unit: t("pdf.unit"),
          labor: t("pdf.labor"),
          line: t("pdf.line"),
          partsSubtotal: t("pdf.partsSubtotal"),
          laborSubtotal: t("pdf.laborSubtotal"),
          total: t("pdf.total"),
          contact: t("pdf.contact"),
          fitmentVerified: t("fitment.verified"),
          fitmentUnverified: t("fitment.unverified"),
          fitmentIncompatible: t("fitment.incompatible"),
          disclaimerHeading: t("pdf.disclaimerHeading"),
        },
        `${quote.id}.pdf`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--muted)]">{t("home.disclaimer")}</p>
      <label className="block space-y-2 text-sm font-semibold">
        {t("quote.customerName")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 w-full rounded-2xl border border-[var(--line)] px-4 font-normal"
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold">
        {t("quote.note")}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 font-normal"
        />
      </label>
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {t("fitment.disclaimer")}
      </p>
      <button
        type="button"
        disabled={busy || items.length === 0}
        onClick={onDownload}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-[var(--ink)] disabled:opacity-40"
      >
        {t("quote.requestCta")}
      </button>
      <button
        type="button"
        disabled={busy || items.length === 0}
        onClick={onDownload}
        className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--brand)] bg-white text-sm font-semibold text-[var(--brand)] disabled:opacity-40"
      >
        {t("quote.download")}
      </button>
      <Link
        href={`/${locale}/combo`}
        className="flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--brand)]"
      >
        {t("quote.back")}
      </Link>
    </div>
  );
}
