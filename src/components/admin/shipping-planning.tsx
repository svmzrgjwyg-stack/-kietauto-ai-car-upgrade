"use client";
import type { Product } from "@/types";
import { planShipping, type Fulfillment } from "@/lib/shipping/planning";

export function FulfillmentEditor({ product, disabled, vi, onChange }: {
  product: Product; disabled: boolean; vi: boolean; onChange: (value: Fulfillment) => void;
}) {
  const f: Fulfillment = product.fulfillment ?? { stockStatus: "unknown", orderStatus: "not_recorded", feeStatus: "unknown" };
  const change = (key: keyof Fulfillment, value: string | number | undefined) => onChange({ ...f, [key]: value });
  const input = (key: keyof Fulfillment, label: string, type = "text") => <label className="text-xs" key={key}>{label}<input disabled={disabled} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} value={f[key] ?? ""} onChange={(e) => change(key, e.target.value === "" ? undefined : type === "number" ? Number(e.target.value) : e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>;
  const select = (key: "stockStatus" | "orderStatus" | "feeStatus", label: string, options: [string, string][]) => <label className="text-xs">{label}<select disabled={disabled} value={f[key]} onChange={(e) => onChange({ ...f, [key]: e.target.value, ...(key === "feeStatus" && e.target.value === "unknown" ? { feeUsd: undefined } : {}) })} className="mt-1 min-h-11 w-full rounded-xl border px-3">{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>;
  return <details className="rounded-xl border p-3"><summary>{vi ? "Kế hoạch giao hàng — nhập tay, nội bộ" : "Manual internal shipping planning"}</summary><p className="my-2 text-xs">{vi ? "Dữ liệu mẫu, lưu cục bộ. Không tra cứu hay đặt hàng tự động. Dùng nút Lưu của sản phẩm. Phí là chi phí nguồn hàng của cả nhóm, không phải phí bán cho khách; đổi số lượng phải kiểm tra lại. Cùng nhóm phải ghi cùng nhà cung cấp và phí." : "Local demo data. No automatic lookup or ordering. Use product Save. Fees are sourcing costs for the whole shipment group, not customer charges; recheck after quantity changes. Same group must use identical supplier and fee details."}</p><div className="grid grid-cols-2 gap-3">
    {input("supplier", vi ? "Nhà cung cấp (nội bộ)" : "Supplier (private)")}
    {input("source", vi ? "Nguồn / đường dẫn (nội bộ)" : "Source / URL (private)")}
    {select("stockStatus", vi ? "Tồn kho (nhập tay)" : "Stock (manual)", [["unknown", vi ? "Chưa biết" : "Unknown"], ["in_stock", vi ? "Có hàng" : "In stock"], ["backorder", vi ? "Chờ hàng" : "Backorder"], ["unavailable", vi ? "Không có" : "Unavailable"]])}
    {select("orderStatus", vi ? "Ghi chú đơn (không thực hiện đặt hàng)" : "Order note (does not place an order)", [["not_recorded", vi ? "Chưa ghi nhận" : "Not recorded"], ["planned", vi ? "Dự định đặt" : "Planned"], ["ordered", vi ? "Người nhập ghi đã đặt" : "Manually marked ordered"], ["received", vi ? "Người nhập ghi đã nhận" : "Manually marked received"]])}
    {input("arrivalFrom", vi ? "Ngày đến sớm nhất dự kiến" : "Earliest estimated arrival", "date")}
    {input("arrivalTo", vi ? "Ngày đến muộn nhất dự kiến" : "Latest estimated arrival", "date")}
    {input("checkedOn", vi ? "Ngày đã kiểm tra nguồn" : "Source checked on", "date")}
    {input("shipmentGroup", vi ? "Mã nhóm vận chuyển / đơn" : "Shipment / order group ID")}
    {select("feeStatus", vi ? "Mức xác minh phí nhóm" : "Group fee status", [["unknown", vi ? "Chưa biết" : "Unknown"], ["estimated", vi ? "Ước tính" : "Estimated"], ["confirmed", vi ? "Người nhập đã xác nhận" : "Manually confirmed"]])}
    {f.feeStatus !== "unknown" && input("feeUsd", vi ? "Phí CẢ NHÓM (USD)" : "WHOLE GROUP fee (USD)", "number")}
  </div></details>;
}

export function ShippingSummary({ products, vi }: { products: Product[]; vi: boolean }) {
  const plan = planShipping(products);
  const money = (v: number) => `$${v.toFixed(2)}`;
  return <section aria-label={vi ? "Tổng hợp giao hàng nội bộ" : "Internal shipping summary"} className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
    <h2 className="font-semibold">{vi ? "Kế hoạch nội bộ — chọn các món cần có bên dưới" : "Internal plan — select required products below"}</h2>
    <p>{vi ? "Bản xem trước có cả thay đổi CHƯA LƯU. Không phải báo giá khách. Phí không cộng vào báo giá/PDF; cần anh duyệt phí bán riêng. Không tự xác minh tồn kho, đơn hay vận chuyển." : "Preview includes UNSAVED edits. Not a customer quote. Costs are excluded from quotes/PDF; customer shipping charges require separate owner approval. No live stock, order or tracking verification."}</p>
    <p>{vi ? "Khoảng ngày đủ tất cả món (ước tính, không cam kết): " : "All-items-ready window (estimate, not guaranteed): "}{plan.readyWindow ? `${plan.readyWindow.from} → ${plan.readyWindow.to}` : vi ? "Chưa đủ thông tin" : "Incomplete / unknown"}</p>
    {plan.etaMissing.length > 0 && <p>{vi ? "Thiếu ngày đến / ngày kiểm tra / tồn kho: " : "Missing arrival / checked date / stock: "}{plan.etaMissing.join(", ")}</p>}
    <p>{vi ? "Phí các nhóm đã ghi nhận — ước tính: " : "Recorded group costs — estimated: "}{money(plan.estimatedUsd)} · {vi ? "đã xác nhận thủ công: " : "manually confirmed: "}{money(plan.confirmedUsd)}</p>
    <p>{plan.feesComplete ? (vi ? "Đã nhóm đủ phí; mỗi nhóm chỉ tính một lần. Vẫn cần kiểm tra lại theo số lượng và địa chỉ nhận." : "All selected fees grouped; counted once per group. Recheck quantities and destination.") : (vi ? "CHƯA ĐỦ PHÍ — số trên chỉ là phần đã biết, không phải tổng. Phí chưa biết không được coi là $0." : "INCOMPLETE COSTS — amounts above are known portions, not totals. Unknown fees are not $0.")}</p>
    {!!plan.ungrouped.length && <p>{vi ? "Chưa có nhóm: " : "Ungrouped: "}{plan.ungrouped.join(", ")}</p>}
    {!!plan.unknownGroups.length && <p>{vi ? "Nhóm thiếu / mâu thuẫn phí: " : "Unknown / conflicting groups: "}{plan.unknownGroups.join(", ")}</p>}
  </section>;
}
