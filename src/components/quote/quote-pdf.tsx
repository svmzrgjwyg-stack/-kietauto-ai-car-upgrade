"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { QuoteDraft } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  title: { fontSize: 14, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginTop: 12,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
  },
  colItem: { width: "32%" },
  colSku: { width: "14%" },
  colFit: { width: "16%" },
  colNum: { width: "12%", textAlign: "right" },
  disclaimer: { marginTop: 8, color: "#475569", lineHeight: 1.4 },
  totals: { marginTop: 12, alignItems: "flex-end" },
});

function QuoteDocument({
  quote,
  labels,
}: {
  quote: QuoteDraft;
  labels: Record<string, string>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>KietAuto</Text>
        <Text style={styles.title}>{labels.title}</Text>
        <View style={styles.row}>
          <Text>
            {labels.quoteId}: {quote.id}
          </Text>
          <Text>
            {labels.date}: {quote.createdAt.slice(0, 10)}
          </Text>
        </View>
        <Text>
          {labels.vehicle}: {quote.vehicleLabel}
        </Text>
        {quote.customerName ? <Text>{quote.customerName}</Text> : null}

        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>{labels.item}</Text>
          <Text style={styles.colSku}>{labels.sku}</Text>
          <Text style={styles.colFit}>{labels.fitment}</Text>
          <Text style={styles.colNum}>{labels.unit}</Text>
          <Text style={styles.colNum}>{labels.labor}</Text>
          <Text style={styles.colNum}>{labels.line}</Text>
        </View>
        {quote.lineItems.map((li) => (
          <View key={li.productId} style={styles.tableRow}>
            <Text style={styles.colItem}>{li.name}</Text>
            <Text style={styles.colSku}>{li.sku}</Text>
            <Text style={styles.colFit}>{li.fitmentStatus}</Text>
            <Text style={styles.colNum}>${li.unitPrice}</Text>
            <Text style={styles.colNum}>${li.labor}</Text>
            <Text style={styles.colNum}>${li.lineTotal}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <Text>
            Parts: ${quote.subtotalProducts} · Labor: ${quote.subtotalLabor}
          </Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 4 }}>
            Total: ${quote.total} {quote.currency}
          </Text>
        </View>

        {quote.disclaimers.map((d, i) => (
          <Text key={i} style={styles.disclaimer}>
            • {d}
          </Text>
        ))}
        <Text style={{ marginTop: 16, color: "#64748b" }}>{labels.contact}</Text>
      </Page>
    </Document>
  );
}

export async function downloadQuotePdf(
  quote: QuoteDraft,
  labels: Record<string, string>,
  filename: string,
) {
  const blob = await pdf(
    <QuoteDocument quote={quote} labels={labels} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
