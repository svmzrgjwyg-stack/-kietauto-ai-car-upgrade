import rows from "../../../data/fitment-reference.json";

/** Reference configurations, not sale products; supplier data is intentionally excluded. */
export interface FitmentReference {
  images: { src: string; width: number; height: number; kind: "oem_dashboard_reference" | "oem_headunit_rear_reference"; sharedReference: boolean }[];
  id: string; make: "Toyota" | "Lexus"; model: string;
  yearFrom: number | null; yearTo: number | null;
  control: string | null; screen: string | null; screenInches: number | null;
  navigationRequired: true | null; market: string | null;
  usMarketVerified: false; fitmentStatus: "unverified";
  priceUsd: null; installationPriceUsd: null; availability: "unknown";
}
export const fitmentReferences = rows as FitmentReference[];
export type ReferenceFilters = { make?: string; model?: string; year?: string; query?: string };
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
export function filterReferences(references: FitmentReference[], filters: ReferenceFilters): FitmentReference[] {
  const yearText = filters.year?.trim() || "";
  if (yearText && !/^\d{4}$/.test(yearText)) return [];
  const year = yearText ? Number(yearText) : null;
  const words = normalize(filters.query?.trim() || "").split(/\s+/).filter(Boolean);
  return references.filter((r) => {
    if (filters.make && r.make !== filters.make) return false;
    if (filters.model && r.model !== filters.model) return false;
    if (year !== null && (r.yearFrom === null || r.yearTo === null || year < r.yearFrom || year > r.yearTo)) return false;
    const haystack = normalize([r.id, r.make, r.model, r.control, r.screen, r.market].filter(Boolean).join(" "));
    return words.every((word) => haystack.includes(word));
  });
}
export function referenceModels(references: FitmentReference[], make: string): string[] {
  return [...new Set(references.filter((r) => !make || r.make === make).map((r) => r.model))].sort();
}
export const referenceCopy = {
  vi: {
    title: "Danh mục Toyota & Lexus", subtitle: "Tra cứu cấu hình hộp CarPlay theo xe",
    intro: "Đây là các cấu hình tham khảo, không phải 45 sản phẩm riêng và chưa được xác minh lắp vừa. Phải đối chiếu đời xe, thị trường, màn hình zin và bộ điều khiển trước khi báo giá hoặc đặt hàng.",
    make: "Hãng xe", model: "Dòng xe", year: "Đời xe", search: "Tìm cấu hình / bộ điều khiển", placeholder: "Ví dụ: RX, chuột, 12.3, Japan", all: "Tất cả", count: "cấu hình tham khảo", reset: "Xóa bộ lọc", empty: "Chưa có cấu hình theo bộ lọc này. Không có kết quả không có nghĩa là xe không lắp được.",
    dashboardImage: "Màn hình và điều khiển zin tham khảo", rearImage: "Mặt sau màn hình zin tham khảo", imageCaption: "Ảnh tham khảo từ tài liệu · chưa xác minh lắp vừa", sharedImage: "Nguồn dùng chung ảnh này cho nhiều cấu hình; cần đối chiếu xe thực tế.",
    unverified: "Cần xác minh", quote: "Cần báo giá", noPrice: "Chưa có giá máy; công lắp, thuế và phí giao hàng chưa xác định. Chưa thể thêm cấu hình này vào gói có tổng tiền hoặc xuất báo giá hoàn chỉnh.",
    control: "Bộ điều khiển / yêu cầu màn zin", screen: "Màn hình", market: "Thị trường ghi trong tài liệu", unknown: "Chưa có thông tin", nav: "Yêu cầu định vị zin", yes: "Có (theo tài liệu, chưa xác minh)", navUnknown: "Chưa rõ; không có nghĩa là không cần", us: "Chưa xác minh cho xe thị trường Mỹ, kể cả dòng ghi Global.", details: "Xem điều kiện cần đối chiếu", reference: "Mã tham khảo", stock: "Tồn kho và thời gian giao hàng: chưa xác định", camera: "Xem camera và sản phẩm có giá", note: "Chưa có cấu hình Camry trong nguồn CarPlay này. Ảnh gốc trong tài liệu dùng để đối chiếu màn hình và điều khiển zin, không phải ảnh bộ hộp bán ra hay bằng chứng đã lắp vừa. Ảnh nguồn có độ phân giải thấp.",
  },
  en: {
    title: "Toyota & Lexus catalog", subtitle: "Browse CarPlay interface configurations by vehicle",
    intro: "These are reference configurations, not 45 separate products or verified fitment. Confirm the model year, market, factory display and controls before quoting or ordering.",
    make: "Make", model: "Model", year: "Model year", search: "Search configuration / controls", placeholder: "For example: RX, Mouse, 12.3, Japan", all: "All", count: "reference configurations", reset: "Reset filters", empty: "No configuration matches these filters. No result does not mean the vehicle is incompatible.",
    dashboardImage: "Factory screen and controls reference", rearImage: "Factory head unit rear reference", imageCaption: "Source reference image · fitment unverified", sharedImage: "The source reuses this image for multiple configurations; confirm against the actual vehicle.",
    unverified: "Needs verification", quote: "Price on request", noPrice: "Hardware price is not supplied; installation, tax and shipping are unknown. This configuration cannot yet be added to a priced combo or exported as a complete quote.",
    control: "Controls / factory system requirements", screen: "Display", market: "Market stated in reference", unknown: "Not supplied", nav: "Factory navigation required", yes: "Yes (reference claim, unverified)", navUnknown: "Unknown; this does not mean not required", us: "US-market fitment is unverified, including entries marked Global.", details: "View requirements to confirm", reference: "Reference ID", stock: "Stock and delivery estimate: unknown", camera: "View cameras and priced products", note: "This CarPlay source has no Camry configuration. Original reference images show factory displays and controls, not the supplied interface kit or proof of fitment. Source images are low resolution.",
  },
};
