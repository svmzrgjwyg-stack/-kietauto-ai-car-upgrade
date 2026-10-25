/** A4 portrait points (react-pdf default). */
export const PDF_PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 36,
  marginTop: 36,
  marginBottom: 44,
} as const;

/**
 * Fixed column widths (pt) for the product table.
 * Sum must fit within page content width; qty and fitment are separated
 * so SL never visually sticks to “Chưa xác minh”.
 */
export const TABLE_COLS = {
  item: 128,
  sku: 60,
  qty: 28,
  fit: 90,
  unit: 60,
  labor: 60,
  line: 62,
} as const;

export const TABLE_COL_GAP = 4;

export function pdfContentWidth(): number {
  return PDF_PAGE.width - PDF_PAGE.marginX * 2;
}

export function tableRowWidth(): number {
  const cols = Object.values(TABLE_COLS);
  return cols.reduce((a, b) => a + b, 0) + TABLE_COL_GAP * (cols.length - 1);
}

/** Layout invariants used by regression tests. */
export function getPdfLayoutReport() {
  const content = pdfContentWidth();
  const table = tableRowWidth();
  return {
    contentWidth: content,
    tableWidth: table,
    fitsPage: table <= content,
    overflowPt: Math.max(0, table - content),
    qtyFitGapPt: TABLE_COL_GAP,
    marginX: PDF_PAGE.marginX,
  };
}

/**
 * Collapse duplicate / near-duplicate disclaimer lines so the warning
 * box shows a single fitment warning (plus price/contract notes).
 */
export function dedupeQuoteDisclaimers(lines: string[]): string[] {
  const out: string[] = [];
  const seenExact = new Set<string>();
  let fitmentKept = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const key = line.toLowerCase().replace(/\s+/g, " ");
    if (seenExact.has(key)) continue;

    // Match fitment-compatibility wording only (not generic “kỹ thuật” contract notes).
    const isFitment =
      /chưa xác minh|not verified|chưa được xác minh tương thích|not been confirmed to fit|lắp được trên xe này/i.test(
        line,
      );

    if (isFitment) {
      if (fitmentKept) continue;
      fitmentKept = true;
    }

    seenExact.add(key);
    out.push(line);
  }

  return out;
}
