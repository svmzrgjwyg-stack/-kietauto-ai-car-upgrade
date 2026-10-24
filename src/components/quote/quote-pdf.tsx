"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { FitmentStatus, QuoteDraft } from "@/types";
import { ensurePdfFonts } from "@/lib/pdf/fonts";
import { formatQuoteDate, formatUsdPdf } from "@/lib/pdf/format";

export type QuotePdfLabels = {
  title: string;
  quoteId: string;
  date: string;
  vehicle: string;
  sku: string;
  item: string;
  qty: string;
  fitment: string;
  unit: string;
  labor: string;
  line: string;
  partsSubtotal: string;
  laborSubtotal: string;
  total: string;
  contact: string;
  fitmentVerified: string;
  fitmentUnverified: string;
  fitmentIncompatible: string;
  disclaimerHeading: string;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 11,
    fontFamily: "NotoSans",
    color: "#0f172a",
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0b3d5c",
    paddingBottom: 12,
  },
  brandBlock: { flexDirection: "column" },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: "#0b3d5c",
    borderRadius: 6,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  logoMark: { color: "#e8b84a", fontSize: 16, fontFamily: "NotoSans", fontWeight: 700 },
  brand: { fontSize: 20, fontFamily: "NotoSans", fontWeight: 700, color: "#0b3d5c" },
  brandSub: { fontSize: 9, color: "#64748b" },
  title: { fontSize: 14, fontFamily: "NotoSans", fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 10, color: "#334155", marginBottom: 3 },
  sectionGap: { marginTop: 14 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0b3d5c",
    paddingVertical: 7,
    paddingHorizontal: 6,
    marginTop: 10,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#dbe3ec",
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: "flex-start",
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  cell: { fontSize: 9, fontFamily: "NotoSans" },
  colItem: { width: "28%", paddingRight: 4 },
  colSku: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colFit: { width: "16%", paddingRight: 2 },
  colNum: { width: "12%", textAlign: "right" },
  totalsBox: {
    marginTop: 14,
    alignSelf: "flex-end",
    width: "48%",
    borderWidth: 1,
    borderColor: "#dbe3ec",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 10,
  },
  totalsTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    fontFamily: "NotoSans",
    fontWeight: 700,
    fontSize: 12,
  },
  warnBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 4,
  },
  warnTitle: {
    fontSize: 10,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: "#92400e",
    marginBottom: 4,
  },
  disclaimer: { fontSize: 9, color: "#475569", marginBottom: 3, lineHeight: 1.4 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 0.75,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
});

function fitmentLabel(
  status: FitmentStatus,
  labels: QuotePdfLabels,
): string {
  if (status === "verified") return labels.fitmentVerified;
  if (status === "incompatible") return labels.fitmentIncompatible;
  return labels.fitmentUnverified;
}

function QuoteDocument({
  quote,
  labels,
}: {
  quote: QuoteDraft;
  labels: QuotePdfLabels;
}) {
  const locale = quote.locale;
  const dateStr = formatQuoteDate(quote.createdAt, locale);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.logoBox}>
              <Text style={styles.logoMark}>K</Text>
            </View>
            <Text style={styles.brand}>KietAuto</Text>
            <Text style={styles.brandSub}>AI Car Upgrade · Phase 1 sample</Text>
          </View>
          <View>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.meta}>
              {labels.quoteId}: {quote.id}
            </Text>
            <Text style={styles.meta}>
              {labels.date}: {dateStr}
            </Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {labels.vehicle}: {quote.vehicleLabel}
        </Text>
        {quote.customerName ? (
          <Text style={styles.meta}>{quote.customerName}</Text>
        ) : null}
        {quote.note ? <Text style={styles.meta}>{quote.note}</Text> : null}

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colItem]}>
            {labels.item}
          </Text>
          <Text style={[styles.tableHeaderText, styles.colSku]}>
            {labels.sku}
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>
            {labels.qty}
          </Text>
          <Text style={[styles.tableHeaderText, styles.colFit]}>
            {labels.fitment}
          </Text>
          <Text style={[styles.tableHeaderText, styles.colNum]}>
            {labels.unit}
          </Text>
          <Text style={[styles.tableHeaderText, styles.colNum]}>
            {labels.labor}
          </Text>
          <Text style={[styles.tableHeaderText, styles.colNum]}>
            {labels.line}
          </Text>
        </View>

        {quote.lineItems.map((li, index) => (
          <View
            key={`${li.productId}-${index}`}
            style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            wrap={false}
          >
            <Text style={[styles.cell, styles.colItem]}>{li.name}</Text>
            <Text style={[styles.cell, styles.colSku]}>{li.sku}</Text>
            <Text style={[styles.cell, styles.colQty]}>{li.qty}</Text>
            <Text style={[styles.cell, styles.colFit]}>
              {fitmentLabel(li.fitmentStatus, labels)}
            </Text>
            <Text style={[styles.cell, styles.colNum]}>
              {formatUsdPdf(li.unitPrice, locale)}
            </Text>
            <Text style={[styles.cell, styles.colNum]}>
              {formatUsdPdf(li.labor, locale)}
            </Text>
            <Text style={[styles.cell, styles.colNum]}>
              {formatUsdPdf(li.lineTotal, locale)}
            </Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>{labels.partsSubtotal}</Text>
            <Text>{formatUsdPdf(quote.subtotalProducts, locale)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>{labels.laborSubtotal}</Text>
            <Text>{formatUsdPdf(quote.subtotalLabor, locale)}</Text>
          </View>
          <View style={styles.totalsTotal}>
            <Text>
              {labels.total} ({quote.currency})
            </Text>
            <Text>{formatUsdPdf(quote.total, locale)}</Text>
          </View>
        </View>

        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>{labels.disclaimerHeading}</Text>
          {quote.disclaimers.map((d, i) => (
            <Text key={i} style={styles.disclaimer}>
              • {d}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>{labels.contact}</Text>
      </Page>
    </Document>
  );
}

export async function downloadQuotePdf(
  quote: QuoteDraft,
  labels: QuotePdfLabels,
  filename: string,
) {
  ensurePdfFonts();
  const blob = await pdf(
    <QuoteDocument quote={quote} labels={labels} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
