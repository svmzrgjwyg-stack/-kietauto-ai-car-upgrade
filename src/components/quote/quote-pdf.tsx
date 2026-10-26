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
import {
  PDF_PAGE,
  TABLE_COL_GAP,
  TABLE_COLS,
  dedupeQuoteDisclaimers,
} from "@/lib/pdf/layout";

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
  brandSub?: string;
  fitmentVerified: string;
  fitmentUnverified: string;
  fitmentIncompatible: string;
  disclaimerHeading: string;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: PDF_PAGE.marginTop,
    paddingBottom: PDF_PAGE.marginBottom,
    paddingHorizontal: PDF_PAGE.marginX,
    fontSize: 10,
    fontFamily: "NotoSans",
    color: "#0f172a",
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#0b3d5c",
    paddingBottom: 12,
  },
  brandLeft: {
    width: "56%",
    paddingRight: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: "#0b3d5c",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoMark: {
    color: "#e8b84a",
    fontSize: 14,
    fontFamily: "NotoSans",
    fontWeight: 700,
  },
  brand: {
    fontSize: 18,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: "#0b3d5c",
  },
  brandSub: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  metaRight: {
    width: "42%",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 12,
    fontFamily: "NotoSans",
    fontWeight: 700,
    marginBottom: 6,
    textAlign: "right",
  },
  meta: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 3,
    textAlign: "right",
  },
  vehicleBlock: {
    marginBottom: 10,
  },
  vehicleText: {
    fontSize: 10,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: "#0b3d5c",
    marginBottom: 2,
  },
  vehicleMeta: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0b3d5c",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "NotoSans",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#dbe3ec",
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "flex-start",
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  cell: { fontSize: 8, fontFamily: "NotoSans" },
  cellRight: { fontSize: 8, fontFamily: "NotoSans", textAlign: "right" },
  colItem: { width: TABLE_COLS.item, paddingRight: TABLE_COL_GAP },
  colSku: { width: TABLE_COLS.sku, paddingRight: TABLE_COL_GAP },
  colQty: {
    width: TABLE_COLS.qty,
    paddingRight: TABLE_COL_GAP,
    alignItems: "flex-end",
  },
  colFit: {
    width: TABLE_COLS.fit,
    paddingRight: TABLE_COL_GAP,
    paddingLeft: 2,
  },
  colNum: {
    width: TABLE_COLS.unit,
    paddingRight: TABLE_COL_GAP,
    alignItems: "flex-end",
  },
  colLine: {
    width: TABLE_COLS.line,
    alignItems: "flex-end",
  },
  totalsBox: {
    marginTop: 14,
    alignSelf: "flex-end",
    width: 220,
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
    fontSize: 9,
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
    fontSize: 11,
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
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: "#92400e",
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 3,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: PDF_PAGE.marginX,
    right: PDF_PAGE.marginX,
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

export function QuoteDocument({
  quote,
  labels,
}: {
  quote: QuoteDraft;
  labels: QuotePdfLabels;
}) {
  const locale = quote.locale;
  const dateStr = formatQuoteDate(quote.createdAt, locale);
  const hasSamples = quote.priceScope === "sample" || quote.lineItems.some((line) => line.priceScope === "sample");
  const hasPending = quote.priceScope === "pending_charges" || quote.lineItems.some((line) => line.hardwareOnly || line.priceScope === "pending_charges");
  const sampleText = locale === "vi" ? "MẪU — giá chưa được duyệt để bán; không phải báo giá chính thức." : "SAMPLE — prices are not approved retail; not a final sales quote.";
  const pendingText = locale === "vi" ? "Chỉ giá máy, chưa gồm công lắp. Thuế, vận chuyển, tồn kho và bộ phụ kiện cần xác nhận. Không phải tổng thanh toán cuối cùng." : "Hardware only; installation is not included. Tax inclusion, shipping, stock and package contents need confirmation. Not a final payable total.";
  const warnings = dedupeQuoteDisclaimers([...quote.disclaimers, ...(hasSamples ? [sampleText] : []), ...(hasPending ? [pendingText] : [])]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandLeft}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoMark}>K</Text>
              </View>
              <Text style={styles.brand}>KietAuto</Text>
            </View>
            <Text style={styles.brandSub}>
              {labels.brandSub ?? "AI Car Upgrade"}
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.meta}>
              {labels.quoteId}: {quote.id}
            </Text>
            <Text style={styles.meta}>
              {labels.date}: {dateStr}
            </Text>
          </View>
        </View>

        <View style={styles.vehicleBlock}>
          <Text style={styles.vehicleText}>
            {labels.vehicle}: {quote.vehicleLabel}
          </Text>
          {quote.customerName ? (
            <Text style={styles.vehicleMeta}>{quote.customerName}</Text>
          ) : null}
          {quote.note ? (
            <Text style={styles.vehicleMeta}>{quote.note}</Text>
          ) : null}
        </View>

        {(hasSamples || hasPending) && <View style={styles.warnBox}>
          {hasSamples && <Text style={styles.warnTitle}>{sampleText}</Text>}
          {hasPending && <Text style={styles.disclaimer}>{pendingText}</Text>}
        </View>}
        <View style={styles.tableHeader}>
          <View style={styles.colItem}>
            <Text style={styles.tableHeaderText}>{labels.item}</Text>
          </View>
          <View style={styles.colSku}>
            <Text style={styles.tableHeaderText}>{labels.sku}</Text>
          </View>
          <View style={styles.colQty}>
            <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
              {labels.qty}
            </Text>
          </View>
          <View style={styles.colFit}>
            <Text style={styles.tableHeaderText}>{labels.fitment}</Text>
          </View>
          <View style={styles.colNum}>
            <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
              {labels.unit}
            </Text>
          </View>
          <View style={styles.colNum}>
            <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
              {labels.labor}
            </Text>
          </View>
          <View style={styles.colLine}>
            <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
              {labels.line}
            </Text>
          </View>
        </View>

        {quote.lineItems.map((li, index) => (
          <View
            key={`${li.productId}-${index}`}
            style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            wrap={false}
          >
            <View style={styles.colItem}>
              <Text style={styles.cell}>{li.name}</Text>
              {li.priceScope === "sample" && <Text style={styles.disclaimer}>{locale === "vi" ? "MẪU — chưa duyệt giá" : "SAMPLE — unapproved price"}</Text>}
            </View>
            <View style={styles.colSku}>
              <Text style={styles.cell}>{li.sku}</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.cellRight}>{li.qty}</Text>
            </View>
            <View style={styles.colFit}>
              <Text style={styles.cell}>
                {fitmentLabel(li.fitmentStatus, labels)}
              </Text>
            </View>
            <View style={styles.colNum}>
              <Text style={styles.cellRight}>
                {formatUsdPdf(li.unitPrice, locale)}
              </Text>
            </View>
            <View style={styles.colNum}>
              <Text style={styles.cellRight}>
                {li.hardwareOnly ? (locale === "vi" ? "Chưa gồm công" : "Not included") : formatUsdPdf(li.labor, locale)}
              </Text>
            </View>
            <View style={styles.colLine}>
              <Text style={styles.cellRight}>
                {formatUsdPdf(li.lineTotal, locale)}
              </Text>
            </View>
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
              {hasPending ? (locale === "vi" ? "Tạm tính phần đã có giá" : "Known-price subtotal") : labels.total} ({quote.currency})
            </Text>
            <Text>{formatUsdPdf(quote.total, locale)}</Text>
          </View>
        </View>

        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>{labels.disclaimerHeading}</Text>
          {warnings.map((d, i) => (
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
