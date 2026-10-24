/**
 * Generate a sample Vietnamese multi-item quote PDF with embedded Noto Sans.
 * Run: node scripts/gen-sample-quote-pdf.mjs
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
const outDir = "/cursor/stores/bc-01a16e19-b110-73aa-8aaa-f97f35dc8cf9/media/phase1";

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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "NotoSans",
    color: "#0f172a",
  },
  brand: { fontSize: 20, fontFamily: "NotoSans", fontWeight: 700, color: "#0b3d5c" },
  title: { fontSize: 14, fontFamily: "NotoSans", fontWeight: 700, marginVertical: 8 },
  row: { marginBottom: 4, fontSize: 10 },
  warn: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
});

const doc = React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: "A4", style: styles.page },
    React.createElement(Text, { style: styles.brand }, "KietAuto"),
    React.createElement(Text, { style: styles.title }, "Báo giá phụ kiện"),
    React.createElement(
      Text,
      { style: styles.row },
      "Xe: Toyota Camry 2025 SE",
    ),
    React.createElement(
      Text,
      { style: styles.row },
      "Ngày: 24 thg 10, 2026",
    ),
    React.createElement(
      Text,
      { style: styles.row },
      "1. Dashcam V35 Front/Rear — Chưa xác minh — $189 + lắp đặt $79 = $268",
    ),
    React.createElement(
      Text,
      { style: styles.row },
      "2. Cốp điện tiêu chuẩn — Chưa xác minh — $549 + lắp đặt $249 = $798",
    ),
    React.createElement(
      Text,
      { style: { marginTop: 10, fontFamily: "NotoSans", fontWeight: 700 } },
      "Tổng cộng (USD): $1,066",
    ),
    React.createElement(
      View,
      { style: styles.warn },
      React.createElement(
        Text,
        { style: { fontFamily: "NotoSans", fontWeight: 700, marginBottom: 4 } },
        "Lưu ý / Fitment",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 9 } },
        "• Sản phẩm đánh dấu Cần xác minh chưa được xác nhận lắp được trên xe này.",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 9, marginTop: 2 } },
        "• Giá ước tính; chưa gồm thuế, shipping, phụ phí phát sinh.",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 9, marginTop: 2 } },
        "• KietAuto — liên hệ cửa hàng để xác nhận báo giá và lắp đặt",
      ),
    ),
  ),
);

const instance = pdf(doc);
const blob = await instance.toBlob();
const ab = await blob.arrayBuffer();
const buf = Buffer.from(ab);
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "sample-quote-vi.pdf");
fs.writeFileSync(out, buf);
console.log("Wrote", out, "bytes", buf.length);
