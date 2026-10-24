"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type SubmitState =
  | { kind: "idle" }
  | { kind: "success"; id: string }
  | { kind: "error"; message: string };

export function QuoteView() {
  const t = useTranslations();
  const locale = useLocale() as "vi" | "en";
  const { items, vehicle, hydrated } = useCombo();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  const products = useMemo(() => getSeedProducts(), []);
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const fitment = useMemo(() => getFitmentRecords(), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quote/request")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return null;

  function buildLineItems(): QuoteLineItem[] {
    return items.flatMap((item) => {
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
  }

  async function onDownload() {
    setBusy(true);
    try {
      const lineItems = buildLineItems();
      const totals = comboTotals(items, byId);
      const quote: QuoteDraft = {
        id: `Q-${Date.now().toString(36).toUpperCase()}`,
        locale,
        currency: "USD",
        vehicleLabel: vehicle ? vehicleLabel(vehicle) : "—",
        lineItems,
        ...totals,
        disclaimers: [
          t("pdf.disclaimerFitment"),
          t("pdf.disclaimerPrice"),
          t("pdf.disclaimerContract"),
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
          brandSub: t("pdf.brandSub"),
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

  async function onSubmitRequest() {
    setSubmitState({ kind: "idle" });
    const hasPii = Boolean(name.trim() || phone.trim() || email.trim());
    if (hasPii && !consent) {
      setSubmitState({
        kind: "error",
        message: t("quote.consentRequired"),
      });
      return;
    }

    setSubmitBusy(true);
    try {
      const lineItems = buildLineItems();
      const totals = comboTotals(items, byId);
      const res = await fetch("/api/quote/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          customerName: name.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          note: note.trim() || undefined,
          consent,
          vehicleLabel: vehicle ? vehicleLabel(vehicle) : "—",
          vehicle,
          items: lineItems.map((li) => ({
            productId: li.productId,
            sku: li.sku,
            name: li.name,
            qty: li.qty,
            unitPrice: li.unitPrice,
            labor: li.labor,
            lineTotal: li.lineTotal,
            fitmentStatus: li.fitmentStatus,
          })),
          subtotalProducts: totals.subtotalProducts,
          subtotalLabor: totals.subtotalLabor,
          total: totals.total,
          currency: "USD",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        code?: string;
        message?: string;
      };

      if (!res.ok || !data.ok || !data.id) {
        const msg =
          data.code === "not_configured"
            ? t("quote.errorNotConfigured")
            : data.code === "consent_required"
              ? t("quote.consentRequired")
              : data.code === "invalid"
                ? t("quote.errorInvalid")
                : t("quote.errorFailed");
        setSubmitState({ kind: "error", message: msg });
        return;
      }

      setSubmitState({ kind: "success", id: data.id });
    } catch {
      setSubmitState({
        kind: "error",
        message: t("quote.errorFailed"),
      });
    } finally {
      setSubmitBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--muted)]">{t("home.disclaimer")}</p>

      {configured === false && (
        <p
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {t("quote.notConfiguredBanner")}
        </p>
      )}

      <label className="block space-y-2 text-sm font-semibold">
        {t("quote.customerName")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="min-h-12 w-full rounded-2xl border border-[var(--line)] px-4 font-normal"
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold">
        {t("quote.phone")}
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          autoComplete="tel"
          className="min-h-12 w-full rounded-2xl border border-[var(--line)] px-4 font-normal"
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold">
        {t("quote.email")}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
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

      <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span>{t("quote.consent")}</span>
      </label>

      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {t("fitment.disclaimer")}
      </p>

      {submitState.kind === "success" && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950"
        >
          {t("quote.success", { id: submitState.id })}
        </p>
      )}
      {submitState.kind === "error" && (
        <p
          role="alert"
          className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950"
        >
          {submitState.message}
        </p>
      )}

      <button
        type="button"
        disabled={submitBusy || items.length === 0}
        onClick={onSubmitRequest}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-[var(--ink)] disabled:opacity-40"
      >
        {submitBusy ? t("quote.submitting") : t("quote.requestCta")}
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
