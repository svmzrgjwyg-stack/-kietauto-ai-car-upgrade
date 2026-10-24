/**
 * Sample PDF matching Safari case: Camry 2025 SE, V35×2 + Pro4K×1 = $964.
 * Uses Noto Sans + fixed column layout (mirrors production PDF).
 */
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const React = require("react");
const {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} = require("@react-pdf/renderer");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir =
  "/cursor/stores/bc-01a16e19-b110-73aa-8aaa-f97f35dc8cf9/media/phase1";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: path.join(root, "public/fonts/NotoSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(root, "public/fonts/NotoSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

const COLS = {
  item: 128,
  sku: 60,
  qty: 28,
  fit: 90,
  unit: 60,
  labor: 60,
  line: 62,
};
const GAP = 4;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 36,
    fontFamily: "NotoSans",
    fontSize: 10,
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#0b3d5c",
    paddingBottom: 12,
    marginBottom: 14,
  },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: "#0b3d5c",
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: { fontSize: 18, fontWeight: 700, color: "#0b3d5c" },
  sub: { fontSize: 9, color: "#64748b" },
  metaR: { alignItems: "flex-end", width: "42%" },
  th: {
    flexDirection: "row",
    backgroundColor: "#0b3d5c",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tht: { color: "#fff", fontSize: 8, fontWeight: 700 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#dbe3ec",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cell: { fontSize: 8 },
  warn: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
});

function col(w) {
  return { width: w, paddingRight: GAP };
}

const rows = [
  {
    name: "Dashcam V35 Front/Rear",
    sku: "KA-DC-V35",
    qty: 2,
    fit: "Cần xác minh",
    unit: 189,
    labor: 158,
    line: 536,
  },
  {
    name: "Dashcam Pro 4K",
    sku: "KA-DC-4K",
    qty: 1,
    fit: "Cần xác minh",
    unit: 329,
    labor: 99,
    line: 428,
  },
];

const doc = React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: "A4", style: styles.page },
    React.createElement(
      View,
      { style: styles.header },
      React.createElement(
        View,
        { style: { width: "56%" } },
        React.createElement(
          View,
          { style: styles.brandRow },
          React.createElement(
            View,
            { style: styles.logo },
            React.createElement(
              Text,
              { style: { color: "#e8b84a", fontWeight: 700 } },
              "K",
            ),
          ),
          React.createElement(Text, { style: styles.brand }, "KietAuto"),
        ),
        React.createElement(
          Text,
          { style: styles.sub },
          "AI Car Upgrade",
        ),
      ),
      React.createElement(
        View,
        { style: styles.metaR },
        React.createElement(
          Text,
          { style: { fontSize: 12, fontWeight: 700, marginBottom: 6 } },
          "Báo giá phụ kiện",
        ),
        React.createElement(Text, { style: { fontSize: 9 } }, "Mã: Q-CAMRY25SE"),
        React.createElement(
          Text,
          { style: { fontSize: 9 } },
          "Ngày: 24 thg 10, 2026",
        ),
      ),
    ),
    React.createElement(
      Text,
      { style: { fontSize: 10, fontWeight: 700, color: "#0b3d5c", marginBottom: 8 } },
      "Xe: Toyota Camry 2025 SE",
    ),
    React.createElement(
      View,
      { style: styles.th },
      React.createElement(View, { style: col(COLS.item) }, React.createElement(Text, { style: styles.tht }, "Sản phẩm")),
      React.createElement(View, { style: col(COLS.sku) }, React.createElement(Text, { style: styles.tht }, "SKU")),
      React.createElement(View, { style: col(COLS.qty) }, React.createElement(Text, { style: styles.tht }, "SL")),
      React.createElement(View, { style: col(COLS.fit) }, React.createElement(Text, { style: styles.tht }, "Fitment")),
      React.createElement(View, { style: col(COLS.unit) }, React.createElement(Text, { style: styles.tht }, "Đơn giá")),
      React.createElement(View, { style: col(COLS.labor) }, React.createElement(Text, { style: styles.tht }, "Lắp đặt")),
      React.createElement(View, { style: { width: COLS.line } }, React.createElement(Text, { style: styles.tht }, "Thành tiền")),
    ),
    ...rows.map((r) =>
      React.createElement(
        View,
        { style: styles.tr, key: r.sku },
        React.createElement(View, { style: col(COLS.item) }, React.createElement(Text, { style: styles.cell }, r.name)),
        React.createElement(View, { style: col(COLS.sku) }, React.createElement(Text, { style: styles.cell }, r.sku)),
        React.createElement(View, { style: col(COLS.qty) }, React.createElement(Text, { style: styles.cell }, String(r.qty))),
        React.createElement(View, { style: col(COLS.fit) }, React.createElement(Text, { style: styles.cell }, r.fit)),
        React.createElement(View, { style: col(COLS.unit) }, React.createElement(Text, { style: styles.cell }, `$${r.unit}`)),
        React.createElement(View, { style: col(COLS.labor) }, React.createElement(Text, { style: styles.cell }, `$${r.labor}`)),
        React.createElement(View, { style: { width: COLS.line } }, React.createElement(Text, { style: styles.cell }, `$${r.line}`)),
      ),
    ),
    React.createElement(
      View,
      {
        style: {
          marginTop: 14,
          alignSelf: "flex-end",
          width: 220,
          borderWidth: 1,
          borderColor: "#dbe3ec",
          padding: 10,
        },
      },
      React.createElement(Text, { style: { fontSize: 9, marginBottom: 3 } }, "Tạm tính phụ kiện: $707"),
      React.createElement(Text, { style: { fontSize: 9, marginBottom: 3 } }, "Tạm tính lắp đặt: $257"),
      React.createElement(Text, { style: { fontSize: 11, fontWeight: 700 } }, "Tổng cộng (USD): $964"),
    ),
    React.createElement(
      View,
      { style: styles.warn },
      React.createElement(
        Text,
        { style: { fontSize: 9, fontWeight: 700, color: "#92400e", marginBottom: 4 } },
        "Lưu ý / Fitment",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 8 } },
        "• Phụ kiện chưa được xác minh tương thích với xe này — kỹ thuật viên phải kiểm tra trước khi lắp đặt/đặt hàng.",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 8, marginTop: 3 } },
        "• Giá ước tính; chưa gồm thuế, shipping, phụ phí phát sinh.",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 8, marginTop: 3 } },
        "• Báo giá không phải hợp đồng; cần xác nhận kỹ thuật trước khi đặt hàng.",
      ),
    ),
    React.createElement(
      Text,
      { style: { marginTop: 20, fontSize: 8, color: "#94a3b8" } },
      "KietAuto — liên hệ cửa hàng để xác nhận báo giá và lắp đặt",
    ),
  ),
);

const instance = pdf(doc);
const blob = await instance.toBlob();
const buf = Buffer.from(await blob.arrayBuffer());
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "quote-camry-2025-se-964.pdf");
fs.writeFileSync(out, buf);
console.log("Wrote", out, "bytes", buf.length);
